/**
 * ==========================================================================
 * HOSPITAL MANAGEMENT SYSTEM - DEPARTMENTS MODULE (§3.3 Refactored)
 * Thin configuration around createListController and UI helpers.
 * Manages clinical departments, handles server quirks (§6.2, §6.3, §6.6):
 * - Displays read-only list of doctors assigned from Doctor side
 * - Pre-validates duplicate department name client-side
 * - Warns if doctors are assigned before deletion & handles FK 500 errors
 * ==========================================================================
 */

let departmentsController;
let allDoctors = [];
const doctorMap = new Map();

document.addEventListener('DOMContentLoaded', async () => {
  await UI.initShell('departments', 'Departments & Units');

  // Initialize List Controller
  departmentsController = createListController({
    tableBodyId: 'departments-tbody',
    paginationId: 'departments-pagination',
    countInfoId: 'departments-count-info',
    searchInputId: 'search-departments',
    tableId: 'departments-table',
    colSpan: 5,
    pageSize: 10,
    sortColumn: 'id',
    sortDirection: 'asc',
    resourceLabel: 'department',
    filterPredicate: (dept, query, lookups) => {
      if (!query) return true;
      const name = (dept.name || dept.Name || '').toLowerCase();
      const id = String(dept.id ?? dept.Id ?? '');

      let docMatch = false;
      const assignedDocIds = Array.isArray(dept.doctorId) ? dept.doctorId : (Array.isArray(dept.DoctorId) ? dept.DoctorId : []);
      if (assignedDocIds.length > 0) {
        docMatch = assignedDocIds.some(docId => {
          const doc = doctorMap.get(docId);
          return doc && doc.name && doc.name.toLowerCase().includes(query);
        });
      }

      return name.includes(query) || id.includes(query) || docMatch;
    },
    customSort: (a, b, col, dir) => {
      if (col === 'doctorCount') {
        const docsA = Array.isArray(a.doctorId) ? a.doctorId : (Array.isArray(a.DoctorId) ? a.DoctorId : []);
        const docsB = Array.isArray(b.doctorId) ? b.doctorId : (Array.isArray(b.DoctorId) ? b.DoctorId : []);
        const countA = docsA.length;
        const countB = docsB.length;
        return dir === 'asc' ? countA - countB : countB - countA;
      }
      return null;
    },
    emptyState: {
      title: 'No Departments Found',
      emptyText: 'No hospital departments established yet. Create clinical departments to organize staff.',
      noMatchText: 'No departments match your search term.',
      actionButtonHtml: '<button type="button" class="btn btn-primary btn-sm" onclick="openAddDepartmentModal()">+ Create Department</button>'
    },
    fetchData: async () => {
      const [deptData, docData] = await Promise.all([
        api.get('/Department'),
        api.get('/Doctor').catch(() => [])
      ]);

      allDoctors = Array.isArray(docData) ? docData : [];
      doctorMap.clear();
      allDoctors.forEach(doc => doctorMap.set(doc.id, doc));

      return {
        records: Array.isArray(deptData) ? deptData : [],
        lookups: { doctorMap, allDoctors }
      };
    },
    renderRow: (dept, lookups) => {
      const deptId = dept.id ?? dept.Id;
      const deptName = dept.name || dept.Name || '';
      const assignedDocIds = Array.isArray(dept.doctorId) ? dept.doctorId : (Array.isArray(dept.DoctorId) ? dept.DoctorId : []);
      let doctorChips = '<span style="color: var(--text-muted); font-size: 12px;">No doctors assigned</span>';

      if (assignedDocIds.length > 0) {
        doctorChips = assignedDocIds.map(docId => {
          const doc = doctorMap.get(docId);
          const name = doc ? `Dr. ${doc.name}` : `Doctor #${docId}`;
          return `<span class="chip">${UI.escapeHtml(name)}</span>`;
        }).join(' ');
      }

      const staffCountBadge = assignedDocIds.length === 0
        ? '<span class="chip chip-warning">0 staff</span>'
        : `<span class="id-badge">${assignedDocIds.length} staff</span>`;

      return `
        <tr>
          <td class="col-mono id-tag">#${deptId}</td>
          <td>
            <span style="font-weight: 600; color: var(--text-primary);">${UI.escapeHtml(deptName)}</span>
          </td>
          <td>${doctorChips}</td>
          <td class="col-mono">${staffCountBadge}</td>
          <td>
            <div class="cell-actions">
              <button type="button" class="btn btn-secondary btn-sm" onclick="openEditDepartmentModal(${deptId})" title="Edit Department Name & View Staff">
                Edit / View
              </button>
              <button type="button" class="btn btn-danger-outline btn-sm" onclick="confirmDeleteDepartment(${deptId}, '${UI.escapeHtml(deptName)}', ${assignedDocIds.length})" title="Delete Department">
                Delete
              </button>
            </div>
          </td>
        </tr>
      `;
    }
  });

  // Setup Add Department button
  const addBtn = document.getElementById('btn-add-department');
  if (addBtn) {
    addBtn.addEventListener('click', openAddDepartmentModal);
  }

  // Department Form submit
  const deptForm = document.getElementById('department-form');
  if (deptForm) {
    deptForm.addEventListener('submit', handleSaveDepartment);
  }

  // Setup Bulk Delete button (§6.1 & §3.2)
  UI.bindBulkDelete({
    buttonId: 'btn-bulk-delete-departments',
    resourceLabel: 'department',
    resourcePath: '/Department',
    getCount: () => departmentsController.getRecords().length,
    confirmTitle: 'Delete All Departments',
    confirmMessage: `This will attempt to permanently delete ALL ${departmentsController.getRecords().length} department(s). If doctors are assigned to any of these departments, this may trigger foreign key constraints on the database.`,
    successMessage: 'All department records removed.',
    onDone: async () => {
      await departmentsController.load();
    }
  });

  // Initial load
  await departmentsController.load();
});

/* Modal Openers */
window.openAddDepartmentModal = function() {
  document.getElementById('department-modal-title').textContent = 'Create Department';
  document.getElementById('department-id').value = '';
  document.getElementById('department-form').reset();
  
  const readonlyBox = document.getElementById('department-doctors-readonly');
  if (readonlyBox) {
    readonlyBox.innerHTML = '<span style="color: var(--text-muted);">Newly created departments have no doctors assigned yet. Assign doctors via the Doctors directory.</span>';
  }

  UI.clearFormErrors('#department-form');
  UI.openModal('department-modal');
};

window.openEditDepartmentModal = function(deptId) {
  const dept = departmentsController.getRecords().find(d => (d.id === deptId || d.Id === deptId));
  if (!dept) return;

  const resolvedId = dept.id ?? dept.Id;
  const resolvedName = dept.name || dept.Name || '';

  document.getElementById('department-modal-title').textContent = `Edit Department #${resolvedId}`;
  document.getElementById('department-id').value = resolvedId;
  document.getElementById('department-name').value = resolvedName;

  // Render read-only doctor list (§6.2)
  const readonlyBox = document.getElementById('department-doctors-readonly');
  const assignedDocIds = Array.isArray(dept.doctorId) ? dept.doctorId : (Array.isArray(dept.DoctorId) ? dept.DoctorId : []);

  if (readonlyBox) {
    if (assignedDocIds.length === 0) {
      readonlyBox.innerHTML = '<span style="color: var(--text-muted);">No doctors currently assigned to this department.</span>';
    } else {
      let listHtml = '<div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px;">';
      assignedDocIds.forEach(docId => {
        const doc = doctorMap.get(docId);
        const name = doc ? `Dr. ${doc.name} (${doc.specialization || 'General'})` : `Doctor #${docId}`;
        listHtml += `<span class="chip">${UI.escapeHtml(name)}</span>`;
      });
      listHtml += '</div>';
      listHtml += '<div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;"><a href="doctors.html">Manage doctor assignments from the Doctors page &rarr;</a></div>';
      readonlyBox.innerHTML = listHtml;
    }
  }

  UI.clearFormErrors('#department-form');
  UI.openModal('department-modal');
};

/**
 * Handles Department Form Save (POST /Department or PUT /Department/{id})
 * Checks client-side for duplicate name per §6.6
 */
async function handleSaveDepartment(e) {
  e.preventDefault();
  UI.clearFormErrors('#department-form');

  const id = document.getElementById('department-id').value;
  const name = document.getElementById('department-name').value.trim();

  if (!name) {
    document.getElementById('department-name-error').textContent = 'Department name is required.';
    document.getElementById('department-name-error').classList.add('is-visible');
    document.getElementById('department-name').classList.add('is-invalid');
    return;
  }

  // Pre-check for duplicate name client-side (§6.6: DB has unique constraint and will 500)
  const allDepartments = departmentsController.getRecords();
  const isDuplicate = allDepartments.some(d => {
    const existingId = String(d.id ?? d.Id ?? '');
    if (id && existingId === String(id)) return false;
    const existingName = d.name || d.Name || '';
    return existingName.trim().toLowerCase() === name.toLowerCase();
  });

  if (isDuplicate) {
    document.getElementById('department-name-error').textContent = `A department named "${name}" already exists. Please choose a unique name.`;
    document.getElementById('department-name-error').classList.add('is-visible');
    document.getElementById('department-name').classList.add('is-invalid');
    return;
  }

  const payload = {
    name: name,
    Name: name,
    doctorId: [],
    DoctorId: []
  };

  const submitBtn = document.getElementById('btn-department-submit');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving...';

  try {
    if (id) {
      await api.put(`/Department/${id}`, payload);
      UI.showToast(`Department "${name}" updated successfully.`, 'success');
    } else {
      await api.post('/Department', payload);
      UI.showToast(`Department "${name}" created successfully.`, 'success');
    }

    UI.closeModal('department-modal');
    await departmentsController.load();
  } catch (err) {
    console.error('Failed to save department:', err);
    UI.showToast(err.message || 'Could not save department.', 'danger');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Save Department';
  }
}

/**
 * Confirmation before deleting single department
 * Warns if doctors are currently assigned (§6.3)
 */
window.confirmDeleteDepartment = function(deptId, deptName, doctorCount) {
  let warningNote = '';
  if (doctorCount > 0) {
    warningNote = `\n\nWARNING: There are currently ${doctorCount} doctor(s) assigned to this department. Deleting this department will likely fail if database foreign keys are constrained. Please reassign the doctors first from the Doctors page.`;
  }

  UI.showConfirmModal({
    title: 'Delete Department',
    message: `Are you sure you want to delete the department "${deptName}" (ID #${deptId})?${warningNote}`,
    confirmText: 'Delete Department',
    isDanger: true,
    onConfirm: async () => {
      try {
        await api.delete(`/Department/${deptId}`);
        UI.showToast(`Department #${deptId} deleted.`, 'success');
        await departmentsController.load();
      } catch (err) {
        UI.showToast(err.message || 'Failed to delete department.', 'danger');
      }
    }
  });
};
