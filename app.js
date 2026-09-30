window.__bushoLoaded = true;
const state = { extracted:false, confirmed:false, view:'worker', sample:'routine' };
const routineText = 'Today we saw 12 patients with fever and 8 with diarrhea. We have only 20 ORS packets left, and our iron tablets are almost finished.';
const ambiguousText = 'A few fever cases today. ORS is almost finished.';
const extractionList = document.getElementById('extraction-list');
const reportInput = document.getElementById('report-input');
const messageText = document.getElementById('message-text');
const draftChip = document.getElementById('draft-chip');
const provisionalBanner = document.getElementById('provisional-banner');
const verificationBar = document.getElementById('verification-bar');
const toast = document.getElementById('toast');

function showToast(message){ document.getElementById('toast-text').textContent=message; toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'),3200); }
function setSample(type){ state.sample=type; reportInput.value=type==='ambiguous'?ambiguousText:routineText; messageText.textContent=reportInput.value; showToast(type==='ambiguous'?'Ambiguous sample loaded':'Routine sample loaded'); }
function makeExtraction(){
  const ambiguous = state.sample==='ambiguous' || reportInput.value.toLowerCase().includes('few fever');
  state.extracted=true; state.confirmed=false;
  draftChip.textContent='Needs verification'; draftChip.className='draft-chip ready';
  verificationBar.classList.remove('hidden');
  const items = ambiguous ? [
    ['symptom','SYM','Reported symptom','Fever mentions','review','Unclear count'],
    ['stock','ORS','Reported stock','Almost finished','review','Quantity needed'],
    ['symptom','NOTE','Clinical status','No diagnosis extracted','high','Safe by design']
  ] : [
    ['symptom','SYM','Reported symptoms','Fever: 12 mentions; diarrhea: 8 mentions','high','High confidence'],
    ['stock','ORS','Remaining stock · ORS','20 packets','high','High confidence'],
    ['stock','Fe','Remaining stock · Iron & folic acid','Almost finished','review','Needs quantity'],
    ['symptom','NOTE','Clinical status','Reported trend only; no diagnosis','high','Guardrail applied']
  ];
  extractionList.innerHTML=items.map(([kind,icon,label,value,level,confidence])=>`<div class="extraction-item"><div class="item-icon ${kind}">${icon}</div><div><span class="item-label">${label}</span><span class="item-value">${value}</span></div><span class="confidence ${level}">${confidence}</span></div>`).join('');
  messageText.textContent=reportInput.value;
  document.getElementById('journey-action').classList.remove('active');
  showToast(ambiguous?'Draft created. One field needs clarification':'Draft created. Review before confirming');
}
window.makeExtraction = makeExtraction;
function confirmReport(){
  state.confirmed=true; draftChip.textContent='Verified by worker'; draftChip.className='draft-chip confirmed'; verificationBar.classList.add('hidden');
  provisionalBanner.innerHTML='<span class="banner-icon" style="border-color:#4ebaa5;color:#087e6d">OK</span><div><strong style="color:#087e6d">Verified operational record</strong><span style="color:#087e6d">Confirmed by Anita Singh / synced to Rampur HWC inventory.</span></div>'; provisionalBanner.style.background='var(--teal-soft)'; provisionalBanner.style.borderColor='#b7d5cc';
  extractionList.querySelectorAll('.confidence.review').forEach(el=>{el.textContent='Worker checked';el.className='confidence high'});
  document.getElementById('journey-action').classList.add('active');
  document.getElementById('pending-count').textContent='0'; document.getElementById('reports-count').textContent='19'; document.getElementById('admin-badge').textContent='0'; document.getElementById('admin-response').classList.remove('hidden');
  showToast('Verified report synced. Admin view updated');
}
function switchView(view){ state.view=view; document.querySelectorAll('.role-btn').forEach(btn=>btn.classList.toggle('active',btn.dataset.view===view)); document.querySelectorAll('.view-panel').forEach(panel=>panel.classList.toggle('active',panel.id===view+'-view')); if(view==='admin' && !state.confirmed) showToast('Admin view shows a signal awaiting worker confirmation'); }
document.querySelectorAll('.role-btn').forEach(btn=>btn.addEventListener('click',()=>switchView(btn.dataset.view)));
document.querySelectorAll('.quick-btn').forEach(btn=>btn.addEventListener('click',()=>setSample(btn.dataset.sample)));
document.getElementById('extract-btn').addEventListener('click',makeExtraction);
document.getElementById('confirm-btn').addEventListener('click',confirmReport);
document.getElementById('edit-btn').addEventListener('click',()=>{ reportInput.focus(); reportInput.select(); showToast('Edit the sentence, then extract again'); });
document.getElementById('view-inventory').addEventListener('click',()=>showToast('Inventory detail is represented in this demo view'));
reportInput.addEventListener('input',()=>messageText.textContent=reportInput.value);
