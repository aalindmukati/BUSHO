const STORAGE_KEY = 'busho-demo-state-v1';
const routineText = 'Today we saw 12 patients with fever and 8 with diarrhea. We have only 20 ORS packets left, and our iron tablets are almost finished.';
const ambiguousText = 'A few fever cases today. ORS is almost finished.';
const baseReportCount = 18;

const inventory = [
  { id: 'ors', name: 'ORS packets', short: 'ORS', stock: 20, capacity: 50, unit: 'packets', severity: 'critical' },
  { id: 'ifa', name: 'Iron and folic acid', short: 'Fe', stock: 14, capacity: 60, unit: 'strips', severity: 'warning' },
  { id: 'zinc', name: 'Zinc tablets', short: 'Zn', stock: 72, capacity: 100, unit: 'tablets', severity: 'safe' }
];

const extractionList = document.getElementById('extraction-list');
const reportInput = document.getElementById('report-input');
const messageText = document.getElementById('message-text');
const draftChip = document.getElementById('draft-chip');
const provisionalBanner = document.getElementById('provisional-banner');
const verificationBar = document.getElementById('verification-bar');
const feedback = document.getElementById('draft-feedback');
const toast = document.getElementById('toast');
const inventoryDrawer = document.getElementById('inventory-drawer');

function initialState() {
  return { version: 1, view: 'worker', sample: 'routine', rawReport: routineText, extracted: false, confirmed: false, draft: [], replenishment: { status: 'none', medicineId: null, source: null } };
}

function loadState() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
    if (!stored || stored.version !== 1 || typeof stored.rawReport !== 'string') return initialState();
    const next = initialState();
    next.view = stored.view === 'admin' ? 'admin' : 'worker';
    next.sample = stored.sample === 'ambiguous' ? 'ambiguous' : 'routine';
    next.rawReport = stored.rawReport.slice(0, 4000);
    next.extracted = Boolean(stored.extracted);
    next.confirmed = Boolean(stored.confirmed && stored.extracted);
    next.draft = Array.isArray(stored.draft) ? stored.draft.filter(item => item && typeof item.id === 'string' && typeof item.value === 'string') : [];
    if (next.extracted && !next.draft.length) {
      next.extracted = false;
      next.confirmed = false;
    }
    const replenishment = stored.replenishment || {};
    next.replenishment = { status: ['none', 'draft', 'approved'].includes(replenishment.status) ? replenishment.status : 'none', medicineId: inventory.some(item => item.id === replenishment.medicineId) ? replenishment.medicineId : null, source: typeof replenishment.source === 'string' ? replenishment.source : null };
    return next;
  } catch {
    return initialState();
  }
}

let state = loadState();

function saveState() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, view: state.view, sample: state.sample, rawReport: state.rawReport, extracted: state.extracted, confirmed: state.confirmed, draft: state.draft, replenishment: state.replenishment }));
  } catch {
    showToast('Browser-local demo state could not be saved');
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function showToast(message) {
  document.getElementById('toast-text').textContent = message;
  toast.classList.add('show');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 3200);
}

function setSample(type) {
  state.sample = type === 'ambiguous' ? 'ambiguous' : 'routine';
  state.rawReport = state.sample === 'ambiguous' ? ambiguousText : routineText;
  state.extracted = false;
  state.confirmed = false;
  state.draft = [];
  reportInput.value = state.rawReport;
  messageText.textContent = state.rawReport;
  renderAll();
  saveState();
  showToast(state.sample === 'ambiguous' ? 'Ambiguous sample loaded' : 'Routine sample loaded');
}

function makeExtraction() {
  const report = reportInput.value.trim();
  if (!report) {
    showToast('Enter a field report before extracting');
    reportInput.focus();
    return;
  }
  state.rawReport = report;
  state.sample = /few fever|almost finished/i.test(report) && !/\d+\s+patients?\s+with\s+fever/i.test(report) ? 'ambiguous' : 'routine';
  const fever = report.match(/(\d+)\s+patients?\s+with\s+fever/i);
  const diarrhea = report.match(/(\d+)\s+with\s+diarrhea/i);
  const ors = report.match(/(\d+)\s+ORS/i);
  const ambiguous = state.sample === 'ambiguous';
  state.draft = [
    { id: 'symptoms', kind: 'symptom', icon: 'SYM', label: 'Reported symptoms', value: fever && diarrhea ? `Fever: ${fever[1]} mentions; diarrhea: ${diarrhea[1]} mentions` : ambiguous ? 'Fever mentions' : 'Symptoms mentioned; count unclear', confidence: fever && diarrhea ? 'high' : 'review', note: fever && diarrhea ? 'High confidence' : 'Clarify before confirmation' },
    { id: 'ors-stock', kind: 'stock', icon: 'ORS', label: 'Remaining stock / ORS', value: ors ? `${ors[1]} packets` : ambiguous ? 'Almost finished' : 'Quantity not stated', confidence: ors ? 'high' : 'review', note: ors ? 'High confidence' : 'Quantity needed' },
    { id: 'ifa-stock', kind: 'stock', icon: 'Fe', label: 'Remaining stock / iron and folic acid', value: /iron.*almost finished/i.test(report) ? 'Almost finished' : 'Quantity not stated', confidence: 'review', note: 'Quantity needed' },
    { id: 'clinical-status', kind: 'symptom', icon: 'NOTE', label: 'Clinical status', value: 'Reported trend only; no diagnosis', confidence: 'high', note: 'Safe by design', readOnly: true }
  ];
  state.extracted = true;
  state.confirmed = false;
  state.replenishment = { status: 'none', medicineId: null, source: null };
  renderAll();
  saveState();
  showToast(ambiguous ? 'Draft created. Clarify the flagged fields' : 'Draft created. Review before confirming');
}

function renderExtraction() {
  if (!state.extracted || !state.draft.length) {
    extractionList.innerHTML = '<div class="empty-extraction"><div class="empty-orbit">Draft</div><strong>Run extraction to create a review draft</strong><span>Fields stay provisional until you confirm them.</span></div>';
    return;
  }
  extractionList.innerHTML = state.draft.map(item => {
    const confidence = state.confirmed && item.confidence === 'review' ? 'high' : item.confidence;
    const note = state.confirmed && item.confidence === 'review' ? 'Worker checked' : item.note;
    return `<div class="extraction-item" data-field-id="${escapeHtml(item.id)}"><div class="item-icon ${escapeHtml(item.kind)}">${escapeHtml(item.icon)}</div><div class="field-copy"><label class="item-label" for="field-${escapeHtml(item.id)}">${escapeHtml(item.label)}</label><span class="field-source">Extracted from the report</span><input class="field-edit" id="field-${escapeHtml(item.id)}" value="${escapeHtml(item.value)}" ${item.readOnly || state.confirmed ? 'readonly' : ''} aria-label="${escapeHtml(item.label)}" /></div><span class="confidence ${escapeHtml(confidence)}">${escapeHtml(note)}</span></div>`;
  }).join('');
  extractionList.querySelectorAll('.field-edit').forEach(input => input.addEventListener('input', event => {
    const item = state.draft.find(entry => entry.id === event.target.id.replace('field-', ''));
    if (item) item.value = event.target.value;
    event.target.classList.remove('invalid');
    feedback.textContent = '';
    saveState();
  }));
}

function renderDraftStatus() {
  draftChip.className = 'draft-chip';
  if (!state.extracted) {
    draftChip.textContent = 'Awaiting extraction';
    provisionalBanner.innerHTML = '<span class="banner-icon">i</span><div><strong>AI-extracted information is provisional</strong><span>Review each field. Nothing is committed until you confirm.</span></div>';
    verificationBar.classList.add('hidden');
    return;
  }
  if (state.confirmed) {
    draftChip.textContent = 'Verified by worker';
    draftChip.classList.add('confirmed');
    provisionalBanner.innerHTML = '<span class="banner-icon" style="border-color:#4ebaa5;color:#087e6d">OK</span><div><strong style="color:#087e6d">Verified operational record</strong><span style="color:#087e6d">Confirmed by Anita Singh in this browser-local demo.</span></div>';
    verificationBar.classList.add('hidden');
    return;
  }
  draftChip.textContent = 'Needs verification';
  draftChip.classList.add('ready');
  provisionalBanner.innerHTML = '<span class="banner-icon">!</span><div><strong>Provisional draft needs human verification</strong><span>Flagged fields must be clarified before the record can be confirmed.</span></div>';
  verificationBar.classList.remove('hidden');
  feedback.textContent = '';
}

function validationForDraft() {
  return state.draft.filter(item => item.confidence === 'review' && (!item.value.trim() || /^(fever mentions|symptoms mentioned; count unclear|almost finished|quantity not stated|quantity needed)$/i.test(item.value.trim())));
}

function confirmReport() {
  if (!state.extracted) return showToast('Extract a draft before confirming');
  const invalid = validationForDraft();
  extractionList.querySelectorAll('.field-edit').forEach(input => input.classList.remove('invalid'));
  if (invalid.length) {
    feedback.textContent = `Clarify before confirming: ${invalid.map(item => item.label).join(', ')}.`;
    invalid.forEach(item => document.getElementById(`field-${item.id}`)?.classList.add('invalid'));
    document.getElementById(`field-${invalid[0].id}`)?.focus();
    showToast('Some extracted fields still need clarification');
    return;
  }
  state.confirmed = true;
  renderAll();
  saveState();
  document.getElementById('admin-response').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  showToast('Verified report saved in browser-local demo state');
}

function editFields() {
  if (!state.extracted) return;
  const first = extractionList.querySelector('.field-edit:not([readonly])') || extractionList.querySelector('.field-edit');
  first?.focus();
  first?.select();
  showToast('Review the extracted fields, then confirm the corrected draft');
}

function renderDashboard() {
  const pending = state.confirmed ? 0 : 1;
  document.getElementById('reports-count').textContent = String(baseReportCount + (state.confirmed ? 1 : 0));
  document.getElementById('reports-trend').textContent = state.confirmed ? 'Includes current verified report' : 'Synthetic baseline';
  document.getElementById('pending-count').textContent = String(pending);
  document.getElementById('pending-trend').textContent = pending ? 'Needs worker review' : 'All current reports reviewed';
  document.getElementById('pending-trend').className = `metric-trend ${pending ? 'warning' : 'positive'}`;
  document.getElementById('admin-badge').textContent = String(pending);
}

function renderAdminResponse() {
  const response = document.getElementById('admin-response');
  const approve = document.getElementById('approve-replenishment');
  if (!state.confirmed) {
    response.classList.add('hidden');
    return;
  }
  response.classList.remove('hidden');
  const title = document.getElementById('admin-action-title');
  const copy = document.getElementById('admin-action-copy');
  const status = document.getElementById('admin-action-status');
  const medicine = inventory.find(item => item.id === state.replenishment.medicineId);
  if (state.replenishment.status === 'approved' && medicine) {
    title.textContent = 'Replenishment draft approved in demo';
    copy.textContent = `${medicine.name} / proposed replenishment quantity recorded for review. No purchase order was placed.`;
    status.textContent = 'Approved in demo';
    approve.disabled = true;
    approve.textContent = 'Draft approved';
  } else if (state.replenishment.status === 'draft' && medicine) {
    title.textContent = 'Replenishment draft ready for approval';
    copy.textContent = `${medicine.name} / proposed replenishment to ${medicine.capacity - medicine.stock} ${medicine.unit}. Source: ${state.replenishment.source}.`;
    status.textContent = 'Pending approval';
    approve.disabled = false;
    approve.textContent = 'Approve draft';
  } else {
    title.textContent = 'Verified report available for admin review';
    copy.textContent = 'Open inventory and choose a low-stock item to create a replenishment draft. No purchase order is created by this demo.';
    status.textContent = 'Awaiting admin action';
    approve.disabled = true;
    approve.textContent = 'Approve draft';
  }
}

function renderInventory() {
  const list = document.getElementById('inventory-detail-list');
  list.innerHTML = inventory.map(item => `<div class="inventory-detail-row"><div><strong>${escapeHtml(item.name)}</strong><span>${item.stock} / ${item.capacity} ${escapeHtml(item.unit)} · ${item.severity === 'safe' ? 'Healthy' : 'Needs attention'}</span></div><button class="secondary-btn inventory-draft" type="button" data-medicine="${escapeHtml(item.id)}" ${item.severity === 'safe' ? 'disabled' : ''}>${item.severity === 'safe' ? 'No action needed' : 'Draft replenishment'}</button></div>`).join('');
  list.querySelectorAll('.inventory-draft').forEach(button => button.addEventListener('click', () => createReplenishmentDraft(button.dataset.medicine)));
}

function openInventory() {
  inventoryDrawer.classList.remove('hidden');
  renderInventory();
  document.getElementById('close-inventory').focus();
}

function closeInventory() {
  inventoryDrawer.classList.add('hidden');
  document.getElementById('view-inventory').focus();
}

function createReplenishmentDraft(medicineId) {
  const medicine = inventory.find(item => item.id === medicineId);
  if (!medicine || medicine.severity === 'safe') return;
  state.replenishment = { status: 'draft', medicineId, source: state.confirmed ? 'verified worker report' : 'synthetic inventory snapshot' };
  renderAdminResponse();
  saveState();
  closeInventory();
  showToast(`${medicine.name} replenishment draft created for admin approval`);
}

function approveReplenishment() {
  if (state.replenishment.status !== 'draft') return;
  state.replenishment.status = 'approved';
  renderAdminResponse();
  saveState();
  showToast('Draft marked approved in demo. No purchase order was placed');
}

function switchView(view, notify = true) {
  state.view = view === 'admin' ? 'admin' : 'worker';
  document.querySelectorAll('.role-btn').forEach(button => {
    const active = button.dataset.view === state.view;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
  document.querySelectorAll('.view-panel').forEach(panel => panel.classList.toggle('active', panel.id === `${state.view}-view`));
  saveState();
  if (notify && state.view === 'admin' && !state.confirmed) showToast('Admin view shows one signal awaiting worker confirmation');
}

function renderAll() {
  reportInput.value = state.rawReport;
  messageText.textContent = state.rawReport || 'No report entered yet.';
  renderExtraction();
  renderDraftStatus();
  renderDashboard();
  renderAdminResponse();
  switchView(state.view, false);
}

document.querySelectorAll('.role-btn').forEach(button => button.addEventListener('click', () => switchView(button.dataset.view)));
document.querySelectorAll('.quick-btn').forEach(button => button.addEventListener('click', () => setSample(button.dataset.sample)));
document.getElementById('extract-btn').addEventListener('click', makeExtraction);
document.getElementById('confirm-btn').addEventListener('click', confirmReport);
document.getElementById('edit-btn').addEventListener('click', editFields);
document.getElementById('view-inventory').addEventListener('click', openInventory);
document.getElementById('close-inventory').addEventListener('click', closeInventory);
document.getElementById('approve-replenishment').addEventListener('click', approveReplenishment);
document.getElementById('reset-demo').addEventListener('click', () => {
  try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* safe demo fallback */ }
  state = initialState();
  closeInventory();
  renderAll();
  showToast('Synthetic demo data reset');
});
document.getElementById('profile-control').addEventListener('click', () => showToast('Authentication is not implemented in this demo'));
document.querySelector('.voice-button').addEventListener('click', () => showToast('Voice transcription is not implemented. Use text input or a sample report'));
reportInput.addEventListener('input', () => {
  state.rawReport = reportInput.value;
  messageText.textContent = reportInput.value || 'No report entered yet.';
  state.extracted = false;
  state.confirmed = false;
  state.draft = [];
  renderDraftStatus();
  renderDashboard();
  renderAdminResponse();
  saveState();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !inventoryDrawer.classList.contains('hidden')) closeInventory();
});

renderInventory();
renderAll();
