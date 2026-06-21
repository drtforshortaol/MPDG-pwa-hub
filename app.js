const $ = id => document.getElementById(id);
const activeCodes = SERVICE_CODES.filter(c => c.status === 'Active' && !/do not use/i.test(c.description || ''));
const stateKey = 'dentalTreatmentPlanner.v6'; // keep same data key so existing saved plans remain available
let state = loadState();
let selectedTeeth = [];
let selectedSurfaces = [];
let selectedNonTooth = false;
let editingItemId = null;

const CATEGORY_ORDER = [
  'Diagnostic / Imaging', 'Preventive / Hygiene', 'Restorative / Crowns', 'Endodontics',
  'Periodontics', 'Oral Surgery', 'Removable Prosthetics', 'Implants',
  'Fixed Prosthetics', 'Adjunctive / General', 'Other'
];

function defaultState(){
  return {patientName:'', planDate:new Date().toISOString().slice(0,10), currentPlanId:'A', plans:[{id:'A', title:'Option A: Ideal / comprehensive', items:[]}]};
}
function loadState(){
  try { return JSON.parse(localStorage.getItem(stateKey)) || defaultState(); } catch { return defaultState(); }
}
function save(){ localStorage.setItem(stateKey, JSON.stringify(state)); }
function money(n){ return Number(n || 0).toLocaleString(undefined, {style:'currency', currency:'USD'}); }
function currentPlan(){ return state.plans.find(p => p.id === state.currentPlanId) || state.plans[0]; }
function codeLabel(c){ return `${c.adaCode || c.serviceCode} • ${c.description} • ${money(c.fee)} • ${c.serviceType}`; }
function codeSearchHaystack(c){ return [c.adaCode, c.serviceCode, c.displayAbbr, c.description, c.serviceType, categoryFor(c), subcategoryFor(c)].join(' ').toLowerCase(); }
function selectedToothText(){ return selectedNonTooth ? 'Non-tooth' : selectedTeeth.join(', '); }
function surfacesText(){ return selectedSurfaces.join(''); }


function selectedValues(id){
  const el = $(id);
  if (!el) return [];
  return Array.from(el.selectedOptions || [])
    .map(o => o.value || o.textContent || '')
    .map(v => String(v).trim())
    .filter(Boolean);
}

function setMultiValues(id, values){
  const el = $(id);
  if (!el) return;
  const arr = Array.isArray(values) ? values : (values ? [values] : []);
  const wanted = new Set(arr.map(v => String(v).trim()).filter(Boolean));
  Array.from(el.options || []).forEach(opt => {
    const val = String(opt.value || opt.textContent || '').trim();
    opt.selected = !!val && wanted.has(val);
  });
}

function detailsText(value){
  if (Array.isArray(value)) return value.filter(Boolean).join('; ');
  return String(value || '').trim();
}

function detailLines(item){
  const lines = [];
  const reasons = detailsText(item.reason);
  const crownReasons = detailsText(item.crownReason);
  if (reasons) lines.push(`<b>Reason:</b> ${reasons}`);
  if (crownReasons) lines.push(`<b>Crown:</b> ${crownReasons}`);
  if (item.referral) lines.push(`<b>Referral:</b> ${item.referral}`);
  if (item.notes) lines.push(`<b>Notes:</b> ${item.notes}`);
  return lines.length ? lines.join('<br>') : '<span class="muted">—</span>';
}

function categoryFor(c){
  const st = (c.serviceType || '').toLowerCase();
  const d = (c.description || '').toLowerCase();
  if (st.includes('diagnostic') || /exam|eval|radiograph|x-ray|xray|ct|cone|pano|photo|image|model|cast/.test(d)) return 'Diagnostic / Imaging';
  if (st.includes('preventive') || /prophy|fluoride|sealant|oral hygiene|maintenance|recall/.test(d)) return 'Preventive / Hygiene';
  if (st.includes('crown') || st.includes('restorative') || st.includes('posterior composites') || /composite|amalgam|crown|veneer|onlay|inlay|buildup|post|core|recement|repair/.test(d)) return 'Restorative / Crowns';
  if (st.includes('endodont') || /root canal|endo|pulp|apico|hemisection/.test(d)) return 'Endodontics';
  if (st.includes('periodont') || /srp|scaling|periodontal|graft|gingiv|osseous|maintenance|arestin|perio/.test(d)) return 'Periodontics';
  if (st.includes('oral surgery') || /extraction|surgical removal|alveo|biopsy|bone graft/.test(d)) return 'Oral Surgery';
  if (st.includes('removable') || /denture|partial|reline|rebase|clasp|flipper|stay plate|overdenture/.test(d)) return 'Removable Prosthetics';
  if (st.includes('implant') || /implant|locator|abutment/.test(d)) return 'Implants';
  if (st.includes('fixed') || /bridge|pontic|retainer|maryland/.test(d)) return 'Fixed Prosthetics';
  if (st.includes('adjunctive') || /sedation|sleep|appliance|lab|referral|office|pre-pay|malocclusion/.test(d)) return 'Adjunctive / General';
  return 'Other';
}

function subcategoryFor(c){
  const d = (c.description || '').toLowerCase();
  const st = (c.serviceType || '').toLowerCase();
  if (/exam|eval|consult|limited|comprehensive|periodic/.test(d)) return 'Exams / Evaluations';
  if (/radiograph|x-ray|xray|pano|ct|cone|image|photo|scan/.test(d)) return 'Imaging';
  if (/prophy|hygiene|fluoride|sealant|maintenance|recall/.test(d)) return 'Hygiene / Prevention';
  if (/composite|amalgam|resin/.test(d) && !/crown/.test(d)) return 'Fillings';
  if (/crown|veneer|onlay|inlay|buildup|post|core|recement/.test(d) || st.includes('crown')) return 'Crowns / Indirect';
  if (/root canal|rct|pulp|endo|apico/.test(d)) return 'Root Canal / Endo';
  if (/srp|scaling|root planing|periodontal maintenance|arestin|irrig/.test(d)) return 'Perio Therapy';
  if (/graft|gingiv|flap|osseous|crown length/.test(d)) return 'Perio Surgery';
  if (/extract|removal|oral surgeon|surgical/.test(d)) return 'Extractions / Surgery';
  if (/complete denture|immediate denture|overdenture/.test(d)) return 'Complete Dentures';
  if (/partial|flipper|stay plate|clasp/.test(d)) return 'Partials / Flippers';
  if (/reline|rebase|repair|adjust/.test(d)) return 'Adjust / Repair';
  if (/implant.*placement|surgical placement/.test(d)) return 'Implant Surgery';
  if (/abutment|implant crown|implant supported|locator|connecting bar/.test(d)) return 'Implant Restorative';
  if (/bridge|pontic|retainer|maryland/.test(d)) return 'Bridge / Fixed';
  if (/sleep|appliance|splint|night|guard|tmj/.test(d)) return 'Appliances / Sleep / TMJ';
  if (/sedation|nitrous|oral sedation/.test(d)) return 'Sedation';
  if (/lab|fee|reduced fee|office|referral|pre-pay/.test(d)) return 'Admin / Lab / Referral';
  return c.serviceType || 'Other';
}

function procedureRelevance(c, q){
  if (!q) return 0;
  const qClean = q.toLowerCase().trim();
  const ada = String(c.adaCode || '').toLowerCase();
  const svc = String(c.serviceCode || '').toLowerCase();
  const desc = String(c.description || '').toLowerCase();
  const abbr = String(c.displayAbbr || '').toLowerCase();
  if (ada === qClean || svc === qClean) return 100;
  if (ada.startsWith(qClean) || svc.startsWith(qClean)) return 80;
  if (abbr === qClean) return 70;
  if (desc.includes(qClean)) return 60;
  const hay = codeSearchHaystack(c);
  const tokens = qClean.split(/\s+/).filter(Boolean);
  return tokens.reduce((score,t) => score + (hay.includes(t) ? 5 : 0), 0);
}

function filteredCodes(){
  const cat = $('categorySelect')?.value || '';
  const sub = $('subcategorySelect')?.value || '';
  const q = ($('codeSearch')?.value || '').toLowerCase().trim();

  // Search is intentionally global. When a search term is entered, it ignores
  // Category and Subcategory so procedures can be found even when their
  // classification is unknown. With no search term, the category/subcategory
  // dropdowns filter normally.
  let rows = activeCodes;
  if (q){
    rows = rows.filter(c => codeSearchHaystack(c).includes(q));
    return rows.sort((a,b) => procedureRelevance(b,q) - procedureRelevance(a,q) || (a.adaCode+a.description).localeCompare(b.adaCode+b.description));
  }
  return rows
    .filter(c => !cat || categoryFor(c) === cat)
    .filter(c => !sub || subcategoryFor(c) === sub)
    .sort((a,b) => (categoryFor(a)+subcategoryFor(a)+a.adaCode+a.description).localeCompare(categoryFor(b)+subcategoryFor(b)+b.adaCode+b.description));
}

function selectedCode(){
  const svc = $('procedureSelect').value;
  if (svc) return activeCodes.find(c => c.serviceCode === svc);
  return null;
}

function init(){
  $('planDate').value = state.planDate || new Date().toISOString().slice(0,10);
  $('patientName').value = state.patientName || '';
  buildTabs(); buildTeeth(); buildSurfaces(); buildCategorySelectors(); buildLookupFilters(); bind(); renderAll();
}
function buildTabs(){
  document.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.tabs button,.tab').forEach(x => x.classList.remove('active'));
    b.classList.add('active'); $(b.dataset.tab).classList.add('active'); renderAll();
  }));
}
function buildTeeth(){
  const chart = $('toothChart'); chart.innerHTML = '';
  const groups = [
    {label:'Upper right', range:[1,2,3,4,5,6,7,8]},
    {label:'Upper left', range:[9,10,11,12,13,14,15,16]},
    {label:'Lower right', range:[32,31,30,29,28,27,26,25]},
    {label:'Lower left', range:[24,23,22,21,20,19,18,17]}
  ];
  groups.forEach(g => {
    const box = document.createElement('div'); box.className = 'toothgroup';
    const label = document.createElement('div'); label.className = 'group-label'; label.textContent = `${g.label} (${g.range[0]}–${g.range[g.range.length-1]})`;
    const row = document.createElement('div'); row.className = 'toothrow';
    g.range.forEach(n => {
      const b = document.createElement('button'); b.className = 'tooth'; b.textContent = n; b.dataset.tooth = n;
      b.onclick = () => { selectedNonTooth = false; selectedTeeth = selectedTeeth.includes(n) ? selectedTeeth.filter(x => x !== n) : [...selectedTeeth, n].sort((a,b)=>a-b); renderTeeth(); };
      row.appendChild(b);
    });
    box.appendChild(label); box.appendChild(row); chart.appendChild(box);
  });
}
function renderTeeth(){
  [...document.querySelectorAll('.tooth')].forEach(b => b.classList.toggle('selected', selectedTeeth.includes(Number(b.dataset.tooth))));
  $('nonToothBtn').classList.toggle('primary', selectedNonTooth);
}
function buildSurfaces(){
  const groups = [
    {label:'Posterior', surfaces:['M','O','D','B','L']},
    {label:'Anterior / other', surfaces:['F','I','P','Root','Quad','Arch']}
  ];
  const bar = $('surfaceBar'); bar.innerHTML = '';
  groups.forEach(g => {
    const box = document.createElement('div'); box.className = 'surfacegroup';
    const label = document.createElement('div'); label.className = 'group-label'; label.textContent = g.label;
    const row = document.createElement('div'); row.className = 'surfacerow';
    g.surfaces.forEach(s => {
      const b = document.createElement('button'); b.className = 'surface'; b.textContent = s;
      b.onclick = () => { selectedSurfaces = selectedSurfaces.includes(s) ? selectedSurfaces.filter(x => x !== s) : [...selectedSurfaces, s]; renderSurfaces(); };
      row.appendChild(b);
    });
    box.appendChild(label); box.appendChild(row); bar.appendChild(box);
  });
}
function renderSurfaces(){
  [...document.querySelectorAll('.surface')].forEach(b => b.classList.toggle('selected', selectedSurfaces.includes(b.textContent)));
}
function buildCategorySelectors(){
  const cats = [...new Set(activeCodes.map(categoryFor))].sort((a,b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b));
  $('categorySelect').innerHTML = '<option value="">— blank / all categories —</option>' + cats.map(c => `<option>${c}</option>`).join('');
  refreshSubcategories(); refreshProcedures();
}
function refreshSubcategories(){
  const cat = $('categorySelect').value;
  const subs = [...new Set(activeCodes.filter(c => !cat || categoryFor(c) === cat).map(subcategoryFor))].sort();
  $('subcategorySelect').innerHTML = '<option value="">— blank / all subcategories —</option>' + subs.map(s => `<option>${s}</option>`).join('');
}
function refreshProcedures(){
  const previous = $('procedureSelect').value;
  const q = ($('codeSearch')?.value || '').trim();
  const rows = filteredCodes().slice(0, 250);
  const prompt = q ? `— blank / no procedure selected — (${rows.length} matching results shown)` : '— blank / no procedure selected —';
  $('procedureSelect').innerHTML = `<option value="">${prompt}</option>` + rows.map(c => `<option value="${c.serviceCode}">${c.adaCode || c.serviceCode} • ${c.description} • ${money(c.fee)}</option>`).join('');
  if (previous && rows.some(c => c.serviceCode === previous)) $('procedureSelect').value = previous;
  renderEntryStatus();
}
function buildLookupFilters(){
  const types = [...new Set(SERVICE_CODES.map(c => c.serviceType).filter(Boolean))].sort();
  types.forEach(t => { const o = document.createElement('option'); o.value = t; o.textContent = t; $('lookupType').appendChild(o); });
}
function bind(){
  ['patientName','planDate','planTitle'].forEach(id => $(id).addEventListener('input', () => {
    state.patientName = $('patientName').value; state.planDate = $('planDate').value; currentPlan().title = $('planTitle').value; save(); renderAll();
  }));
  $('planSelect').addEventListener('change', () => { state.currentPlanId = $('planSelect').value; save(); renderAll(); });
  $('newPlan').onclick = () => { const id = String.fromCharCode(65 + state.plans.length); state.plans.push({id, title:`Option ${id}: Alternative`, items:[]}); state.currentPlanId = id; save(); renderAll(); };
  $('duplicatePlan').onclick = () => { const cp = currentPlan(); const id = String.fromCharCode(65 + state.plans.length); state.plans.push({id, title:`Option ${id}: copy of ${cp.id}`, items:JSON.parse(JSON.stringify(cp.items))}); state.currentPlanId = id; save(); renderAll(); };
  $('deletePlan').onclick = () => { if(state.plans.length === 1){ alert('Keep at least one plan.'); return; } if(confirm('Delete this alternative plan?')){ state.plans = state.plans.filter(p => p.id !== state.currentPlanId); state.currentPlanId = state.plans[0].id; save(); renderAll(); } };
  $('clearTeeth').onclick = () => { selectedTeeth = []; selectedNonTooth = false; renderTeeth(); };
  $('clearSurfaces').onclick = () => { selectedSurfaces = []; renderSurfaces(); };
  document.querySelectorAll('[data-surface-set]').forEach(b => b.onclick = () => { selectedSurfaces = b.dataset.surfaceSet.split(''); renderSurfaces(); });
  document.querySelectorAll('[data-range]').forEach(b => b.onclick = () => { selectedNonTooth = false; selectedTeeth = parseRange(b.dataset.range); renderTeeth(); });
  document.querySelectorAll('[data-arch]').forEach(b => b.onclick = () => { const arch = b.dataset.arch; selectedNonTooth = false; selectedTeeth = arch === 'upper' ? range(1,16) : arch === 'lower' ? range(17,32) : range(1,32); renderTeeth(); });
  $('nonToothBtn').onclick = () => { selectedNonTooth = true; selectedTeeth = []; renderTeeth(); };
  $('categorySelect').addEventListener('change', () => { refreshSubcategories(); refreshProcedures(); });
  $('subcategorySelect').addEventListener('change', refreshProcedures);
  $('procedureSelect').addEventListener('change', renderEntryStatus);
  $('codeSearch').addEventListener('input', refreshProcedures);
  $('addProcedure').onclick = () => addProcedure(false);
  $('updateProcedure').onclick = updateCurrentEdit;
  $('cancelEdit').onclick = cancelEdit;
  $('addMonitor').onclick = () => addProcedure(true);
  $('clearEntry').onclick = () => { cancelEdit(false); clearEntryChoices(); };
  $('printPlan').onclick = () => { document.body.classList.remove('printing-compare'); window.print(); };
  if ($('printComparison')) $('printComparison').onclick = () => { document.body.classList.add('printing-compare'); document.querySelector('[data-tab="compare"]').click(); setTimeout(() => { window.print(); setTimeout(() => document.body.classList.remove('printing-compare'), 500); }, 50); };
  $('exportJson').onclick = exportJson;
  $('clearAll').onclick = () => { if(confirm('Erase all local treatment plans in this app?')){ localStorage.removeItem(stateKey); state = defaultState(); location.reload(); } };
  ['lookupQ','lookupType','lookupStatus'].forEach(id => $(id).addEventListener('input', renderLookup));
  $('installHelp').onclick = () => alert('To install on iPhone: host these files, open index.html in Safari, tap Share, then Add to Home Screen. The service worker caches the app for offline use after first load.');
}
function range(a,b){ return Array.from({length:b-a+1}, (_,i) => a+i); }
function parseRange(text){
  const [a,b] = text.split('-').map(Number); const step = a <= b ? 1 : -1; const out = [];
  for(let n=a; step>0 ? n<=b : n>=b; n += step) out.push(n);
  return out.sort((x,y)=>x-y);
}
function clearEntryChoices(){
  selectedTeeth = []; selectedSurfaces = []; selectedNonTooth = false;
  $('categorySelect').value = ''; refreshSubcategories(); $('subcategorySelect').value = ''; $('codeSearch').value = ''; refreshProcedures();
  $('procedureSelect').value = ''; $('feeOverride').value = ''; setMultiValues('reasonSelect', []); setMultiValues('crownReasonSelect', []); $('referralSelect').value = ''; $('notes').value = '';
  renderTeeth(); renderSurfaces(); renderEntryStatus();
}
function addProcedure(monitorOnly){
  const cp = currentPlan();
  const code = selectedCode() || (monitorOnly ? {adaCode:'MONITOR', serviceCode:'MONITOR', description:'Monitor / record finding', serviceType:'Monitor', fee:0, timeUnits:0} : null);
  if(!code){ alert('Select a procedure first. Search all procedures if needed, then choose a result from the Procedure dropdown.'); return; }
  if(!selectedNonTooth && selectedTeeth.length === 0 && !monitorOnly){ if(!confirm('No tooth selected. Add as non-tooth/general procedure?')) return; selectedNonTooth = true; }
  const feeOverride = $('feeOverride').value;
  const item = {
    id: crypto.randomUUID(), seq: cp.items.length + 1, phase: $('phaseSelect').value,
    tooth: selectedToothText(), surfaces: surfacesText(), adaCode: code.adaCode, serviceCode: code.serviceCode,
    description: code.description, serviceType: code.serviceType, fee: feeOverride === '' ? Number(code.fee || 0) : Number(feeOverride),
    reason: selectedValues('reasonSelect'), crownReason: selectedValues('crownReasonSelect'), referral: $('referralSelect').value,
    notes: $('notes').value, monitor: monitorOnly || $('phaseSelect').value === 'Monitor'
  };
  cp.items.push(item); save(); clearEntryChoices(); renderAll();
}


function findItemById(id){
  return currentPlan().items.find(i => i.id === id);
}

function parseToothText(text){
  if (!text || /^non-tooth$/i.test(text.trim())) return {nonTooth: !!text, teeth: []};
  const teeth = String(text).match(/\d+/g)?.map(Number).filter(n => n >= 1 && n <= 32) || [];
  return {nonTooth:false, teeth:[...new Set(teeth)].sort((a,b)=>a-b)};
}

function parseSurfaceText(text){
  const raw = String(text || '');
  const found = [];
  let t = raw;
  ['Root','Quad','Arch'].forEach(token => {
    if (t.includes(token)){ found.push(token); t = t.replaceAll(token, ''); }
  });
  t.split('').forEach(ch => { if ('MODBLFIP'.includes(ch)) found.push(ch); });
  return [...new Set(found)];
}

function setEditingMode(item){
  editingItemId = item ? item.id : null;
  const editing = !!editingItemId;
  if ($('addProcedure')) $('addProcedure').style.display = editing ? 'none' : '';
  if ($('addMonitor')) $('addMonitor').style.display = editing ? 'none' : '';
  if ($('updateProcedure')) $('updateProcedure').style.display = editing ? '' : 'none';
  if ($('cancelEdit')) $('cancelEdit').style.display = editing ? '' : 'none';
  if ($('editStatus')){
    $('editStatus').style.display = editing ? '' : 'none';
    $('editStatus').innerHTML = editing ? `<b>Editing sequence ${item.seq}:</b> ${item.adaCode || item.serviceCode} — ${item.description}<br><span class="muted">Change phase, teeth, surfaces, procedure, fee, reason, referral, or notes, then tap Update selected procedure.</span>` : '';
  }
}

function editItem(id){
  const item = findItemById(id);
  if (!item) return;
  const toothInfo = parseToothText(item.tooth);
  selectedNonTooth = toothInfo.nonTooth;
  selectedTeeth = toothInfo.teeth;
  selectedSurfaces = parseSurfaceText(item.surfaces);

  $('phaseSelect').value = item.phase ?? '';
  $('feeOverride').value = Number(item.fee || 0);
  setMultiValues('reasonSelect', item.reason || []);
  setMultiValues('crownReasonSelect', item.crownReason || []);
  $('referralSelect').value = item.referral || '';
  $('notes').value = item.notes || '';

  const code = activeCodes.find(c => c.serviceCode === item.serviceCode);
  $('codeSearch').value = '';
  if (code){
    $('categorySelect').value = categoryFor(code);
    refreshSubcategories();
    $('subcategorySelect').value = subcategoryFor(code);
    refreshProcedures();
    $('procedureSelect').value = code.serviceCode;
  } else {
    $('categorySelect').value = '';
    refreshSubcategories();
    $('subcategorySelect').value = '';
    refreshProcedures();
    $('procedureSelect').value = '';
  }

  setEditingMode(item);
  renderTeeth();
  renderSurfaces();
  renderEntryStatus();
  document.querySelector('section.panel.no-print:nth-of-type(4)')?.scrollIntoView({behavior:'smooth', block:'start'});
}

function cancelEdit(render=true){
  editingItemId = null;
  setEditingMode(null);
  if (render) renderEntryStatus();
}

function updateCurrentEdit(){
  const cp = currentPlan();
  const item = cp.items.find(i => i.id === editingItemId);
  if (!item){ cancelEdit(); return; }
  const chosenCode = selectedCode();
  const code = chosenCode || {adaCode:item.adaCode, serviceCode:item.serviceCode, description:item.description, serviceType:item.serviceType, fee:item.fee};
  if(!selectedNonTooth && selectedTeeth.length === 0 && item.serviceCode !== 'MONITOR'){
    if(!confirm('No tooth selected. Save as non-tooth/general procedure?')) return;
    selectedNonTooth = true;
  }
  const feeOverride = $('feeOverride').value;
  Object.assign(item, {
    phase: $('phaseSelect').value,
    tooth: selectedToothText(),
    surfaces: surfacesText(),
    adaCode: code.adaCode,
    serviceCode: code.serviceCode,
    description: code.description,
    serviceType: code.serviceType,
    fee: feeOverride === '' ? Number(code.fee || 0) : Number(feeOverride),
    reason: selectedValues('reasonSelect'),
    crownReason: selectedValues('crownReasonSelect'),
    referral: $('referralSelect').value,
    notes: $('notes').value,
    monitor: code.serviceCode === 'MONITOR' || $('phaseSelect').value === 'Monitor'
  });
  save();
  cancelEdit(false);
  clearEntryChoices();
  renderAll();
}


function renderEntryStatus(){
  const code = selectedCode();
  const addBtn = $('addProcedure');
  const box = $('selectedProcedureSummary');
  if (!box || !addBtn) return;
  if (!code){
    const q = ($('codeSearch')?.value || '').trim();
    box.innerHTML = q
      ? '<b>No procedure selected.</b><br><span class="muted">Search is looking through all active procedures. Choose one result from the Procedure dropdown before adding.</span>'
      : '<b>No procedure selected.</b><br><span class="muted">Choose Category → Subcategory → Procedure, or search all procedures and choose a result.</span>';
    addBtn.disabled = true;
    addBtn.title = 'Select a procedure first';
    return;
  }
  addBtn.disabled = false;
  addBtn.title = '';
  box.innerHTML = `<b>Selected:</b> ${code.adaCode || code.serviceCode} — ${code.description}<br><span class="muted">${categoryFor(code)} › ${subcategoryFor(code)} • Service ${code.serviceCode} • ${money(code.fee)}</span>`;
}

function renderPlans(){
  const sel = $('planSelect'); sel.innerHTML = '';
  state.plans.forEach(p => { const o = document.createElement('option'); o.value = p.id; o.textContent = `${p.id} - ${p.title}`; sel.appendChild(o); });
  sel.value = state.currentPlanId; $('planTitle').value = currentPlan().title; $('patientName').value = state.patientName; $('planDate').value = state.planDate;
}
function phaseGroups(items){
  const groups = [];
  items.slice().sort((a,b) => a.seq - b.seq).forEach(item => {
    let group = groups.find(g => g.phase === item.phase);
    if (!group){ group = {phase:item.phase || 'Unassigned phase', items:[], subtotal:0}; groups.push(group); }
    group.items.push(item);
    group.subtotal += Number(item.fee || 0);
  });
  return groups;
}
function renderTotals(){
  const items = currentPlan().items;
  const total = items.reduce((s,i) => s + Number(i.fee || 0), 0);
  if ($('printTotal')) $('printTotal').textContent = money(total);
}
function renderTable(){
  const cp = currentPlan();
  $('printPlanTitle').textContent = cp.title || 'Treatment Plan';
  $('printPatientLine').textContent = `${state.patientName || 'Patient'} • ${state.planDate || ''}`;
  const groups = phaseGroups(cp.items);
  const grand = cp.items.reduce((s,i) => s + Number(i.fee || 0), 0);
  if (!groups.length){
    $('planTableWrap').innerHTML = `<div class="tablewrap"><table><thead><tr><th>Seq</th><th>Phase</th><th>Tooth</th><th>Surf</th><th>Code</th><th>Procedure</th><th>Reason / notes</th><th class="money">Fee</th><th class="no-print"></th></tr></thead><tbody><tr><td colspan="9" class="muted">No procedures added yet.</td></tr></tbody></table></div>`;
    return;
  }
  const body = groups.map(group => {
    const rows = group.items.map(i => `<tr><td class="seqcell">${i.seq}</td><td>${i.phase}</td><td>${i.tooth || ''}</td><td>${i.surfaces || ''}</td><td><b>${i.adaCode}</b><br><span class="muted">${i.serviceCode}</span></td><td>${i.description}<br><span class="muted">${i.serviceType || ''}</span></td><td>${detailLines(i)}</td><td class="money">${money(i.fee)}</td><td class="row-actions no-print"><button onclick="editItem('${i.id}')">Edit</button><button onclick="moveItem('${i.id}',-1)">↑</button><button onclick="moveItem('${i.id}',1)">↓</button><button onclick="removeItem('${i.id}')">×</button></td></tr>`).join('');
    return `<tr class="phase-heading"><th colspan="9">${group.phase}</th></tr>${rows}<tr class="phase-subtotal"><td colspan="7"><b>${group.phase} subtotal</b></td><td class="money"><b>${money(group.subtotal)}</b></td><td class="no-print"></td></tr>`;
  }).join('');
  const grandRow = `<tr class="grand-total-row"><td colspan="7"><b>Grand total</b></td><td class="money"><b>${money(grand)}</b></td><td class="no-print"></td></tr>`;
  $('planTableWrap').innerHTML = `<div class="tablewrap"><table><thead><tr><th>Seq</th><th>Phase</th><th>Tooth</th><th>Surf</th><th>Code</th><th>Procedure</th><th>Reason / notes</th><th class="money">Fee</th><th class="no-print"></th></tr></thead><tbody>${body}${grandRow}</tbody></table></div>`;
}

function resequenceItems(plan){
  plan.items
    .sort((a,b) => Number(a.seq || 0) - Number(b.seq || 0))
    .forEach((item, idx) => { item.seq = idx + 1; });
}

function removeItem(id){
  const cp = currentPlan();
  const item = cp.items.find(i => i.id === id);
  if (!item) return;
  if (!confirm(`Remove this procedure?\n\n${item.adaCode || item.serviceCode} — ${item.description}`)) return;
  cp.items = cp.items.filter(i => i.id !== id);
  if (editingItemId === id) cancelEdit(false);
  resequenceItems(cp);
  save();
  renderAll();
}

function moveItem(id, direction){
  const cp = currentPlan();
  const ordered = cp.items.slice().sort((a,b) => Number(a.seq || 0) - Number(b.seq || 0));
  const idx = ordered.findIndex(i => i.id === id);
  if (idx < 0) return;
  const newIdx = idx + Number(direction || 0);
  if (newIdx < 0 || newIdx >= ordered.length) return;
  [ordered[idx], ordered[newIdx]] = [ordered[newIdx], ordered[idx]];
  ordered.forEach((item, i) => { item.seq = i + 1; });
  cp.items = ordered;
  save();
  renderAll();
}

window.removeItem = removeItem;
window.moveItem = moveItem;
window.editItem = editItem;

function renderLookup(){
  const q = $('lookupQ').value.toLowerCase(), type = $('lookupType').value, status = $('lookupStatus').value;
  const rows = SERVICE_CODES.filter(c => (!type || c.serviceType === type) && (!status || c.status === status) && (!q || [c.adaCode,c.serviceCode,c.displayAbbr,c.description,c.serviceType,categoryFor(c),subcategoryFor(c)].join(' ').toLowerCase().includes(q))).slice(0,150);
  $('lookupList').innerHTML = rows.map(c => `<div class="lookup-card"><div><b>${c.description}</b> <span class="badge">${c.status}</span><div class="muted">ADA ${c.adaCode} • Service ${c.serviceCode} • ${categoryFor(c)} › ${subcategoryFor(c)} • Page ${c.page}</div></div><div><b>${money(c.fee)}</b><br><button onclick="prefillCode('${c.serviceCode}')">Use</button></div></div>`).join('') || '<p class="muted">No matches.</p>';
}
window.prefillCode = svc => {
  const c = SERVICE_CODES.find(x => x.serviceCode === svc); if(!c) return;
  $('categorySelect').value = categoryFor(c); refreshSubcategories(); $('subcategorySelect').value = subcategoryFor(c); refreshProcedures(); $('procedureSelect').value = c.serviceCode;
  document.querySelector('[data-tab="planner"]').click();
};
function renderCompare(){
  if ($('comparePatientLine')) $('comparePatientLine').textContent = `${state.patientName || 'Patient'} • ${state.planDate || ''}`;
  if (!state.plans.length){ $('compareBox').innerHTML = '<p class="muted">No alternative plans yet.</p>'; return; }
  const totals = state.plans.map(p => p.items.reduce((s,i) => s + Number(i.fee || 0),0));
  const minTotal = totals.length ? Math.min(...totals) : 0;
  const summary = '<div class="comparison">' + state.plans.map((p, idx) => {
    const total = totals[idx];
    const refs = p.items.filter(i => i.referral).length;
    const monitors = p.items.filter(i => i.monitor || i.phase === 'Monitor').length;
    const diff = total - minTotal;
    return `<div class="compare-card"><h3>${p.title}</h3><div class="compare-total">${money(total)}</div><p>${p.items.length} procedures<br>${refs} referral considerations<br>${monitors} monitoring rows<br>${diff ? `Difference from lowest: <b>${money(diff)}</b>` : '<b>Lowest total</b>'}</p></div>`;
  }).join('') + '</div>';

  const detailTables = state.plans.map(p => {
    const total = p.items.reduce((s,i) => s + Number(i.fee || 0),0);
    const rows = p.items.slice().sort((a,b) => a.seq - b.seq).map(i => `<tr><td>${i.seq}</td><td>${i.phase}</td><td>${i.tooth || ''}</td><td>${i.surfaces || ''}</td><td><b>${i.adaCode}</b><br><span class="muted">${i.serviceCode}</span></td><td>${i.description}${detailsText(i.reason) ? `<br><span class="muted">Reason: ${detailsText(i.reason)}</span>` : ''}${detailsText(i.crownReason) ? `<br><span class="muted">Crown: ${detailsText(i.crownReason)}</span>` : ''}${i.referral ? `<br><span class="muted">Referral: ${i.referral}</span>` : ''}</td><td class="money">${money(i.fee)}</td></tr>`).join('') || '<tr><td colspan="7" class="muted">No procedures in this alternative.</td></tr>';
    return `<section class="compare-detail"><h3>${p.title} <span>${money(total)}</span></h3><div class="tablewrap"><table><thead><tr><th>Seq</th><th>Phase</th><th>Tooth</th><th>Surf</th><th>Code</th><th>Procedure / reason</th><th class="money">Fee</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><th colspan="6">Total</th><th class="money">${money(total)}</th></tr></tfoot></table></div></section>`;
  }).join('');

  const maxLen = Math.max(...state.plans.map(p => p.items.length), 0);
  let sideRows = '';
  for (let r=0; r<maxLen; r++){
    sideRows += '<tr>' + state.plans.map(p => {
      const i = p.items.slice().sort((a,b)=>a.seq-b.seq)[r];
      return i ? `<td><b>${i.seq}. ${i.adaCode}</b> ${i.description}<br><span class="muted">${i.tooth || ''} ${i.surfaces || ''}</span><br><b>${money(i.fee)}</b></td>` : '<td class="muted">—</td>';
    }).join('') + '</tr>';
  }
  const sideBySide = `<section class="compare-detail"><h3>Side-by-side procedure comparison</h3><div class="tablewrap"><table><thead><tr>${state.plans.map(p => `<th>${p.title}<br><span class="muted">${money(p.items.reduce((s,i)=>s+Number(i.fee||0),0))}</span></th>`).join('')}</tr></thead><tbody>${sideRows || '<tr><td class="muted">Add procedures to compare alternatives.</td></tr>'}</tbody></table></div></section>`;
  $('compareBox').innerHTML = summary + sideBySide + detailTables;
}
function renderMonitoring(){
  const items = state.plans.flatMap(p => p.items.map(i => ({...i, plan:p.title}))).filter(i => i.monitor || i.referral || /monitor|watch|observe/i.test(i.notes || ''));
  $('monitorBox').innerHTML = items.map(i => `<div class="monitor-item"><b>${i.plan}</b> • Tooth ${i.tooth || 'N/A'} • ${i.adaCode} ${i.description}<br>${i.referral ? `Referral: ${i.referral}<br>` : ''}${i.notes || detailsText(i.reason) || ''}</div>`).join('') || '<p class="muted">No monitoring or referral rows yet.</p>';
}
function exportJson(){ const blob = new Blob([JSON.stringify(state,null,2)], {type:'application/json'}); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'treatment-plans.json'; a.click(); }
function renderAll(){ renderPlans(); renderTeeth(); renderSurfaces(); renderTotals(); renderTable(); renderLookup(); renderCompare(); renderMonitoring(); renderEntryStatus(); }
init();
