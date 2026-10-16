/**
 * ==========================================================================
 * HOSPITAL MANAGEMENT SYSTEM - SHARED LIST CONTROLLER (§3.1)
 * Generic controller factory that handles client-side filtering, column
 * sorting, pagination, empty/loading/error states, and table rendering.
 * Eliminates duplication across Patients, Doctors, Departments, Appointments,
 * and Insurance modules.
 * ==========================================================================
 */

function createListController(config) {
  let allRecords = [];
  let filteredRecords = [];
  let lookups = config.lookups || {};

  let currentPage = 1;
  const pageSize = config.pageSize || 10;
  let sortColumn = config.sortColumn || 'id';
  let sortDirection = config.sortDirection || 'desc';
  let currentSearchQuery = '';

  const tableBody = document.getElementById(config.tableBodyId);
  const paginationControls = document.getElementById(config.paginationId);
  const countInfoEl = document.getElementById(config.countInfoId);
  const searchInput = config.searchInputId ? document.getElementById(config.searchInputId) : null;
  const tableEl = config.tableId ? document.getElementById(config.tableId) : null;

  // Default empty state SVG icon: clinical line-art clipboard
  const defaultEmptySvg = `
    <svg class="empty-state-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  `;

  /**
   * Bind DOM controls (Search input & Table header clicks)
   */
  function bindEvents() {
    if (searchInput && !searchInput._boundListController) {
      searchInput._boundListController = true;
      searchInput.addEventListener('input', (e) => {
        applyFilter(e.target.value);
      });
    }

    if (tableEl && !tableEl._boundListController) {
      tableEl._boundListController = true;
      tableEl.querySelectorAll('th.sortable').forEach(th => {
        th.addEventListener('click', () => {
          const col = th.getAttribute('data-sort');
          if (col) {
            sortBy(col);
          }
        });
      });
    }
  }

  /**
   * Update sort arrow indicators on table headers
   */
  function updateSortIndicators() {
    if (!tableEl) return;
    tableEl.querySelectorAll('th.sortable').forEach(th => {
      const col = th.getAttribute('data-sort');
      const indicator = th.querySelector('.sort-indicator');
      if (indicator) {
        if (col === sortColumn) {
          indicator.textContent = sortDirection === 'asc' ? '▲' : '▼';
        } else {
          indicator.textContent = '⇅';
        }
      }
    });
  }

  /**
   * Render Loading Skeleton State
   */
  function renderLoading() {
    if (!tableBody) return;
    const colSpan = config.colSpan || 8;
    tableBody.innerHTML = `
      <tr>
        <td colspan="${colSpan}" style="padding: 28px; text-align: center;">
          <span class="skeleton-text" style="width: 280px;"></span>
        </td>
      </tr>
    `;
    if (countInfoEl) countInfoEl.textContent = 'Loading records...';
    if (paginationControls) paginationControls.innerHTML = '';
  }

  /**
   * Render Error State with Retry Button
   */
  function renderError(errorMessage) {
    if (!tableBody) return;
    const colSpan = config.colSpan || 8;
    const label = config.resourceLabel || 'records';
    tableBody.innerHTML = `
      <tr>
        <td colspan="${colSpan}">
          <div class="table-error-state">
            <h3>Failed to load ${UI.escapeHtml(label)}</h3>
            <p>${UI.escapeHtml(errorMessage)}</p>
            <button type="button" class="btn btn-primary btn-sm" id="${config.tableBodyId}-retry-btn">Retry Connection</button>
          </div>
        </td>
      </tr>
    `;
    const retryBtn = document.getElementById(`${config.tableBodyId}-retry-btn`);
    if (retryBtn) {
      retryBtn.onclick = () => load();
    }
    if (countInfoEl) countInfoEl.textContent = 'Connection error';
    if (paginationControls) paginationControls.innerHTML = '';
  }

  /**
   * Filter records based on search query
   */
  function applyFilter(query) {
    currentSearchQuery = (query || '').toLowerCase().trim();

    if (typeof config.filterPredicate === 'function') {
      filteredRecords = allRecords.filter(item => config.filterPredicate(item, currentSearchQuery, lookups));
    } else if (!currentSearchQuery) {
      filteredRecords = [...allRecords];
    } else {
      const fields = config.searchFields || ['id', 'name'];
      filteredRecords = allRecords.filter(item => {
        return fields.some(field => {
          const val = item[field];
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(currentSearchQuery);
        });
      });
    }

    currentPage = 1;
    render();
  }

  /**
   * Column sorting
   */
  function sortBy(column) {
    if (sortColumn === column) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortColumn = column;
      sortDirection = 'asc';
    }
    render();
  }

  /**
   * Page navigation
   */
  function goToPage(page) {
    currentPage = page;
    render();
  }

  /**
   * Main render function
   */
  function render() {
    updateSortIndicators();

    if (!tableBody) return;

    // Check empty state
    if (filteredRecords.length === 0) {
      const colSpan = config.colSpan || 8;
      const isSearchActive = Boolean(currentSearchQuery || (config.isCustomFilterActive && config.isCustomFilterActive()));
      const emptyConfig = config.emptyState || {};
      const title = emptyConfig.title || 'No Records Found';
      const text = isSearchActive
        ? (emptyConfig.noMatchText || 'No records match your search criteria.')
        : (emptyConfig.emptyText || 'No records have been added yet.');
      const actionHtml = (!isSearchActive && emptyConfig.actionButtonHtml) ? emptyConfig.actionButtonHtml : '';
      const iconSvg = emptyConfig.iconSvg || defaultEmptySvg;

      tableBody.innerHTML = `
        <tr>
          <td colspan="${colSpan}">
            <div class="empty-state">
              ${iconSvg}
              <div class="empty-state-title">${UI.escapeHtml(title)}</div>
              <p class="empty-state-text">${UI.escapeHtml(text)}</p>
              ${actionHtml}
            </div>
          </td>
        </tr>
      `;

      if (countInfoEl) countInfoEl.textContent = 'Showing 0 records';
      if (paginationControls) paginationControls.innerHTML = '';
      return;
    }

    // Sort records
    const sorted = [...filteredRecords].sort((a, b) => {
      if (typeof config.customSort === 'function') {
        const customRes = config.customSort(a, b, sortColumn, sortDirection, lookups);
        if (customRes !== null && customRes !== undefined) {
          return customRes;
        }
      }

      let valA = a[sortColumn];
      let valB = b[sortColumn];

      if (valA === null || valA === undefined) valA = '';
      if (valB === null || valB === undefined) valB = '';

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDirection === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      return sortDirection === 'asc' ? valA - valB : valB - valA;
    });

    // Pagination slice
    const totalItems = sorted.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * pageSize;
    const pageItems = sorted.slice(startIndex, startIndex + pageSize);

    // Render Rows
    let html = '';
    pageItems.forEach((record, index) => {
      html += config.renderRow(record, lookups, startIndex + index);
    });
    tableBody.innerHTML = html;

    // Update count info
    if (countInfoEl) {
      const end = Math.min(startIndex + pageSize, totalItems);
      const label = config.resourceLabel || 'record';
      countInfoEl.textContent = `Showing ${startIndex + 1} to ${end} of ${totalItems} ${label}${totalItems === 1 ? '' : 's'}`;
    }

    // Render pagination controls
    renderPagination(totalPages);

    if (typeof config.onAfterRender === 'function') {
      config.onAfterRender(pageItems, lookups);
    }
  }

  /**
   * Render Pagination Buttons
   */
  function renderPagination(totalPages) {
    if (!paginationControls) return;
    if (totalPages <= 1) {
      paginationControls.innerHTML = '';
      return;
    }

    paginationControls.innerHTML = `
      <button type="button" class="btn btn-secondary btn-sm" ${currentPage === 1 ? 'disabled' : ''} id="${config.tableBodyId}-prev-btn">Previous</button>
      <span style="font-size: 12px; color: var(--text-secondary); margin: 0 4px;">Page ${currentPage} of ${totalPages}</span>
      <button type="button" class="btn btn-secondary btn-sm" ${currentPage === totalPages ? 'disabled' : ''} id="${config.tableBodyId}-next-btn">Next</button>
    `;

    const prevBtn = document.getElementById(`${config.tableBodyId}-prev-btn`);
    const nextBtn = document.getElementById(`${config.tableBodyId}-next-btn`);
    if (prevBtn) prevBtn.onclick = () => goToPage(currentPage - 1);
    if (nextBtn) nextBtn.onclick = () => goToPage(currentPage + 1);
  }

  /**
   * Load data from server or custom fetch function
   */
  async function load() {
    renderLoading();
    try {
      if (typeof config.fetchData === 'function') {
        const result = await config.fetchData();
        if (result && Array.isArray(result.records)) {
          allRecords = result.records;
        } else if (Array.isArray(result)) {
          allRecords = result;
        } else {
          allRecords = [];
        }
        if (result && result.lookups) {
          lookups = result.lookups;
        }
      } else if (config.resourcePath) {
        const data = await api.get(config.resourcePath);
        allRecords = Array.isArray(data) ? data : [];
      }

      if (typeof config.onLoaded === 'function') {
        await config.onLoaded(allRecords, lookups);
      }

      applyFilter(searchInput ? searchInput.value : currentSearchQuery);
      return allRecords;
    } catch (err) {
      console.error(`Failed to load ${config.resourceLabel || 'records'}:`, err);
      renderError(err.message || `Unable to retrieve ${config.resourceLabel || 'data'} from server.`);
      throw err;
    }
  }

  // Initialize event bindings
  bindEvents();

  return {
    load,
    render,
    applyFilter,
    sortBy,
    goToPage,
    getRecords: () => allRecords,
    getFilteredRecords: () => filteredRecords,
    setRecords: (records) => {
      allRecords = Array.isArray(records) ? records : [];
      applyFilter(currentSearchQuery);
    },
    getLookups: () => lookups,
    setLookups: (newLookups) => {
      lookups = newLookups;
      render();
    },
    renderLoading,
    renderError
  };
}

// Make globally accessible
if (typeof window !== 'undefined') {
  window.createListController = createListController;
}
