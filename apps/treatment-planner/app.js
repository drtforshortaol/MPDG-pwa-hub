const starterProcedures = [
  { code: 'D0120', name: 'Periodic oral evaluation', category: 'Diagnostic', fee: 0 },
  { code: 'D0150', name: 'Comprehensive oral evaluation', category: 'Diagnostic', fee: 0 },
  { code: 'D1110', name: 'Adult prophylaxis', category: 'Preventive', fee: 0 },
  { code: 'D2740', name: 'Crown - porcelain/ceramic', category: 'Fixed Prosthodontics', fee: 0 },
  { code: 'D2950', name: 'Core buildup', category: 'Restorative', fee: 0 },
  { code: 'D2391', name: 'Resin composite - one surface, posterior', category: 'Restorative', fee: 0 },
  { code: 'D2392', name: 'Resin composite - two surfaces, posterior', category: 'Restorative', fee: 0 },
  { code: 'D7210', name: 'Surgical removal of erupted tooth', category: 'Oral Surgery', fee: 0 }
];

let selectedTeeth = [];
let selectedSurfaces = [];
let plan = [];
let procedures = starterProcedures;

const teethEl = document.getElementById('teeth');
const procedureSearch = document.getElementById('procedureSearch');
const procedureSelect = document.getElementById('procedureSelect');
const planRows = document.getElementById('planRows');
const subtotalEl = document.getElementById('subtotal');

function renderTeeth(group = '1-8') {
  const ranges = {
    '1-8': [1,2,3,4,5,6,7,8],
    '9-16': [9,10,11,12,13,14,15,16],
    '24-17': [24,23,22,21,20,19,18,17],
    '32-25': [32,31,30,29,28,27,26,25]
  };
  teethEl.innerHTML = '';
  ranges[group].forEach(num => {
    const btn = document.createElement('button');
    btn.textContent = num;
    btn.className = selectedTeeth.includes(num) ? 'selected' : '';
    btn.onclick = () => {
      selectedTeeth = selectedTeeth.includes(num)
        ? selectedTeeth.filter(t => t !== num)
        : [...selectedTeeth, num];
      renderTeeth(group);
    };
    teethEl.appendChild(btn);
  });
}

function renderProcedures(filter = '') {
  const term = filter.toLowerCase();
  const matches = procedures.filter(p =>
    [p.code, p.name, p.category].join(' ').toLowerCase().includes(term)
  );
  procedureSelect.innerHTML = matches.map((p, i) =>
    `<option value="${procedures.indexOf(p)}">${p.category} — ${p.code} — ${p.name} — $${p.fee}</option>`
  ).join('');
}

function renderPlan() {
  planRows.innerHTML = plan.map(item => `
    <tr>
      <td>${item.tooth}</td>
      <td>${item.surface}</td>
      <td>${item.code}</td>
      <td>${item.name}</td>
      <td>$${Number(item.fee).toLocaleString()}</td>
    </tr>
  `).join('');
  const subtotal = plan.reduce((sum, item) => sum + Number(item.fee || 0), 0);
  subtotalEl.textContent = `Subtotal: $${subtotal.toLocaleString()}`;
}

function clearChoices() {
  selectedTeeth = [];
  selectedSurfaces = [];
  document.querySelectorAll('.surface-buttons button').forEach(b => b.classList.remove('selected'));
  renderTeeth();
}

document.querySelectorAll('[data-group]').forEach(btn => {
  btn.onclick = () => renderTeeth(btn.dataset.group);
});

document.querySelectorAll('[data-surface]').forEach(btn => {
  btn.onclick = () => {
    const surface = btn.dataset.surface;
    selectedSurfaces = selectedSurfaces.includes(surface)
      ? selectedSurfaces.filter(s => s !== surface)
      : [...selectedSurfaces, surface];
    btn.classList.toggle('selected');
  };
});

procedureSearch.oninput = () => renderProcedures(procedureSearch.value);

document.getElementById('addProcedure').onclick = () => {
  const proc = procedures[Number(procedureSelect.value)];
  if (!proc) return;
  const teeth = selectedTeeth.length ? selectedTeeth : ['General'];
  const surface = selectedSurfaces.join('') || '';
  teeth.forEach(tooth => plan.push({ tooth, surface, ...proc }));
  renderPlan();
  clearChoices();
};

document.getElementById('clearChoices').onclick = clearChoices;

renderTeeth();
renderProcedures();
renderPlan();
