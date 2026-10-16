/**
 * ==========================================================================
 * HOSPITAL MANAGEMENT SYSTEM - INSURANCE MODULE (§3.3 Refactored)
 * Thin configuration around createListController and UI helpers.
 * Manages health insurance plans, policy verification, patient linkage
 * checks before deletion, read-only createdAt display, and bulk delete.
 * ==========================================================================
 */

let insuranceController;
const insurancePatientCountMap = new Map();

document.addEventListener('DOMContentLoaded', async () => {
  await UI.initShell('insurance', 'Health Insurance Directory');

  const todayStr = new Date().toISOString().substring(0, 10);

  // Initialize List Controller
  insuranceController = createListController({
    tableBodyId: 'insurance-tbody',
    paginationId: 'insurance-pagination',
    countInfoId: 'insurance-count-info',
    searchInputId: 'search-insurance',
    tableId: 'insurance-table',
    colSpan: 7,
    pageSize: 10,
    sortColumn: 'id',
    sortDirection: 'desc',
    resourceLabel: 'insurance policy',
    searchFields: ['policyNumber', 'provider', 'id', 'validUntil'],
    emptyState: {
      title: 'No Insurance Records Found',
      emptyText: 'No insurance policies enrolled yet. Add insurance plans for patient coverage.',
      noMatchText: 'No policies match your search term.',
      actionButtonHtml: '<button type="button" class="btn btn-primary btn-sm" onclick="openAddInsuranceModal()">+ Enroll Insurance Plan</button>'
    },
    fetchData: async () => {
      const [insData, patientData] = await Promise.all([
        api.get('/Insurance'),
        api.get('/Patient').catch(() => [])
      ]);

      insurancePatientCountMap.clear();
      if (Array.isArray(patientData)) {
        patientData.forEach(p => {
          if (p.insuranceId) {
            const count = insurancePatientCountMap.get(p.insuranceId) || 0;
            insurancePatientCountMap.set(p.insuranceId, count + 1);
          }
        });
      }

      return {
        records: Array.isArray(insData) ? insData : [],
        lookups: { insurancePatientCountMap }
      };
    },
    renderRow: (ins, lookups) => {
      const linkedPatients = insurancePatientCountMap.get(ins.id) || 0;
      const isExpired = ins.validUntil && ins.validUntil < todayStr;
      const isExpiringSoon = !isExpired && ins.validUntil && (new Date(ins.validUntil) - new Date() < 30 * 24 * 60 * 60 * 1000);

      let statusBadge = '<span class="chip chip-success" style="font-size: 10px;">Active</span>';
      if (isExpired) {
        statusBadge = '<span class="chip chip-danger" style="font-size: 10px;">Expired</span>';
      } else if (isExpiringSoon) {
        statusBadge = '<span class="chip chip-warning" style="font-size: 10px;">Expiring Soon</span>';
      }

      return `
        <tr>
          <td class="col-mono id-tag">#${ins.id}</td>
          <td class="col-mono" style="font-weight: 500;">${UI.escapeHtml(ins.policyNumber)}</td>
          <td>
            <div style="font-weight: 500;">${UI.escapeHtml(ins.provider)}</div>
          </td>
          <td class="col-mono">
            <div>${ins.validUntil || '—'}</div>
            ${statusBadge}
          </td>
          <td class="col-mono">
            <span class="id-badge">${linkedPatients} linked</span>
          </td>
          <td class="col-mono" style="font-size: 12px; color: var(--text-muted);">
            ${UI.formatDateTime(ins.createdAt)}
          </td>
          <td>
            <div class="cell-actions">
              <button type="button" class="btn btn-secondary btn-sm" onclick="openEditInsuranceModal(${ins.id})" title="Edit Insurance Policy">
                Edit
              </button>
              <button type="button" class="btn btn-danger-outline btn-sm" onclick="confirmDeleteInsurance(${ins.id}, '${UI.escapeHtml(ins.policyNumber)}', '${UI.escapeHtml(ins.provider)}', ${linkedPatients})" title="Delete Policy">
                Delete
              </button>
            </div>
          </td>
        </tr>
      `;
    }
  });

  // Setup Add Insurance button
  const addBtn = document.getElementById('btn-add-insurance');
  if (addBtn) {
    addBtn.addEventListener('click', openAddInsuranceModal);
  }

  // Insurance Form submit
  const insForm = document.getElementById('insurance-form');
  if (insForm) {
    insForm.addEventListener('submit', handleSaveInsurance);
  }

  // Setup Bulk Delete button (§6.1 & §3.2)
  UI.bindBulkDelete({
    buttonId: 'btn-bulk-delete-insurance',
    resourceLabel: 'insurance policies',
    resourcePath: '/Insurance',
    getCount: () => insuranceController.getRecords().length,
    confirmTitle: 'Delete All Insurance Records',
    confirmMessage: `This will attempt to permanently delete ALL ${insuranceController.getRecords().length} insurance policy records. If any patients are currently linked to these policies, this will cause database foreign-key constraint violations.`,
    successMessage: 'All insurance records have been removed.',
    onDone: async () => {
      await insuranceController.load();
    }
  });

  // Initial load
  await insuranceController.load();
});

/* Modal Openers */
window.openAddInsuranceModal = function() {
  document.getElementById('insurance-modal-title').textContent = 'Enroll New Insurance Policy';
  document.getElementById('insurance-id').value = '';
  document.getElementById('insurance-form').reset();
  const createdGroup = document.getElementById('insurance-created-group');
  if (createdGroup) {
    createdGroup.style.display = 'none';
  }

  UI.clearFormErrors('#insurance-form');
  UI.openModal('insurance-modal');
};

window.openEditInsuranceModal = function(insId) {
  const ins = insuranceController.getRecords().find(i => i.id === insId);
  if (!ins) return;

  document.getElementById('insurance-modal-title').textContent = `Edit Policy #${ins.id}`;
  document.getElementById('insurance-id').value = ins.id;
  document.getElementById('insurance-policyNumber').value = ins.policyNumber || '';
  document.getElementById('insurance-provider').value = ins.provider || '';
  document.getElementById('insurance-validUntil').value = ins.validUntil ? ins.validUntil.substring(0, 10) : '';

  // Show read-only createdAt on edit (§3)
  const createdGroup = document.getElementById('insurance-created-group');
  if (createdGroup) {
    createdGroup.style.display = 'block';
    document.getElementById('insurance-created-at-display').textContent = UI.formatDateTime(ins.createdAt) || 'Database record stamped';
  }

  UI.clearFormErrors('#insurance-form');
  UI.openModal('insurance-modal');
};

/**
 * Handles Insurance Form Save (POST /Insurance or PUT /Insurance/{id})
 * Note: createdAt is omitted from create form per §3 (DB automatically stamps @CreationTimestamp)
 */
async function handleSaveInsurance(e) {
  e.preventDefault();
  UI.clearFormErrors('#insurance-form');

  const id = document.getElementById('insurance-id').value;
  const policyNumber = document.getElementById('insurance-policyNumber').value.trim();
  const provider = document.getElementById('insurance-provider').value.trim();
  const validUntil = document.getElementById('insurance-validUntil').value;

  let isValid = true;

  if (!policyNumber) {
    document.getElementById('insurance-policy-error').classList.add('is-visible');
    document.getElementById('insurance-policyNumber').classList.add('is-invalid');
    isValid = false;
  }

  if (!provider) {
    document.getElementById('insurance-provider-error').classList.add('is-visible');
    document.getElementById('insurance-provider').classList.add('is-invalid');
    isValid = false;
  }

  if (!validUntil) {
    document.getElementById('insurance-valid-error').classList.add('is-visible');
    document.getElementById('insurance-validUntil').classList.add('is-invalid');
    isValid = false;
  }

  if (!isValid) return;

  const payload = {
    policyNumber: policyNumber,
    provider: provider,
    validUntil: validUntil
  };

  const submitBtn = document.getElementById('btn-insurance-submit');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving...';

  try {
    if (id) {
      await api.put(`/Insurance/${id}`, payload);
      UI.showToast(`Insurance policy "${policyNumber}" updated successfully.`, 'success');
    } else {
      await api.post('/Insurance', payload);
      UI.showToast(`Insurance policy "${policyNumber}" registered successfully.`, 'success');
    }

    UI.closeModal('insurance-modal');
    await insuranceController.load();
  } catch (err) {
    console.error('Failed to save insurance:', err);
    UI.showToast(err.message || 'Could not save insurance policy.', 'danger');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Save Policy';
  }
}

/**
 * Confirmation before deleting insurance record
 * Warns if any patient is linked (§6.3)
 */
window.confirmDeleteInsurance = function(insId, policyNum, provider, linkedCount) {
  let warningNote = '';
  if (linkedCount > 0) {
    warningNote = `\n\nWARNING: This insurance record is currently linked to ${linkedCount} patient(s). Deleting it will likely trigger an unhandled foreign-key error on the database (HTTP 500). Please remove or reassign the insurance on those patient records first.`;
  }

  UI.showConfirmModal({
    title: 'Delete Insurance Policy',
    message: `Are you sure you want to delete policy "${policyNum}" (${provider}) [ID #${insId}]?${warningNote}`,
    confirmText: 'Delete Policy',
    isDanger: true,
    onConfirm: async () => {
      try {
        await api.delete(`/Insurance/${insId}`);
        UI.showToast(`Insurance record #${insId} deleted.`, 'success');
        await insuranceController.load();
      } catch (err) {
        UI.showToast(err.message || 'Failed to delete insurance policy.', 'danger');
      }
    }
  });
};
