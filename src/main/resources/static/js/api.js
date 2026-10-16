/**
 * ==========================================================================
 * HOSPITAL MANAGEMENT SYSTEM - CENTRAL API CLIENT (Vanilla JS)
 * Handles token attachment, response parsing (text vs json), session expiry
 * redirects, defensive error formatting, and configurable base URL.
 * ==========================================================================
 */

// Configurable API base URL: defaults to "" (same-origin when served from Spring Boot :8080)
// If frontend is opened from another origin (e.g. VS Code Live Server on :5500 or file://),
// fallback to 'http://localhost:8080' or use window.__API_BASE_URL__.
const API_BASE_URL = (typeof window !== 'undefined' && window.__API_BASE_URL__) 
  ? window.__API_BASE_URL__ 
  : (typeof window !== 'undefined' && (window.location.port === '8080' || window.location.hostname === 'localhost' && window.location.port === '') ? '' : 'http://localhost:8080');

/**
 * Main HTTP request wrapper
 * @param {string} method - 'GET', 'POST', 'PUT', 'DELETE'
 * @param {string} path - URL path (e.g. '/Patient', '/auth/login')
 * @param {object|null} body - Request body payload
 * @param {object} customOptions - Extra fetch options
 * @returns {Promise<any>} Parsed response data (JSON or plain text)
 */
async function apiRequest(method, path, body = null, customOptions = {}) {
  const url = `${API_BASE_URL}${path}`;
  const token = localStorage.getItem('token');

  const headers = {
    ...customOptions.headers
  };

  // Attach JWT Bearer token for all endpoints except public auth endpoints
  const isAuthEndpoint = path.startsWith('/auth/login') || path.startsWith('/auth/signup');
  if (!isAuthEndpoint && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fetchConfig = {
    method: method.toUpperCase(),
    headers: headers,
    ...customOptions
  };

  if (body !== null && body !== undefined) {
    headers['Content-Type'] = 'application/json';
    fetchConfig.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, fetchConfig);
  } catch (networkError) {
    console.error('Network failure connecting to:', url, networkError);
    throw {
      status: 0,
      message: 'Unable to connect to hospital server. Please ensure the backend is running at ' + (API_BASE_URL || 'http://localhost:8080') + '.',
      raw: networkError
    };
  }

  // Handle Session Expiration (401 Unauthorized on protected calls)
  if (!isAuthEndpoint && response.status === 401) {
    console.warn(`Unauthorized [401] accessing ${path}. Session expired.`);
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    // Redirect to login page with expired flag unless already on login/signup page
    const currentPath = window.location.pathname;
    if (!currentPath.endsWith('index.html') && !currentPath.endsWith('signup.html') && currentPath !== '/') {
      window.location.href = 'index.html?session=expired';
    }
    throw {
      status: 401,
      message: 'Your session has expired — please log in again.',
      isSessionExpired: true
    };
  }

  // Handle Permission Denied (403 Forbidden on protected calls)
  if (!isAuthEndpoint && response.status === 403) {
    console.warn(`Forbidden [403] accessing ${path}. Access denied.`);
    throw {
      status: 403,
      message: 'Access Denied: You do not have permission for this resource.',
      isForbidden: true
    };
  }

  // Special Handling: /auth/login bad credentials maps to HTTP 404 in this backend (§4 quirk)
  if (path === '/auth/login' && response.status === 404) {
    let errorData = null;
    try {
      errorData = await response.json();
    } catch (_) {
      // Ignored
    }
    throw {
      status: 404,
      message: 'Invalid username or password.',
      raw: errorData
    };
  }

  // Determine if this is a known plain-text endpoint (§3: /auth/signup and /report)
  const isPlainTextEndpoint = path.startsWith('/auth/signup') || path === '/report';

  // Read response body safely
  let responseData = null;
  let rawText = '';
  try {
    rawText = await response.text();
    if (isPlainTextEndpoint) {
      responseData = rawText;
    } else if (rawText && rawText.trim().length > 0) {
      try {
        responseData = JSON.parse(rawText);
      } catch (_) {
        // Not valid JSON, keep as raw text
        responseData = rawText;
      }
    }
  } catch (readErr) {
    console.warn('Error reading response body:', readErr);
  }

  // Handle HTTP Errors (non-2xx)
  if (!response.ok) {
    let errorMessage = 'An unexpected server error occurred.';

    // Foreign Key constraint failure detection on DELETE (HTTP 500 quirk §5 & §6.3)
    if (method.toUpperCase() === 'DELETE' && response.status === 500) {
      if (path.startsWith('/Department') || path.startsWith('/department')) {
        errorMessage = "Couldn't delete department — it still has doctors assigned. Reassign or remove the doctors first.";
      } else if (path.startsWith('/Insurance') || path.startsWith('/insurance')) {
        errorMessage = "Couldn't delete insurance policy — it is still linked to one or more patients. Remove that link first.";
      } else {
        errorMessage = "Couldn't delete record — it is still referenced by another record in the system.";
      }
    } else {
      let serverMsg = null;
      if (responseData && typeof responseData === 'object') {
        const msg = responseData.message || responseData.Message;
        const err = responseData.error || responseData.Error;
        if (msg && typeof msg === 'string' && msg.trim()) {
          serverMsg = msg.trim();
        } else if (err && typeof err === 'string' && err.trim()) {
          serverMsg = err.trim();
        } else if (responseData.errors && Array.isArray(responseData.errors)) {
          serverMsg = responseData.errors.map(e => e.defaultMessage || e.message || String(e)).join(', ');
        }
      } else if (typeof responseData === 'string' && responseData.trim()) {
        serverMsg = responseData.trim();
      }

      if (serverMsg) {
        errorMessage = serverMsg;
      } else if (response.status === 400) {
        errorMessage = 'Please check the fields you entered for accuracy.';
      } else if (response.status === 404) {
        errorMessage = 'The requested record was not found.';
      } else if (response.status === 409) {
        errorMessage = 'A record with this information already exists.';
      } else if (response.status === 500) {
        errorMessage = 'Server error processing request. Please check related records.';
      }
    }

    throw {
      status: response.status,
      message: errorMessage,
      data: responseData,
      path: path
    };
  }

  // Treat any 2xx as success (§6.5: /Patient POST is 201, others 200)
  return responseData;
}

// Convenient method wrappers
const api = {
  get: (path, options) => apiRequest('GET', path, null, options),
  post: (path, body, options) => apiRequest('POST', path, body, options),
  put: (path, body, options) => apiRequest('PUT', path, body, options),
  delete: (path, options) => apiRequest('DELETE', path, null, options),
  request: apiRequest,
  BASE_URL: API_BASE_URL
};
