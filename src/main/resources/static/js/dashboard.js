/**
 * ==========================================================================
 * HOSPITAL MANAGEMENT SYSTEM - DASHBOARD LOGIC (§2 Doctor & §3 Patient)
 * Role-tailored dashboards:
 * - ADMIN: Full operational overview, department staffing, 5 metric cards, admin report
 * - DOCTOR: Doctor-related options only: assigned appointments, relevant patients,
 *   today's consultations, 7-day personal trend. Administrative sections hidden.
 * - PATIENT: Patient portal: select available doctor, select insurance, book appointments
 *   using existing APIs, view and cancel own appointments. Permitted info only.
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', async () => {
  const role = (typeof Auth !== 'undefined') ? Auth.getRole() : '';
  const pageTitle = (role === 'DOCTOR') 
    ? 'Physician Dashboard' 
    : (role === 'PATIENT' ? 'Patient Health Portal' : 'Operations Dashboard');

  await UI.initShell('dashboard', pageTitle);

  if (typeof Auth !== 'undefined') {
    await Auth.ensureProfileId();
  }

  await loadDashboardForRole();
});

async function loadDashboardForRole() {
  const role = (typeof Auth !== 'undefined') ? Auth.getRole() : 'ADMIN';

  if (role === 'PATIENT') {
    await setupPatientDashboard();
  } else if (role === 'DOCTOR') {
    await setupDoctorDashboard();
  } else {
    await setupAdminDashboard();
  }
}

/**
 * ==========================================================================
 * PATIENT DASHBOARD (§3)
 * Shows:
 * - Patient's own appointments
 * - Current insurance coverage status
 * - Quick Appointment Booking form:
 *     * Select available doctor (from GET /Doctor)
 *     * Select existing insurance option (from GET /Insurance)
 *     * Book appointment using existing API (POST /Appointment)
 * - Administrative sections and other patients' info restricted
 * ==========================================================================
 */
async function setupPatientDashboard() {
  // Update header text
  const titleEl = document.getElementById('dashboard-title');
  const subEl = document.getElementById('dashboard-subtitle');
  if (titleEl) titleEl.textContent = 'Patient Health Portal';
  if (subEl) subEl.textContent = 'Schedule consultations with available medical staff and manage your appointments.';

  // Hide action buttons in header
  const btnAppt = document.getElementById('btn-header-appointment');
  const btnPat = document.getElementById('btn-header-patient');
  if (btnAppt) btnAppt.style.display = 'none';
  if (btnPat) btnPat.style.display = 'none';

  // Card visibility
  const cardPatients = document.getElementById('card-patients');
  const cardDoctors = document.getElementById('card-doctors');
  const cardDepartments = document.getElementById('card-departments');
  const cardAppointments = document.getElementById('card-appointments');
  const cardInsurance = document.getElementById('card-insurance');
  const cardPatientInsurance = document.getElementById('card-patient-insurance');
  const cardDoctorPatients = document.getElementById('card-doctor-patients');

  if (cardPatients) cardPatients.style.display = 'none';
  if (cardDoctors) cardDoctors.style.display = 'none';
  if (cardDepartments) cardDepartments.style.display = 'none';
  if (cardInsurance) cardInsurance.style.display = 'none';
  if (cardDoctorPatients) cardDoctorPatients.style.display = 'none';
  if (cardAppointments) cardAppointments.style.display = 'block';
  if (cardPatientInsurance) cardPatientInsurance.style.display = 'block';

  const apptTitle = document.getElementById('card-appointments-title');
  if (apptTitle) apptTitle.textContent = 'My Consultations';

  // Hide admin analytics & today's consultations panel & admin report
  const analyticsGrid = document.getElementById('dashboard-analytics-grid');
  const todayPanel = document.getElementById('panel-today-appointments');
  const adminReport = document.getElementById('panel-admin-report');
  const docPatPanel = document.getElementById('panel-doctor-patients');

  if (analyticsGrid) analyticsGrid.style.display = 'none';
  if (todayPanel) todayPanel.style.display = 'none';
  if (adminReport) adminReport.style.display = 'none';
  if (docPatPanel) docPatPanel.style.display = 'none';

  // Show Patient Portal panel
  const portalPanel = document.getElementById('panel-patient-portal');
  if (portalPanel) portalPanel.style.display = 'block';

  // Set default appointment date to tomorrow or today
  const dateInput = document.getElementById('patient-book-date');
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().substring(0, 10);
  }

  try {
    // Fetch available doctors, insurance policies, own appointments, and own patient record
    const [appointments, doctors, insuranceList, patients] = await Promise.all([
      api.get('/Appointment').catch(() => []),
      api.get('/Doctor').catch(() => []),
      api.get('/Insurance').catch(() => []),
      api.get('/Patient').catch(() => [])
    ]);

    const myAppointments = Array.isArray(appointments) ? appointments : [];
    const doctorList = Array.isArray(doctors) ? doctors : [];
    const myInsuranceList = Array.isArray(insuranceList) ? insuranceList : [];
    const patientList = Array.isArray(patients) ? patients : [];

    const currentPatient = patientList.length > 0 ? patientList[0] : null;

    // Update My Consultations count
    const metricAppts = document.getElementById('metric-appointments');
    if (metricAppts) metricAppts.textContent = myAppointments.length;
    renderMiniSparkline('sparkline-appointments', [Math.max(0, myAppointments.length - 1), myAppointments.length, myAppointments.length], '#2F6F6B');

    // Update insurance status card
    const insTitle = document.getElementById('metric-patient-insurance-title');
    const insSub = document.getElementById('metric-patient-insurance-sub');
    const insuranceMap = new Map();
    myInsuranceList.forEach(i => insuranceMap.set(i.id, i));

    if (currentPatient && currentPatient.insuranceId && insuranceMap.has(currentPatient.insuranceId)) {
      const ins = insuranceMap.get(currentPatient.insuranceId);
      if (insTitle) insTitle.textContent = ins.provider || 'Covered';
      if (insSub) insSub.textContent = `Policy: ${ins.policyNumber || '#' + ins.id}`;
    } else {
      if (insTitle) insTitle.textContent = 'Uninsured';
      if (insSub) insSub.textContent = 'No policy linked yet';
    }

    // Populate Doctor select dropdown
    const docSelect = document.getElementById('patient-book-doctor');
    if (docSelect) {
      docSelect.innerHTML = '<option value="" disabled selected>-- Select an Available Doctor --</option>';
      doctorList.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.id;
        opt.textContent = `Dr. ${d.name} (${d.specialization || 'General Practice'})`;
        docSelect.appendChild(opt);
      });
    }

    // Populate Insurance select dropdown
    const insSelect = document.getElementById('patient-book-insurance');
    if (insSelect) {
      insSelect.innerHTML = '<option value="">-- None / No Insurance Policy --</option>';
      myInsuranceList.forEach(ins => {
        const opt = document.createElement('option');
        opt.value = ins.id;
        opt.textContent = `${ins.provider} - ${ins.policyNumber} (Valid: ${ins.validUntil || 'Active'})`;
        if (currentPatient && currentPatient.insuranceId === ins.id) {
          opt.selected = true;
        }
        insSelect.appendChild(opt);
      });
    }

    // Render Patient's appointment table
    renderPatientAppointmentsTable(myAppointments, doctorList);

    // Setup Appointment Booking Form submission
    setupPatientBookingForm(currentPatient);

  } catch (err) {
    console.error('Failed to load patient dashboard:', err);
    UI.showToast('Could not load patient dashboard data.', 'danger');
  }
}

function renderPatientAppointmentsTable(appointments, doctors) {
  const tbody = document.getElementById('patient-appointments-tbody');
  const countBadge = document.getElementById('patient-appt-count-badge');
  if (!tbody) return;

  const doctorMap = new Map();
  doctors.forEach(d => doctorMap.set(d.id, d));

  if (countBadge) countBadge.textContent = appointments.length;

  if (appointments.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 32px; color: var(--text-secondary);">
          You have no appointments booked yet. Select an available doctor above to schedule your visit.
        </td>
      </tr>
    `;
    return;
  }

  const todayStr = new Date().toISOString().substring(0, 10);
  let html = '';

  appointments.forEach(appt => {
    const doc = doctorMap.get(appt.doctorId);
    const docName = doc ? `Dr. ${UI.escapeHtml(doc.name)}` : `Doctor #${appt.doctorId}`;
    const docSpec = doc ? UI.escapeHtml(doc.specialization || 'General') : '—';
    const isToday = appt.appointmentDate && appt.appointmentDate.substring(0, 10) === todayStr;

    html += `
      <tr class="${isToday ? 'row-today' : ''}">
        <td class="col-mono id-tag">#${appt.id}</td>
        <td class="col-mono">
          <div style="font-weight: 500;">${appt.appointmentDate}</div>
          ${isToday ? '<span class="chip chip-primary" style="font-weight: 600;">Today</span>' : ''}
        </td>
        <td><div style="font-weight: 500;">${docName}</div></td>
        <td><span class="chip">${docSpec}</span></td>
        <td>${UI.escapeHtml(appt.reason || 'General Consultation')}</td>
        <td style="text-align: right;">
          <button type="button" class="btn btn-danger-outline btn-sm" onclick="cancelPatientAppointment(${appt.id})" title="Cancel Consultation">
            Cancel
          </button>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

function setupPatientBookingForm(currentPatient) {
  const form = document.getElementById('patient-booking-form');
  if (!form || form._bound) return;
  form._bound = true;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    UI.clearFormErrors(form);

    const docIdVal = document.getElementById('patient-book-doctor').value;
    const insIdVal = document.getElementById('patient-book-insurance').value;
    const dateVal = document.getElementById('patient-book-date').value;
    const reasonVal = document.getElementById('patient-book-reason').value.trim();

    let isValid = true;
    if (!docIdVal) {
      document.getElementById('patient-book-doctor-error')?.classList.add('is-visible');
      document.getElementById('patient-book-doctor')?.classList.add('is-invalid');
      isValid = false;
    }
    if (!dateVal) {
      document.getElementById('patient-book-date-error')?.classList.add('is-visible');
      document.getElementById('patient-book-date')?.classList.add('is-invalid');
      isValid = false;
    }
    if (!reasonVal) {
      document.getElementById('patient-book-reason-error')?.classList.add('is-visible');
      document.getElementById('patient-book-reason')?.classList.add('is-invalid');
      isValid = false;
    }

    if (!isValid) return;

    const submitBtn = document.getElementById('btn-patient-submit-booking');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Booking...';
    }

    try {
      // 1. Resolve patient profile ID
      let patientId = currentPatient ? currentPatient.id : Auth.getProfileId();
      if (!patientId) {
        patientId = await Auth.ensureProfileId();
      }

      // 2. If insurance policy was selected and differs from current, update patient record
      if (insIdVal && currentPatient && (!currentPatient.insuranceId || currentPatient.insuranceId !== parseInt(insIdVal, 10))) {
        try {
          const updatePayload = {
            patientName: currentPatient.patientName,
            gender: currentPatient.gender || 'Other',
            age: currentPatient.age || 30,
            email: currentPatient.email || `${Auth.getUsername()}@patient.hospital.org`,
            mobileNumber: currentPatient.mobileNumber || 9876543210,
            address: currentPatient.address || 'Registered Address',
            insuranceId: parseInt(insIdVal, 10)
          };
          await api.put(`/Patient/${patientId}`, updatePayload);
          currentPatient.insuranceId = parseInt(insIdVal, 10);
        } catch (insErr) {
          console.warn('Could not update patient insurance link:', insErr);
        }
      }

      // 3. Book appointment using existing API (POST /Appointment)
      const appointmentPayload = {
        appointmentDate: dateVal,
        reason: reasonVal,
        patientId: patientId,
        doctorId: parseInt(docIdVal, 10)
      };

      await api.post('/Appointment', appointmentPayload);
      UI.showToast('Your appointment has been successfully booked!', 'success', 'Appointment Confirmed');

      // Reset form fields
      document.getElementById('patient-book-reason').value = '';
      document.getElementById('patient-book-doctor').value = '';

      // Reload patient dashboard
      await setupPatientDashboard();
    } catch (err) {
      console.error('Failed to book appointment:', err);
      UI.showToast(err.message || 'Could not schedule appointment. Please try again.', 'danger');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Book Appointment';
      }
    }
  });
}

window.cancelPatientAppointment = function(apptId) {
  UI.showConfirmModal({
    title: 'Cancel Consultation',
    message: `Are you sure you want to cancel appointment #${apptId}?`,
    confirmText: 'Cancel Appointment',
    isDanger: true,
    onConfirm: async () => {
      try {
        await api.delete(`/Appointment/${apptId}`);
        UI.showToast('Appointment successfully cancelled.', 'success');
        await setupPatientDashboard();
      } catch (err) {
        UI.showToast(err.message || 'Could not cancel appointment.', 'danger');
      }
    }
  });
};

/**
 * ==========================================================================
 * DOCTOR DASHBOARD (§2)
 * Shows ONLY doctor-related options:
 * - Assigned Appointments count & Personal 7-day trend
 * - Relevant Patients (only patients who have appointments assigned to this doctor)
 * - Today's Consultations for this doctor
 * - Administrative sections (Departments, Insurance, Medical staff management,
 *   Admin report) are restricted and hidden
 * ==========================================================================
 */
async function setupDoctorDashboard() {
  const titleEl = document.getElementById('dashboard-title');
  const subEl = document.getElementById('dashboard-subtitle');
  if (titleEl) titleEl.textContent = 'Physician Clinical Overview';
  if (subEl) subEl.textContent = 'Monitor your scheduled clinical consultations, patient care records, and daily visits.';

  // Header actions: Keep "+ New Appointment", hide "+ Register Patient" (admin only)
  const btnAppt = document.getElementById('btn-header-appointment');
  const btnPat = document.getElementById('btn-header-patient');
  if (btnAppt) btnAppt.style.display = 'inline-block';
  if (btnPat) btnPat.style.display = 'none';

  // Metric card visibility
  const cardPatients = document.getElementById('card-patients');
  const cardDoctors = document.getElementById('card-doctors');
  const cardDepartments = document.getElementById('card-departments');
  const cardAppointments = document.getElementById('card-appointments');
  const cardInsurance = document.getElementById('card-insurance');
  const cardDoctorPatients = document.getElementById('card-doctor-patients');
  const cardPatientInsurance = document.getElementById('card-patient-insurance');

  if (cardPatients) cardPatients.style.display = 'none';
  if (cardDoctors) cardDoctors.style.display = 'none';
  if (cardDepartments) cardDepartments.style.display = 'none';
  if (cardInsurance) cardInsurance.style.display = 'none';
  if (cardPatientInsurance) cardPatientInsurance.style.display = 'none';

  if (cardDoctorPatients) cardDoctorPatients.style.display = 'block';
  if (cardAppointments) cardAppointments.style.display = 'block';

  const apptTitle = document.getElementById('card-appointments-title');
  if (apptTitle) apptTitle.textContent = 'Assigned Appointments';

  // Analytics Grid: Show personal trend, hide department staffing (admin only)
  const analyticsGrid = document.getElementById('dashboard-analytics-grid');
  const trendPanel = document.getElementById('panel-appointment-trend');
  const deptStaffing = document.getElementById('panel-dept-staffing');
  const trendTitle = document.getElementById('trend-panel-title');

  if (analyticsGrid) analyticsGrid.style.display = 'grid';
  if (trendPanel) trendPanel.style.display = 'block';
  if (deptStaffing) deptStaffing.style.display = 'none';
  if (trendTitle) trendTitle.textContent = 'My 7-Day Consultation Volume';

  // Panels: Show today's appointments, show assigned patients, hide admin report, hide patient portal
  const todayPanel = document.getElementById('panel-today-appointments');
  const docPatPanel = document.getElementById('panel-doctor-patients');
  const adminReport = document.getElementById('panel-admin-report');
  const patientPortal = document.getElementById('panel-patient-portal');

  if (todayPanel) todayPanel.style.display = 'block';
  if (docPatPanel) docPatPanel.style.display = 'block';
  if (adminReport) adminReport.style.display = 'none';
  if (patientPortal) patientPortal.style.display = 'none';

  const todayTitle = document.getElementById('today-consultations-title');
  if (todayTitle) todayTitle.textContent = "My Today's Consultations";

  try {
    // Parallel fetch:
    // GET /Appointment automatically returns only appointments for this doctor on backend
    // GET /Patient returns only patients who have appointments assigned to this doctor
    const [appointments, patients, doctors] = await Promise.all([
      api.get('/Appointment'),
      api.get('/Patient'),
      api.get('/Doctor').catch(() => [])
    ]);

    const myAppointments = Array.isArray(appointments) ? appointments : [];
    const myPatients = Array.isArray(patients) ? patients : [];
    const doctorList = Array.isArray(doctors) ? doctors : [];

    // 1. Update metric numbers
    const metricDocPatients = document.getElementById('metric-doctor-patients');
    const metricAppts = document.getElementById('metric-appointments');

    if (metricDocPatients) metricDocPatients.textContent = myPatients.length;
    if (metricAppts) metricAppts.textContent = myAppointments.length;

    renderMiniSparkline('sparkline-doctor-patients', [Math.max(0, myPatients.length - 2), myPatients.length, myPatients.length], '#2F6F6B');
    renderMiniSparkline('sparkline-appointments', [Math.max(0, myAppointments.length - 2), myAppointments.length, myAppointments.length], '#3AA9A3');

    // 2. Render Personal 7-day trend
    renderAppointmentTrendChart(myAppointments);

    // 3. Render Today's Consultations for this doctor
    const patientMap = new Map();
    myPatients.forEach(p => patientMap.set(p.id, p));

    const doctorMap = new Map();
    doctorList.forEach(d => doctorMap.set(d.id, d));

    renderTodayAppointments(myAppointments, patientMap, doctorMap);

    // 4. Render Doctor's Assigned Patients Table
    renderDoctorAssignedPatients(myPatients, myAppointments);

  } catch (err) {
    console.error('Failed to load doctor dashboard:', err);
    UI.showToast('Could not load doctor dashboard metrics.', 'danger');
  }
}

function renderDoctorAssignedPatients(patients, appointments) {
  const tbody = document.getElementById('doctor-patients-tbody');
  const countBadge = document.getElementById('doctor-patient-count-badge');
  if (!tbody) return;

  if (countBadge) countBadge.textContent = patients.length;

  if (patients.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 32px; color: var(--text-secondary);">
          No patients currently have consultations assigned to you.
        </td>
      </tr>
    `;
    return;
  }

  // Count appointments per patient
  const patientApptCount = new Map();
  appointments.forEach(a => {
    if (a.patientId) {
      const c = patientApptCount.get(a.patientId) || 0;
      patientApptCount.set(a.patientId, c + 1);
    }
  });

  let html = '';
  patients.forEach(p => {
    const appts = patientApptCount.get(p.id) || 0;
    html += `
      <tr>
        <td class="col-mono id-tag">#${p.id}</td>
        <td>
          <div style="font-weight: 500;">${UI.escapeHtml(p.patientName)}</div>
          <div style="font-size: 11px; color: var(--text-muted);">${UI.escapeHtml(p.email || 'No email')} • ${UI.escapeHtml(String(p.mobileNumber || ''))}</div>
        </td>
        <td>${UI.escapeHtml(p.gender || '—')}</td>
        <td class="col-mono">${p.age || '—'}</td>
        <td>${p.insuranceId ? `<span class="id-badge">Policy #${p.insuranceId}</span>` : '<span class="chip" style="color: var(--text-muted);">Uninsured</span>'}</td>
        <td class="col-mono"><span class="id-badge">${appts} booked</span></td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

/**
 * ==========================================================================
 * ADMIN DASHBOARD (Full Access)
 * ==========================================================================
 */
async function setupAdminDashboard() {
  // Ensure all admin panels and cards are visible
  const cardPatients = document.getElementById('card-patients');
  const cardDoctors = document.getElementById('card-doctors');
  const cardDepartments = document.getElementById('card-departments');
  const cardAppointments = document.getElementById('card-appointments');
  const cardInsurance = document.getElementById('card-insurance');
  const cardDoctorPatients = document.getElementById('card-doctor-patients');
  const cardPatientInsurance = document.getElementById('card-patient-insurance');

  if (cardPatients) cardPatients.style.display = 'block';
  if (cardDoctors) cardDoctors.style.display = 'block';
  if (cardDepartments) cardDepartments.style.display = 'block';
  if (cardAppointments) cardAppointments.style.display = 'block';
  if (cardInsurance) cardInsurance.style.display = 'block';
  if (cardDoctorPatients) cardDoctorPatients.style.display = 'none';
  if (cardPatientInsurance) cardPatientInsurance.style.display = 'none';

  const analyticsGrid = document.getElementById('dashboard-analytics-grid');
  const deptStaffing = document.getElementById('panel-dept-staffing');
  const todayPanel = document.getElementById('panel-today-appointments');
  const adminReport = document.getElementById('panel-admin-report');
  const docPatPanel = document.getElementById('panel-doctor-patients');
  const patientPortal = document.getElementById('panel-patient-portal');

  if (analyticsGrid) analyticsGrid.style.display = 'grid';
  if (deptStaffing) deptStaffing.style.display = 'block';
  if (todayPanel) todayPanel.style.display = 'block';
  if (adminReport) adminReport.style.display = 'block';
  if (docPatPanel) docPatPanel.style.display = 'none';
  if (patientPortal) patientPortal.style.display = 'none';

  await loadAdminMetrics();
  await loadAdminReport();

  const refreshReportBtn = document.getElementById('btn-refresh-report');
  if (refreshReportBtn && !refreshReportBtn._bound) {
    refreshReportBtn._bound = true;
    refreshReportBtn.addEventListener('click', loadAdminReport);
  }
}

async function loadAdminMetrics() {
  try {
    const [patients, doctors, departments, appointments, insurance] = await Promise.allSettled([
      api.get('/Patient'),
      api.get('/Doctor'),
      api.get('/Department'),
      api.get('/Appointment'),
      api.get('/Insurance')
    ]);

    const patientList = patients.status === 'fulfilled' && Array.isArray(patients.value) ? patients.value : [];
    const doctorList = doctors.status === 'fulfilled' && Array.isArray(doctors.value) ? doctors.value : [];
    const departmentList = departments.status === 'fulfilled' && Array.isArray(departments.value) ? departments.value : [];
    const appointmentList = appointments.status === 'fulfilled' && Array.isArray(appointments.value) ? appointments.value : [];
    const insuranceList = insurance.status === 'fulfilled' && Array.isArray(insurance.value) ? insurance.value : [];

    // 1. Update metric numeric values
    document.getElementById('metric-patients').textContent = patientList.length;
    document.getElementById('metric-doctors').textContent = doctorList.length;
    document.getElementById('metric-departments').textContent = departmentList.length;
    document.getElementById('metric-appointments').textContent = appointmentList.length;
    document.getElementById('metric-insurance').textContent = insuranceList.length;

    // 2. Render Mini Sparklines
    renderMiniSparkline('sparkline-patients', [Math.max(1, patientList.length - 4), Math.max(1, patientList.length - 2), patientList.length], '#2F6F6B');
    renderMiniSparkline('sparkline-doctors', [Math.max(1, doctorList.length - 1), doctorList.length, doctorList.length], '#3AA9A3');
    renderMiniSparkline('sparkline-departments', [departmentList.length, departmentList.length, departmentList.length], '#4F8A5B');
    renderMiniSparkline('sparkline-appointments', [Math.max(0, appointmentList.length - 3), Math.max(0, appointmentList.length - 1), appointmentList.length], '#2F6F6B');
    renderMiniSparkline('sparkline-insurance', [Math.max(0, insuranceList.length - 2), insuranceList.length, insuranceList.length], '#9E6B18');

    // 3. Render 7-Day Appointment Trend Chart
    renderAppointmentTrendChart(appointmentList);

    // 4. Render Department Staffing
    renderDepartmentStaffing(departmentList, doctorList);

    // 5. Render Today's Appointments
    const patientMap = new Map();
    patientList.forEach(p => patientMap.set(p.id, p));

    const doctorMap = new Map();
    doctorList.forEach(d => doctorMap.set(d.id, d));

    renderTodayAppointments(appointmentList, patientMap, doctorMap);

  } catch (err) {
    console.error('Failed to load admin metrics:', err);
    UI.showToast('Could not load some dashboard metrics from server.', 'danger');
  }
}

/**
 * Inline SVG sparkline helper
 */
function renderMiniSparkline(containerId, points, color = 'var(--accent-primary)') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const w = 72;
  const h = 26;
  const minVal = Math.min(...points, 0);
  const maxVal = Math.max(...points, 1);
  const range = (maxVal - minVal) || 1;

  const stepX = w / (points.length - 1);
  const coords = points.map((val, i) => {
    const x = i * stepX;
    const y = h - 4 - ((val - minVal) / range) * (h - 8);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${coords.join(' L ')}`;

  container.innerHTML = `
    <svg class="metric-sparkline-svg" viewBox="0 0 ${w} ${h}">
      <path d="${pathD}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${coords[coords.length - 1].split(',')[0]}" cy="${coords[coords.length - 1].split(',')[1]}" r="3" fill="${color}"/>
    </svg>
  `;
}

/**
 * Inline SVG 7-day trend chart
 */
function renderAppointmentTrendChart(appointments) {
  const container = document.getElementById('appointment-trend-chart-container');
  const badge = document.getElementById('trend-total-badge');
  if (!container) return;

  const days = [];
  const now = new Date();
  for (let i = -3; i <= 3; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    days.push(d);
  }

  const dayData = days.map((dateObj, idx) => {
    const dateStr = dateObj.toISOString().substring(0, 10);
    const count = appointments.filter(a => a.appointmentDate && a.appointmentDate.substring(0, 10) === dateStr).length;
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const label = (idx === 3) ? 'Today' : `${dayNames[dateObj.getDay()]} ${String(dateObj.getDate()).padStart(2, '0')}`;
    return { dateStr, count, label, isToday: idx === 3 };
  });

  const total7Day = dayData.reduce((acc, d) => acc + d.count, 0);
  if (badge) {
    badge.textContent = `${total7Day} visits in window`;
  }

  const svgWidth = 480;
  const svgHeight = 160;
  const padLeft = 32;
  const padRight = 32;
  const padTop = 26;
  const padBottom = 32;

  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  const maxCount = Math.max(...dayData.map(d => d.count), 4);
  const stepX = chartW / (dayData.length - 1);

  const points = dayData.map((d, i) => {
    const x = padLeft + (i * stepX);
    const y = padTop + chartH - ((d.count / maxCount) * chartH);
    return { ...d, x, y };
  });

  const linePathD = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
  const areaPathD = `${linePathD} L ${points[points.length - 1].x} ${padTop + chartH} L ${points[0].x} ${padTop + chartH} Z`;

  const gridY1 = padTop;
  const gridY2 = padTop + chartH * 0.5;
  const gridY3 = padTop + chartH;

  let svgHtml = `
    <svg viewBox="0 0 ${svgWidth} ${svgHeight}" class="chart-svg-container" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--accent-primary)" stop-opacity="0.32"/>
          <stop offset="100%" stop-color="var(--accent-primary)" stop-opacity="0.02"/>
        </linearGradient>
      </defs>

      <line x1="${padLeft}" y1="${gridY1}" x2="${svgWidth - padRight}" y2="${gridY1}" stroke="var(--border-hairline)" stroke-dasharray="3 3"/>
      <line x1="${padLeft}" y1="${gridY2}" x2="${svgWidth - padRight}" y2="${gridY2}" stroke="var(--border-hairline)" stroke-dasharray="3 3"/>
      <line x1="${padLeft}" y1="${gridY3}" x2="${svgWidth - padRight}" y2="${gridY3}" stroke="var(--border)"/>

      <path d="${areaPathD}" class="chart-trend-area"/>
      <path d="${linePathD}" class="chart-trend-line"/>
  `;

  points.forEach(p => {
    if (p.isToday) {
      svgHtml += `<line x1="${p.x}" y1="${padTop}" x2="${p.x}" y2="${padTop + chartH}" class="chart-today-indicator"/>`;
    }

    svgHtml += `
      <circle cx="${p.x}" cy="${p.y}" r="${p.isToday ? '5' : '4'}" class="chart-data-dot" style="${p.isToday ? 'stroke: var(--accent-primary); stroke-width: 3; fill: var(--surface);' : ''}"/>
      <text x="${p.x}" y="${p.y - 8}" text-anchor="middle" font-family="var(--font-mono)" font-size="11" font-weight="600" fill="var(--text-primary)">${p.count}</text>
      <text x="${p.x}" y="${svgHeight - 10}" text-anchor="middle" class="chart-axis-label" ${p.isToday ? 'font-weight="700" fill="var(--accent-primary)"' : ''}>${p.label}</text>
    `;
  });

  svgHtml += `</svg>`;
  container.innerHTML = svgHtml;
}

function renderDepartmentStaffing(departments, doctors) {
  const container = document.getElementById('dept-staffing-container');
  const badge = document.getElementById('staff-total-badge');
  if (!container) return;

  if (badge) badge.textContent = `${doctors.length} physicians registered`;

  if (departments.length === 0) {
    container.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 13px;">No clinical departments configured yet.</div>`;
    return;
  }

  const deptCounts = departments.map(dept => {
    const docCount = doctors.filter(d => Array.isArray(d.departmentId) && d.departmentId.includes(dept.id)).length;
    return { id: dept.id, name: dept.name, count: docCount };
  });

  deptCounts.sort((a, b) => b.count - a.count);
  const maxCount = Math.max(...deptCounts.map(d => d.count), 1);

  let html = '';
  deptCounts.slice(0, 5).forEach(dept => {
    const percentage = Math.round((dept.count / maxCount) * 100);
    html += `
      <div class="dept-bar-item">
        <div class="dept-bar-label-row">
          <span class="dept-bar-name">${UI.escapeHtml(dept.name)}</span>
          <span class="dept-bar-count">${dept.count} doctor${dept.count === 1 ? '' : 's'}</span>
        </div>
        <div class="dept-bar-track">
          <div class="dept-bar-progress" style="width: ${percentage}%;"></div>
        </div>
      </div>
    `;
  });

  if (deptCounts.length > 5) {
    html += `
      <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 4px; text-align: right;">
        <a href="departments.html">+${deptCounts.length - 5} more departments &rarr;</a>
      </div>
    `;
  }

  container.innerHTML = html;
}

function renderTodayAppointments(appointments, patientMap, doctorMap) {
  const tbody = document.getElementById('today-appointments-tbody');
  const countBadge = document.getElementById('today-count-badge');
  if (!tbody) return;

  const todayStr = new Date().toISOString().substring(0, 10);
  const todayList = appointments.filter(a => a.appointmentDate && a.appointmentDate.substring(0, 10) === todayStr);

  if (countBadge) countBadge.textContent = todayList.length;

  if (todayList.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 32px; color: var(--text-secondary);">
          No consultations scheduled for today (${todayStr}).
        </td>
      </tr>
    `;
    return;
  }

  let html = '';
  todayList.forEach(apt => {
    const patient = patientMap.get(apt.patientId);
    const doctor = doctorMap.get(apt.doctorId);

    const patientLabel = patient 
      ? `${UI.escapeHtml(patient.patientName)} <span class="id-badge">#${patient.id}</span>` 
      : `<span class="id-badge">ID #${apt.patientId}</span>`;

    const doctorLabel = doctor 
      ? `Dr. ${UI.escapeHtml(doctor.name)} <span class="chip">${UI.escapeHtml(doctor.specialization || 'General')}</span>` 
      : `<span class="id-badge">Doctor #${apt.doctorId}</span>`;

    html += `
      <tr class="row-today">
        <td class="col-mono id-tag">#${apt.id}</td>
        <td class="col-mono">${apt.appointmentDate}</td>
        <td>${patientLabel}</td>
        <td>${doctorLabel}</td>
        <td>${UI.escapeHtml(apt.reason || 'General Consultation')}</td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

async function loadAdminReport() {
  const reportBox = document.getElementById('report-text-content');
  const reportMeta = document.getElementById('report-timestamp');
  const refreshBtn = document.getElementById('btn-refresh-report');

  if (!reportBox) return;

  if (refreshBtn) refreshBtn.disabled = true;
  reportBox.textContent = 'Fetching report from server...';

  try {
    const text = await api.get('/report');
    if (reportMeta) {
      reportMeta.textContent = `Last synchronized: ${new Date().toLocaleTimeString()}`;
    }

    if (!text || text.trim() === '') {
      reportBox.textContent = '(Admin report returned an empty response. Backend feature is currently a stub.)';
      reportBox.style.color = 'var(--text-muted)';
    } else {
      reportBox.textContent = text;
      reportBox.style.color = 'var(--text-primary)';
    }
  } catch (err) {
    console.warn('Failed to fetch /report:', err);
    reportBox.textContent = 'Could not load report: ' + (err.message || 'Server error');
    reportBox.style.color = 'var(--accent-danger)';
  } finally {
    if (refreshBtn) refreshBtn.disabled = false;
  }
}
