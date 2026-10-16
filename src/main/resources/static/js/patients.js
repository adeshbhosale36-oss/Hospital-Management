/**
 * ==========================================================================
 * HOSPITAL MANAGEMENT SYSTEM - PATIENTS MODULE (§3.3 Refactored)
 * Thin configuration around createListController and UI helpers.
 * Manages patient form validation, insurance lookup, cascade warning on
 * deletion, and bulk delete protection.
 * ==========================================================================
 */

let patientsController;
const insuranceMap = new Map();
const patientAppointmentCountMap = new Map();

document.addEventListener('DOMContentLoaded', async () => {
  await UI.initShell('patients', 'Patient Records Directory');

  // Initialize List Controller
  patientsController = createListController({
    tableBodyId: 'patients-tbody',
    paginationId: 'patients-pagination',
    countInfoId: 'patients-count-info',
    searchInputId: 'search-patients',
    tableId: 'patients-table',
    colSpan: 8,
    pageSize: 10,
    sortColumn: 'id',
    sortDirection: 'desc',
    resourceLabel: 'patient',
    searchFields: ['patientName', 'email', 'mobileNumber', 'id', 'address'],
    emptyState: {
      title: 'No Patients Found',
      emptyText: 'No patients have been registered yet. Add your first patient to begin.',
      noMatchText: 'No patients match your search criteria.',
      actionButtonHtml: '<button type="button" class="btn btn-primary btn-sm" onclick="openAddPatientModal()">+ Register Patient</button>'
    },
    fetchData: async () => {
      const [patientData, insuranceData, appointmentData] = await Promise.all([
        api.get('/Patient'),
        api.get('/Insurance').catch(() => []),
        api.get('/Appointment').catch(() => [])
      ]);

      // Build Insurance lookup map (id -> record)
      insuranceMap.clear();
      if (Array.isArray(insuranceData)) {
        insuranceData.forEach(ins => insuranceMap.set(ins.id, ins));
      }
      populateInsuranceSelect(insuranceData);

      // Build Patient -> Appointment count map for cascade delete warnings (§6.4)
      patientAppointmentCountMap.clear();
      if (Array.isArray(appointmentData)) {
        appointmentData.forEach(apt => {
          if (apt.patientId) {
            const current = patientAppointmentCountMap.get(apt.patientId) || 0;
            patientAppointmentCountMap.set(apt.patientId, current + 1);
          }
        });
      }

      return {
        records: Array.isArray(patientData) ? patientData : [],
        lookups: { insuranceMap, patientAppointmentCountMap }
      };
    },
    renderRow: (patient, lookups) => {
      const insurance = patient.insuranceId ? insuranceMap.get(patient.insuranceId) : null;
      const insuranceLabel = insurance 
        ? `${UI.escapeHtml(insurance.provider)} <span class="id-badge">${UI.escapeHtml(insurance.policyNumber)}</span>` 
        : (patient.insuranceId ? `<span class="id-badge">ID #${patient.insuranceId}</span>` : '<span class="chip" style="color: var(--text-muted);">Uninsured</span>');

      const appointmentCount = patientAppointmentCountMap.get(patient.id) || 0;
      const isAdmin = (typeof Auth !== 'undefined') ? Auth.isAdmin() : true;
      const deleteBtnHtml = isAdmin ? `
              <button type="button" class="btn btn-danger-outline btn-sm" onclick="confirmDeletePatient(${patient.id}, '${UI.escapeHtml(patient.patientName)}', ${appointmentCount})" title="Delete Patient Record">
                Delete
              </button>` : '';

      return `
        <tr>
          <td class="col-mono id-tag">#${patient.id}</td>
          <td>
            <div style="font-weight: 500;">${UI.escapeHtml(patient.patientName)}</div>
            <div style="font-size: 11px; color: var(--text-muted);">${UI.escapeHtml(patient.email || 'No email')}</div>
          </td>
          <td>${UI.escapeHtml(patient.gender || '—')}</td>
          <td class="col-mono">${patient.age || '—'}</td>
          <td class="col-mono">${patient.mobileNumber || '—'}</td>
          <td>${UI.escapeHtml(patient.address || '—')}</td>
          <td>${insuranceLabel}</td>
          <td>
            <div class="cell-actions">
              <button type="button" class="btn btn-secondary btn-sm" onclick="openEditPatientModal(${patient.id})" title="Edit Patient Details">
                Edit
              </button>
              ${deleteBtnHtml}
            </div>
          </td>
        </tr>
      `;
    }
  });

  // Role visibility: Hide admin features from non-admin users (§2)
  if (typeof Auth !== 'undefined' && !Auth.isAdmin()) {
    const addBtn = document.getElementById('btn-add-patient');
    if (addBtn) addBtn.style.display = 'none';
    const dangerZone = document.querySelector('.danger-zone-panel');
    if (dangerZone) dangerZone.style.display = 'none';
  } else {
    // Setup Add Patient button for admin
    const addBtn = document.getElementById('btn-add-patient');
    if (addBtn) {
      addBtn.addEventListener('click', openAddPatientModal);
    }

    // Setup Bulk Delete button for admin (§6.1 & §3.2)
    UI.bindBulkDelete({
      buttonId: 'btn-bulk-delete-patients',
      resourceLabel: 'patient',
      resourcePath: '/Patient',
      getCount: () => patientsController.getRecords().length,
      confirmTitle: 'Delete All Patient Records',
      confirmMessage: `This will permanently delete ALL ${patientsController.getRecords().length} patient record(s) and all linked appointments in the database. This action is immediate and cannot be recovered.`,
      successMessage: 'All patient records have been permanently removed.',
      onDone: async () => {
        await patientsController.load();
      }
    });
  }

  // Form submission
  const patientForm = document.getElementById('patient-form');
  if (patientForm) {
    patientForm.addEventListener('submit', handleSavePatient);
  }

  // Initial load
  await patientsController.load();
});

function populateInsuranceSelect(insuranceList) {
  const select = document.getElementById('patient-insuranceId');
  if (!select) return;

  select.innerHTML = '<option value="">-- None / No Insurance Policy --</option>';
  if (Array.isArray(insuranceList)) {
    insuranceList.forEach(ins => {
      const opt = document.createElement('option');
      opt.value = ins.id;
      opt.textContent = `${ins.policyNumber || 'No Policy #'} (${ins.provider || 'Unknown Provider'}) [ID: ${ins.id}]`;
      select.appendChild(opt);
    });
  }
}

/* Modal Openers */
window.openAddPatientModal = function() {
  document.getElementById('patient-modal-title').textContent = 'Register New Patient';
  document.getElementById('patient-id').value = '';
  document.getElementById('patient-form').reset();
  const pwdInput = document.getElementById('patient-password');
  if (pwdInput) {
    pwdInput.value = '';
    pwdInput.placeholder = 'At least 4 characters';
  }
  const pwdReq = document.getElementById('patient-password-req');
  if (pwdReq) pwdReq.style.display = 'inline';
  const pwdHint = document.getElementById('patient-password-hint');
  if (pwdHint) pwdHint.textContent = 'Patient uses this password and their email to sign in.';
  UI.clearFormErrors('#patient-form');
  UI.openModal('patient-modal');
};

window.openEditPatientModal = function(patientId) {
  const patient = patientsController.getRecords().find(p => p.id === patientId);
  if (!patient) return;

  document.getElementById('patient-modal-title').textContent = `Edit Patient Record #${patient.id}`;
  document.getElementById('patient-id').value = patient.id;
  document.getElementById('patient-name').value = patient.patientName || '';
  document.getElementById('patient-gender').value = patient.gender || 'Male';
  document.getElementById('patient-age').value = patient.age || '';
  document.getElementById('patient-email').value = patient.email || '';
  document.getElementById('patient-mobile').value = patient.mobileNumber || '';
  document.getElementById('patient-address').value = patient.address || '';
  const pwdInput = document.getElementById('patient-password');
  if (pwdInput) {
    pwdInput.value = '';
    pwdInput.placeholder = 'Leave blank to keep existing password';
  }
  const pwdReq = document.getElementById('patient-password-req');
  if (pwdReq) pwdReq.style.display = 'none';
  const pwdHint = document.getElementById('patient-password-hint');
  if (pwdHint) pwdHint.textContent = 'Leave blank to keep existing password.';

  UI.clearFormErrors('#patient-form');
  UI.openModal('patient-modal');
};

/**
 * Handles Patient Form Save (POST /Patient or PUT /Patient/{id})
 */
async function handleSavePatient(e) {
  e.preventDefault();
  UI.clearFormErrors('#patient-form');

  const id = document.getElementById('patient-id').value;
  const name = document.getElementById('patient-name').value.trim();
  const gender = document.getElementById('patient-gender').value;
  const ageVal = document.getElementById('patient-age').value.trim();
  const email = document.getElementById('patient-email').value.trim();
  const mobileVal = document.getElementById('patient-mobile').value.trim();
  const address = document.getElementById('patient-address').value.trim();
  const password = document.getElementById('patient-password')?.value || '';

  let isValid = true;

  if (!name) {
    document.getElementById('patient-name-error').classList.add('is-visible');
    document.getElementById('patient-name').classList.add('is-invalid');
    isValid = false;
  }

  const age = parseInt(ageVal, 10);
  if (isNaN(age) || age <= 0 || age > 150) {
    document.getElementById('patient-age-error').classList.add('is-visible');
    document.getElementById('patient-age').classList.add('is-invalid');
    isValid = false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    document.getElementById('patient-email-error').classList.add('is-visible');
    document.getElementById('patient-email').classList.add('is-invalid');
    isValid = false;
  }

  const mobile = parseInt(mobileVal, 10);
  if (isNaN(mobile) || mobileVal.length < 5) {
    document.getElementById('patient-mobile-error').classList.add('is-visible');
    document.getElementById('patient-mobile').classList.add('is-invalid');
    isValid = false;
  }

  if (!address) {
    document.getElementById('patient-address-error').classList.add('is-visible');
    document.getElementById('patient-address').classList.add('is-invalid');
    isValid = false;
  }

  // Password validation: required for new patient, optional for edit
  if (!id) {
    if (!password || password.length < 4) {
      document.getElementById('patient-password-error').classList.add('is-visible');
      document.getElementById('patient-password').classList.add('is-invalid');
      isValid = false;
    }
  } else if (password && password.length < 4) {
    document.getElementById('patient-password-error').classList.add('is-visible');
    document.getElementById('patient-password').classList.add('is-invalid');
    isValid = false;
  }

  if (!isValid) return;

  let existingInsuranceId = null;
  if (id) {
    const existingPatient = patientsController.getRecords().find(p => p.id === parseInt(id, 10));
    if (existingPatient) {
      existingInsuranceId = existingPatient.insuranceId;
    }
  }

  const payload = {
    patientName: name,
    gender: gender,
    age: age,
    email: email,
    mobileNumber: mobile,
    address: address,
    insuranceId: existingInsuranceId,
    password: password.trim() ? password.trim() : undefined
  };

  const submitBtn = document.getElementById('btn-patient-submit');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving...';

  try {
    if (id) {
      await api.put(`/Patient/${id}`, payload);
      UI.showToast(`Patient "${name}" updated successfully.`, 'success');
    } else {
      await api.post('/Patient', payload);
      UI.showToast(`Patient "${name}" registered successfully. Login credentials provisioned.`, 'success');
    }

    UI.closeModal('patient-modal');
    await patientsController.load();
  } catch (err) {
    console.error('Failed to save patient:', err);
    UI.showToast(err.message || 'Could not save patient record.', 'danger');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Save Record';
  }
}

/**
 * Confirmation modal before deleting single patient
 * Mentions cascading appointment deletion per §6.4
 */
window.confirmDeletePatient = function(patientId, patientName, appointmentCount) {
  let cascadeWarning = '';
  if (appointmentCount > 0) {
    cascadeWarning = `\n\nWARNING: Deleting this patient will also permanently delete their ${appointmentCount} linked appointment(s).`;
  }

  UI.showConfirmModal({
    title: 'Delete Patient Record',
    message: `Are you sure you want to delete patient "${patientName}" (ID #${patientId})?${cascadeWarning}`,
    confirmText: 'Delete Patient',
    isDanger: true,
    onConfirm: async () => {
      try {
        await api.delete(`/Patient/${patientId}`);
        UI.showToast(`Patient record #${patientId} deleted.`, 'success');
        await patientsController.load();
      } catch (err) {
        UI.showToast(err.message || 'Failed to delete patient.', 'danger');
      }
    }
  });
};
