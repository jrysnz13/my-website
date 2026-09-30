// Inicializar iconos de Lucide
lucide.createIcons();

// --- ESTADO GLOBAL Y DATOS POR DEFECTO ---
let currentModule = 'Placas';

const defaultPlates = [
  { code: 'PLC-01', name: 'Placa Cyrel Fast', description: 'Grosor 1.14 mm para empaque flexible', active: true },
  { code: 'PLC-02', name: 'Placa Kodak NX', description: 'Grosor 1.70 mm alta resolución', active: true }
];

const defaultDotTypes = [
  { code: 'TP-01', name: 'Punto Redondo (Round)', description: 'Trama convencional para tonos medios suaves', active: true },
  { code: 'TP-02', name: 'Punto Elíptico (Elliptical)', description: 'Evita saltos de tono al 50% de cobertura', active: true }
];

const defaultOrders = [
  {
    ot: 'OT-101',
    priority: 'Alta',
    user: 'Jerry Sanchez',
    client: 'FlexoPack S.A.',
    plate: 'Placa Cyrel Fast',
    dotType: 'Punto Redondo (Round)',
    internalFile: 'empaque_v1.pdf',
    printType: 'Frente',
    measureX: '500',
    measureY: '700',
    observations: 'Sin detalles',
    platesList: [
      { color: 'Cyan', lpi: '150', angle: '75°', dot: 'Redondo' },
      { color: 'Magenta', lpi: '150', angle: '45°', dot: 'Redondo' }
    ],
    status: 'Borrador',
    active: true
  }
];

let plates = JSON.parse(localStorage.getItem('plates_catalog')) || defaultPlates;
let dotTypes = JSON.parse(localStorage.getItem('dotTypes_catalog')) || defaultDotTypes;
let orders = JSON.parse(localStorage.getItem('orders_catalog')) || defaultOrders;

let selectedPlateIndex = null;
let selectedDotTypeIndex = null;
let selectedOrderIndex = null;
let selectedWorkOrderIndex = null;
let currentOrderPlatesList = [];

// --- PERSISTENCIA EN LOCALSTORAGE ---
function saveToStorage() {
  localStorage.setItem('plates_catalog', JSON.stringify(plates));
  localStorage.setItem('dotTypes_catalog', JSON.stringify(dotTypes));
  localStorage.setItem('orders_catalog', JSON.stringify(orders));
}

// --- NAVEGACIÓN Y SIDEBAR ---
function toggleDropdown(btn) {
  const parentGroup = btn.closest('.nav-group');
  const isAlreadyOpen = parentGroup.classList.contains('open');

  document.querySelectorAll('.nav-group').forEach(group => {
    if (group !== parentGroup) group.classList.remove('open');
  });

  parentGroup.classList.toggle('open', !isAlreadyOpen);
}

function selectSubmenu(element, itemName, categoryName) {
  document.querySelectorAll('.submenu-item').forEach(item => item.classList.remove('active'));
  
  if (element) element.classList.add('active');
  currentModule = itemName;

  document.getElementById('page-title').textContent = categoryName + ' > ' + itemName;

  const toolbar = document.getElementById('toolbar');
  const btnAdd = document.getElementById('btn-add');
  const btnEdit = document.getElementById('btn-edit');
  const btnDelete = document.getElementById('btn-delete');
  const btnToggleStatus = document.getElementById('btn-toggle-status');
  const btnProduction = document.getElementById('btn-production');
  const btnView = document.getElementById('btn-view');
  const btnPrint = document.getElementById('btn-print');
  
  const cardPlates = document.getElementById('card-plates');
  const cardDotTypes = document.getElementById('card-dotTypes');
  const cardOrders = document.getElementById('card-orders');
  const cardWorkOrders = document.getElementById('card-workOrders');
  const cardGeneric = document.getElementById('card-generic');

  // Ocultar tarjetas por defecto
  cardPlates.style.display = 'none';
  cardDotTypes.style.display = 'none';
  cardOrders.style.display = 'none';
  if (cardWorkOrders) cardWorkOrders.style.display = 'none';
  cardGeneric.style.display = 'none';

  // Visibilidad por defecto de la barra de herramientas (Módulos estándar)
  toolbar.style.display = 'flex';
  btnAdd.style.display = 'inline-flex';
  btnEdit.style.display = 'inline-flex';
  btnDelete.style.display = 'inline-flex';
  btnToggleStatus.style.display = 'inline-flex';
  btnProduction.style.display = 'none';
  btnView.style.display = 'none';
  btnPrint.style.display = 'none';

  if (itemName === 'Placas') {
    cardPlates.style.display = 'block';
  } else if (itemName === 'Tipo de Punto') {
    cardDotTypes.style.display = 'block';
  } else if (itemName === 'Pedidos') {
    btnToggleStatus.style.display = 'none';
    btnProduction.style.display = 'inline-flex';
    cardOrders.style.display = 'block';
  } else if (itemName === 'Orden de Trabajo') {
    // Configuración exclusiva de botones para Orden de Trabajo
    btnAdd.style.display = 'none';
    btnEdit.style.display = 'none';
    btnDelete.style.display = 'none';
    btnToggleStatus.style.display = 'none';
    btnProduction.style.display = 'none';
    
    // Mostrar únicamente Visualizar e Imprimir
    btnView.style.display = 'inline-flex';
    btnPrint.style.display = 'inline-flex';

    if (cardWorkOrders) cardWorkOrders.style.display = 'block';
  } else {
    toolbar.style.display = 'none';
    cardGeneric.style.display = 'block';
    document.getElementById('content-heading').textContent = 'Módulo: ' + itemName;
    document.getElementById('content-description').textContent = 'Sección perteneciente a ' + categoryName + '.';
  }

  if (window.innerWidth <= 768) toggleSidebar();
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('active');
}

document.getElementById('overlay').addEventListener('click', toggleSidebar);

// --- CARGAR SELECTS DESDE LOS CATÁLOGOS ---
function populateCatalogSelects() {
  const plateSelect = document.getElementById('orderPlate');
  const dotTypeSelect = document.getElementById('orderDotType');

  if (!plateSelect || !dotTypeSelect) return;

  const activePlates = (plates || []).filter(p => p.active !== false);
  if (activePlates.length === 0) {
    plateSelect.innerHTML = '<option value="">Sin placas registradas</option>';
  } else {
    plateSelect.innerHTML = activePlates.map(p => `<option value="${p.name}">${p.name} (${p.code})</option>`).join('');
  }

  const activeDotTypes = (dotTypes || []).filter(d => d.active !== false);
  if (activeDotTypes.length === 0) {
    dotTypeSelect.innerHTML = '<option value="">Sin tipos de punto registrados</option>';
  } else {
    dotTypeSelect.innerHTML = activeDotTypes.map(d => `<option value="${d.name}">${d.name} (${d.code})</option>`).join('');
  }
}

// --- RENDERIZADO DE TABLAS ---
function renderTable() {
  // Render Placas
  const tbodyPlates = document.getElementById('platesTableBody');
  if (tbodyPlates) {
    tbodyPlates.innerHTML = plates.length === 0 
      ? `<tr><td colspan="5" style="text-align:center; padding: 20px; color: #6b7280;">No hay placas registradas.</td></tr>`
      : plates.map((plate, index) => `
          <tr class="${selectedPlateIndex === index ? 'selected' : ''}" onclick="selectedPlateIndex = ${index}; renderTable();">
            <td><input type="radio" name="selectPlate" ${selectedPlateIndex === index ? 'checked' : ''}></td>
            <td><strong>${plate.code}</strong></td>
            <td>${plate.name}</td>
            <td>${plate.description || '-'}</td>
            <td><span class="status-badge ${plate.active ? 'status-active' : 'status-inactive'}">${plate.active ? 'Activo' : 'Inactivo'}</span></td>
          </tr>
        `).join('');
  }

  // Render Tipo de Punto
  const tbodyDotTypes = document.getElementById('dotTypesTableBody');
  if (tbodyDotTypes) {
    tbodyDotTypes.innerHTML = dotTypes.length === 0 
      ? `<tr><td colspan="5" style="text-align:center; padding: 20px; color: #6b7280;">No hay tipos de punto registrados.</td></tr>`
      : dotTypes.map((item, index) => `
          <tr class="${selectedDotTypeIndex === index ? 'selected' : ''}" onclick="selectedDotTypeIndex = ${index}; renderTable();">
            <td><input type="radio" name="selectDotType" ${selectedDotTypeIndex === index ? 'checked' : ''}></td>
            <td><strong>${item.code}</strong></td>
            <td>${item.name}</td>
            <td>${item.description || '-'}</td>
            <td><span class="status-badge ${item.active ? 'status-active' : 'status-inactive'}">${item.active ? 'Activo' : 'Inactivo'}</span></td>
          </tr>
        `).join('');
  }

  // Render Pedidos (FILTRADO: Solo se muestran los que NO están "En Producción")
  const tbodyOrders = document.getElementById('ordersTableBody');
  if (tbodyOrders) {
    const draftOrders = orders.filter(o => o.status !== 'En Producción');

    tbodyOrders.innerHTML = draftOrders.length === 0 
      ? `<tr><td colspan="7" style="text-align:center; padding: 20px; color: #6b7280;">No hay pedidos pendientes en borrador.</td></tr>`
      : draftOrders.map((order) => {
          // Buscamos el índice real del objeto en el arreglo global 'orders'
          const realIndex = orders.indexOf(order);
          const measures = (order.measureX || '-') + ' x ' + (order.measureY || '-') + ' mm';

          return `
            <tr class="${selectedOrderIndex === realIndex ? 'selected' : ''}" onclick="selectedOrderIndex = ${realIndex}; renderTable();">
              <td><input type="radio" name="selectOrder" ${selectedOrderIndex === realIndex ? 'checked' : ''}></td>
              <td><strong>${order.ot}</strong></td>
              <td>${order.client}</td>
              <td>${order.plate} / ${order.dotType}</td>
              <td>${measures}</td>
              <td><strong>${order.priority}</strong></td>
              <td><span class="status-badge status-draft">${order.status}</span></td>
            </tr>
          `;
        }).join('');
  }

  // Render Orden de Trabajo (FILTRADO: Solo se muestran los que SÍ están "En Producción")
  const tbodyWorkOrders = document.getElementById('workOrdersTableBody');
  if (tbodyWorkOrders) {
    const inProductionOrders = orders.filter(o => o.status === 'En Producción');

    tbodyWorkOrders.innerHTML = inProductionOrders.length === 0 
      ? `<tr><td colspan="7" style="text-align:center; padding: 20px; color: #6b7280;">No hay órdenes de trabajo en producción actualmente.</td></tr>`
      : inProductionOrders.map((order) => {
          const realIndex = orders.indexOf(order);
          const measures = (order.measureX || '-') + ' x ' + (order.measureY || '-') + ' mm';

          return `
            <tr class="${selectedWorkOrderIndex === realIndex ? 'selected' : ''}" onclick="selectedWorkOrderIndex = ${realIndex}; renderTable();">
              <td><input type="radio" name="selectWorkOrder" ${selectedWorkOrderIndex === realIndex ? 'checked' : ''}></td>
              <td><strong>${order.ot}</strong></td>
              <td>${order.client}</td>
              <td>${order.plate} / ${order.dotType}</td>
              <td>${measures}</td>
              <td><strong>${order.priority}</strong></td>
              <td><span class="status-badge status-production">En Producción</span></td>
            </tr>
          `;
        }).join('');
  }

  lucide.createIcons();
}

// --- SUB-TABLA DE COLORES/PLACAS EN EL PEDIDO ---
function addPlateItem() {
  const color = document.getElementById('plateColor').value.trim();
  const lpi = document.getElementById('plateLpi').value.trim();
  const angle = document.getElementById('plateAngle').value.trim();
  const dot = document.getElementById('plateDot').value.trim();

  if (!color) {
    return alert('Por favor ingresa el nombre del Color.');
  }

  currentOrderPlatesList.push({ color, lpi, angle, dot });
  
  document.getElementById('plateColor').value = '';
  document.getElementById('plateLpi').value = '';
  document.getElementById('plateAngle').value = '';
  document.getElementById('plateDot').value = '';

  renderPlateItemsTable();
}

function removePlateItem(index) {
  currentOrderPlatesList.splice(index, 1);
  renderPlateItemsTable();
}

function renderPlateItemsTable() {
  const tbody = document.getElementById('plateItemsTableBody');
  if (!tbody) return;

  if (currentOrderPlatesList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 8px; color: #94a3b8;">No se han agregado placas a este pedido.</td></tr>`;
    return;
  }

  tbody.innerHTML = currentOrderPlatesList.map((item, index) => `
    <tr>
      <td><strong>${item.color}</strong></td>
      <td>${item.lpi || '-'}</td>
      <td>${item.angle || '-'}</td>
      <td>${item.dot || '-'}</td>
      <td style="text-align: center;">
        <button type="button" onclick="removePlateItem(${index})" style="background:none; border:none; color:#ef4444; cursor:pointer;">
          <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
        </button>
      </td>
    </tr>
  `).join('');

  lucide.createIcons();
}

// --- MODAL Y FUNCIONES CRUD ---
function openAddModal() {
  const itemIndexInput = document.getElementById('itemIndex');
  const itemForm = document.getElementById('itemForm');
  const fieldsCatalog = document.getElementById('fields-catalog');
  const fieldsOrders = document.getElementById('fields-orders');

  if (itemIndexInput) itemIndexInput.value = '';
  if (itemForm) itemForm.reset();
  currentOrderPlatesList = [];

  if (currentModule === 'Pedidos') {
    selectedOrderIndex = null;
    if (fieldsCatalog) fieldsCatalog.style.display = 'none';
    if (fieldsOrders) fieldsOrders.style.display = 'block';
    
    document.getElementById('modalTitle').textContent = 'Nuevo Pedido';
    populateCatalogSelects();
    document.getElementById('orderUser').value = 'Jerry Sanchez';
    renderPlateItemsTable();
  } else {
    if (fieldsCatalog) fieldsCatalog.style.display = 'block';
    if (fieldsOrders) fieldsOrders.style.display = 'none';

    if (currentModule === 'Placas') {
      selectedPlateIndex = null;
      document.getElementById('modalTitle').textContent = 'Nueva Placa';
      document.getElementById('lblCode').textContent = 'SKU';
    } else {
      selectedDotTypeIndex = null;
      document.getElementById('modalTitle').textContent = 'Nuevo Tipo de Punto';
      document.getElementById('lblCode').textContent = 'Código';
    }
  }

  document.getElementById('modalOverlay').classList.add('active');
}

function editSelected() {
  const fieldsCatalog = document.getElementById('fields-catalog');
  const fieldsOrders = document.getElementById('fields-orders');

  if (currentModule === 'Pedidos') {
    if (selectedOrderIndex === null || selectedOrderIndex === undefined) {
      return alert('Por favor selecciona un pedido de la lista.');
    }
    
    populateCatalogSelects();
    const order = orders[selectedOrderIndex];

    document.getElementById('itemIndex').value = selectedOrderIndex;
    document.getElementById('orderOt').value = order.ot || '';
    document.getElementById('orderPriority').value = order.priority || 'Normal';
    document.getElementById('orderUser').value = 'Jerry Sanchez';
    document.getElementById('orderClient').value = order.client || '';
    if (order.plate) document.getElementById('orderPlate').value = order.plate;
    if (order.dotType) document.getElementById('orderDotType').value = order.dotType;
    document.getElementById('orderFile').value = order.internalFile || '';
    document.getElementById('orderPrintType').value = order.printType || 'Frente';
    document.getElementById('orderMeasureX').value = order.measureX || '';
    document.getElementById('orderMeasureY').value = order.measureY || '';
    document.getElementById('orderObservations').value = order.observations || '';

    currentOrderPlatesList = order.platesList ? [...order.platesList] : [];
    renderPlateItemsTable();

    if (fieldsCatalog) fieldsCatalog.style.display = 'none';
    if (fieldsOrders) fieldsOrders.style.display = 'block';
    document.getElementById('modalTitle').textContent = 'Editar Pedido';
  } else {
    if (fieldsCatalog) fieldsCatalog.style.display = 'block';
    if (fieldsOrders) fieldsOrders.style.display = 'none';

    const isPlates = currentModule === 'Placas';
    const index = isPlates ? selectedPlateIndex : selectedDotTypeIndex;
    const list = isPlates ? plates : dotTypes;

    if (index === null || index === undefined) {
      return alert(`Por favor selecciona un registro de ${currentModule}.`);
    }

    const item = list[index];
    document.getElementById('itemIndex').value = index;
    document.getElementById('itemCode').value = item.code || '';
    document.getElementById('itemName').value = item.name || '';
    document.getElementById('itemDescription').value = item.description || '';
    document.getElementById('modalTitle').textContent = `Editar ${currentModule}`;
  }

  document.getElementById('modalOverlay').classList.add('active');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
}

function saveItem(e) {
  e.preventDefault();
  const editIndex = document.getElementById('itemIndex').value;

  if (currentModule === 'Pedidos') {
    const ot = document.getElementById('orderOt').value.trim();
    const client = document.getElementById('orderClient').value.trim();

    if (!ot || !client) {
      return alert('Por favor ingresa la OT y el Nombre del Cliente.');
    }

    const newOrder = {
      ot: ot,
      priority: document.getElementById('orderPriority').value,
      user: 'Jerry Sanchez',
      client: client,
      plate: document.getElementById('orderPlate').value || 'Sin asignar',
      dotType: document.getElementById('orderDotType').value || 'Sin asignar',
      internalFile: document.getElementById('orderFile').value.trim(),
      printType: document.getElementById('orderPrintType').value,
      measureX: document.getElementById('orderMeasureX').value.trim(),
      measureY: document.getElementById('orderMeasureY').value.trim(),
      observations: document.getElementById('orderObservations').value.trim(),
      platesList: [...currentOrderPlatesList],
      status: editIndex !== '' ? orders[editIndex].status : 'Borrador',
      active: true
    };

    if (editIndex !== '') {
      orders[editIndex] = newOrder;
    } else {
      orders.push(newOrder);
    }
  } else {
    const code = document.getElementById('itemCode').value.trim();
    const name = document.getElementById('itemName').value.trim();
    const description = document.getElementById('itemDescription').value.trim();

    if (!code || !name) {
      return alert('Por favor ingresa el Código/SKU y el Nombre.');
    }

    const isPlates = currentModule === 'Placas';
    const list = isPlates ? plates : dotTypes;

    const newItem = { code, name, description, active: true };

    if (editIndex !== '') {
      list[editIndex] = { ...list[editIndex], ...newItem };
    } else {
      list.push(newItem);
    }
  }

  saveToStorage();
  closeModal();
  renderTable();
}

function toggleStatusSelected() {
  if (currentModule === 'Placas') {
    if (selectedPlateIndex === null) return alert('Por favor selecciona una placa.');
    plates[selectedPlateIndex].active = !plates[selectedPlateIndex].active;
  } else if (currentModule === 'Tipo de Punto') {
    if (selectedDotTypeIndex === null) return alert('Por favor selecciona un tipo de punto.');
    dotTypes[selectedDotTypeIndex].active = !dotTypes[selectedDotTypeIndex].active;
  }

  saveToStorage();
  renderTable();
}

function sendToProductionSelected() {
  if (selectedOrderIndex === null || selectedOrderIndex === undefined) {
    return alert('Por favor selecciona un pedido de la lista.');
  }

  const order = orders[selectedOrderIndex];

  if (order.status === 'En Producción') {
    return alert(`El pedido "${order.ot}" ya se encuentra en Producción.`);
  }

  order.status = 'En Producción';
  saveToStorage();
  renderTable();
  alert(`El pedido con OT "${order.ot}" ha cambiado a Estatus 'En Producción' y ya se refleja en la sección Orden de Trabajo.`);
}

function deleteSelected() {
  let list, indexVarName;

  if (currentModule === 'Pedidos') {
    list = orders;
    indexVarName = selectedOrderIndex;
  } else if (currentModule === 'Placas') {
    list = plates;
    indexVarName = selectedPlateIndex;
  } else {
    list = dotTypes;
    indexVarName = selectedDotTypeIndex;
  }

  if (indexVarName === null || indexVarName === undefined) return alert(`Por favor selecciona un elemento para eliminar.`);

  if (confirm(`¿Deseas eliminar este elemento de ${currentModule}?`)) {
    list.splice(indexVarName, 1);
    if (currentModule === 'Pedidos') selectedOrderIndex = null;
    else if (currentModule === 'Placas') selectedPlateIndex = null;
    else selectedDotTypeIndex = null;

    saveToStorage();
    renderTable();
  }
}

function filterTable(type) {
  const map = {
    plates: { query: 'searchInputPlates', body: 'platesTableBody' },
    dotTypes: { query: 'searchInputDotTypes', body: 'dotTypesTableBody' },
    orders: { query: 'searchInputOrders', body: 'ordersTableBody' },
    workOrders: { query: 'searchInputWorkOrders', body: 'workOrdersTableBody' }
  };

  const target = map[type];
  if (!target) return;

  const q = document.getElementById(target.query).value.toLowerCase();
  const rows = document.querySelectorAll(`#${target.body} tr`);

  rows.forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

document.addEventListener('DOMContentLoaded', renderTable);
