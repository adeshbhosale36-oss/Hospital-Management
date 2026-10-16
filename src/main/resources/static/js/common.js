/**
 * ==========================================================================
 * HOSPITAL MANAGEMENT SYSTEM - COMMON UI UTILITIES
 * Toast notifications, accessible modals, hard confirmation for bulk deletes,
 * shell initialization, XSS-safe escaping, and date formatting.
 * ==========================================================================
 */

const UI = {
  /**
   * Escape text to prevent XSS vulnerabilities (§7)
   */
  escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  /**
   * Show a non-blocking toast notification
   * @param {string} message
   * @param {'info'|'success'|'danger'|'warning'} type
   * @param {string|null} title
   * @param {number} durationMs
   */
  showToast(message, type = 'info', title = null, durationMs = 4500) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      container.setAttribute('aria-live', 'polite');
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');

    const defaultTitles = {
      success: 'Success',
      danger: 'Action Failed',
      warning: 'Warning',
      info: 'Notification'
    };

    const displayTitle = title || defaultTitles[type] || 'Notice';

    toast.innerHTML = `
      <div class="toast-content">
        <div class="toast-title">${this.escapeHtml(displayTitle)}</div>
        <div class="toast-message">${this.escapeHtml(message)}</div>
      </div>
      <button type="button" class="toast-close-btn" aria-label="Dismiss notification">&times;</button>
    `;

    container.appendChild(toast);

    // Force layout reflow before triggering slide-in animation
    void toast.offsetWidth;
    toast.classList.add('is-visible');

    const removeToast = () => {
      toast.classList.remove('is-visible');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 200);
    };

    const closeBtn = toast.querySelector('.toast-close-btn');
    closeBtn.addEventListener('click', removeToast);

    if (durationMs > 0) {
      setTimeout(removeToast, durationMs);
    }
  },

  /**
   * Open a modal dialog with accessibility
   */
  openModal(modalId) {
    const backdrop = document.getElementById(modalId);
    if (!backdrop) return;

    backdrop.classList.add('is-open');
    backdrop.setAttribute('aria-hidden', 'false');

    // Focus first interactive element inside modal
    const focusable = backdrop.querySelectorAll('input:not([type="hidden"]), select, textarea, button:not(.modal-close-btn)');
    if (focusable.length > 0) {
      setTimeout(() => focusable[0].focus(), 50);
    }

    // Attach Escape key listener
    backdrop._keydownHandler = (e) => {
      if (e.key === 'Escape') {
        this.closeModal(modalId);
      }
    };
    document.addEventListener('keydown', backdrop._keydownHandler);

    // Backdrop click outside window
    backdrop._backdropClickHandler = (e) => {
      if (e.target === backdrop) {
        this.closeModal(modalId);
      }
    };
    backdrop.addEventListener('click', backdrop._backdropClickHandler);
  },

  /**
   * Close a modal dialog
   */
  closeModal(modalId) {
    const backdrop = document.getElementById(modalId);
    if (!backdrop) return;

    backdrop.classList.remove('is-open');
    backdrop.setAttribute('aria-hidden', 'true');

    if (backdrop._keydownHandler) {
      document.removeEventListener('keydown', backdrop._keydownHandler);
    }
    if (backdrop._backdropClickHandler) {
      backdrop.removeEventListener('click', backdrop._backdropClickHandler);
    }
  },

  /**
   * Reusable Standard Confirmation Modal
   */
  showConfirmModal({ title, message, confirmText = 'Confirm', isDanger = false, onConfirm }) {
    let modal = document.getElementById('generic-confirm-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'generic-confirm-modal';
      modal.className = 'modal-backdrop';
      modal.innerHTML = `
        <div class="modal-window">
          <div class="modal-header">
            <h3 class="modal-title" id="confirm-modal-title">Confirm Action</h3>
            <button type="button" class="modal-close-btn" onclick="UI.closeModal('generic-confirm-modal')">&times;</button>
          </div>
          <div class="modal-body" id="confirm-modal-body">
            <p id="confirm-modal-message"></p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="UI.closeModal('generic-confirm-modal')">Cancel</button>
            <button type="button" class="btn" id="confirm-modal-submit-btn">Confirm</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    document.getElementById('confirm-modal-title').textContent = title;
    document.getElementById('confirm-modal-message').textContent = message;

    const submitBtn = document.getElementById('confirm-modal-submit-btn');
    submitBtn.textContent = confirmText;
    submitBtn.className = isDanger ? 'btn btn-danger' : 'btn btn-primary';

    // Replace click listener
    submitBtn.onclick = async () => {
      submitBtn.disabled = true;
      try {
        await onConfirm();
        UI.closeModal('generic-confirm-modal');
      } catch (err) {
        console.error('Action failed:', err);
      } finally {
        submitBtn.disabled = false;
      }
    };

    UI.openModal('generic-confirm-modal');
  },

  /**
   * Hard Confirmation Modal for Bulk Delete-All Endpoints (§6.1)
   * Requires typing "DELETE" into a text field to enable deletion.
   */
  showHardConfirmModal({ title, message, matchWord = 'DELETE', onConfirm }) {
    let modal = document.getElementById('hard-confirm-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'hard-confirm-modal';
      modal.className = 'modal-backdrop';
      modal.innerHTML = `
        <div class="modal-window">
          <div class="modal-header">
            <h3 class="modal-title text-danger" id="hard-confirm-title" style="color: var(--accent-danger);">Dangerous Action</h3>
            <button type="button" class="modal-close-btn" onclick="UI.closeModal('hard-confirm-modal')">&times;</button>
          </div>
          <div class="modal-body">
            <div class="banner banner-danger">
              <span style="font-weight: 600;">Irreversible Action:</span>
              <span id="hard-confirm-warning">This bulk operation cannot be undone.</span>
            </div>
            <p id="hard-confirm-message" style="margin-bottom: 12px;"></p>
            <div class="hard-confirm-box">
              <label class="form-label" for="hard-confirm-input">
                Type <strong><span id="hard-confirm-word">DELETE</span></strong> to proceed:
              </label>
              <input type="text" id="hard-confirm-input" class="form-control form-control-mono" placeholder="Type here..." autocomplete="off">
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="UI.closeModal('hard-confirm-modal')">Cancel</button>
            <button type="button" class="btn btn-danger" id="hard-confirm-submit-btn" disabled>Permanently Delete All</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    document.getElementById('hard-confirm-title').textContent = title;
    document.getElementById('hard-confirm-message').textContent = message;
    document.getElementById('hard-confirm-word').textContent = matchWord;

    const input = document.getElementById('hard-confirm-input');
    const submitBtn = document.getElementById('hard-confirm-submit-btn');

    input.value = '';
    submitBtn.disabled = true;

    input.oninput = () => {
      submitBtn.disabled = (input.value.trim() !== matchWord);
    };

    submitBtn.onclick = async () => {
      if (input.value.trim() !== matchWord) return;
      submitBtn.disabled = true;
      try {
        await onConfirm();
        UI.closeModal('hard-confirm-modal');
      } catch (err) {
        console.error('Hard confirm action failed:', err);
      } finally {
        submitBtn.disabled = false;
      }
    };

    UI.openModal('hard-confirm-modal');
  },

  /**
   * Initializes the application shell (active nav link, greeting, logout, partial injection, theme)
   * @param {string} activePage - e.g. 'dashboard', 'patients', 'doctors', etc.
   * @param {string} [pageTitle] - Optional page title to display in topbar
   */
  async initShell(activePage, pageTitle = null) {
    // Check authentication guard
    if (typeof Auth !== 'undefined') {
      Auth.requireAuth();

      // Check role-based page access (§2 & §3)
      const role = Auth.getRole();
      if (role === 'DOCTOR') {
        const doctorAllowedPages = ['dashboard', 'appointments', 'patients'];
        if (!doctorAllowedPages.includes(activePage)) {
          window.location.href = 'dashboard.html';
          return;
        }
      } else if (role === 'PATIENT') {
        const patientAllowedPages = ['dashboard', 'appointments'];
        if (!patientAllowedPages.includes(activePage)) {
          window.location.href = 'dashboard.html';
          return;
        }
      }
    }

    // Initialize Theme immediately
    this.initTheme();

    // Check if #app-shell placeholder needs injection from partials/shell.html
    const appShellPlaceholder = document.getElementById('app-shell');
    if (appShellPlaceholder) {
      try {
        if (!UI._shellHtmlPromise) {
          const headers = {};
          const token = (typeof Auth !== 'undefined') ? Auth.getToken() : localStorage.getItem('token');
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
          UI._shellHtmlPromise = fetch('partials/shell.html', { headers }).then(r => {
            if (!r.ok) throw new Error('Failed to load partials/shell.html: ' + r.status);
            return r.text();
          });
        }
        const shellHtml = await UI._shellHtmlPromise;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = shellHtml;

        const sidebar = tempDiv.querySelector('.app-sidebar');
        const topbar = tempDiv.querySelector('.app-topbar');

        const appLayout = document.querySelector('.app-layout');
        const appMain = document.querySelector('.app-main');

        if (sidebar && appLayout) {
          appShellPlaceholder.replaceWith(sidebar);
        } else if (sidebar) {
          appShellPlaceholder.replaceWith(sidebar);
        }

        if (topbar && appMain) {
          appMain.insertBefore(topbar, appMain.firstChild);
        }
      } catch (err) {
        console.error('Failed to inject app shell:', err);
      }
    }

    // Filter sidebar navigation according to user role (§2 & §3)
    if (typeof Auth !== 'undefined') {
      const role = Auth.getRole();
      document.querySelectorAll('.app-sidebar .nav-link').forEach(link => {
        const page = link.getAttribute('data-page');
        if (role === 'DOCTOR') {
          // Doctors only see dashboard, appointments, and patients
          if (page === 'doctors' || page === 'departments' || page === 'insurance') {
            link.style.display = 'none';
          }
        } else if (role === 'PATIENT') {
          // Patients only see dashboard and appointments
          if (page === 'patients' || page === 'doctors' || page === 'departments' || page === 'insurance') {
            link.style.display = 'none';
          }
        }
      });
    }

    // Set page title in topbar if provided or infer from activePage
    const defaultTitles = {
      dashboard: 'Operations Dashboard',
      patients: 'Patient Records Directory',
      doctors: 'Medical Staff Directory',
      departments: 'Departments & Units',
      appointments: 'Appointment Master Schedule',
      insurance: 'Health Insurance Directory'
    };
    const titleText = pageTitle || defaultTitles[activePage] || 'Hospital Management';
    const topbarTitleEl = document.getElementById('topbar-page-title') || document.querySelector('.topbar-page-title');
    if (topbarTitleEl) {
      topbarTitleEl.textContent = titleText;
    }

    // Set active link in left rail
    const links = document.querySelectorAll('.nav-link');
    links.forEach(link => {
      if (link.getAttribute('data-page') === activePage) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Populate user greeting
    const userNameEl = document.getElementById('topbar-username');
    if (userNameEl && typeof Auth !== 'undefined') {
      const role = Auth.getRole();
      const roleBadge = role ? ` <span class="id-badge" style="font-size: 10px; margin-left: 4px;">${UI.escapeHtml(role)}</span>` : '';
      userNameEl.innerHTML = `${UI.escapeHtml(Auth.getUsername())}${roleBadge}`;
    }

    // Bind logout button
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn && typeof Auth !== 'undefined' && !logoutBtn._bound) {
      logoutBtn._bound = true;
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        UI.showConfirmModal({
          title: 'Sign Out',
          message: 'Are you sure you want to end your current session?',
          confirmText: 'Sign Out',
          isDanger: false,
          onConfirm: () => {
            Auth.logout();
          }
        });
      });
    }

    // Bind mobile menu toggle
    const toggleBtn = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.app-sidebar');
    if (toggleBtn && sidebar && !toggleBtn._bound) {
      toggleBtn._bound = true;
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('is-open');
      });
      // Close when clicking outside on mobile
      document.addEventListener('click', (e) => {
        if (sidebar.classList.contains('is-open') && !sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
          sidebar.classList.remove('is-open');
        }
      });
    }

    // Bind theme toggle button
    const themeBtn = document.getElementById('btn-theme-toggle');
    if (themeBtn && !themeBtn._bound) {
      themeBtn._bound = true;
      themeBtn.addEventListener('click', () => {
        UI.toggleTheme();
      });
    }
  },

  /**
   * Theme Management (§4.4)
   */
  initTheme() {
    const savedTheme = localStorage.getItem('hms_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  },

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('hms_theme', nextTheme);
    return nextTheme;
  },

  /**
   * Clears form validation errors and invalid input styling (§3.2)
   * @param {HTMLElement|string} formEl - Form element or selector
   */
  clearFormErrors(formEl) {
    const root = (typeof formEl === 'string') ? document.querySelector(formEl) : (formEl || document);
    if (!root) return;
    root.querySelectorAll('.form-error').forEach(el => el.classList.remove('is-visible'));
    root.querySelectorAll('.form-control').forEach(el => el.classList.remove('is-invalid'));
  },

  /**
   * Shared bulk delete binder (§3.2)
   * Wraps showHardConfirmModal + api.delete + toast + reload
   */
  bindBulkDelete({ buttonId, resourceLabel, resourcePath, getCount, confirmTitle, confirmMessage, successMessage, onDone }) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;

    btn.addEventListener('click', () => {
      const count = (typeof getCount === 'function') ? getCount() : 0;
      const title = confirmTitle || `Delete All ${resourceLabel || 'Records'}`;
      const message = confirmMessage || `This will permanently delete ALL ${count} record(s) in the system. This action is irreversible.`;

      UI.showHardConfirmModal({
        title: title,
        message: message,
        matchWord: 'DELETE',
        onConfirm: async () => {
          try {
            await api.delete(resourcePath);
            UI.showToast(
              successMessage || `All ${resourceLabel || 'records'} have been permanently removed.`,
              'warning',
              'Bulk Delete Complete'
            );
            if (typeof onDone === 'function') {
              await onDone();
            }
          } catch (err) {
            console.error('Bulk delete failed:', err);
            UI.showToast(err.message || `Failed to delete all ${resourceLabel || 'records'}.`, 'danger');
          }
        }
      });
    });
  },

  /**
   * Formatting helpers
   */
  formatDate(dateStr) {
    if (!dateStr) return '—';
    // Returns ISO formatted date cleanly YYYY-MM-DD
    return String(dateStr).substring(0, 10);
  },

  formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return '—';
    try {
      const d = new Date(dateTimeStr);
      if (isNaN(d.getTime())) return String(dateTimeStr);
      return d.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (_) {
      return String(dateTimeStr);
    }
  },

  isToday(dateStr) {
    if (!dateStr) return false;
    const today = new Date().toISOString().substring(0, 10);
    return String(dateStr).substring(0, 10) === today;
  }
};

// Auto-initialize theme on script execution
if (typeof document !== 'undefined') {
  UI.initTheme();
}

