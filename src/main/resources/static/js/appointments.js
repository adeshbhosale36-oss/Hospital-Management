/**
 * ==========================================================================
 * HOSPITAL MANAGEMENT SYSTEM - APPOINTMENTS MODULE (§3.3 Refactored)
 * Thin configuration around createListController and UI helpers.
 * Manages clinical appointments schedule, patient & doctor lookups,
 * today's appointment highlight indicator, and bulk delete protection.
 * ==========================================================================
 */

let appointmentsController;
let allPatients = [];
let allDoctors = [];
const patientMap = new Map();
const doctorMap = new Map();

document.addEventListener('DOMContentLoaded', async () => {
  await UI.initShell('appointments', 'Appointment Master Schedule');

  const todayStr = new Date().toISOString().substring(0, 10);

  // Initialize List Controller
  appointmentsController = createListController({
    tableBodyId: 'appointments-tbody',
    paginationId: 'appointments-pagination',
    countInfoId: 'appointments-count-info',
    searchInputId: 'search-appointments',
    tableId: 'appointments-table',
    colSpan: 6,
    pageSize: 10,
    sortColumn: 'appointmentDate',
    sortDirection: 'desc',
    resourceLabel: 'appointment',
    isCustomFilterActive: () => Boolean(document.getElementById('filter-today-only')?.checked),
    filterPredicate: (appt, query, lookups) => {
      const todayOnly = document.getElementById('filter-today-only')?.checked;
      if (todayOnly) {
        if (!appt.appointmentDate || appt.appointmentDate.substring(0, 10) !== todayStr) {
          return false;
        }
      }

      if (!query) return true;

      const dateStr = String(appt.appointmentDate || '').toLowerCase();
      const reason = String(appt.reason || '').toLowerCase();
      const id = String(appt.id || '');

      const patient = patientMap.get(appt.patientId);
      const patientName = patient ? patient.patientName.toLowerCase() : '';

      const doctor = doctorMap.get(appt.doctorId);
      const docName = doctor ? doctor.name.toLowerCase() : '';
      const docSpec = doctor ? (doctor.specialization || '').toLowerCase() : '';

      return dateStr.includes(query) || reason.includes(query) || id.includes(query) || 
             patientName.includes(query) || docName.includes(query) || docSpec.includes(query);
    },
    customSort: (a, b, col, dir) => {
      if (col === 'patientName') {
        const nameA = patientMap.get(a.patientId)?.patientName || '';
        const nameB = patientMap.get(b.patientId)?.patientName || '';
        return dir === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      if (col === 'doctorName') {
        const docA = doctorMap.get(a.doctorId)?.name || '';
        const docB = doctorMap.get(b.doctorId)?.name || '';
        return dir === 'asc' ? docA.localeCompare(docB) : docB.localeCompare(docA);
      }
      return null;
    },
    emptyState: {
      title: 'No Appointments Found',
      emptyText: 'No appointments scheduled yet. Schedule your first consultation.',
      noMatchText: 'No appointments match the filter criteria.',
      actionButtonHtml: '<button type="button" class="btn btn-primary btn-sm" onclick="openAddAppointmentModal()">+ Schedule Appointment</button>'
    },
    fetchData: async () => {
      const [apptData, patientData, docData] = await Promise.all([
        api.get('/Appointment'),
        api.get('/Patient').catch(() => []),
        api.get('/Doctor').catch(() => [])
      ]);

      allPatients = Array.isArray(patientData) ? patientData : [];
      allDoctors = Array.isArray(docData) ? docData : [];

      patientMap.clear();
      allPatients.forEach(p => patientMap.set(p.id, p));

      doctorMap.clear();
      allDoctors.forEach(d => doctorMap.set(d.id, d));

      populatePatientSelect();
      populateDoctorSelect();

      return {
        records: Array.isArray(apptData) ? apptData : [],
        lookups: { patientMap, doctorMap }
      };
    },
    renderRow: (appt, lookups) => {
      const isToday = appt.appointmentDate && appt.appointmentDate.substring(0, 10) === todayStr;
      const rowClass = isToday ? 'row-today' : '';

      const patient = patientMap.get(appt.patientId);
      const patientLabel = patient 
        ? `<div style="font-weight: 500;">${UI.escapeHtml(patient.patientName)}</div>
           <div style="font-size: 11px; color: var(--text-muted);"><span class="id-badge">#${patient.id}</span> ${UI.escapeHtml(patient.mobileNumber ? String(patient.mobileNumber) : '')}</div>` 
        : `<span class="id-badge">ID #${appt.patientId} (Not Found)</span>`;

      const doctor = doctorMap.get(appt.doctorId);
      const doctorLabel = doctor
        ? `<div style="font-weight: 500;">Dr. ${UI.escapeHtml(doctor.name)}</div>
           <div style="font-size: 11px; color: var(--text-muted);"><span class="chip">${UI.escapeHtml(doctor.specialization || 'General')}</span></div>` 
        : `<span class="id-badge">Doctor #${appt.doctorId} (Not Found)</span>`;

      return `
        <tr class="${rowClass}">
          <td class="col-mono id-tag">#${appt.id}</td>
          <td class="col-mono">
            <div style="font-weight: 500;">${appt.appointmentDate}</div>
            ${isToday ? '<span class="chip chip-primary" style="font-weight: 600;">Today</span>' : ''}
          </td>
          <td>${patientLabel}</td>
          <td>${doctorLabel}</td>
          <td>${UI.escapeHtml(appt.reason || 'Consultation')}</td>
          <td>
            <div class="cell-actions">
              <button type="button" class="btn btn-secondary btn-sm" onclick="openEditAppointmentModal(${appt.id})" title="Edit Appointment Details">
                Edit
              </button>
              <button type="button" class="btn btn-danger-outline btn-sm" onclick="confirmDeleteAppointment(${appt.id})" title="Cancel / Delete Appointment">
                Cancel
              </button>
            </div>
          </td>
        </tr>
      `;
    }
  });

  // Quick filter: Show Today Only checkbox
  const todayFilter = document.getElementById('filter-today-only');
  if (todayFilter) {
    todayFilter.addEventListener('change', () => {
      appointmentsController.applyFilter(document.getElementById('search-appointments')?.value || '');
    });
  }

  // Setup Add Appointment button
  const addBtn = document.getElementById('btn-add-appointment');
  if (addBtn) {
    addBtn.addEventListener('click', openAddAppointmentModal);
  }

  // Appointment Form submit
  const apptForm = document.getElementById('appointment-form');
  if (apptForm) {
    apptForm.addEventListener('submit', handleSaveAppointment);
  }

  // Setup Bulk Delete button for admin only (§6.1 & §3.2)
  if (typeof Auth !== 'undefined' && !Auth.isAdmin()) {
    const dangerZone = document.querySelector('.danger-zone-panel');
    if (dangerZone) dangerZone.style.display = 'none';
  } else {
    UI.bindBulkDelete({
      buttonId: 'btn-bulk-delete-appointments',
      resourceLabel: 'appointment',
      resourcePath: '/Appointment',
      getCount: () => appointmentsController.getRecords().length,
      confirmTitle: 'Delete All Appointments',
      confirmMessage: `This will permanently delete ALL ${appointmentsController.getRecords().length} scheduled appointment(s) in the hospital database. This action is immediate and cannot be recovered.`,
      successMessage: 'All appointments have been permanently removed.',
      onDone: async () => {
        await appointmentsController.load();
      }
    });
  }

  // Initial load
  await appointmentsController.load();
});

function populatePatientSelect() {
  const select = document.getElementById('appointment-patientId');
  if (!select) return;

  select.innerHTML = '<option value="" disabled selected>-- Select Registered Patient --</option>';
  allPatients.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = `${p.patientName} (ID #${p.id}) — Age: ${p.age || '—'}`;
    select.appendChild(opt);
  });
}

function populateDoctorSelect() {
  const select = document.getElementById('appointment-doctorId');
  if (!select) return;

  select.innerHTML = '<option value="" disabled selected>-- Select Consulting Doctor --</option>';
  allDoctors.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d.id;
    opt.textContent = `Dr. ${d.name} (${d.specialization || 'General'}) [ID #${d.id}]`;
    select.appendChild(opt);
  });
}

/* Modal Openers */
window.openAddAppointmentModal = function() {
  document.getElementById('appointment-modal-title').textContent = 'Schedule New Appointment';
  document.getElementById('appointment-id').value = '';
  document.getElementById('appointment-form').reset();

  const patientSelect = document.getElementById('appointment-patientId');
  if (patientSelect) patientSelect.disabled = false;

  // Pre-fill date with today's date
  const today = new Date().toISOString().substring(0, 10);
  document.getElementById('appointment-date').value = today;

  // Auto-lock to current user if Patient or Doctor
  if (typeof Auth !== 'undefined') {
    if (Auth.isPatient()) {
      const pid = Auth.getProfileId();
      if (pid && patientSelect) {
        patientSelect.value = pid;
        patientSelect.disabled = true;
      }
    } else if (Auth.isDoctor()) {
      const docSelect = document.getElementById('appointment-doctorId');
      const did = Auth.getProfileId();
      if (did && docSelect) {
        docSelect.value = did;
      }
    }
  }

  UI.clearFormErrors('#appointment-form');
  UI.openModal('appointment-modal');
};

window.openEditAppointmentModal = function(apptId) {
  const appt = appointmentsController.getRecords().find(a => a.id === apptId);
  if (!appt) return;

  document.getElementById('appointment-modal-title').textContent = `Edit Appointment #${appt.id}`;
  document.getElementById('appointment-id').value = appt.id;
  document.getElementById('appointment-date').value = appt.appointmentDate ? appt.appointmentDate.substring(0, 10) : '';
  const patientSelect = document.getElementById('appointment-patientId');
  if (patientSelect) {
    patientSelect.value = appt.patientId || '';
    patientSelect.disabled = (typeof Auth !== 'undefined' && Auth.isPatient());
  }
  document.getElementById('appointment-doctorId').value = appt.doctorId || '';
  document.getElementById('appointment-reason').value = appt.reason || '';

  UI.clearFormErrors('#appointment-form');
  UI.openModal('appointment-modal');
};

/**
 * Handles Appointment Form Save (POST /Appointment or PUT /Appointment/{id})
 * Validates ALL FOUR @NotNull fields client-side per §3
 */
async function handleSaveAppointment(e) {
  e.preventDefault();
  UI.clearFormErrors('#appointment-form');

  const id = document.getElementById('appointment-id').value;
  const date = document.getElementById('appointment-date').value;
  let patientIdVal = document.getElementById('appointment-patientId').value;
  if (!patientIdVal && typeof Auth !== 'undefined' && Auth.isPatient()) {
    patientIdVal = Auth.getProfileId();
  }
  const doctorIdVal = document.getElementById('appointment-doctorId').value;
  const reason = document.getElementById('appointment-reason').value.trim();

  let isValid = true;

  if (!date) {
    document.getElementById('appointment-date-error').classList.add('is-visible');
    document.getElementById('appointment-date').classList.add('is-invalid');
    isValid = false;
  }

  if (!patientIdVal) {
    document.getElementById('appointment-patient-error').classList.add('is-visible');
    document.getElementById('appointment-patientId').classList.add('is-invalid');
    isValid = false;
  }

  if (!doctorIdVal) {
    document.getElementById('appointment-doctor-error').classList.add('is-visible');
    document.getElementById('appointment-doctorId').classList.add('is-invalid');
    isValid = false;
  }

  if (!reason) {
    document.getElementById('appointment-reason-error').classList.add('is-visible');
    document.getElementById('appointment-reason').classList.add('is-invalid');
    isValid = false;
  }

  if (!isValid) return;

  const payload = {
    appointmentDate: date,
    reason: reason,
    patientId: parseInt(patientIdVal, 10),
    doctorId: parseInt(doctorIdVal, 10)
  };

  const submitBtn = document.getElementById('btn-appointment-submit');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving...';

  try {
    if (id) {
      await api.put(`/Appointment/${id}`, payload);
      UI.showToast(`Appointment #${id} updated successfully.`, 'success');
    } else {
      await api.post('/Appointment', payload);
      UI.showToast('New appointment scheduled successfully.', 'success');
    }

    UI.closeModal('appointment-modal');
    await appointmentsController.load();
  } catch (err) {
    console.error('Failed to save appointment:', err);
    UI.showToast(err.message || 'Could not schedule appointment.', 'danger');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Save Appointment';
  }
}

/**
 * Confirmation before deleting single appointment
 */
window.confirmDeleteAppointment = function(apptId) {
  UI.showConfirmModal({
    title: 'Cancel Appointment',
    message: `Are you sure you want to cancel and delete appointment #${apptId}?`,
    confirmText: 'Cancel Appointment',
    isDanger: true,
    onConfirm: async () => {
      try {
        await api.delete(`/Appointment/${apptId}`);
        UI.showToast(`Appointment #${apptId} cancelled.`, 'success');
        await appointmentsController.load();
      } catch (err) {
        UI.showToast(err.message || 'Failed to cancel appointment.', 'danger');
      }
    }
  });
};
