/**
 * CONSOLA MÉDICA DE PROTOCOLIZACIÓN Y ADQUISICIÓN PET/CT — GALARIA · SERGAS
 * Módulo 5 del Ecosistema Digital PET/CT
 * Gestión de pacientes citados, volantes de petición e instrucciones técnicas de adquisición
 */

(function () {
  'use strict';

  // ==========================================================================
  // ESTADO GLOBAL DE LA APLICACIÓN
  // ==========================================================================
  const state = {
    allPatients: [],
    filteredPatients: [],
    protocols: {}, // key: patient id or nhc -> protocol object
    activeFilterDate: 'today', // 'today', 'tomorrow', 'all', or 'YYYY-MM-DD'
    activeFilterStatus: 'all', // 'all', 'pending', 'done'
    activeFilterTracer: 'all',
    activeFilterTestType: 'all',
    searchTerm: '',
    currentView: 'cards', // 'cards' | 'table'
    selectedPatient: null,
    editingProtocol: null
  };

  // Referencias DOM
  const elements = {};

  // ==========================================================================
  // INICIALIZACIÓN
  // ==========================================================================
  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    cacheDomElements();
    setupEventListeners();
    setupInteractiveRadioCards();
    setupProtocolNavTabs();
    loadStoredProtocols();
    await loadPatientsData();
    render();
  }

  function cacheDomElements() {
    elements.kpiTotalCitados = document.getElementById('kpiTotalCitados');
    elements.kpiPendientes = document.getElementById('kpiPendientes');
    elements.kpiProtocolizados = document.getElementById('kpiProtocolizados');
    elements.kpiAlertas = document.getElementById('kpiAlertas');
    elements.kpiFechaSub = document.getElementById('kpiFechaSub');

    elements.countTabAll = document.getElementById('countTabAll');
    elements.countTabPending = document.getElementById('countTabPending');
    elements.countTabDone = document.getElementById('countTabDone');

    elements.btnDateToday = document.getElementById('btnDateToday');
    elements.btnDateTomorrow = document.getElementById('btnDateTomorrow');
    elements.btnDateAll = document.getElementById('btnDateAll');
    elements.inputCustomDate = document.getElementById('inputCustomDate');
    elements.statusTabs = document.querySelectorAll('.status-tab');
    elements.searchInput = document.getElementById('searchInput');
    elements.selectTracer = document.getElementById('selectTracer');
    elements.selectTestType = document.getElementById('selectTestType');
    elements.btnViewCards = document.getElementById('btnViewCards');
    elements.btnViewTable = document.getElementById('btnViewTable');
    elements.btnSyncPatients = document.getElementById('btnSyncPatients');

    elements.patientsGrid = document.getElementById('patientsGrid');
    elements.patientsTableWrap = document.getElementById('patientsTableWrap');
    elements.patientsTableBody = document.getElementById('patientsTableBody');
    elements.noPatientsMessage = document.getElementById('noPatientsMessage');
    elements.sectionTitleText = document.getElementById('sectionTitleText');
    elements.displayFilteredCount = document.getElementById('displayFilteredCount');

    // Modal Protocolo
    elements.protocolModalBackdrop = document.getElementById('protocolModalBackdrop');
    elements.btnCloseProtocolModal = document.getElementById('btnCloseProtocolModal');
    elements.btnCancelProtocol = document.getElementById('btnCancelProtocol');
    elements.btnSaveProtocol = document.getElementById('btnSaveProtocol');
    elements.btnPrintProtocolSheet = document.getElementById('btnPrintProtocolSheet');
    elements.btnViewVolanteFromModal = document.getElementById('btnViewVolanteFromModal');

    // Elementos del Modal
    elements.modalPatName = document.getElementById('modalPatName');
    elements.modalPatNHC = document.getElementById('modalPatNHC');
    elements.modalPatAge = document.getElementById('modalPatAge');
    elements.modalPatWeight = document.getElementById('modalPatWeight');
    elements.modalPatTracer = document.getElementById('modalPatTracer');
    elements.modalPatGlucose = document.getElementById('modalPatGlucose');

    elements.inputCustomUptake = document.getElementById('inputCustomUptake');
    elements.wrapCustomRange = document.getElementById('wrapCustomRange');
    elements.inputCustomRange = document.getElementById('inputCustomRange');
    elements.inputDiureticMinutes = document.getElementById('inputDiureticMinutes');
    elements.inputContrastBoxMinutes = document.getElementById('inputContrastBoxMinutes');

    elements.txtDoctorNotes = document.getElementById('txtDoctorNotes');
    elements.selectDoctorSign = document.getElementById('selectDoctorSign');
    elements.displaySignTimestamp = document.getElementById('displaySignTimestamp');

    // Modal Volante
    elements.volanteModalBackdrop = document.getElementById('volanteModalBackdrop');
    elements.btnCloseVolanteModal = document.getElementById('btnCloseVolanteModal');
    elements.btnCloseVolanteModalBtn = document.getElementById('btnCloseVolanteModalBtn');
    elements.btnPrintVolanteFromViewer = document.getElementById('btnPrintVolanteFromViewer');
    elements.volanteIframe = document.getElementById('volanteIframe');
    elements.volanteModalSubtitle = document.getElementById('volanteModalSubtitle');

    elements.toastContainer = document.getElementById('toastContainer');
  }

  // ==========================================================================
  // CARGA DE DATOS & INTEROPERABILIDAD
  // ==========================================================================
  function loadStoredProtocols() {
    try {
      const raw = localStorage.getItem('PET_MEDICAL_PROTOCOLS_V1');
      if (raw) {
        state.protocols = JSON.parse(raw) || {};
      }
    } catch (e) {
      console.warn('Error leyendo PET_MEDICAL_PROTOCOLS_V1:', e);
      state.protocols = {};
    }
  }

  function saveStoredProtocols() {
    try {
      localStorage.setItem('PET_MEDICAL_PROTOCOLS_V1', JSON.stringify(state.protocols));
      syncProtocolsToMasterDb();
    } catch (e) {
      console.warn('Error guardando PET_MEDICAL_PROTOCOLS_V1:', e);
    }
  }

  function syncProtocolsToMasterDb() {
    try {
      const rawMaster = localStorage.getItem('PET_DATABASE_MASTER_V4');
      if (rawMaster) {
        const masterList = JSON.parse(rawMaster);
        if (Array.isArray(masterList)) {
          let modified = false;
          masterList.forEach(item => {
            const key = item["Submission ID"] || item.id || item["NHC / Historia Clínica"] || item.nhc;
            if (key && state.protocols[key]) {
              item.protocoloMedico = state.protocols[key];
              modified = true;
            }
          });
          if (modified) {
            localStorage.setItem('PET_DATABASE_MASTER_V4', JSON.stringify(masterList));
          }
        }
      }
    } catch (e) {
      console.warn('Error sincronizando con PET_DATABASE_MASTER_V4:', e);
    }
  }

  async function loadPatientsData(forceFetch = false) {
    let rawList = [];

    // 1. Intentar consultar la API en vivo si hay servidor activo en la red
    try {
      const resApi = await fetch('/api/sync-database');
      if (resApi.ok) {
        const json = await resApi.json();
        const data = json.data || (Array.isArray(json) ? json : []);
        if (Array.isArray(data) && data.length > 0) {
          rawList = data;
        }
      }
    } catch (e) {}

    // 2. Si no hubo respuesta de API o es la primera carga, leer desde localStorage
    if (!rawList || rawList.length === 0) {
      try {
        const stored = localStorage.getItem('PET_DATABASE_MASTER_V4');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            rawList = parsed;
          }
        }
      } catch (e) {
        console.warn('Error leyendo PET_DATABASE_MASTER_V4:', e);
      }
    }

    // 3. Si no hay datos en localStorage o se fuerza refresco de red, cargar el JSON oficial
    if (!rawList || rawList.length === 0 || forceFetch) {
      try {
        const response = await fetch('../pet_ct_triage/web_app/peticiones_db.json?t=' + Date.now());
        if (response.ok) {
          const fetched = await response.json();
          if (Array.isArray(fetched) && fetched.length > 0) {
            if (rawList && rawList.length > 0) {
              const existingIds = new Set(rawList.map(p => p["Submission ID"] || p.id || p.nhc));
              fetched.forEach(item => {
                const id = item["Submission ID"] || item.id || item.nhc;
                if (!existingIds.has(id)) {
                  rawList.push(item);
                }
              });
            } else {
              rawList = fetched;
            }
          }
        }
      } catch (e) {
        console.warn('Error fetch peticiones_db.json:', e);
      }
    }

    // Persistir en localStorage
    if (rawList && rawList.length > 0) {
      try {
        localStorage.setItem('PET_DATABASE_MASTER_V4', JSON.stringify(rawList));
      } catch (e) {}
    }

    // 4. Normalizar pacientes para la consola médica
    state.allPatients = rawList.map((item, index) => normalizePatient(item, index));

    ensureDatesAndSlots(state.allPatients);
  }

  function normalizePatient(raw, index) {
    const subId = raw["Submission ID"] || raw.id || `sub_${index + 1000}`;
    const nhc = raw["NHC / Historia Clínica"] || raw.nhc || `NHC-${100000 + index}`;
    const nombre = raw["Nombre del Paciente"] || raw["Nombre y Apellidos"] || raw.nombre || `Paciente ${index + 1}`;
    const edad = parseInt(raw["Edad"] || raw.edad || 65, 10);
    const sexo = raw["Sexo"] || raw.sexo || "Varón";
    const peso = parseFloat(raw["Peso (kg)"] || raw.peso || 72);
    const talla = parseFloat(raw["Talla (cm)"] || raw.talla || 170);

    const diag = raw["Diagnóstico Clínico"] || raw["Motivo de Solicitud"] || raw.motivo || "Estudio Oncológico";
    const radiofarmaco = raw["Tipo de Estudio PET Solicitado"] || raw.radiofarmaco || "18F-FDG (Oncológico / Inflamatorio General)";
    const prioridad = raw["Carácter de la Petición"] || raw["Prioridad Calculada"] || raw.prioridad || "🟢 P3";
    const fechaCita = raw["Fecha Cita Asignada"] || raw.fechaCita || "2026-10-19";
    const horaCita = raw["Hora Cita Asignada"] || raw.horaCita || "08:30 h";

    // Alertas clínicas
    let isDiabetic = false;
    let glucemia = raw["Glucemia (mg/dL)"] || 95;
    const rawDiab = String(raw["¿Tiene Diabetes Mellitus?"] || '').toLowerCase();
    if (rawDiab.includes('sí') || rawDiab.includes('si') || glucemia >= 130) {
      isDiabetic = true;
    }

    const alergia = raw["Alergias Conocidas"] || "Ninguna";
    const contraindicacionContraste = raw["Contraindicación Contraste"] || "No";
    const movilidad = raw["Movilidad / Traslado"] || "Autónomo";

    const savedProto = state.protocols[subId] || state.protocols[nhc] || raw.protocoloMedico || null;

    return {
      id: subId,
      nhc: nhc,
      nombre: nombre,
      edad: edad,
      sexo: sexo,
      peso: peso,
      talla: talla,
      diagnostico: diag,
      radiofarmaco: radiofarmaco,
      prioridad: prioridad,
      fechaCita: fechaCita,
      horaCita: horaCita,
      isDiabetic: isDiabetic,
      glucemia: glucemia,
      alergia: alergia,
      contraindicacionContraste: contraindicacionContraste,
      movilidad: movilidad,
      protocoloMedico: savedProto,
      raw: raw
    };
  }

  function ensureDatesAndSlots(patients) {
    const todayStr = '2026-10-19';
    const tomorrowStr = '2026-10-20';

    patients.forEach((p, idx) => {
      if (!p.fechaCita || p.fechaCita === 'Pendiente de Triaje') {
        if (idx < 8) {
          p.fechaCita = todayStr;
          const startMin = 510 + (idx * 45); // desde las 08:30 h
          const h = Math.floor(startMin / 60);
          const m = startMin % 60;
          p.horaCita = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} h`;
        } else if (idx < 14) {
          p.fechaCita = tomorrowStr;
          const startMin = 510 + ((idx - 8) * 45);
          const h = Math.floor(startMin / 60);
          const m = startMin % 60;
          p.horaCita = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} h`;
        }
      }
    });
  }

  // ==========================================================================
  // FILTRADO Y ACTUALIZACIÓN DE VISTAS
  // ==========================================================================
  function applyFilters() {
    const todayStr = '2026-10-19';
    const tomorrowStr = '2026-10-20';

    state.filteredPatients = state.allPatients.filter(p => {
      // 1. Filtro por Fecha
      if (state.activeFilterDate === 'today') {
        if (p.fechaCita !== todayStr) return false;
      } else if (state.activeFilterDate === 'tomorrow') {
        if (p.fechaCita !== tomorrowStr) return false;
      } else if (state.activeFilterDate !== 'all') {
        if (p.fechaCita !== state.activeFilterDate) return false;
      }

      // 2. Filtro por Estado de Protocolo
      const isProtocolized = !!(p.protocoloMedico && p.protocoloMedico.completed);
      if (state.activeFilterStatus === 'pending' && isProtocolized) return false;
      if (state.activeFilterStatus === 'done' && !isProtocolized) return false;

      // 3. Filtro por Isótopo
      if (state.activeFilterTracer !== 'all') {
        const tracer = String(p.radiofarmaco).toLowerCase();
        const filterT = state.activeFilterTracer.toLowerCase();
        if (!tracer.includes(filterT)) return false;
      }

      // 4. Filtro por Tipo de Prueba / Rango
      if (state.activeFilterTestType && state.activeFilterTestType !== 'all') {
        const filterTT = state.activeFilterTestType;
        const assignedRange = p.protocoloMedico ? p.protocoloMedico.scanRange : '';
        const diag = String(p.diagnostico || '').toLowerCase();

        if (filterTT === 'cabeza_cuello') {
          const matchRange = assignedRange === 'cabeza_cuello_cuerpo';
          const matchDiag = diag.includes('cabeza') || diag.includes('cuello') || diag.includes('cavum') || diag.includes('laringe');
          if (!matchRange && !matchDiag) return false;
        } else if (filterTT === 'mmii') {
          const matchRange = assignedRange === 'mmii';
          const matchDiag = diag.includes('mmii') || diag.includes('pierna') || diag.includes('pie') || diag.includes('femur');
          if (!matchRange && !matchDiag) return false;
        } else if (filterTT === 'cuerpo_total') {
          const matchRange = assignedRange === 'cuerpo_total';
          const matchDiag = diag.includes('melanoma') || diag.includes('sarcoma') || diag.includes('mieloma');
          if (!matchRange && !matchDiag) return false;
        } else if (filterTT === 'cerebro') {
          const matchRange = assignedRange === 'cerebro';
          const matchDiag = diag.includes('cerebro') || diag.includes('demencia') || diag.includes('alzheimer');
          if (!matchRange && !matchDiag) return false;
        } else if (filterTT === 'base_craneo') {
          const matchRange = assignedRange === 'base_craneo_muslos' || !assignedRange;
          if (!matchRange) return false;
        }
      }

      // 5. Búsqueda por texto libre
      if (state.searchTerm) {
        const q = state.searchTerm.toLowerCase();
        const matchName = String(p.nombre).toLowerCase().includes(q);
        const matchNHC = String(p.nhc).toLowerCase().includes(q);
        const matchDiag = String(p.diagnostico).toLowerCase().includes(q);
        const matchServ = String(p.raw["Servicio Solicitante"] || '').toLowerCase();
        if (!matchName && !matchNHC && !matchDiag && !matchServ) return false;
      }

      return true;
    });

    // Ordenar por hora de cita
    state.filteredPatients.sort((a, b) => {
      const timeA = String(a.horaCita || '99:99').slice(0, 5);
      const timeB = String(b.horaCita || '99:99').slice(0, 5);
      return timeA.localeCompare(timeB);
    });
  }

  function render() {
    applyFilters();
    updateKpis();
    renderPatientList();
  }

  function updateKpis() {
    let setForKpis = state.allPatients;
    const todayStr = '2026-10-19';
    const tomorrowStr = '2026-10-20';

    if (state.activeFilterDate === 'today') {
      setForKpis = state.allPatients.filter(p => p.fechaCita === todayStr);
      elements.kpiFechaSub.textContent = 'Hoy: 19 de Octubre 2026';
      elements.sectionTitleText.textContent = 'Agenda de Pacientes Citados para Hoy (19/10/2026)';
    } else if (state.activeFilterDate === 'tomorrow') {
      setForKpis = state.allPatients.filter(p => p.fechaCita === tomorrowStr);
      elements.kpiFechaSub.textContent = 'Mañana: 20 de Octubre 2026';
      elements.sectionTitleText.textContent = 'Agenda de Pacientes Citados para Mañana (20/10/2026)';
    } else if (state.activeFilterDate === 'all') {
      elements.kpiFechaSub.textContent = 'Todos los registros históricos';
      elements.sectionTitleText.textContent = 'Agenda Global de Pacientes (Todos los días)';
    } else {
      setForKpis = state.allPatients.filter(p => p.fechaCita === state.activeFilterDate);
      elements.kpiFechaSub.textContent = `Fecha: ${state.activeFilterDate}`;
      elements.sectionTitleText.textContent = `Agenda de Pacientes Citados (${state.activeFilterDate})`;
    }

    const total = setForKpis.length;
    let pending = 0;
    let done = 0;
    let alerts = 0;

    setForKpis.forEach(p => {
      const isDone = !!(p.protocoloMedico && p.protocoloMedico.completed);
      if (isDone) done++; else pending++;

      if (p.isDiabetic || p.alergia !== 'Ninguna' || p.contraindicacionContraste === 'Sí' || p.movilidad !== 'Autónomo') {
        alerts++;
      }
    });

    elements.kpiTotalCitados.textContent = total;
    elements.kpiPendientes.textContent = pending;
    elements.kpiProtocolizados.textContent = done;
    elements.kpiAlertas.textContent = alerts;

    elements.countTabAll.textContent = total;
    elements.countTabPending.textContent = pending;
    elements.countTabDone.textContent = done;

    elements.displayFilteredCount.textContent = `${state.filteredPatients.length} pacientes mostrados`;
  }

  function renderPatientList() {
    if (state.filteredPatients.length === 0) {
      elements.patientsGrid.style.display = 'none';
      elements.patientsTableWrap.style.display = 'none';
      elements.noPatientsMessage.style.display = 'block';
      return;
    }

    elements.noPatientsMessage.style.display = 'none';

    if (state.currentView === 'cards') {
      elements.patientsGrid.style.display = 'grid';
      elements.patientsTableWrap.style.display = 'none';
      renderCardsView();
    } else {
      elements.patientsGrid.style.display = 'none';
      elements.patientsTableWrap.style.display = 'block';
      renderTableView();
    }
  }

  function renderCardsView() {
    elements.patientsGrid.innerHTML = state.filteredPatients.map(p => {
      const isDone = !!(p.protocoloMedico && p.protocoloMedico.completed);
      const prioClass = getPriorityClass(p.prioridad);

      // Chips del protocolo
      let protocolHtml = '';
      if (isDone) {
        const proto = p.protocoloMedico;
        const medsSummary = getMedicationsBadgeList(proto);

        protocolHtml = `
          <div class="protocol-status-box is-done">
            <div class="protocol-header-status">
              <span class="status-label-badge done">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                Protocolizado Oficial
              </span>
              <span style="font-size:0.7rem; color:var(--text-muted); font-weight:600;">${proto.doctorName || 'Dr. M. Gómez'}</span>
            </div>
            <div class="protocol-summary-chips">
              <span class="proto-chip">⏱️ ${proto.uptakeTime || 60} min máquina</span>
              <span class="proto-chip">🙆‍♂️ ${getArmsShort(proto.armsPosition)}</span>
              <span class="proto-chip">📐 ${getRangeShort(proto.scanRange)}</span>
              <span class="proto-chip">💧 ${getHydrationShort(proto.hydration)}</span>
              <span class="proto-chip">⚡ ${getDiureticShort(proto)}</span>
              <span class="proto-chip">☢️ ${getContrastShort(proto)}</span>
            </div>
            ${medsSummary ? `
              <div style="margin-top:5px; font-size:0.7rem; color:#0369a1; font-weight:700; background:#ffffff; border:1px dashed #bae6fd; border-radius:4px; padding:3px 6px;">
                💊 <strong>Medicación Previa:</strong> ${medsSummary}
              </div>
            ` : ''}
          </div>
        `;
      } else {
        protocolHtml = `
          <div class="protocol-status-box">
            <div class="protocol-header-status">
              <span class="status-label-badge pending">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Pendiente de Protocolizar
              </span>
              <span style="font-size:0.7rem; color:var(--protocol-pending); font-weight:700;">Sin pauta médica</span>
            </div>
            <p style="font-size: 0.74rem; color: var(--text-secondary); margin-top: 2px;">
              El técnico requiere validar posición de brazos, tipo de prueba, diurético o contraste 15 min antes.
            </p>
          </div>
        `;
      }

      // Badges de alerta
      let alertsHtml = '';
      if (p.isDiabetic) {
        alertsHtml += `<span class="clinical-alert-tag alert-diabetes">⚠️ Diabético (${p.glucemia} mg/dL)</span>`;
      }
      if (p.contraindicacionContraste === 'Sí' || (p.alergia && p.alergia.toLowerCase().includes('yodo'))) {
        alertsHtml += `<span class="clinical-alert-tag alert-allergy">⚠️ Alergia Contraste</span>`;
      }
      if (p.movilidad && p.movilidad !== 'Autónomo') {
        alertsHtml += `<span class="clinical-alert-tag alert-mobility">🦽 ${escapeHTML(p.movilidad)}</span>`;
      }

      return `
        <article class="patient-card ${prioClass}">
          <div>
            <div class="card-top-meta">
              <span class="time-slot-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                ${escapeHTML(p.horaCita)}
              </span>
              <span class="priority-pill ${prioClass}">${escapeHTML(p.prioridad)}</span>
            </div>

            <div class="patient-identity">
              <h3 class="patient-name">${escapeHTML(p.nombre)}</h3>
              <div class="patient-demographics">
                <span class="nhc-tag">${escapeHTML(p.nhc)}</span>
                <span>${p.edad} años</span>
                <span>•</span>
                <span>${escapeHTML(p.sexo)}</span>
                <span>•</span>
                <span>${p.peso} kg (${p.talla} cm)</span>
              </div>
            </div>

            <div class="clinical-badge-row">
              <span class="tracer-tag">🧪 ${escapeHTML(p.radiofarmaco)}</span>
              ${alertsHtml}
            </div>

            <div class="patient-diagnosis-box">
              <div class="diag-title">Diagnóstico Clínico / Sospecha:</div>
              <div class="diag-text">${escapeHTML(p.diagnostico)}</div>
            </div>

            ${protocolHtml}
          </div>

          <div class="card-actions-row">
            <button class="btn-card btn-card-volante" onclick="window.consolaApp.openVolanteModal('${p.id}')">
              📄 Volante Petición
            </button>
            <button class="btn-card btn-card-protocol ${isDone ? 'is-edit' : ''}" onclick="window.consolaApp.openProtocolModal('${p.id}')">
              ${isDone ? '✏️ Editar Pauta' : '🩺 Protocolizar'}
            </button>
          </div>
        </article>
      `;
    }).join('');
  }

  function renderTableView() {
    elements.patientsTableBody.innerHTML = state.filteredPatients.map(p => {
      const isDone = !!(p.protocoloMedico && p.protocoloMedico.completed);
      const prioClass = getPriorityClass(p.prioridad);

      let statusBadge = isDone
        ? `<span style="display:inline-flex; align-items:center; gap:4px; font-weight:700; color:var(--sergas-navy); font-size:0.76rem; background:var(--protocol-ready-bg); padding:3px 8px; border-radius:6px; border:1px solid var(--sergas-light-border);">
             ✅ Listo (${p.protocoloMedico.uptakeTime || 60}m | ${getArmsShort(p.protocoloMedico.armsPosition)} | ${getRangeShort(p.protocoloMedico.scanRange)})
           </span>`
        : `<span style="display:inline-flex; align-items:center; gap:4px; font-weight:700; color:var(--protocol-pending); font-size:0.76rem; background:var(--protocol-pending-bg); padding:3px 8px; border-radius:6px; border:1px dashed var(--protocol-pending);">
             ⏳ Pendiente
           </span>`;

      let alertsShort = [];
      if (p.isDiabetic) alertsShort.push(`💉 Diabético`);
      if (p.contraindicacionContraste === 'Sí') alertsShort.push(`⚠️ Contraste`);
      if (p.movilidad !== 'Autónomo') alertsShort.push(`🦽 ${p.movilidad}`);

      return `
        <tr>
          <td><strong style="color:var(--sergas-navy);">${escapeHTML(p.horaCita)}</strong></td>
          <td>
            <div style="font-weight:700; color:var(--text-main);">${escapeHTML(p.nombre)}</div>
            <div style="font-size:0.75rem; color:var(--text-muted); font-family:'JetBrains Mono',monospace;">${escapeHTML(p.nhc)}</div>
          </td>
          <td style="font-size:0.8rem; color:var(--text-secondary);">
            ${p.edad}a · ${escapeHTML(p.sexo)}<br>${p.peso}kg / ${p.talla}cm
          </td>
          <td><span class="tracer-tag" style="font-size:0.7rem;">${escapeHTML(p.radiofarmaco)}</span></td>
          <td style="max-width:260px; font-size:0.82rem; line-height:1.3;">${escapeHTML(p.diagnostico)}</td>
          <td><span class="priority-pill ${prioClass}" style="font-size:0.68rem;">${escapeHTML(p.prioridad)}</span></td>
          <td style="font-size:0.72rem; color:var(--text-secondary);">${alertsShort.join(', ') || 'Normal'}</td>
          <td>${statusBadge}</td>
          <td style="text-align: right; white-space:nowrap;">
            <button class="btn-card btn-card-volante" style="display:inline-flex; padding:4px 8px; font-size:0.75rem; margin-right:4px;" onclick="window.consolaApp.openVolanteModal('${p.id}')">
              📄 Volante
            </button>
            <button class="btn-card btn-card-protocol ${isDone ? 'is-edit' : ''}" style="display:inline-flex; padding:4px 10px; font-size:0.75rem;" onclick="window.consolaApp.openProtocolModal('${p.id}')">
              ${isDone ? '✏️ Editar' : '🩺 Protocolizar'}
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // ==========================================================================
  // MANIPULACIÓN DEL MODAL DE PROTOCOLIZACIÓN
  // ==========================================================================
  function openProtocolModal(patientId) {
    try {
      const patient = state.allPatients.find(p => p.id === patientId || p.nhc === patientId);
      if (!patient) return;

      state.selectedPatient = patient;

    // Rellenar cabecera del modal
    elements.modalPatName.textContent = patient.nombre;
    elements.modalPatNHC.textContent = patient.nhc;
    elements.modalPatAge.textContent = `${patient.edad} años (${patient.sexo})`;
    elements.modalPatWeight.textContent = `${patient.peso} kg / ${patient.talla} cm`;
    elements.modalPatTracer.textContent = patient.radiofarmaco;
    elements.modalPatGlucose.textContent = `${patient.glucemia} mg/dL ${patient.isDiabetic ? '(Diabético)' : ''}`;

    // Obtener protocolo existente o recomendaciones clínicas inteligentes por defecto
    const existing = patient.protocoloMedico || getSmartDefaultProtocol(patient);
    state.editingProtocol = { ...existing };

    // Cargar valores en los controles
    setRadioOption('uptake', existing.uptakeTime || '60');
    if (['60', '90', '120', '45'].includes(String(existing.uptakeTime))) {
      elements.inputCustomUptake.value = '';
    } else {
      elements.inputCustomUptake.value = existing.uptakeTime || '';
    }

    // Sanitizar brazos si procedía de una opción asimétrica eliminada
    let armsVal = existing.armsPosition || 'arriba';
    if (armsVal === 'der_arriba_izq_abajo' || armsVal === 'izq_arriba_der_abajo') {
      armsVal = 'arriba';
    }
    setRadioOption('arms', armsVal);

    // Sanitizar rango si procedía de torax_4d o columna eliminados
    let rangeVal = existing.scanRange || 'base_craneo_muslos';
    if (rangeVal === 'torax_4d' || rangeVal === 'columna') {
      rangeVal = 'base_craneo_muslos';
    }
    setRadioOption('range', rangeVal);

    if (rangeVal === 'otro_rango') {
      elements.wrapCustomRange.style.display = 'flex';
      elements.inputCustomRange.value = existing.customRangeDetails || '';
    } else {
      elements.wrapCustomRange.style.display = 'none';
      elements.inputCustomRange.value = '';
    }

    // 3. Hidratación en box (box_si vs box_no)
    let hydVal = 'box_si';
    if (existing.hydration === 'box_no' || existing.hydration === 'restriccion' || existing.hydration === 'ayuno') {
      hydVal = 'box_no';
    }
    setRadioOption('hydration', hydVal);

    // 4. Medicación (Solo Diurético Post-Inyección) y Contraste (En máquina / IV en box / Sin contraste)
    // A) Diurético (Furosemida / Seguril 20 mg)
    let diurVal = 'no';
    if (existing.diuretic === 'si_20mg_post' || existing.diuretic === 'diur_post' || existing.diuretic === 'si_15min_antes' || existing.diuretic === 'diur_si') {
      diurVal = 'si_20mg_post';
    }
    setRadioOption('diuretic', diurVal);

    // B) Protocolo de Contraste: en_maquina, en_box, sin_contraste
    let contrastVal = 'sin_contraste';
    if (existing.contrastType === 'en_maquina' || existing.contrast === 'en_maquina' || existing.contrastGantry === 'civ_portal' || existing.contrast === 'civ_portal') {
      contrastVal = 'en_maquina';
    } else if (existing.contrastType === 'en_box' || existing.contrast === 'en_box' || existing.contrastPre === 'oral_gastrografin' || existing.contrastPre === 'oral_agua' || existing.contrast === 'oral_gastrografin_15min') {
      contrastVal = 'en_box';
    } else {
      contrastVal = 'sin_contraste';
    }
    setRadioOption('contrast', contrastVal);
    if (elements.inputContrastBoxMinutes) {
      elements.inputContrastBoxMinutes.value = existing.contrastBoxMinutes || existing.contrastPreMinutes || '15';
    }

    if (elements.txtDoctorNotes) elements.txtDoctorNotes.value = existing.doctorNotes || '';

    if (existing.doctorSign && elements.selectDoctorSign) {
      elements.selectDoctorSign.value = existing.doctorSign;
    }
    if (elements.displaySignTimestamp) {
      elements.displaySignTimestamp.value = existing.timestamp || formatCurrentDateTime();
    }

    // Abrir backdrop
    if (elements.protocolModalBackdrop) {
      elements.protocolModalBackdrop.classList.add('open');
    }
    document.body.style.overflow = 'hidden';

    // Resetear posición de scroll y pestaña activa a sección 1
    const modalBody = document.getElementById('protocolModalBody');
    if (modalBody) modalBody.scrollTop = 0;
    updateActiveNavTab('sectionUptake');
  } catch (err) {
    console.error('Error al abrir modal de protocolo:', err);
  }
  }

  function closeProtocolModal() {
    elements.protocolModalBackdrop.classList.remove('open');
    document.body.style.overflow = '';
    state.selectedPatient = null;
    state.editingProtocol = null;
  }

  /**
   * Genera recomendaciones clínicas automáticas basadas en trazador y patología
   */
  function getSmartDefaultProtocol(p) {
    const diag = String(p.diagnostico || '').toLowerCase();
    const tracer = String(p.radiofarmaco || '').toLowerCase();

    let defUptake = '60';
    let defArms = 'arriba';
    let defRange = 'base_craneo_muslos';
    let defHydration = 'box_si';
    let defDiuretic = 'no';
    let defContrastType = 'sin_contraste';
    let defContrastBoxMinutes = 15;
    let doctorNotes = '';

    // Cabeza y Cuello / Otorrino / Cavum -> Cabeza-Cuello + Cuerpo Entero con Brazos Abajo
    if (diag.includes('cabeza') || diag.includes('cuello') || diag.includes('laringe') || diag.includes('cavum') || diag.includes('lengua') || diag.includes('amigdala')) {
      defArms = 'abajo';
      defRange = 'cabeza_cuello_cuerpo';
      doctorNotes += 'Protocolo Cabeza y Cuello + Cuerpo Entero: Adquisición combinada en 2 fases con brazos abajo en 1ª fase para evitar artefactos en cadenas ganglionares. ';
    }

    // MMII / Miembros inferiores / extremidades
    if (diag.includes('mmii') || diag.includes('pierna') || diag.includes('pie') || diag.includes('femur') || diag.includes('tibia')) {
      defRange = 'mmii';
      defArms = 'abdominal';
      doctorNotes += 'Protocolo MMII: Adquisición dedicada a extremidades inferiores. ';
    }

    // Próstata (PSMA o Colina) -> Uptake 45m, Furosemida 20mg IV post-inyección, Hidratación en box
    if (tracer.includes('psma') || tracer.includes('colina') || diag.includes('prostata')) {
      defUptake = '45';
      defDiuretic = 'si_20mg_post';
      defHydration = 'box_si';
      doctorNotes += 'Protocolo prostático: Administrar 20 mg Furosemida IV post-inyección. Vaciar vejiga justo antes de camilla. ';
    }

    // Melanoma o Sarcomas -> Cuerpo total extendido (vértice a pies)
    if (diag.includes('melanoma') || diag.includes('sarcoma') || diag.includes('mieloma')) {
      defRange = 'cuerpo_total';
      doctorNotes += 'Protocolo Cuerpo Total extendido (vértice craneal hasta plantas de los pies). ';
    }

    // Carcinomatosis peritoneal -> Contraste IV en Box 15 min antes
    if (diag.includes('carcinomatosis') || diag.includes('peritone') || diag.includes('ovario') || diag.includes('colon')) {
      defContrastType = 'en_box';
      defContrastBoxMinutes = 15;
      doctorNotes += 'Contraste IV en box 15 min antes de la prueba. ';
    }

    // Endocarditis / Infección -> 90 min uptake
    if (diag.includes('endocarditis') || diag.includes('infeccion') || diag.includes('vasculitis')) {
      defUptake = '90';
      doctorNotes += 'Protocolo inflamatorio/infeccioso: 90 min de captación para aclaramiento de pool vascular. ';
    }

    // Si tiene indicación de contraste intravenoso diagnóstico en PET CT
    if (diag.includes('hepato') || diag.includes('pancreas') || diag.includes('recidiva vascular')) {
      defContrastType = 'en_maquina';
      doctorNotes += 'Contraste iodado en máquina (fase portal en gantry). ';
    }

    // Contraindicación contraste
    if (p.contraindicacionContraste === 'Sí' || (p.alergia && p.alergia.toLowerCase().includes('yodo'))) {
      defContrastType = 'sin_contraste';
      doctorNotes += 'Contraindicación formal para contraste iodado IV (Alergia conocida / FG < 30). Solo Low-Dose CT en camilla. ';
    }

    return {
      uptakeTime: defUptake,
      armsPosition: defArms,
      scanRange: defRange,
      customRangeDetails: '',
      hydration: defHydration,
      diuretic: defDiuretic,
      contrastType: defContrastType,
      contrastBoxMinutes: defContrastBoxMinutes,
      // Retrocompatibilidad con vistas previas y hojas TSID
      contrast: defContrastType === 'en_maquina' ? 'civ_portal' : (defContrastType === 'en_box' ? 'oral_gastrografin_15min' : 'baja_dosis'),
      contrastGantry: defContrastType === 'en_maquina' ? 'civ_portal' : 'baja_dosis',
      contrastPre: defContrastType === 'en_box' ? 'oral_gastrografin' : 'sin_oral',
      contrastPreMinutes: defContrastBoxMinutes,
      doctorNotes: doctorNotes.trim(),
      doctorSign: 'Dr. Manuel Gómez Feijóo (Col. 36/08421)',
      timestamp: formatCurrentDateTime()
    };
  }

  function saveProtocolFromModal() {
    if (!state.selectedPatient) return;

    let uptake = getSelectedRadioValue('radioUptake') || '60';
    const customUptake = elements.inputCustomUptake ? elements.inputCustomUptake.value.trim() : '';
    if (customUptake && parseInt(customUptake, 10) > 0) {
      uptake = customUptake;
    }

    const arms = getSelectedRadioValue('radioArms') || 'arriba';
    const range = getSelectedRadioValue('radioRange') || 'base_craneo_muslos';
    const customRangeDetails = elements.inputCustomRange ? elements.inputCustomRange.value.trim() : '';
    const hydration = getSelectedRadioValue('radioHydration') || 'box_si';

    // Diurético (Solo post-inyección o no diurético)
    const diuretic = getSelectedRadioValue('radioDiuretic') || 'no';

    // Contraste: en máquina, IV en box con minutos o sin contraste
    const contrastType = getSelectedRadioValue('radioContrast') || 'sin_contraste';
    const contrastBoxMinutes = elements.inputContrastBoxMinutes ? (parseInt(elements.inputContrastBoxMinutes.value, 10) || 15) : 15;

    const doctorSign = elements.selectDoctorSign ? elements.selectDoctorSign.value : 'Dr. Manuel Gómez Feijóo (Col. 36/08421)';
    const notes = elements.txtDoctorNotes ? elements.txtDoctorNotes.value.trim() : '';
    const timestamp = formatCurrentDateTime();

    const protocolObj = {
      completed: true,
      patientId: state.selectedPatient.id,
      patientNHC: state.selectedPatient.nhc,
      patientName: state.selectedPatient.nombre,
      uptakeTime: uptake,
      armsPosition: arms,
      scanRange: range,
      customRangeDetails: customRangeDetails,
      hydration: hydration,
      diuretic: diuretic,
      contrastType: contrastType,
      contrastBoxMinutes: contrastBoxMinutes,
      // Retrocompatibilidad con otros módulos y sistemas
      contrast: contrastType === 'en_maquina' ? 'civ_portal' : (contrastType === 'en_box' ? 'oral_gastrografin_15min' : 'baja_dosis'),
      contrastGantry: contrastType === 'en_maquina' ? 'civ_portal' : 'baja_dosis',
      contrastPre: contrastType === 'en_box' ? 'oral_gastrografin' : 'sin_oral',
      contrastPreMinutes: contrastBoxMinutes,
      doctorNotes: notes,
      doctorSign: doctorSign,
      doctorName: doctorSign.split('(')[0].trim(),
      timestamp: timestamp
    };

    state.protocols[state.selectedPatient.id] = protocolObj;
    state.protocols[state.selectedPatient.nhc] = protocolObj;
    state.selectedPatient.protocoloMedico = protocolObj;

    saveStoredProtocols();

    showToast(`✅ Protocolo médico validado para ${state.selectedPatient.nombre}`, 'success');
    closeProtocolModal();
    render();
  }

  // ==========================================================================
  // MODAL DEL VOLANTE DE PETICIÓN
  // ==========================================================================
  function openVolanteModal(patientId) {
    const patient = state.allPatients.find(p => p.id === patientId || p.nhc === patientId);
    if (!patient) return;

    state.selectedPatient = patient;
    elements.volanteModalSubtitle.textContent = `Paciente: ${patient.nombre} (${patient.nhc}) · Estudio: ${patient.radiofarmaco}`;

    const volanteHtml = generatePatientVolanteHtml(patient, false);
    elements.volanteIframe.srcdoc = volanteHtml;

    elements.volanteModalBackdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeVolanteModal() {
    elements.volanteModalBackdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  function printVolanteFromViewer() {
    if (elements.volanteIframe && elements.volanteIframe.contentWindow) {
      elements.volanteIframe.contentWindow.focus();
      elements.volanteIframe.contentWindow.print();
    }
  }

  // ==========================================================================
  // IMPRESIÓN DE LA HOJA TÉCNICA DEL TSID
  // ==========================================================================
  function printProtocolSheet() {
    if (!state.selectedPatient) return;
    const p = state.selectedPatient;
    const proto = state.selectedPatient.protocoloMedico || getSmartDefaultProtocol(p);

    const sheetHtml = generateProtocolSheetHtml(p, proto);
    const printWin = window.open('', '_blank', 'width=900,height=950');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(sheetHtml);
      printWin.document.close();
      printWin.focus();
    } else {
      showToast('Por favor, permita ventanas emergentes para imprimir la hoja técnica', 'warning');
    }
  }

  // ==========================================================================
  // GENERADOR DEL VOLANTE OFICIAL DE PETICIÓN (SERGAS · GALARIA)
  // ==========================================================================
  function generatePatientVolanteHtml(p, autoPrint = false) {
    if (!p) return '';
    const raw = p.raw || p;

    const subId = p.id || raw["Submission ID"] || "sub_0000";
    const idClean = String(subId).replace("sub_", "").replace("REQ-", "");

    const nombre = raw["Nombre del Paciente"] || raw["Nombre y Apellidos"] || p.nombre || "--";
    const nhc = raw["NHC / Historia Clínica"] || p.nhc || idClean || "--";
    const edad = raw["Edad"] || p.edad || "65";
    const sexo = raw["Sexo"] || p.sexo || "Varón";
    const peso = raw["Peso (kg)"] || p.peso || "74";
    const talla = raw["Talla (cm)"] || p.talla || "172";
    const movilidad = raw["Movilidad / Traslado"] || p.movilidad || "Autónomo";
    const sedacion = raw["¿Precisa sedación?"] || "No";

    let diabetes = p.isDiabetic ? 'Sí (Diabético)' : (raw["¿Tiene Diabetes Mellitus?"] || 'No');
    let glucemia = p.glucemia || raw["Glucemia (mg/dL)"] || (p.isDiabetic ? '142' : '98');

    const ingresado = raw["¿El paciente está ingresado?"] || "No (Ambulatorio)";
    const medico = raw["Médico Solicitante"] || "Dr. Fernando García";
    const servicio = raw["Servicio Solicitante"] || "Oncología Médica";
    const proxConsulta = raw["Fecha Próxima Consulta"] || "23/10/2026 (Comité de Tumores)";
    const fechaSol = raw["Fecha Solicitud"] || "15/10/2026";

    const estudio = p.radiofarmaco || raw["Tipo de Estudio PET Solicitado"] || "18F-FDG (Oncológico / Inflamatorio General)";
    const prioridad = p.prioridad || raw["Carácter de la Petición"] || "🟢 P3 - Ordinario";
    const diag = p.diagnostico || raw["Diagnóstico Clínico"] || "Estudio PET/CT Oncológico";
    const resumen = raw["Resumen Clínico"] || "Estudio PET/CT solicitado para estadificación, valoración de extensión y respuesta terapéutica según protocolo asistencial SERGAS.";

    const alergias = p.alergia || raw["Alergias Conocidas"] || "Ninguna";
    const contraste = p.contraindicacionContraste || raw["Contraindicación Contraste"] || "No";
    const metal = raw["Portador Objetos Metálicos"] || "No";

    const fechaCita = p.fechaCita || raw["Fecha Cita Asignada"] || "19/10/2026";
    const horaCita = p.horaCita || raw["Hora Cita Asignada"] || "08:30 h";

    let protocolSection = '';
    if (p.protocoloMedico && p.protocoloMedico.completed) {
      const pr = p.protocoloMedico;
      const medsBadgeList = getMedicationsBadgeList(pr);

      protocolSection = `
        <div style="margin-top: 18px; border: 2px solid #007eb4; border-radius: 6px; padding: 14px; background: #f0f9ff;">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1.5px solid #007eb4; padding-bottom:6px; margin-bottom:10px;">
            <strong style="color:#004868; font-size:13px; text-transform:uppercase;">🩺 Protocolización Oficial de Adquisición (Validada en Medicina Nuclear)</strong>
            <span style="font-size:11px; color:#007eb4; font-weight:700;">${escapeHTML(pr.timestamp || '')}</span>
          </div>
          <table style="width:100%; border-collapse:collapse; font-size:11.5px;">
            <tr>
              <td style="padding:4px; width:25%;"><strong>⏱️ Tiempo a Máquina:</strong> ${escapeHTML(pr.uptakeTime)} min</td>
              <td style="padding:4px; width:25%;"><strong>🙆‍♂️ Posición Brazos:</strong> ${getArmsLabel(pr.armsPosition)}</td>
              <td style="padding:4px; width:25%;"><strong>📐 Rango / Tipo Prueba:</strong> ${getRangeLabel(pr.scanRange)}</td>
              <td style="padding:4px; width:25%;"><strong>💧 Hidratación Previa:</strong> ${getHydrationLabel(pr.hydration)}</td>
            </tr>
            <tr>
              <td style="padding:4px;" colspan="2"><strong>⚡ Diurético (Furosemida):</strong> ${getDiureticLabel(pr)}</td>
              <td style="padding:4px;" colspan="2"><strong>☢️ Protocolo de Contraste:</strong> ${getContrastLabel(pr)}</td>
            </tr>
            ${medsBadgeList ? `<tr><td style="padding:4px;" colspan="4"><strong>💊 Medicación Opcional Validada:</strong> ${medsBadgeList}</td></tr>` : ''}
            ${pr.doctorNotes ? `<tr><td style="padding:4px;" colspan="4"><strong>📝 Notas Facultativas para TSID:</strong> ${escapeHTML(pr.doctorNotes)}</td></tr>` : ''}
            <tr>
              <td style="padding:4px; padding-top:8px;" colspan="4">
                <strong>👨‍⚕️ Facultativo Validador:</strong> ${escapeHTML(pr.doctorSign || pr.doctorName || 'Dr. Manuel Gómez Feijóo')}
              </td>
            </tr>
          </table>
        </div>
      `;
    }

    const scriptPrintTag = autoPrint ? `<script>window.addEventListener('load', function() { setTimeout(function(){ window.print(); }, 250); });<` + `/script>` : '';

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Volante Oficial PET/CT - ${escapeHTML(nombre)} (${escapeHTML(nhc)})</title>
  <style>
    @page { size: A4 portrait; margin: 10mm 14mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #f1f5f9;
      margin: 0;
      padding: 16px;
    }
    .action-bar {
      max-width: 900px;
      margin: 0 auto 12px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #004868;
      color: white;
      padding: 10px 18px;
      border-radius: 8px;
    }
    .btn-print {
      background: #007eb4;
      color: white;
      border: none;
      padding: 7px 14px;
      border-radius: 6px;
      font-weight: 700;
      cursor: pointer;
      font-size: 13px;
    }
    .official-sheet {
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      border: 2px solid #004868;
      border-radius: 8px;
      padding: 24px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.08);
    }
    .sheet-header-box {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #004868;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .sheet-hospital-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .sheet-hospital-info img {
      height: 48px;
      object-fit: contain;
    }
    .sheet-title-badge {
      text-align: right;
    }
    .sheet-title-badge h1 {
      margin: 0;
      font-size: 15px;
      color: #004868;
      font-weight: 800;
    }
    .sheet-section {
      margin-bottom: 14px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
    }
    .sheet-section-header {
      background: #f8fafc;
      padding: 6px 12px;
      font-weight: 800;
      font-size: 12px;
      color: #004868;
      border-bottom: 1px solid #cbd5e1;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .sheet-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    .sheet-table td {
      padding: 6px 10px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: top;
    }
    .field-lbl {
      color: #64748b;
      font-size: 11px;
      display: block;
      margin-bottom: 2px;
      font-weight: 600;
    }
    .field-val {
      color: #0f172a;
      font-weight: 700;
    }
    .signature-area {
      display: flex;
      justify-content: space-between;
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px dashed #cbd5e1;
      font-size: 11px;
      color: #475569;
    }
    @media print {
      body { background: white; padding: 0; }
      .action-bar { display: none !important; }
      .official-sheet { border: 1px solid #000; box-shadow: none; border-radius: 0; padding: 10px; }
    }
  </style>
</head>
<body>
  <div class="action-bar">
    <div><strong>SERGAS · Galaria</strong> | Volante de Petición Oficial PET/CT</div>
    <button class="btn-print" onclick="window.print()">🖨️ Imprimir Volante</button>
  </div>

  <div class="official-sheet">
    <div class="sheet-header-box">
      <div class="sheet-hospital-info">
        <img src="galaria_logo.jpg" alt="Galaria">
        <div>
          <h2 style="margin:0; font-size:14px; color:#004868; font-weight:800;">XUNTA DE GALICIA · CONSELLERÍA DE SANIDADE</h2>
          <p style="margin:2px 0 0 0; font-size:11px; color:#475569;">GALARIA · SERVIZO GALEGO DE SAÚDE (SERGAS) — MEDICINA NUCLEAR</p>
        </div>
      </div>
      <div class="sheet-title-badge">
        <h1>VOLANTE DE PETICIÓN CLÍNICA PET/CT</h1>
        <div style="font-family:'JetBrains Mono',monospace; font-size:11px; color:#007eb4; font-weight:700; margin-top:3px;">
          REF: ${escapeHTML(subId)}
        </div>
      </div>
    </div>

    <!-- 1. IDENTIFICACIÓN DO PACIENTE -->
    <div class="sheet-section">
      <div class="sheet-section-header">1. Identificación do Paciente e Parámetros Físicos</div>
      <table class="sheet-table">
        <tr>
          <td style="width: 35%;">
            <span class="field-lbl">Nome e Apelidos:</span>
            <span class="field-val" style="font-size: 13px; color:#004868;">${escapeHTML(nombre)}</span>
          </td>
          <td style="width: 25%;">
            <span class="field-lbl">NHC / Nº Historia:</span>
            <span class="field-val" style="font-family: monospace; font-size: 13px;">${escapeHTML(nhc)}</span>
          </td>
          <td style="width: 20%;">
            <span class="field-lbl">Idade / Sexo:</span>
            <span class="field-val">${escapeHTML(edad)} anos / ${escapeHTML(sexo)}</span>
          </td>
          <td style="width: 20%;">
            <span class="field-lbl">Peso e Talla:</span>
            <span class="field-val">${escapeHTML(peso)} kg (${escapeHTML(talla)} cm)</span>
          </td>
        </tr>
        <tr>
          <td>
            <span class="field-lbl">Mobilidade / Traslado:</span>
            <span class="field-val">${escapeHTML(movilidad)}</span>
          </td>
          <td>
            <span class="field-lbl">Precisa Sedación:</span>
            <span class="field-val">${escapeHTML(sedacion)}</span>
          </td>
          <td>
            <span class="field-lbl">¿Está Ingresado?:</span>
            <span class="field-val">${escapeHTML(ingresado)}</span>
          </td>
          <td>
            <span class="field-lbl">Glicemia Basal:</span>
            <span class="field-val" style="color: ${p.isDiabetic ? '#dc2626' : '#0f172a'};">
              ${escapeHTML(glucemia)} mg/dL (${escapeHTML(diabetes)})
            </span>
          </td>
        </tr>
      </table>
    </div>

    <!-- 2. DATOS DA SOLICITUDE E CITA -->
    <div class="sheet-section">
      <div class="sheet-section-header">2. Servizo Solicitante e Citación Asignada</div>
      <table class="sheet-table">
        <tr>
          <td style="width: 30%;">
            <span class="field-lbl">Servizo Prescritor:</span>
            <span class="field-val">${escapeHTML(servicio)}</span>
          </td>
          <td style="width: 30%;">
            <span class="field-lbl">Facultativo Solicitante:</span>
            <span class="field-val">${escapeHTML(medico)}</span>
          </td>
          <td style="width: 20%;">
            <span class="field-lbl">Data da Solicitude:</span>
            <span class="field-val">${escapeHTML(fechaSol)}</span>
          </td>
          <td style="width: 20%;">
            <span class="field-lbl">Prioridade:</span>
            <span class="field-val">${escapeHTML(prioridad)}</span>
          </td>
        </tr>
        <tr style="background: #f0fdf4;">
          <td colspan="2">
            <span class="field-lbl">Cita Asignada no PET/CT:</span>
            <span class="field-val" style="color:#059669; font-size:13px;">📅 ${escapeHTML(fechaCita)} ás ${escapeHTML(horaCita)}</span>
          </td>
          <td colspan="2">
            <span class="field-lbl">Próxima Consulta / Comité:</span>
            <span class="field-val">${escapeHTML(proxConsulta)}</span>
          </td>
        </tr>
      </table>
    </div>

    <!-- 3. MOTIVO CLÍNICO E ESTUDO SOLICITADO -->
    <div class="sheet-section">
      <div class="sheet-section-header">3. Tipo de Estudo PET/CT e Xustificación Diagnóstica</div>
      <table class="sheet-table">
        <tr>
          <td colspan="2">
            <span class="field-lbl">Radiofármaco e Protocolo Solicitado:</span>
            <span class="field-val" style="color:#004868; font-size:13px;">${escapeHTML(estudio)}</span>
          </td>
        </tr>
        <tr>
          <td colspan="2">
            <span class="field-lbl">Diagnóstico Clínico / Sospeita Oncolóxica:</span>
            <span class="field-val">${escapeHTML(diag)}</span>
          </td>
        </tr>
        <tr>
          <td colspan="2">
            <span class="field-lbl">Resumo Clínico e Antecedentes Relevantes:</span>
            <div style="font-size:11.5px; color:#334155; line-height:1.5; margin-top:2px;">
              ${escapeHTML(resumen)}
            </div>
          </td>
        </tr>
        <tr>
          <td style="width: 50%;">
            <span class="field-lbl">Alerxias Coñecidas:</span>
            <span class="field-val">${escapeHTML(alergias)}</span>
          </td>
          <td style="width: 50%;">
            <span class="field-lbl">Contraindicación de Contraste / Metais:</span>
            <span class="field-val">Contraste: ${escapeHTML(contraste)} | Obxectos Metálicos: ${escapeHTML(metal)}</span>
          </td>
        </tr>
      </table>
    </div>

    ${protocolSection}

    <div class="signature-area">
      <div>
        <strong>Servizo Solicitante:</strong> ${escapeHTML(servicio)}<br>
        Facultativo: ${escapeHTML(medico)}
      </div>
      <div style="text-align: right;">
        <strong>Unidade PET/CT — Galaria / SERGAS</strong><br>
        Documento Asistencial Validado Telematicamente
      </div>
    </div>
  </div>

  ${scriptPrintTag}
</body>
</html>`;
  }

  // ==========================================================================
  // GENERADOR DE HOJA TÉCNICA DE ADQUISICIÓN PARA TSID (TÉCNICO DE MÁQUINA)
  // ==========================================================================
  function generateProtocolSheetHtml(p, proto) {
    const medsBadgeList = getMedicationsBadgeList(proto);

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Hoja Técnica PET/CT - ${escapeHTML(p.nombre)} (${escapeHTML(p.nhc)})</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #f8fafc;
      margin: 0;
      padding: 16px;
    }
    .sheet-card {
      max-width: 860px;
      margin: 0 auto;
      background: white;
      border: 2px solid #004868;
      border-radius: 8px;
      padding: 24px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #004868;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .header-bar img { height: 46px; }
    .badge-alert-box {
      background: #fef2f2;
      border: 1.5px solid #f87171;
      padding: 10px 14px;
      border-radius: 6px;
      margin-bottom: 14px;
      font-weight: 700;
      color: #991b1b;
      font-size: 13px;
    }
    .param-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 16px;
    }
    .param-box {
      border: 1.5px solid #cbd5e1;
      border-radius: 6px;
      padding: 12px;
      background: #f8fafc;
    }
    .param-box.highlight {
      border-color: #007eb4;
      background: #f0f9ff;
    }
    .param-title {
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 800;
      color: #004868;
      margin-bottom: 4px;
    }
    .param-val {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
    }
    .param-sub {
      font-size: 11px;
      color: #475569;
      margin-top: 2px;
    }
    .meds-alert-card {
      background: #fffbeb;
      border: 2px solid #f59e0b;
      border-radius: 6px;
      padding: 12px 14px;
      margin-bottom: 16px;
    }
    .tsid-checklist {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 16px;
    }
    .tsid-checklist label {
      display: block;
      margin-bottom: 6px;
      font-size: 12px;
      font-weight: 600;
    }
    @media print {
      body { background: white; padding: 0; }
      .sheet-card { border: 1.5px solid #000; box-shadow: none; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="sheet-card">
    <div class="header-bar">
      <div style="display:flex; align-items:center; gap:12px;">
        <img src="galaria_logo.jpg" alt="Galaria">
        <div>
          <h2 style="margin:0; font-size:14px; color:#004868; font-weight:800;">GALARIA · SERGAS — UNIDADE PET/CT</h2>
          <p style="margin:2px 0 0 0; font-size:11px; color:#475569;">HOJA DE PROTOCOLO DE ADQUISICIÓN PARA TSID / CONSOLA DE MÁQUINA</p>
        </div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:12px; font-weight:800; color:#004868;">FECHA: ${escapeHTML(p.fechaCita)}</div>
        <div style="font-size:13px; font-weight:800; color:#007eb4;">HORA CITA: ${escapeHTML(p.horaCita)}</div>
      </div>
    </div>

    <!-- DATOS DEL PACIENTE -->
    <div style="background:#f1f5f9; padding:10px 14px; border-radius:6px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center;">
      <div>
        <div style="font-size:16px; font-weight:800; color:#004868;">${escapeHTML(p.nombre)}</div>
        <div style="font-size:12px; color:#475569; font-weight:600;">
          NHC: <strong>${escapeHTML(p.nhc)}</strong> | Edad: ${p.edad} años (${p.sexo}) | Peso: ${p.peso} kg | Talla: ${p.talla} cm
        </div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:11px; color:#64748b; font-weight:700;">RADIOFÁRMACO:</div>
        <div style="font-size:13px; font-weight:800; color:#004868;">${escapeHTML(p.radiofarmaco)}</div>
      </div>
    </div>

    <!-- ALERTAS SI APLICAN -->
    ${p.isDiabetic || p.contraindicacionContraste === 'Sí' || p.movilidad !== 'Autónomo' ? `
      <div class="badge-alert-box">
        ⚠️ ALERTAS CLÍNICAS:
        ${p.isDiabetic ? `[DIABÉTICO: Glucemia basal ${p.glucemia} mg/dL] ` : ''}
        ${p.contraindicacionContraste === 'Sí' ? `[CONTRAINDICACIÓN CONTRASTE IODADO] ` : ''}
        ${p.movilidad !== 'Autónomo' ? `[MOVILIDAD: ${p.movilidad}] ` : ''}
      </div>
    ` : ''}

    <!-- PARÁMETROS CRÍTICOS DE ADQUISICIÓN -->
    <div class="param-grid">
      <div class="param-box highlight">
        <div class="param-title">⏱️ TIEMPO DE ESPERA / PASO A MÁQUINA</div>
        <div class="param-val">${escapeHTML(proto.uptakeTime || 60)} MINUTOS</div>
        <div class="param-sub">Tiempo mínimo de captación desde inyección IV del trazador</div>
      </div>

      <div class="param-box highlight">
        <div class="param-title">🙆‍♂️ POSICIÓN DE LOS BRAZOS</div>
        <div class="param-val">${getArmsLabel(proto.armsPosition)}</div>
        <div class="param-sub">${getArmsDescription(proto.armsPosition)}</div>
      </div>

      <div class="param-box highlight">
        <div class="param-title">📐 TIPO DE PRUEBA Y RANGO ANATÓMICO (SCOUT VIEW)</div>
        <div class="param-val">${getRangeLabel(proto.scanRange)}</div>
        <div class="param-sub">${proto.customRangeDetails ? escapeHTML(proto.customRangeDetails) : 'Longitud y cobertura axial de adquisición'}</div>
      </div>

      <div class="param-box">
        <div class="param-title">💧 PAUTA DE HIDRATACIÓN EN BOX</div>
        <div class="param-val">${getHydrationLabel(proto.hydration)}</div>
        <div class="param-sub">Pauta exclusiva de ingesta hídrica oral durante la espera en el box</div>
      </div>

      <div class="param-box highlight">
        <div class="param-title">⚡ DIURÉTICO (FUROSEMIDA / SEGURIL)</div>
        <div class="param-val" style="color: ${(proto.diuretic && proto.diuretic !== 'no') ? '#007eb4' : '#64748b'};">
          ${getDiureticLabel(proto)}
        </div>
        <div class="param-sub">${(proto.diuretic === 'si_20mg_post' || proto.diuretic === 'diur_post' || proto.diuretic === 'si_15min_antes') ? 'Administrar 20 mg IV lenta a los 15-20 min post-inyección' : 'No administrar diurético'}</div>
      </div>

      <div class="param-box highlight">
        <div class="param-title">☢️ PROTOCOLO DE CONTRASTE</div>
        <div class="param-val" style="color: ${(proto.contrastType === 'en_maquina' || proto.contrast === 'civ_portal') ? '#0284c7' : ((proto.contrastType === 'en_box' || proto.contrastPre === 'oral_gastrografin') ? '#059669' : '#475569')};">
          ${getContrastLabel(proto)}
        </div>
        <div class="param-sub">${(proto.contrastType === 'en_maquina' || proto.contrast === 'civ_portal') ? 'Inyección endovenosa de contraste iodado acoplada en máquina con inyector en camilla (fase portal)' : ((proto.contrastType === 'en_box' || proto.contrastPre === 'oral_gastrografin' || proto.contrast === 'oral_gastrografin_15min') ? `Administrar contraste IV en el box ${proto.contrastBoxMinutes || proto.contrastPreMinutes || 15} min antes de la prueba` : 'CT a baja dosis para corrección de atenuación sin contraste')}</div>
      </div>
    </div>

    <!-- MEDICACIÓN OPCIONAL Y SOPORTE CLÍNICO -->
    ${medsBadgeList ? `
      <div class="meds-alert-card">
        <div style="font-size:11px; font-weight:800; color:#b45309; text-transform:uppercase; margin-bottom:4px;">
          💊 MEDICAMENTOS OPCIONALES PAUTADOS POR EL FACULTATIVO:
        </div>
        <div style="font-size:13px; font-weight:700; color:#92400e;">
          ${medsBadgeList}
        </div>
      </div>
    ` : ''}

    <!-- INSTRUCCIONES ESPECÍFICAS DEL FACULTATIVO -->
    ${proto.doctorNotes ? `
      <div style="background:#fffbeb; border:1.5px solid #fde68a; border-radius:6px; padding:12px; margin-bottom:16px;">
        <div style="font-size:11px; font-weight:800; color:#b45309; text-transform:uppercase; margin-bottom:4px;">
          📝 OBSERVACIONES Y ÓRDENES ESPECÍFICAS DEL FACULTATIVO:
        </div>
        <div style="font-size:13px; font-weight:600; color:#78350f; line-height:1.4;">
          ${escapeHTML(proto.doctorNotes)}
        </div>
      </div>
    ` : ''}

    <!-- CHECKLIST TÉCNICO TSID -->
    <div class="tsid-checklist">
      <div style="font-size:11px; font-weight:800; color:#004868; text-transform:uppercase; margin-bottom:8px;">
        COMPROBACIONES TÉCNICAS TSID ANTES DE DISPARAR:
      </div>
      <label>◻️ Confirmar identidad inequívoca del paciente y NHC (${escapeHTML(p.nhc)})</label>
      <label>◻️ Micción previa forzada verificada (Vejiga vacía antes de posicionar en camilla)</label>
      <label>◻️ Retirada de objetos metálicos (botones, cremalleras, joyas en FOV)</label>
      <label>◻️ Colocación de brazos según pauta médica: <strong>${getArmsLabel(proto.armsPosition)}</strong></label>
      <label>◻️ Tipo de prueba y cobertura verificada: <strong>${getRangeLabel(proto.scanRange)}</strong></label>
      <label>◻️ Modalidad de contraste verificada: <strong>${getContrastLabel(proto)}</strong></label>
      <label>◻️ Pauta de diurético comprobada: <strong>${getDiureticLabel(proto)}</strong></label>
      <label>◻️ Comprobación de CT de corrección de atenuación sin artefactos de movimiento respiratorio</label>
    </div>

    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:20px; font-size:11px; color:#475569; border-top:1px dashed #cbd5e1; padding-top:10px;">
      <div>
        <strong>Médico Validador:</strong> ${escapeHTML(proto.doctorSign || 'Dr. Manuel Gómez Feijóo')}<br>
        Firma Electrónica Galaria · SERGAS — ${escapeHTML(proto.timestamp || '')}
      </div>
      <div style="text-align:right;">
        Firma / Iniciales TSID: _____________________
      </div>
    </div>
  </div>

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() { window.print(); }, 200);
    });
  <` + `/script>
</body>
</html>`;
  }

  // ==========================================================================
  // HELPERS DE FORMATEO Y ETIQUETAS
  // ==========================================================================
  function getArmsLabel(val) {
    if (val === 'abajo') return 'Ambos Brazos Abajo (Arms Down)';
    if (val === 'abdominal') return 'Brazos en Reposo Abdominal';
    return 'Ambos Brazos Arriba (Arms Up)';
  }

  function getArmsShort(val) {
    if (val === 'abajo') return 'Brazos Abajo';
    if (val === 'abdominal') return 'Reposo Abdominal';
    return 'Brazos Arriba';
  }

  function getArmsDescription(val) {
    if (val === 'abajo') return 'Obligatorio en cuello/cabeza o por hombro doloroso/prótesis';
    if (val === 'abdominal') return 'Cincha sobre abdomen para encamados o cifosis';
    return 'Con apoyo cefálico para evitar corte de tórax/abdomen';
  }

  function getRangeLabel(val) {
    if (val === 'cabeza_cuello_cuerpo') return 'Cabeza-Cuello + Cuerpo Entero (Protocolo Combinado 2 Fases)';
    if (val === 'mmii') return 'MMII (Miembros Inferiores / Extremidades)';
    if (val === 'cuerpo_total') return 'Cuerpo Total (Vértice a Pies)';
    if (val === 'cerebro') return 'Cerebro Dedicado (NeuroPET 3D)';
    if (val === 'otro_rango') return 'Rango Personalizado';
    return 'Base de Cráneo a Muslos (Estándar EANM)';
  }

  function getRangeShort(val) {
    if (val === 'cabeza_cuello_cuerpo') return 'Cabeza-Cuello + Cuerpo';
    if (val === 'mmii') return 'MMII';
    if (val === 'cuerpo_total') return 'Cuerpo Total';
    if (val === 'cerebro') return 'Cerebro 3D';
    if (val === 'otro_rango') return 'Personalizado';
    return 'Base Cráneo-Muslos';
  }

  function getHydrationLabel(val) {
    if (val === 'box_no' || val === 'restriccion' || val === 'ayuno') return '🚫 Sin Hidratación en Box (Restricción)';
    return '💧 Hidratación en Box (1.000 mL de agua oral)';
  }

  function getHydrationShort(val) {
    if (val === 'box_no' || val === 'restriccion' || val === 'ayuno') return 'Sin Hidratación Box';
    return 'Hidratación en Box';
  }

  function getDiureticLabel(protoOrVal) {
    const val = typeof protoOrVal === 'object' && protoOrVal ? protoOrVal.diuretic : protoOrVal;
    if (val === 'si_20mg_post' || val === 'diur_post' || val === 'si_15min_antes' || val === 'diur_si') {
      return '💉 SÍ: Furosemida 20 mg (Post-Inyección)';
    }
    return '❌ NO Administrar Diurético';
  }

  function getDiureticShort(protoOrVal) {
    const val = typeof protoOrVal === 'object' && protoOrVal ? protoOrVal.diuretic : protoOrVal;
    if (val === 'si_20mg_post' || val === 'diur_post' || val === 'si_15min_antes' || val === 'diur_si') {
      return 'Seguril post-inyección';
    }
    return 'Sin diurético';
  }

  function getContrastLabel(protoOrVal, minutes) {
    if (!protoOrVal) return 'Sin Contraste (CT Baja Dosis)';
    const type = typeof protoOrVal === 'object' && protoOrVal ? (protoOrVal.contrastType || protoOrVal.contrast) : protoOrVal;
    const mins = typeof protoOrVal === 'object' && protoOrVal ? (protoOrVal.contrastBoxMinutes || protoOrVal.contrastPreMinutes || 15) : (minutes || 15);

    if (type === 'en_maquina' || type === 'civ_portal') {
      return '💉 Contraste en Máquina (CT con CIV en Gantry)';
    }
    if (type === 'en_box' || type === 'oral_gastrografin' || type === 'oral_gastrografin_15min' || type === 'oral_agua') {
      return `💉 Contraste IV en Box (${mins} min antes de la prueba)`;
    }
    return '❌ Sin Contraste (CT Baja Dosis)';
  }

  function getContrastShort(protoOrVal) {
    if (!protoOrVal) return 'Sin contraste';
    const type = typeof protoOrVal === 'object' && protoOrVal ? (protoOrVal.contrastType || protoOrVal.contrast) : protoOrVal;
    const mins = typeof protoOrVal === 'object' && protoOrVal ? (protoOrVal.contrastBoxMinutes || protoOrVal.contrastPreMinutes || 15) : 15;

    if (type === 'en_maquina' || type === 'civ_portal') {
      return 'Contraste en máquina';
    }
    if (type === 'en_box' || type === 'oral_gastrografin' || type === 'oral_gastrografin_15min' || type === 'oral_agua') {
      return `Contraste IV box (${mins}m antes)`;
    }
    return 'Sin contraste';
  }

  function getContrastPreLabel(protoOrVal, minutes) {
    return getContrastLabel(protoOrVal, minutes);
  }

  function getContrastGantryLabel(protoOrVal) {
    return getContrastLabel(protoOrVal);
  }

  function getMedicationsBadgeList(proto) {
    if (!proto) return '';
    const list = [];
    if (proto.premedBrownFatPropranolol) list.push('⭐ Propranolol 20-40mg (1 HORA ANTES de FDG)');
    if (proto.premedBrownFatDiazepam) list.push('Diazepam 5mg (30-45m antes)');
    if (proto.ansiolitico) list.push('Lorazepam/Midazolam (30m antes)');
    if (proto.analgesico) list.push('Analgésico IV (20m antes)');
    if (proto.antiemetico) list.push('Antiemético IV');
    return list.join(' • ');
  }

  function getPriorityClass(prio) {
    const p = String(prio || '').toUpperCase();
    if (p.includes('P1') || p.includes('URG')) return 'is-p1 p1';
    if (p.includes('P2') || p.includes('PREF')) return 'is-p2 p2';
    return 'is-p3 p3';
  }

  function formatCurrentDateTime() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${mins} h`;
  }

  function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ==========================================================================
  // COMPORTAMIENTO DE RADIO CARDS INTERACTIVAS
  // ==========================================================================
  function setupInteractiveRadioCards() {
    const cardGroups = [
      'uptakeOptionsGrid',
      'armsOptionsGrid',
      'rangeOptionsGrid',
      'hydrationOptionsGrid',
      'diureticOptionsGrid',
      'contrastOptionsGrid'
    ];

    cardGroups.forEach(groupId => {
      const container = document.getElementById(groupId);
      if (!container) return;

      container.addEventListener('click', (e) => {
        // Si el usuario hace clic o interactúa con el input de minutos o texto, asegurar selección de la tarjeta sin anular el foco
        if (e.target.tagName === 'INPUT' && (e.target.type === 'number' || e.target.type === 'text')) {
          const parentCard = e.target.closest('.option-radio-card');
          if (parentCard) {
            container.querySelectorAll('.option-radio-card').forEach(c => c.classList.remove('selected'));
            parentCard.classList.add('selected');
            const input = parentCard.querySelector('input[type="radio"]');
            if (input) input.checked = true;
          }
          return;
        }

        const card = e.target.closest('.option-radio-card');
        if (!card) return;

        container.querySelectorAll('.option-radio-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');

        const input = card.querySelector('input[type="radio"]');
        if (input) input.checked = true;

        if (groupId === 'uptakeOptionsGrid') {
          if (elements.inputCustomUptake) elements.inputCustomUptake.value = '';
        }

        if (groupId === 'rangeOptionsGrid') {
          if (elements.wrapCustomRange) {
            elements.wrapCustomRange.style.display = card.dataset.val === 'otro_rango' ? 'flex' : 'none';
          }
        }
      });
    });

    if (elements.inputCustomUptake) {
      elements.inputCustomUptake.addEventListener('input', () => {
        const val = elements.inputCustomUptake.value.trim();
        if (val) {
          const container = document.getElementById('uptakeOptionsGrid');
          if (container) {
            container.querySelectorAll('.option-radio-card').forEach(c => c.classList.remove('selected'));
            const checkedRadio = container.querySelector('input[type="radio"]:checked');
            if (checkedRadio) checkedRadio.checked = false;
          }
        }
      });
    }
  }

  function setRadioOption(fieldGroup, value) {
    let containerId = '';
    let radioName = '';

    if (fieldGroup === 'uptake') { containerId = 'uptakeOptionsGrid'; radioName = 'radioUptake'; }
    else if (fieldGroup === 'arms') { containerId = 'armsOptionsGrid'; radioName = 'radioArms'; }
    else if (fieldGroup === 'range') { containerId = 'rangeOptionsGrid'; radioName = 'radioRange'; }
    else if (fieldGroup === 'hydration') { containerId = 'hydrationOptionsGrid'; radioName = 'radioHydration'; }
    else if (fieldGroup === 'diuretic') { containerId = 'diureticOptionsGrid'; radioName = 'radioDiuretic'; }
    else if (fieldGroup === 'contrast') { containerId = 'contrastOptionsGrid'; radioName = 'radioContrast'; }

    const container = document.getElementById(containerId);
    if (!container) return;

    container.querySelectorAll('.option-radio-card').forEach(card => {
      const cardVal = card.dataset.val;
      const isMatch = String(cardVal) === String(value);
      card.classList.toggle('selected', isMatch);
      const radio = card.querySelector(`input[name="${radioName}"]`);
      if (radio) radio.checked = isMatch;
    });
  }

  function getSelectedRadioValue(name) {
    const checked = document.querySelector(`input[name="${name}"]:checked`);
    return checked ? checked.value : null;
  }

  // ==========================================================================
  // EVENT LISTENERS DE LA APLICACIÓN
  // ==========================================================================
  function setupEventListeners() {
    // Presets de fecha
    elements.btnDateToday.addEventListener('click', () => {
      setActiveDateFilter('today', elements.btnDateToday);
    });
    elements.btnDateTomorrow.addEventListener('click', () => {
      setActiveDateFilter('tomorrow', elements.btnDateTomorrow);
    });
    elements.btnDateAll.addEventListener('click', () => {
      setActiveDateFilter('all', elements.btnDateAll);
    });
    elements.inputCustomDate.addEventListener('change', () => {
      const val = elements.inputCustomDate.value;
      if (val) {
        document.querySelectorAll('.date-btn').forEach(b => b.classList.remove('active'));
        state.activeFilterDate = val;
        render();
      }
    });

    // Pestañas de estado (Todos, Pendientes, Protocolizados)
    elements.statusTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        elements.statusTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        state.activeFilterStatus = tab.dataset.status;
        render();
      });
    });

    // Filtro trazador
    elements.selectTracer.addEventListener('change', () => {
      state.activeFilterTracer = elements.selectTracer.value;
      render();
    });

    // Filtro tipo de prueba
    if (elements.selectTestType) {
      elements.selectTestType.addEventListener('change', () => {
        state.activeFilterTestType = elements.selectTestType.value;
        render();
      });
    }

    // Búsqueda en vivo
    elements.searchInput.addEventListener('input', () => {
      state.searchTerm = elements.searchInput.value.trim();
      render();
    });

    // Alternador de vistas
    elements.btnViewCards.addEventListener('click', () => {
      elements.btnViewCards.classList.add('active');
      elements.btnViewTable.classList.remove('active');
      state.currentView = 'cards';
      renderPatientList();
    });
    elements.btnViewTable.addEventListener('click', () => {
      elements.btnViewTable.classList.add('active');
      elements.btnViewCards.classList.remove('active');
      state.currentView = 'table';
      renderPatientList();
    });

    // Acciones del modal de protocolo
    elements.btnCloseProtocolModal.addEventListener('click', closeProtocolModal);
    elements.btnCancelProtocol.addEventListener('click', closeProtocolModal);
    elements.btnSaveProtocol.addEventListener('click', saveProtocolFromModal);
    elements.btnPrintProtocolSheet.addEventListener('click', printProtocolSheet);
    elements.btnViewVolanteFromModal.addEventListener('click', () => {
      if (state.selectedPatient) {
        openVolanteModal(state.selectedPatient.id);
      }
    });

    elements.protocolModalBackdrop.addEventListener('click', (e) => {
      if (e.target === elements.protocolModalBackdrop) closeProtocolModal();
    });

    elements.btnCloseVolanteModal.addEventListener('click', closeVolanteModal);
    elements.btnCloseVolanteModalBtn.addEventListener('click', closeVolanteModal);
    elements.btnPrintVolanteFromViewer.addEventListener('click', printVolanteFromViewer);
    elements.volanteModalBackdrop.addEventListener('click', (e) => {
      if (e.target === elements.volanteModalBackdrop) closeVolanteModal();
    });

    // Sincronización manual en red
    if (elements.btnSyncPatients) {
      elements.btnSyncPatients.addEventListener('click', async () => {
        const icon = document.getElementById('syncIcon');
        if (icon) {
          icon.style.display = 'inline-block';
          icon.style.transform = 'rotate(360deg)';
          icon.style.transition = 'transform 0.6s ease';
        }
        loadStoredProtocols();
        await loadPatientsData(true);
        render();
        setTimeout(() => {
          if (icon) {
            icon.style.transform = 'none';
            icon.style.transition = 'none';
          }
        }, 600);
        showToast('✅ Base de datos actualizada con los pacientes de la red', 'success');
      });
    }

    // Sincronización automática entre pestañas y módulos en tiempo real
    window.addEventListener('storage', async (e) => {
      if (e.key === 'PET_DATABASE_MASTER_V4' || e.key === 'PET_MEDICAL_PROTOCOLS_V1') {
        loadStoredProtocols();
        await loadPatientsData();
        render();
      }
    });

    // Sondeo periódico en red cada 20 segundos
    setInterval(async () => {
      if (!state.selectedPatient) {
        await loadPatientsData();
        render();
      }
    }, 20000);
  }

  function setActiveDateFilter(type, btnElement) {
    document.querySelectorAll('.date-btn').forEach(b => b.classList.remove('active'));
    btnElement.classList.add('active');
    elements.inputCustomDate.value = '';
    state.activeFilterDate = type;
    render();
  }

  // ==========================================================================
  // TOASTS Y NOTIFICACIONES
  // ==========================================================================
  function showToast(message, type = 'info') {
    if (!elements.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  }

  // ==========================================================================
  // NAVEGACIÓN Y ACCESO DIRECTO ENTRE SECCIONES DEL PROTOCOLO
  // ==========================================================================
  function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    const body = document.getElementById('protocolModalBody');
    if (!section || !body) return;

    updateActiveNavTab(sectionId);

    // Calcular la posición relativa dentro del contenedor con scroll
    const bodyRect = body.getBoundingClientRect();
    const sectionRect = section.getBoundingClientRect();
    const targetScrollTop = body.scrollTop + (sectionRect.top - bodyRect.top) - 15;

    body.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: 'smooth'
    });
  }

  function updateActiveNavTab(targetSectionId) {
    const tabBtns = document.querySelectorAll('.prot