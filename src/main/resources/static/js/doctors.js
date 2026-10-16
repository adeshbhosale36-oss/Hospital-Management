/**
 * ==========================================================================
 * HOSPITAL MANAGEMENT SYSTEM - DOCTORS MODULE (§3.3 Refactored)
 * Thin configuration around createListController and UI helpers.
 * Manages doctor directory, department multi-select association,
 * appointment count display, appointment cascade delete warning,
 * bulk delete protection, and doctor login provisioning.
 * ==========================================================================
 */

let doctorsController;
let allDepartments = [];
const departmentMap = new Map();

document.addEventListener('DOMContentLoaded', async () => {
  await UI.initShell('doctors', 'Medical Staff Directory');

  // Initialize List Controller
  doctorsController = createListController({
    tableBodyId: 'doctors-tbody',
    paginationId: 'doctors-pagination',
    countInfoId: 'doctors-count-info',
    searchInputId: 'search-doctors',
    tableId: 'doctors-table',
    colSpan: 6,
    pageSize: 10,
    sortColumn: 'id',
    sortDirection: 'desc',
    resourceLabel: 'doctor',
    filterPredicate: (doc, query, lookups) => {
      if (!query) return true;
      const name = (doc.name || '').toLowerCase();
      const spec = (doc.specialization || '').toLowerCase();
      const email = (doc.email || '').toLowerCase();
      const id = String(doc.id || '');

      // Match assigned department names
      let deptMatch = false;
      if (Array.isArray(doc.departmentId)) {
        deptMatch = doc.departmentId.some(deptId => {
          const dept = departmentMap.get(deptId);
          return dept && dept.name && dept.name.toLowerCase().includes(query);
        });
      }

      return name.includes(query) || spec.includes(query) || email.includes(query) || id.includes(query) || deptMatch;
    },
    customSort: (a, b, col, dir) => {
      if (col === 'appointmentCount') {
        const countA = Array.isArray(a.appointmentId) ? a.appointmentId.length : 0;
        const countB = Array.isArray(b.appointmentId) ? b.appointmentId.length : 0;
        return dir === 'asc' ? countA - countB : countB - countA;
      }
      return null;
    },
    emptyState: {
      title: 'No Medical Practitioners Found',
      emptyText: 'No doctors have been registered yet. Add staff to begin scheduling.',
      noMatchText: 'No doctors match your search query.',
      actionButtonHtml: '<button type="button" class="btn btn-primary btn-sm" onclick="openAddDoctorModal()">+ Register Doctor</button>'
    },
    fetchData: async () => {
      const [doctorData, deptData] = await Promise.all([
        api.get('/Doctor'),
        api.get('/Department').catch(() => [])
      ]);

      allDepartments = Array.isArray(deptData) ? deptData : [];
      departmentMap.clear();
      allDepartments.forEach(dept => departmentMap.set(dept.id, dept));

      renderDepartmentChecklist();

      return {
        records: Array.isArray(doctorData) ? doctorData : [],
        lookups: { departmentMap, allDepartments }
      };
    },
    renderRow: (doc, lookups) => {
      // Resolve department badges from departmentId array (§2)
      let deptChips = '<span style="color: var(--text-muted); font-size: 12px;">Unassigned</span>';
      if (Array.isArray(doc.departmentId) && doc.departmentId.length > 0) {
        deptChips = doc.departmentId.map(deptId => {
          const dept = departmentMap.get(deptId);
          const label = dept ? dept.name : `Dept #${deptId}`;
          return `<span class="chip">${UI.escapeHtml(label)}</span>`;
        }).join(' ');
      }

      const apptCount = Array.isArray(doc.appointmentId) ? doc.appointmentId.length : 0;

      return `
        <tr>
          <td class="col-mono id-tag">#${doc.id}</td>
          <td>
            <div style="font-weight: 500;">Dr. ${UI.escapeHtml(doc.name)}</div>
            <div style="font-size: 11px; color: var(--text-muted);">${UI.escapeHtml(doc.email || 'No email')}</div>
          </td>
          <td>${UI.escapeHtml(doc.specialization || 'General Practice')}</td>
          <td>${deptChips}</td>
          <td class="col-mono">
            <span class="id-badge" title="${apptCount} appointments scheduled">${apptCount} booked</span>
          </td>
          <td>
            <div class="cell-actions">
              <button type="button" class="btn btn-secondary btn-sm" onclick="openEditDoctorModal(${doc.id})" title="Edit Doctor Details">
                Edit
              </button>
              <button type="button" class="btn btn-danger-outline btn-sm" onclick="confirmDeleteDoctor(${doc.id}, '${UI.escapeHtml(doc.name)}', ${apptCount})" title="Delete Doctor Record">
                Delete
              </button>
            </div>
          </td>
        </tr>
      `;
    }
  });

  // Setup Add Doctor button
  const addBtn = document.getElementById('btn-add-doctor');
  if (addBtn) {
    addBtn.addEventListener('click', openAddDoctorModal);
  }

  // Doctor Form submit
  const doctorForm = document.getElementById('doctor-form');
  if (doctorForm) {
    doctorForm.addEventListener('submit', handleSaveDoctor);
  }

  // Setup Bulk Delete button (§6.1 & §3.2)
  UI.bindBulkDelete({
    buttonId: 'btn-bulk-delete-doctors',
    resourceLabel: 'doctor',
    resourcePath: '/Doctor',
    getCount: () => doctorsController.getRecords().length,
    confirmTitle: 'Delete All Doctors',
    confirmMessage: `This will permanently delete ALL ${doctorsController.getRecords().length} doctor profile(s) and all linked appointments in the database. This action is irreversible.`,
    successMessage: 'All doctor records have been permanently removed.',
    onDone: async () => {
      await doctorsController.load();
    }
  });

  // Initial load
  await doctorsController.load();
});

/**
 * Render department checkboxes inside doctor modal
 */
function renderDepartmentChecklist(selectedDeptIds = []) {
  const container = document.getElementById('doctor-departments-checklist');
  if (!container) return;

  if (allDepartments.length === 0) {
    container.innerHTML = `
      <div style="font-size: 12px; color: var(--text-muted); padding: 8px;">
        No departments registered yet. Create departments in the Departments module first.
      </div>
    `;
    return;
  }

  let html = '';
  allDepartments.forEach(dept => {
    const isChecked = selectedDeptIds.includes(dept.id);
    html += `
      <label class="checklist-item">
        <input type="checkbox" name="doctor-dept" value="${dept.id}" ${isChecked ? 'checked' : ''}>
        <span>${UI.escapeHtml(dept.name)}</span>
        <span class="id-badge" style="font-size: 11px;">#${dept.id}</span>
      </label>
    `;
  });

  container.innerHTML = html;
}

/* Modal Openers */
window.openAddDoctorModal = function() {
  document.getElementById('doctor-modal-title').textContent = 'Register Medical Staff';
  document.getElementById('doctor-id').value = '';
  document.getElementById('doctor-form').reset();
  const pwdInput = document.getElementById('doctor-password');
  if (pwdInput) {
    pwdInput.value = '';
    pwdInput.placeholder = 'At least 4 characters';
  }
  const pwdReq = document.getElementById('doctor-password-req');
  if (pwdReq) pwdReq.style.display = 'inline';
  const pwdHint = document.getElementById('doctor-password-hint');
  if (pwdHint) pwdHint.textContent = 'Doctor uses this password and their email to sign in.';
  renderDepartmentChecklist([]);
  UI.clearFormErrors('#doctor-form');
  UI.openModal('doctor-modal');
};

window.openEditDoctorModal = function(docId) {
  const doc = doctorsController.getRecords().find(d => d.id === docId);
  if (!doc) return;

  document.getElementById('doctor-modal-title').textContent = `Edit Doctor Record #${doc.id}`;
  document.getElementById('doctor-id').value = doc.id;
  document.getElementById('doctor-name').value = doc.name || '';
  document.getElementById('doctor-specialization').value = doc.specialization || '';
  document.getElementById('doctor-email').value = doc.email || '';
  const pwdInput = document.getElementById('doctor-password');
  if (pwdInput) {
    pwdInput.value = '';
    pwdInput.placeholder = 'Leave blank to keep existing password';
  }
  const pwdReq = document.getElementById('doctor-password-req');
  if (pwdReq) pwdReq.style.display = 'none';
  const pwdHint = document.getElementById('doctor-password-hint');
  if (pwdHint) pwdHint.textContent = 'Leave blank to keep existing password.';

  renderDepartmentChecklist(Array.isArray(doc.departmentId) ? doc.departmentId : []);
  UI.clearFormErrors('#doctor-form');
  UI.openModal('doctor-modal');
};

/**
 * Handles Doctor Form Save (POST /Doctor or PUT /Doctor/{id})
 */
async function handleSaveDoctor(e) {
  e.preventDefault();
  UI.clearFormErrors('#doctor-form');

  const id = document.getElementById('doctor-id').value;
  const name = document.getElementById('doctor-name').value.trim();
  const specialization = document.getElementById('doctor-specialization').value.trim();
  const email = document.getElementById('doctor-email').value.trim();
  const password = document.getElementById('doctor-password')?.value || '';

  // Gather selected department IDs from checkboxes
  const deptCheckboxes = document.querySelectorAll('#doctor-departments-checklist input[name="doctor-dept"]:checked');
  const departmentId = Array.from(deptCheckboxes).map(cb => parseInt(cb.value, 10));

  let isValid = true;

  if (!name) {
    document.getElementById('doctor-name-error').classList.add('is-visible');
    document.getElementById('doctor-name').classList.add('is-invalid');
    isValid = false;
  }

  if (!specialization) {
    document.getElementById('doctor-specialization-error').classList.add('is-visible');
    document.getElementById('doctor-specialization').classList.add('is-invalid');
    isValid = false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    document.getElementById('doctor-email-error').classList.add('is-visible');
    document.getElementById('doctor-email').classList.add('is-invalid');
    isValid = false;
  }

  // Password validation: required for new doctor, optional for edit
  if (!id) {
    if (!password || password.length < 4) {
      document.getElementById('doctor-password-error').classList.add('is-visible');
      document.getElementById('doctor-password').classList.add('is-invalid');
      isValid = false;
    }
  } else if (password && password.length < 4) {
    document.getElementById('doctor-password-error').classList.add('is-visible');
    document.getElementById('doctor-password').classList.add('is-invalid');
    isValid = false;
  }

  if (!isValid) return;

  const payload = {
    name: name,
    specialization: specialization,
    email: email,
    departmentId: departmentId, // Required multi-select array per §3
    password: password.trim() ? password.trim() : undefined
  };

  const submitBtn = document.getElementById('btn-doctor-submit');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving...';

  try {
    if (id) {
      await api.put(`/Doctor/${id}`, payload);
      UI.showToast(`Doctor Dr. ${name} updated successfully.`, 'success');
    } else {
      await api.post('/Doctor', payload);
      UI.showToast(`Doctor Dr. ${name} registered successfully. Login credentials provisioned.`, 'success');
    }

    UI.closeModal('doctor-modal');
    await doctorsController.load();
  } catch (err) {
    console.error('Failed to save doctor:', err);
    UI.showToast(err.message || 'Could not save doctor profile.', 'danger');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Save Record';
  }
}

/**
 * Confirmation before deleting doctor
 * Mentions cascading appointment deletion per §6.4
 */
window.confirmDeleteDoctor = function(docId, docName, apptCount) {
  let cascadeWarning = '';
  if (apptCount > 0) {
    cascadeWarning = `\n\nWARNING: Deleting this doctor will automatically cascade and delete their ${apptCount} associated appointment(s).`;
  }

  UI.showConfirmModal({
    title: 'Delete Medical Staff Record',
    message: `Are you sure you want to remove Dr. ${docName} (ID #${docId})?${cascadeWarning}`,
    confirmText: 'Delete Doctor',
    isDanger: true,
    onConfirm: async () => {
      try {
        await api.delete(`/Doctor/${docId}`);
        UI.showToast(`Doctor record #${docId} deleted.`, 'success');
        await doctorsController.load();
      } catch (err) {
        UI.showToast(err.message || 'Failed to delete doctor.', 'danger');
      }
    }
  });
};
