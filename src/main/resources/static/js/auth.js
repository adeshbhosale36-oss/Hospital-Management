/**
 * ==========================================================================
 * HOSPITAL MANAGEMENT SYSTEM - AUTH & SESSION MANAGER
 * Manages JWT token storage, user display name caching, page auth guards,
 * login submission, signup handling, and logout.
 * ==========================================================================
 */

const Auth = {
  getToken() {
    return localStorage.getItem('token');
  },

  getUserId() {
    return localStorage.getItem('userId');
  },

  getUsername() {
    return localStorage.getItem('username') || 'Staff Member';
  },

  getRole() {
    let role = localStorage.getItem('role');
    if (!role) {
      const token = this.getToken();
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          role = payload.role;
          if (role) localStorage.setItem('role', role);
        } catch (_) {}
      }
    }
    return role || '';
  },

  getProfileId() {
    const pid = localStorage.getItem('profileId');
    return pid ? parseInt(pid, 10) : null;
  },

  isAdmin() {
    return this.getRole() === 'ADMIN';
  },

  isDoctor() {
    return this.getRole() === 'DOCTOR';
  },

  isPatient() {
    return this.getRole() === 'PATIENT';
  },

  saveSession(token, userId, username, role = '', profileId = null) {
    if (token) localStorage.setItem('token', token);
    if (userId) localStorage.setItem('userId', String(userId));
    if (username) localStorage.setItem('username', username);
    if (role) localStorage.setItem('role', role);
    if (profileId !== null && profileId !== undefined) localStorage.setItem('profileId', String(profileId));
  },

  clearSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('profileId');
  },

  isAuthenticated() {
    const token = this.getToken();
    return Boolean(token && token.trim().length > 0);
  },

  /**
   * Helper to ensure profileId is available for doctor or patient
   */
  async ensureProfileId() {
    let pid = this.getProfileId();
    if (pid) return pid;

    const uname = this.getUsername();
    try {
      if (this.isDoctor()) {
        const doctors = await api.get('/Doctor');
        if (Array.isArray(doctors)) {
          const doc = doctors.find(d => 
            (d.email && d.email.toLowerCase() === uname.toLowerCase()) || 
            (d.name && d.name.toLowerCase() === uname.toLowerCase())
          );
          if (doc) {
            pid = doc.id;
            localStorage.setItem('profileId', String(pid));
          }
        }
      } else if (this.isPatient()) {
        const patients = await api.get('/Patient');
        if (Array.isArray(patients)) {
          const pat = patients.find(p => 
            (p.email && p.email.toLowerCase() === uname.toLowerCase()) || 
            (p.patientName && p.patientName.toLowerCase() === uname.toLowerCase())
          );
          if (pat) {
            pid = pat.id;
            localStorage.setItem('profileId', String(pid));
          }
        }
      }
    } catch (err) {
      console.warn('Could not auto-resolve profileId:', err);
    }
    return pid;
  },

  /**
   * Auth Guard: Call at the top of every protected page.
   * Redirects unauthenticated visitors to index.html immediately.
   */
  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = 'index.html';
      return false;
    }
    return true;
  },

  /**
   * Guest Guard: Call on index.html and signup.html.
   * If already logged in, redirects directly to dashboard.html.
   */
  redirectIfAuthenticated() {
    if (this.isAuthenticated()) {
      window.location.href = 'dashboard.html';
    }
  },

  /**
   * Performs user login
   * @param {string} username
   * @param {string} password
   */
  async login(username, password) {
    // Basic client validation
    if (!username || !username.trim()) {
      throw new Error('Please enter your username.');
    }
    if (!password || !password.trim()) {
      throw new Error('Please enter your password.');
    }

    const payload = {
      username: username.trim(),
      password: password
    };

    // Calls POST /auth/login
    // Server returns { userId, token, role, profileId, name }
    const result = await api.post('/auth/login', payload);

    if (result && result.token) {
      const displayName = result.name || username.trim();
      this.saveSession(result.token, result.userId, displayName, result.role || '', result.profileId);
      return result;
    } else {
      throw new Error('Login succeeded but no security token was returned.');
    }
  },

  /**
   * Performs user registration against POST /auth/signup.
   *
   * Access model (deliberately restricted at the UI layer):
   *  - PATIENT: the only role the public signup.html form is allowed to submit.
   *    Anyone can create their own patient account.
   *  - DOCTOR: never offered on the public form. Created by an already-logged-in
   *    admin from the "Provision Doctor Portal Access" panel on doctors.html,
   *    which calls this same function with role hardcoded to 'DOCTOR'.
   *  - ADMIN: not creatable from any UI in this app at all. The first (and any
   *    further) admin account is expected to be inserted directly into the
   *    `users` table — see the seed script provided alongside this project.
   *
   * NOTE: /auth/signup itself is a public, unauthenticated endpoint on the
   * backend and does not actually enforce any of the above — this function
   * still accepts any role string. The restriction is a UI/UX decision, not a
   * server-side security boundary. See the project notes for how to lock this
   * down on the backend if that guarantee matters for your deployment.
   *
   * @param {string} username
   * @param {string} password
   * @param {string} role - "DOCTOR" | "PATIENT" (see access model above)
   */
  async signup(username, password, role) {
    if (!username || !username.trim()) {
      throw new Error('Please choose a username.');
    }
    if (!password || password.length < 4) {
      throw new Error('Password must be at least 4 characters.');
    }
    if (!role) {
      throw new Error('Please select a system role.');
    }

    const payload = {
      username: username.trim(),
      password: password,
      role: role
    };

    // Response from /auth/signup is PLAIN TEXT per §3
    const textResponse = await api.post('/auth/signup', payload);
    return textResponse;
  },

  /**
   * Signs the user out and returns to login screen
   */
  logout() {
    this.clearSession();
    window.location.href = 'index.html';
  }
};
