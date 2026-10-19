/**
 * ==============================================================================
 * PORTAL CLÍNICO DE PRESCRIPCIÓN MÉDICA — PET/CT & MEDICINA NUCLEAR
 * Implementación de los 4 tipos de PET de Tally.so, Medicina Nuclear Convencional
 * y Base de Datos Maestra Interoperable con la Suite Triaje PET
 * ==============================================================================
 */

// --- Base de Datos de Facultativos Autorizados ---
// --- Base de Datos de Facultativos Autorizados ---
const HOSPITAL_DOCTORS = [
  {
    id: 'crodriguez',
    name: 'Dr. Carlos Rodríguez',
    specialty: 'Oncología Médica',
    service: 'Oncología',
    collegiate: 'Col. 2804592 - Busca 104',
    initials: 'CR',
    password: 'demo'
  },
  {
    id: 'egomez',
    name: 'Dra. Elena Gómez',
    specialty: 'Hematología Clínica',
    service: 'Hematología',
    collegiate: 'Col. 2809112 - Busca 218',
    initials: 'EG',
    password: 'demo'
  },
  {
    id: 'fgarcia',
    name: 'Dr. Fernando García',
    specialty: 'Urología Oncológica',
    service: 'Urología',
    collegiate: 'Col. 2810344 - Busca 305',
    initials: 'FG',
    password: 'demo'
  },
  {
    id: 'cruiz',
    name: 'Dra. Carmen Ruiz',
    specialty: 'Neurología / Memoria',
    service: 'Neurología',
    collegiate: 'Col. 2812290 - Busca 310',
    initials: 'CR',
    password: 'demo'
  },
  {
    id: 'lsanchez',
    name: 'Dra. Lucía Sánchez',
    specialty: 'Cirugía General y Digestiva',
    service: 'Cirugía General',
    collegiate: 'Col. 2814401 - Busca 415',
    initials: 'LS',
    password: 'demo'
  },
  {
    id: 'jmartinez',
    name: 'Dr. Javier Martínez',
    specialty: 'Cardiología Clínica',
    service: 'Cardiología',
    collegiate: 'Col. 2816509 - Busca 520',
    initials: 'JM',
    password: 'demo'
  },
  {
    id: 'lfernandez',
    name: 'Dra. Sofía Fernández',
    specialty: 'Neumología',
    service: 'Neumología',
    collegiate: 'Col. 2815671 - Busca 412',
    initials: 'SF',
    password: 'demo'
  },
  {
    id: 'jtorres',
    name: 'Dr. Miguel Ramírez',
    specialty: 'Medicina Interna',
    service: 'Medicina Interna',
    collegiate: 'Col. 2801984 - Busca 550',
    initials: 'MR',
    password: 'demo'
  }
];

/**
 * Filtro de privacidad estricto: determina si una petición fue creada por el médico actualmente en sesión.
 * Cada facultativo tiene visibilidad exclusiva sobre sus propios pacientes y peticiones prescritas.
 */
function isPetitionFromCurrentDoctor(p) {
  if (!p) return false;
  if (!currentUser || !currentUser.name) return true;

  const currentDocRaw = String(currentUser.name || '').trim().toLowerCase();
  const petitionDocRaw = String(p["Médico Solicitante"] || p.docName || '').trim().toLowerCase();

  if (!petitionDocRaw) return false;
  if (currentDocRaw === petitionDocRaw) return true;

  // Normalizar removiendo prefijos de cortesía (dr., dra., doctor, doctora) y espacios
  const cleanCurrent = currentDocRaw.replace(/^(dr\.|dra\.|doctor|doctora)\s+/i, '').trim();
  const cleanPetition = petitionDocRaw.replace(/^(dr\.|dra\.|doctor|doctora)\s+/i, '').trim();

  return cleanCurrent === cleanPetition;
}

// --- Base de Datos Hospitalaria Inicial (Esquema Triaje PET) ---
const INITIAL_DATABASE = [
  {
    "Submission ID": "sub_70669892",
    "Respondent ID": "resp_52736221",
    "Modalidad": "PET",
    "Fecha Solicitud": "2026-10-10",
    "NHC / Historia Clínica": "NHC-131362",
    "Nombre del Paciente": "Cristina Rodríguez Martín",
    "Nombre y Apellidos": "Cristina Rodríguez Martín",
    "Sexo": "Femenino",
    "Edad": 65,
    "Talla (cm)": 154,
    "Peso (kg)": 75,
    "Servicio Solicitante": "Oncología",
    "Médico Solicitante": "Dr. Carlos Rodríguez",
    "Diagnóstico Clínico": "Linfoma de Hodgkin Estadio IIIA",
    "Motivo de Solicitud": "Monitorización de Respuesta (Interim PET tras ciclo 2)",
    "Tipo de Estudio PET Solicitado": "18F-FDG (Oncológico / Inflamatorio General)",
    "Carácter de la Petición": "Preferente",
    "Prioridad Calculada": "🟡 P2",
    "Ventana Clínica (Días Laborables)": 14,
    "Fecha Próxima Consulta": "22/10/2026",
    "Fecha Cita Asignada": "2026-10-16",
    "Hora Cita Asignada": "08:20 h (18F-FDG)",
    "¿El paciente está ingresado?": "No",
    "¿Precisa sedación?": "No",
    "Movilidad / Traslado": "Autónomo",
    "¿Tiene Diabetes Mellitus?": "No",
    "Glucemia (mg/dL)": 105,
    "Fin Tratamiento QT/RT": "2026-09-28",
    "Alergias Conocidas": "Penicilina",
    "Contraindicación Contraste": "No",
    "Portador Objetos Metálicos": "No",
    "Alertas Técnicas": "Ninguna",
    "Estado de Triaje": "Cita Asignada",
    "Resumen Clínico": "Linfoma de Hodgkin tras 2º ciclo ABVD. Valoración de respuesta precoz según criterios Deauville."
  },
  {
    "Submission ID": "sub_40041391",
    "Respondent ID": "resp_26809899",
    "Modalidad": "PET",
    "Fecha Solicitud": "2026-10-11",
    "NHC / Historia Clínica": "NHC-722682",
    "Nombre del Paciente": "Ramón Moreno Jiménez",
    "Nombre y Apellidos": "Ramón Moreno Jiménez",
    "Sexo": "Masculino",
    "Edad": 72,
    "Talla (cm)": 178,
    "Peso (kg)": 88,
    "Servicio Solicitante": "Urología",
    "Médico Solicitante": "Dr. Fernando García",
    "Diagnóstico Clínico": "Adenocarcinoma de Próstata Gleason 4+3 (PSA: 1.45 ng/mL)",
    "Motivo de Solicitud": "Recidiva con incremento PSA (Fallo bioquímico)",
    "Tipo de Estudio PET Solicitado": "18F-Fluorurocolina / 68Ga-PSMA (Próstata)",
    "Carácter de la Petición": "Urgente",
    "Prioridad Calculada": "🔴 P1",
    "Ventana Clínica (Días Laborables)": 7,
    "Fecha Próxima Consulta": "25/10/2026",
    "Fecha Cita Asignada": "2026-10-17",
    "Hora Cita Asignada": "08:00 h (Fluor-PSMA)",
    "¿El paciente está ingresado?": "No",
    "¿Precisa sedación?": "No",
    "Movilidad / Traslado": "Autónomo",
    "¿Tiene Diabetes Mellitus?": "No",
    "Glucemia (mg/dL)": 110,
    "Fin Tratamiento QT/RT": "",
    "Alergias Conocidas": "Ninguna",
    "Contraindicación Contraste": "No",
    "Portador Objetos Metálicos": "No",
    "Alertas Técnicas": "Cinética de PSA acelerada",
    "Estado de Triaje": "Cita Asignada",
    "Resumen Clínico": "Prostatectomía radical en 2024. Elevación persistente de PSA. Planificación de radioterapia de rescate."
  },
  {
    "Submission ID": "sub_82686731",
    "Respondent ID": "resp_19487472",
    "Modalidad": "CONVENCIONAL",
    "Fecha Solicitud": "2026-10-11",
    "NHC / Historia Clínica": "NHC-501923",
    "Nombre del Paciente": "Marta Delgado Serrano",
    "Nombre y Apellidos": "Marta Delgado Serrano",
    "Sexo": "Femenino",
    "Edad": 62,
    "Talla (cm)": 165,
    "Peso (kg)": 62,
    "Servicio Solicitante": "Traumatología y Cirugía Ortopédica",
    "Médico Solicitante": "Dr. Carlos Rodríguez",
    "Diagnóstico Clínico": "Gonalgia derecha persistente post-artroplastia total de rodilla",
    "Motivo de Solicitud": "Descarte de aflojamiento protésico aséptico vs proceso séptico",
    "Tipo de Estudio PET Solicitado": "Gammagrafía Ósea / SPECT-CT",
    "Carácter de la Petición": "Preferente",
    "Prioridad Calculada": "🟡 P2",
    "Ventana Clínica (Días Laborables)": 14,
    "Fecha Próxima Consulta": "28/10/2026",
    "Fecha Cita Asignada": "2026-10-18",
    "Hora Cita Asignada": "09:30 h (99mTc-HDP)",
    "¿El paciente está ingresado?": "No",
    "¿Precisa sedación?": "No",
    "Movilidad / Traslado": "Autónomo",
    "¿Tiene Diabetes Mellitus?": "No",
    "Glucemia (mg/dL)": 98,
    "Fin Tratamiento QT/RT": "",
    "Alergias Conocidas": "Ninguna",
    "Contraindicación Contraste": "No",
    "Portador Objetos Metálicos": "Sí (Prótesis de rodilla derecha)",
    "Alertas Técnicas": "Portador de material protésico metálico",
    "Estado de Triaje": "Cita Asignada",
    "Resumen Clínico": "Gammagrafía ósea en tres fases para evaluar perfusión, hiperemia y captación ósea tardía periprotésica."
  },
  {
    "Submission ID": "sub_92636233",
    "Respondent ID": "resp_41531115",
    "Modalidad": "PET",
    "Fecha Solicitud": "2026-10-12",
    "NHC / Historia Clínica": "NHC-618492",
    "Nombre del Paciente": "Vicente Blasco Ibáñez",
    "Nombre y Apellidos": "Vicente Blasco Ibáñez",
    "Sexo": "Masculino",
    "Edad": 62,
    "Talla (cm)": 170,
    "Peso (kg)": 71,
    "Servicio Solicitante": "Neurología",
    "Médico Solicitante": "Dr. Javier Torres",
    "Diagnóstico Clínico": "Deterioro cognitivo leve amnésico progresivo",
    "Motivo de Solicitud": "Demencia: Inicio precoz (< 65 años)",
    "Tipo de Estudio PET Solicitado": "PET Neurológico / Neurooncología",
    "Carácter de la Petición": "Preferente",
    "Prioridad Calculada": "🟡 P2",
    "Ventana Clínica (Días Laborables)": 14,
    "Fecha Próxima Consulta": "04/11/2026",
    "Fecha Cita Asignada": "",
    "Hora Cita Asignada": "",
    "¿El paciente está ingresado?": "No",
    "¿Precisa sedación?": "No",
    "Movilidad / Traslado": "Autónomo",
    "¿Tiene Diabetes Mellitus?": "No",
    "Glucemia (mg/dL)": 95,
    "Fin Tratamiento QT/RT": "",
    "Alergias Conocidas": "Ninguna",
    "Contraindicación Contraste": "No",
    "Portador Objetos Metálicos": "No",
    "Alertas Técnicas": "PET Cerebral con reposo sensorial previo",
    "Estado de Triaje": "Pendiente de Triaje",
    "Resumen Clínico": "Estudio de hipometabolismo cortical parietotemporal y precúneo para confirmación diagnóstica."
  },
  {
    "Submission ID": "sub_91304778",
    "Respondent ID": "resp_63923140",
    "Modalidad": "PET",
    "Fecha Solicitud": "2026-10-12",
    "NHC / Historia Clínica": "NHC-419200",
    "Nombre del Paciente": "Antonio Silva Barba",
    "Nombre y Apellidos": "Antonio Silva Barba",
    "Sexo": "Masculino",
    "Edad": 69,
    "Talla (cm)": 171,
    "Peso (kg)": 81,
    "Servicio Solicitante": "Endocrinología",
    "Médico Solicitante": "Dr. Carlos Rodríguez",
    "Diagnóstico Clínico": "Tumor Neuroendocrino Ileal G1 (Ki-67: 2%)",
    "Motivo de Solicitud": "Evaluación densidad receptores de somatostatina (SSTR)",
    "Tipo de Estudio PET Solicitado": "68Ga-DOTATOC / 68Ga-DOTATATE (Tumores Neuroendocrinos)",
    "Carácter de la Petición": "Preferente",
    "Prioridad Calculada": "🟡 P2",
    "Ventana Clínica (Días Laborables)": 14,
    "Fecha Próxima Consulta": "29/10/2026",
    "Fecha Cita Asignada": "2026-10-19",
    "Hora Cita Asignada": "10:30 h (68Ga-DOTATOC)",
    "¿El paciente está ingresado?": "No",
    "¿Precisa sedación?": "No",
    "Movilidad / Traslado": "Autónomo",
    "¿Tiene Diabetes Mellitus?": "No",
    "Glucemia (mg/dL)": 102,
    "Fin Tratamiento QT/RT": "",
    "Alergias Conocidas": "Ninguna",
    "Contraindicación Contraste": "No",
    "Portador Objetos Metálicos": "No",
    "Alertas Técnicas": "Trazador con elución de generador de Galio-68",
    "Estado de Triaje": "Cita Asignada",
    "Resumen Clínico": "Mapeo de receptores somatostatina para valorar idoneidad de terapia con análogos fríos o PRRT."
  },
  {
    "Submission ID": "sub_84729103",
    "Respondent ID": "resp_88319201",
    "Modalidad": "PET",
    "Fecha Solicitud": "2026-10-13",
    "NHC / Historia Clínica": "NHC-847291",
    "Nombre del Paciente": "Ignacio San Román Gil",
    "Nombre y Apellidos": "Ignacio San Román Gil",
    "Sexo": "Masculino",
    "Edad": 67,
    "Talla (cm)": 173,
    "Peso (kg)": 74,
    "Servicio Solicitante": "Neumología",
    "Médico Solicitante": "Dra. Lucía Fernández",
    "Diagnóstico Clínico": "CPNCP Lóbulo Superior Derecho cT2aN0M0",
    "Motivo de Solicitud": "Estadificación inicial prequirúrgica",
    "Tipo de Estudio PET Solicitado": "18F-FDG (Oncológico / Inflamatorio General)",
    "Carácter de la Petición": "Urgente",
    "Prioridad Calculada": "🔴 P1",
    "Ventana Clínica (Días Laborables)": 7,
    "Fecha Próxima Consulta": "23/10/2026 (Comité)",
    "Fecha Cita Asignada": "2026-10-16",
    "Hora Cita Asignada": "09:00 h (18F-FDG)",
    "¿El paciente está ingresado?": "No",
    "¿Precisa sedación?": "No",
    "Movilidad / Traslado": "Autónomo",
    "¿Tiene Diabetes Mellitus?": "No",
    "Glucemia (mg/dL)": 108,
    "Fin Tratamiento QT/RT": "",
    "Alergias Conocidas": "Ninguna",
    "Contraindicación Contraste": "No",
    "Portador Objetos Metálicos": "No",
    "Alertas Técnicas": "Prioridad P1: Comité de tumores inminente",
    "Estado de Triaje": "Cita Asignada",
    "Resumen Clínico": "Estadificación mediastínica y a distancia para confirmar viabilidad de lobectomía."
  },
  {
    "Submission ID": "sub_55421099",
    "Respondent ID": "resp_33910284",
    "Modalidad": "CONVENCIONAL",
    "Fecha Solicitud": "2026-10-13",
    "NHC / Historia Clínica": "NHC-554210",
    "Nombre del Paciente": "Mercedes Valls Herrero",
    "Nombre y Apellidos": "Mercedes Valls Herrero",
    "Sexo": "Femenino",
    "Edad": 54,
    "Talla (cm)": 162,
    "Peso (kg)": 65,
    "Servicio Solicitante": "Cirugía General",
    "Médico Solicitante": "Dr. Carlos Rodríguez",
    "Diagnóstico Clínico": "Carcinoma de mama infiltrante en mama izquierda cT1cN0",
    "Motivo de Solicitud": "Biopsia Selectiva Ganglio Centinela (BSGC)",
    "Tipo de Estudio PET Solicitado": "Biopsia Selectiva Ganglio Centinela (BSGC)",
    "Carácter de la Petición": "Urgente",
    "Prioridad Calculada": "🔴 P1",
    "Ventana Clínica (Días Laborables)": 7,
    "Fecha Próxima Consulta": "21/10/2026 (Quirófano)",
    "Fecha Cita Asignada": "2026-10-20",
    "Hora Cita Asignada": "15:30 h (99mTc-Nanocoloides)",
    "¿El paciente está ingresado?": "No",
    "¿Precisa sedación?": "No",
    "Movilidad / Traslado": "Autónomo",
    "¿Tiene Diabetes Mellitus?": "No",
    "Glucemia (mg/dL)": 92,
    "Fin Tratamiento QT/RT": "",
    "Alergias Conocidas": "Ninguna",
    "Contraindicación Contraste": "No",
    "Portador Objetos Metálicos": "No",
    "Alertas Técnicas": "Cirugía radioguiada coordinada con quirófano día siguiente",
    "Estado de Triaje": "Cita Asignada",
    "Resumen Clínico": "Inyección periareolar de 99mTc-Nanocoloides y detección gammagráfica prequirúrgica de ganglio centinela axilar."
  }
];

// --- Estado Global ---
let currentUser = HOSPITAL_DOCTORS[0]; // Por defecto Dr. Carlos Rodríguez (Oncología Médica)
let petitions = [];
let currentViewingPetition = null;
let activeModality = 'pet';
let pendingPetitionToConfirm = null;
let pendingFormType = 'pet';

let tallyRiskFactors = {
  allergies: false,
  cardiac: false,
  renal: false,
  resp: false,
  contrast: false,
  metal: false,
  infection: false,
  alcohol: false,
  myasthenia: false,
  glaucoma: false,
  biopsy: false,
  surgery: false,
  chemo: false,
  radio: false
};

// ==============================================================================
// Inicialización y Base de Datos
// ==============================================================================
function initApp() {
  checkExistingSession();
  loadPetitionsDatabase().catch(err => {
    console.warn("Carga de base de datos en segundo plano:", err);
  });
}

// Inicializar inmediatamente si el DOM ya está listo, o al dispararse DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Escucha cambios en tiempo real desde la Suite Triaje PET
window.addEventListener('storage', (e) => {
  if (e.key === 'PET_DATABASE_MASTER_V4') {
    try {
      petitions = JSON.parse(e.newValue);
      updateKpis();
      renderPetitionsTable();
      renderDatabaseView();
    } catch (err) {
      console.warn("Error actualizando desde storage event:", err);
    }
  }
});

function applyOneMonthAutoPurgePetitions(records) {
  if (!Array.isArray(records)) return [];
  const today = new Date();
  const cutoffDate = new Date(today);
  cutoffDate.setDate(today.getDate() - 30);
  cutoffDate.setHours(0, 0, 0, 0);
  const cutoffStr = cutoffDate.toISOString().split('T')[0];

  return records.filter(item => {
    const fechaCita = item["Fecha Cita Asignada"] || "";
    const estado = String(item["Estado de Triaje"] || "").toLowerCase();
    if (!fechaCita || fechaCita.includes("SIN AGENDAR") || estado.includes("pendiente")) {
      return true;
    }
    if (fechaCita < cutoffStr) {
      return false;
    }
    return true;
  });
}

function getApiBaseUrl() {
  if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
    return '';
  }
  return 'http://localhost:8000';
}

async function loadPetitionsDatabase() {
  const baseUrl = getApiBaseUrl();

  // 1. Intentar cargar desde la API en vivo unificada conectada con el servidor
  try {
    const res = await fetch(`${baseUrl}/api/sync-database`);
    if (res.ok) {
      const json = await res.json();
      if (json.status === "success" && Array.isArray(json.data) && json.data.length > 0) {
        petitions = applyOneMonthAutoPurgePetitions(json.data);
        localStorage.setItem('PET_DATABASE_MASTER_V4', JSON.stringify(petitions));
        updateKpis();
        renderPetitionsTable();
        renderDatabaseView();
        console.log(`✅ Base de datos cargada en vivo desde el servidor (${petitions.length} registros)`);
        return;
      }
    }
  } catch (e) {
    console.warn("No se pudo conectar con /api/sync-database, buscando alternativa local...", e);
  }

  // 2. Intentar cargar desde el archivo database/peticiones_db.json
  try {
    const res = await fetch('database/peticiones_db.json');
    if (res.ok) {
      const fullDb = await res.json();
      if (Array.isArray(fullDb) && fullDb.length > 0) {
        petitions = applyOneMonthAutoPurgePetitions(fullDb);
        localStorage.setItem('PET_DATABASE_MASTER_V4', JSON.stringify(petitions));
        updateKpis();
        renderPetitionsTable();
        renderDatabaseView();
        return;
      }
    }
  } catch (err) {
    console.log("Carga fetch peticiones_db.json fallback:", err);
  }

  // 3. Fallback en caché LocalStorage
  const stored = localStorage.getItem('PET_DATABASE_MASTER_V4');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      petitions = applyOneMonthAutoPurgePetitions(parsed);
      if (petitions && petitions.length > 0) {
        updateKpis();
        renderPetitionsTable();
        renderDatabaseView();
        return;
      }
    } catch (e) {
      petitions = [...INITIAL_DATABASE];
    }
  }

  if (!petitions || petitions.length === 0) {
    petitions = [...INITIAL_DATABASE];
  }
  savePetitionsToStorage();
}

async function savePetitionsToStorage(singlePetition = null) {
  // 1. Guardar en LocalStorage para redundancia instantánea
  localStorage.setItem('PET_DATABASE_MASTER_V4', JSON.stringify(petitions));
  updateKpis();
  renderPetitionsTable();
  renderDatabaseView();

  const baseUrl = getApiBaseUrl();

  // 2. Si se pasa una petición individual nueva, persistir directamente en /api/peticiones/crear
  if (singlePetition) {
    try {
      const res = await fetch(`${baseUrl}/api/peticiones/crear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(singlePetition)
      });
      if (res.ok) {
        console.log("✅ Petición persistida en peticiones_db.json vía /api/peticiones/crear");
        return;
      }
    } catch (e) {
      console.warn("Fallo enviando a /api/peticiones/crear, intentando volcado completo:", e);
    }
  }

  // 3. Volcado completo / sincronización en tiempo real
  try {
    const syncRes = await fetch(`${baseUrl}/api/sync-database`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(petitions)
    });
    if (syncRes.ok) {
      console.log("✅ Base de datos maestra sincronizada en servidor (peticiones_db.json)");
    }
  } catch (err) {
    console.warn("Sincronización con backend pet_peticion_medica pendiente:", err);
  }
}

// Escuchar cambios de almacenamiento en tiempo real desde Triaje PET/CT
window.addEventListener('storage', (e) => {
  if (e.key === 'PET_DATABASE_MASTER_V4' && e.newValue) {
    try {
      const updated = JSON.parse(e.newValue);
      if (Array.isArray(updated) && updated.length > 0) {
        petitions = updated;
        updateKpis();
        renderPetitionsTable();
        renderDatabaseView();
      }
    } catch (err) {}
  }
});

function checkExistingSession() {
  try {
    const sessionUser = localStorage.getItem('PET_AUTH_USER');
    if (sessionUser) {
      const parsed = JSON.parse(sessionUser);
      if (parsed && parsed.name) {
        currentUser = parsed;
      }
    }
  } catch (e) {
    currentUser = HOSPITAL_DOCTORS[0];
  }
  if (!currentUser || !currentUser.name) {
    currentUser = HOSPITAL_DOCTORS[0];
  }
  try {
    localStorage.setItem('PET_AUTH_USER', JSON.stringify(currentUser));
  } catch (e) {}
  showApp();
}

function showLogin() {
  const overlay = document.getElementById('login-overlay');
  if (overlay) {
    overlay.style.display = 'flex';
    overlay.classList.remove('hidden');
  }
}

function showApp() {
  const overlay = document.getElementById('login-overlay');
  if (overlay) {
    overlay.style.display = 'none';
    overlay.classList.add('hidden');
  }

  const mainApp = document.getElementById('main-app');
  if (mainApp) {
    mainApp.style.display = 'flex';
    mainApp.classList.remove('hidden');
  }

  if (!currentUser || !currentUser.name) {
    currentUser = HOSPITAL_DOCTORS[0];
  }

  const elAvatar = document.getElementById('header-user-avatar');
  if (elAvatar) elAvatar.textContent = currentUser.initials || 'CR';

  const elName = document.getElementById('header-user-name');
  if (elName) elName.textContent = currentUser.name;

  const elRole = document.getElementById('header-user-role');
  if (elRole) elRole.textContent = `${currentUser.specialty} (${currentUser.collegiate})`;

  const elPetDoc = document.getElementById('pet-doc-name');
  if (elPetDoc) elPetDoc.value = currentUser.name;

  const elConvDoc = document.getElementById('conv-doc-name');
  if (elConvDoc) elConvDoc.value = currentUser.name;

  const elDocBadge = document.getElementById('my-requests-doctor-badge');
  if (elDocBadge) elDocBadge.textContent = currentUser.name;

  try { updateKpis(); } catch (e) { console.warn("KPI error:", e); }
  try { renderPetitionsTable(); } catch (e) { console.warn("Table error:", e); }
  try { renderDatabaseView(); } catch (e) { console.warn("DB error:", e); }

  try { switchTab('tab-pet-request'); } catch (e) { console.warn("Tab switch error:", e); }
}

function quickLogin(docId) {
  const found = HOSPITAL_DOCTORS.find(d => d.id === docId) || HOSPITAL_DOCTORS[0];
  currentUser = found;
  try {
    localStorage.setItem('PET_AUTH_USER', JSON.stringify(currentUser));
  } catch (e) {}
  showApp();
  showToast(`Facultativo prescriptor activo: ${currentUser.name}`, 'success');
}

function handleManualLogin(event) {
  if (event) event.preventDefault();
  const userInput = document.getElementById('login-username');
  const username = (userInput && userInput.value.trim().toLowerCase()) || 'crodriguez';

  const found = HOSPITAL_DOCTORS.find(d => d.id.toLowerCase() === username) || HOSPITAL_DOCTORS[0];
  currentUser = found;
  try {
    localStorage.setItem('PET_AUTH_USER', JSON.stringify(currentUser));
  } catch (e) {}
  showApp();
  showToast(`Facultativo prescriptor activo: ${currentUser.name}`, 'success');
}

function logoutUser() {
  showLogin();
  showToast('Selecciona el facultativo que prescribirá la petición.', 'info');
}

// ==============================================================================
// Modalidad y Navegación
// ==============================================================================
function selectModality(mod) {
  activeModality = mod;
  const petHero = document.getElementById('hero-card-pet');
  const convHero = document.getElementById('hero-card-conv');

  if (mod === 'pet') {
    petHero.classList.add('active');
    convHero.classList.remove('active');
    switchTab('tab-pet-request');
    showToast('Modalidad seleccionada: Petición PET / CT Molecular', 'info');
  } else {
    convHero.classList.add('active');
    petHero.classList.remove('active');
    switchTab('tab-conv-request');
    showToast('Modalidad seleccionada: Medicina Nuclear Convencional', 'info');
  }
}

function switchTab(tabId) {
  document.querySelectorAll('.main-nav-tabs .nav-tab').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  document.querySelectorAll('.nav-content').forEach(c => {
    if (c.id === tabId) {
      c.classList.remove('hidden');
    } else {
      c.classList.add('hidden');
    }
  });

  if (tabId === 'tab-pet-request') {
    document.getElementById('hero-card-pet').classList.add('active');
    document.getElementById('hero-card-conv').classList.remove('active');
  } else if (tabId === 'tab-conv-request') {
    document.getElementById('hero-card-conv').classList.add('active');
    document.getElementById('hero-card-pet').classList.remove('active');
  } else if (tabId === 'tab-my-requests') {
    renderPetitionsTable();
  } else if (tabId === 'tab-database') {
    renderDatabaseView();
  }
}

// ==============================================================================
// LÓGICA DE FORMULARIO PET / CT (Exacta a Tally.so)
// ==============================================================================
function calculatePetBmi() {
  const weight = parseFloat(document.getElementById('pet-weight').value);
  const heightCm = parseFloat(document.getElementById('pet-height').value);
  const badge = document.getElementById('pet-bmi-display');

  if (weight > 0 && heightCm > 0) {
    const heightM = heightCm / 100;
    const bmi = (weight / (heightM * heightM)).toFixed(1);
    const bsa = (0.007184 * Math.pow(weight, 0.425) * Math.pow(heightCm, 0.725)).toFixed(2);
    badge.innerHTML = `<span>⚖️ IMC: <strong>${bmi} kg/m²</strong> | SC: <strong>${bsa} m²</strong></span>`;
  } else {
    badge.innerHTML = `<span>⚖️ IMC: -- kg/m²</span>`;
  }
}

function selectTallyPetType(petType) {
  document.querySelectorAll('.tally-pet-card').forEach(c => c.classList.remove('selected'));

  const criteriaBoxIds = [
    'criteria-box-fdg',
    'criteria-box-fdg-contraste',
    'criteria-box-fdg-hep',
    'criteria-box-psma',
    'criteria-box-ga68',
    'criteria-box-colina',
    'criteria-box-paratiroides',
    'criteria-box-neuro',
    'criteria-box-neuro-eeg'
  ];

  criteriaBoxIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });

  let cardId = 'card-tally-fdg';
  let boxId = 'criteria-box-fdg';
  const ptLower = (petType || '').toLowerCase();

  if (ptLower.includes('contraste')) {
    cardId = 'card-tally-fdg-contraste';
    boxId = 'criteria-box-fdg-contraste';
  } else if (ptLower.includes('endocarditis') || ptLower.includes('hep')) {
    cardId = 'card-tally-fdg-hep';
    boxId = 'criteria-box-fdg-hep';
  } else if (ptLower.includes('68ga-psma') || (ptLower.includes('ga68') && ptLower.includes('psma')) || (ptLower.includes('ga 68') && ptLower.includes('psma'))) {
    cardId = 'card-tally-ga68-psma';
    boxId = 'criteria-box-psma';
  } else if (ptLower.includes('dotatoc') || ptLower.includes('dotatate') || ptLower.includes('neuroendocrin')) {
    cardId = 'card-tally-ga68-dotatoc';
    boxId = 'criteria-box-ga68';
  } else if (ptLower.includes('paratiroides')) {
    cardId = 'card-tally-f18-paratiroides';
    boxId = 'criteria-box-paratiroides';
  } else if (ptLower.includes('colina')) {
    cardId = 'card-tally-f18-colina';
    boxId = 'criteria-box-colina';
  } else if (ptLower.includes('neurofisioneurolog') || ptLower.includes('neurofisiolog') || ptLower.includes('eeg')) {
    cardId = 'card-tally-fdg-neuro-eeg';
    boxId = 'criteria-box-neuro-eeg';
  } else if (ptLower.includes('neurol')) {
    cardId = 'card-tally-fdg-neuro-normal';
    boxId = 'criteria-box-neuro';
  } else if (ptLower.includes('18f-psma') || ptLower.includes('f psma') || ptLower.includes('fluor-psma')) {
    cardId = 'card-tally-f18-psma';
    boxId = 'criteria-box-psma';
  } else {
    // 1. FDG Oncológico / Inflamatorio por defecto
    cardId = 'card-tally-fdg';
    boxId = 'criteria-box-fdg';
  }

  const card = document.getElementById(cardId);
  if (card) {
    card.classList.add('selected');
    const input = typeof card.querySelector === 'function' ? card.querySelector('input') : null;
    if (input) input.checked = true;
  }
  const box = document.getElementById(boxId);
  if (box) box.classList.remove('hidden');
}

function setSedationChoice(val) {
  document.getElementById('pet-sedation').value = val;
  const btnNo = document.getElementById('btn-sedation-no');
  const btnYes = document.getElementById('btn-sedation-yes');
  if (val === 'Sí') {
    btnYes.className = 'tally-yn-btn selected-yes-blue';
    btnNo.className = 'tally-yn-btn';
  } else {
    btnNo.className = 'tally-yn-btn selected-no';
    btnYes.className = 'tally-yn-btn';
  }
}

function setInpatientChoice(val) {
  document.getElementById('pet-inpatient').value = val;
  const btnNo = document.getElementById('btn-inpatient-no');
  const btnYes = document.getElementById('btn-inpatient-yes');
  const box = document.getElementById('pet-inpatient-box');

  if (val === 'Sí') {
    btnYes.className = 'tally-yn-btn selected-yes-blue';
    btnNo.className = 'tally-yn-btn';
    box.classList.remove('hidden');
    document.getElementById('pet-room').required = true;
  } else {
    btnNo.className = 'tally-yn-btn selected-no';
    btnYes.className = 'tally-yn-btn';
    box.classList.add('hidden');
    document.getElementById('pet-room').required = false;
  }
}

function setDiabetesChoice(val) {
  document.getElementById('pet-diabetes').value = val;
  const btnNo = document.getElementById('btn-diabetes-no');
  const btnYes = document.getElementById('btn-diabetes-yes');
  const sub = document.getElementById('pet-diabetes-subfields');

  if (val === 'Sí') {
    btnYes.className = 'tally-yn-btn selected-yes-blue';
    btnNo.className = 'tally-yn-btn';
    sub.classList.remove('hidden');
  } else {
    btnNo.className = 'tally-yn-btn selected-no';
    btnYes.className = 'tally-yn-btn';
    sub.classList.add('hidden');
  }
}

function toggleRiskField(field, isYes) {
  tallyRiskFactors[field] = isYes;
  const btnNo = document.getElementById(`btn-${field}-no`);
  const btnYes = document.getElementById(`btn-${field}-yes`);
  const subBox = document.getElementById(`sub-${field}`);

  if (isYes) {
    btnYes.className = 'tally-yn-btn selected-yes';
    btnNo.className = 'tally-yn-btn';
    if (subBox) subBox.classList.remove('hidden');
  } else {
    btnNo.className = 'tally-yn-btn selected-no';
    btnYes.className = 'tally-yn-btn';
    if (subBox) subBox.classList.add('hidden');
  }
}

function selectPetPriority(val) {
  document.querySelectorAll('#tab-pet-request .priority-option-card').forEach(c => c.classList.remove('selected'));
  let cardId = 'card-p2';
  if (val === 'Urgente') cardId = 'card-p1';
  else if (val === 'Ordinaria') cardId = 'card-p3';

  const card = document.getElementById(cardId);
  if (card) {
    card.classList.add('selected');
    const input = typeof card.querySelector === 'function' ? card.querySelector('input') : null;
    if (input) input.checked = true;
  }
}

// Envío del Formulario PET
function handlePetSubmit(event) {
  event.preventDefault();

  const petType = document.querySelector('input[name="tally-pet-type"]:checked')?.value || 'FDG Oncológico / Inflamatorio';
  const service = document.getElementById('pet-service').value;
  const docName = document.getElementById('pet-doc-name').value;
  const patientName = document.getElementById('pet-patient-name').value.trim();
  const nhc = document.getElementById('pet-nhc').value.trim();
  const weight = parseFloat(document.getElementById('pet-weight').value);
  const height = parseFloat(document.getElementById('pet-height').value);
  const nextVisit = document.getElementById('pet-next-visit').value.trim();
  const sedation = document.getElementById('pet-sedation').value;
  const inpatient = document.getElementById('pet-inpatient').value;
  const diabetes = document.getElementById('pet-diabetes').value;
  const mobility = document.getElementById('pet-patient-mobility').value;
  const summary = document.getElementById('pet-summary').value.trim();
  const priority = document.querySelector('input[name="pet-priority"]:checked')?.value || 'Preferente';
  const priorityJust = document.getElementById('pet-priority-just').value.trim();

  let diagnosis = '';
  let reason = '';
  const ptLower = petType.toLowerCase();

  if (ptLower.includes('contraste')) {
    const diag = document.getElementById('fdg-contraste-diagnosis')?.value.trim() || 'Estudio Oncológico con TC Contraste IV';
    const r = document.getElementById('fdg-contraste-reason')?.value || 'Estadificación con Contraste IV';
    const creat = document.getElementById('fdg-contraste-creatinine')?.value.trim();
    const egfr = document.getElementById('fdg-contraste-egfr')?.value.trim();
    const allergy = document.getElementById('fdg-contraste-allergy')?.value;
    diagnosis = `${diag} (Creat: ${creat || '--'} mg/dL, eGFR: ${egfr || '--'})`;
    reason = `${r} — Alergia: ${allergy || 'No conocida'}`;
  } else if (ptLower.includes('endocarditis') || ptLower.includes('hep')) {
    const susp = document.getElementById('fdg-hep-suspicion')?.value || 'Endocarditis';
    const hemo = document.getElementById('fdg-hep-bloodculture')?.value.trim() || 'Negativos';
    const prep = document.getElementById('fdg-hep-prep')?.value || 'Confirmada preparación HEP';
    diagnosis = `Sospecha Infección Cardíaca: ${susp}`;
    reason = `Protocolo HEP Miocárdico (Hemocultivos: ${hemo}) — ${prep}`;
  } else if (ptLower.includes('68ga-psma') || ptLower.includes('18f-psma') || ptLower.includes('psma')) {
    const vals = document.getElementById('psma-values')?.value.trim() || 'PSA en ascenso';
    const sit = document.getElementById('psma-situation')?.value || 'Recidiva bioquímica';
    const kin = document.getElementById('psma-kinetics')?.value.trim();
    diagnosis = `Cáncer de Próstata — ${vals}`;
    reason = `${sit}${kin ? ` (Cinética/Tto: ${kin})` : ''}`;
  } else if (ptLower.includes('dotatoc') || ptLower.includes('dotatate') || ptLower.includes('neuroendocrin')) {
    const ind = document.getElementById('ga68-indication')?.value || 'Estadificación TNE';
    const gr = document.getElementById('ga68-grade')?.value.trim() || 'G1/G2';
    const tto = document.getElementById('ga68-somatostatin-therapy')?.value.trim();
    diagnosis = `Tumor Neuroendocrino — ${gr}`;
    reason = `68Ga-DOTATOC: ${ind}${tto ? ` (Tto: ${tto})` : ''}`;
  } else if (ptLower.includes('paratiroides')) {
    const pth = document.getElementById('paratiroides-pth')?.value.trim();
    const ca = document.getElementById('paratiroides-calcium')?.value.trim();
    const surg = document.getElementById('paratiroides-surgery')?.value || 'Sin cirugía previa';
    const prev = document.getElementById('paratiroides-previous-tests')?.value.trim();
    diagnosis = `Hiperparatiroidismo — PTH: ${pth || '--'} pg/mL, Ca: ${ca || '--'} mg/dL`;
    reason = `Localización Adenoma Paratiroideo (${surg})${prev ? ` — Pruebas: ${prev}` : ''}`;
  } else if (ptLower.includes('colina')) {
    const ind = document.getElementById('colina-indication')?.value || 'Adenocarcinoma Próstata';
    const vals = document.getElementById('colina-values')?.value.trim() || 'Valores control';
    diagnosis = `18F-Colina — ${ind}`;
    reason = `Marcadores/PSA: ${vals}`;
  } else if (ptLower.includes('neurofisioneurolog') || ptLower.includes('neurofisiolog') || ptLower.includes('eeg')) {
    const typ = document.getElementById('neuro-eeg-type')?.value || 'Epilepsia farmacorresistente';
    const prot = document.getElementById('neuro-eeg-protocol')?.value || 'Monitorización Video-EEG';
    const det = document.getElementById('neuro-eeg-details')?.value.trim();
    diagnosis = `Epilepsia Farmacorresistente — ${typ}`;
    reason = `PET + Neurofisiología (${prot})${det ? ` — ${det}` : ''}`;
  } else if (ptLower.includes('neurol')) {
    const ind = document.getElementById('neuro-indication')?.value || 'Deterioro cognitivo';
    const det = document.getElementById('neuro-details')?.value.trim() || 'Estudio metabólico cerebral';
    diagnosis = `PET Neurológico Cognitivo — ${ind}`;
    reason = `Evaluación Demencias (${det})`;
  } else {
    diagnosis = document.getElementById('fdg-diagnosis')?.value.trim() || 'Estudio Oncológico / Inflamatorio';
    reason = document.getElementById('fdg-reason')?.value || 'Estadificación inicial';
  }

  const heightM = height / 100;
  const bmiVal = (weight / (heightM * heightM)).toFixed(1);

  const subId = `sub_${Math.floor(10000000 + Math.random() * 90000000)}`;
  const respId = `resp_${Math.floor(10000000 + Math.random() * 90000000)}`;
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  // Objeto Maestro compatible con el esquema de pet_ct_triage
  const newPetitionRecord = {
    "Submission ID": subId,
    "Respondent ID": respId,
    "Modalidad": "PET",
    "Fecha Solicitud": dateStr,
    "NHC / Historia Clínica": nhc,
    "Nombre del Paciente": patientName,
    "Nombre y Apellidos": patientName,
    "Sexo": "No especificado",
    "Edad": 65,
    "Talla (cm)": height,
    "Peso (kg)": weight,
    "Servicio Solicitante": service,
    "Médico Solicitante": docName,
    "Diagnóstico Clínico": diagnosis,
    "Motivo de Solicitud": reason,
    "Tipo de Estudio PET Solicitado": petType,
    "Carácter de la Petición": priority,
    "Prioridad Calculada": priority === 'Urgente' ? '🔴 P1' : (priority === 'Preferente' ? '🟡 P2' : '🟢 P3'),
    "Ventana Clínica (Días Laborables)": priority === 'Urgente' ? 7 : (priority === 'Preferente' ? 14 : 30),
    "Fecha Próxima Consulta": nextVisit,
    "Fecha Cita Asignada": "",
    "Hora Cita Asignada": "",
    "¿El paciente está ingresado?": inpatient,
    "¿Precisa sedación?": sedation,
    "Movilidad / Traslado": mobility,
    "¿Tiene Diabetes Mellitus?": diabetes,
    "Glucemia (mg/dL)": diabetes === 'Sí' ? 140 : 100,
    "Fin Tratamiento QT/RT": tallyRiskFactors.chemo ? document.getElementById('input-chemo')?.value : "",
    "Alergias Conocidas": tallyRiskFactors.allergies ? (document.getElementById('input-allergies')?.value || 'Sí') : 'Ninguna',
    "Contraindicación Contraste": tallyRiskFactors.contrast ? 'Sí' : 'No',
    "Portador Objetos Metálicos": tallyRiskFactors.metal ? (document.getElementById('input-metal')?.value || 'Sí') : 'No',
    "Alertas Técnicas": priority === 'Urgente' ? 'Prioridad Asistencial P1' : 'Ninguna',
    "Estado de Triaje": "Pendiente de Triaje",
    "Resumen Clínico": summary
  };

  // Iniciar Paso de Doble Confirmación (NO guardar hasta confirmación explícita)
  pendingPetitionToConfirm = newPetitionRecord;
  pendingFormType = 'pet';
  openDoubleConfirmationModal(newPetitionRecord, false);
  showToast('Por favor, revise los datos del volante e imprima el PDF antes de confirmar.', 'info');
}

function resetPetForm() {
  document.getElementById('pet-request-form').reset();
  if (currentUser) document.getElementById('pet-doc-name').value = currentUser.name;
  calculatePetBmi();
  selectTallyPetType('FDG Oncológico / Inflamatorio');
  setSedationChoice('No');
  setInpatientChoice('No');
  setDiabetesChoice('No');
  selectPetPriority('Preferente');

  Object.keys(tallyRiskFactors).forEach(k => {
    toggleRiskField(k, false);
  });
}

function loadSamplePetData() {
  document.getElementById('pet-patient-name').value = 'Ignacio San Román Gil';
  document.getElementById('pet-nhc').value = 'NHC-847291';
  document.getElementById('pet-weight').value = 74;
  document.getElementById('pet-height').value = 173;
  document.getElementById('pet-next-visit').value = '23/10/2026 (Comité de Tumores)';
  document.getElementById('pet-summary').value = 'Adenocarcinoma pulmonar lóbulo superior derecho confirmado. Se solicita PET para estadificación ganglionar mediastínica y descartar enfermedad a distancia.';
  document.getElementById('fdg-diagnosis').value = 'CPNCP Lóbulo Superior Derecho Estadio cT2aN0M0';
  document.getElementById('fdg-reason').value = 'Estadificación inicial';
  document.getElementById('pet-priority-just').value = 'Fecha de comité el próximo jueves para planificar lobectomía.';

  calculatePetBmi();
  selectTallyPetType('FDG Oncológico / Inflamatorio');
  selectPetPriority('Urgente');
  showToast('Caso PET de ejemplo cargado (CPNCP para FDG Oncológico / Inflamatorio).', 'success');
}

// ==============================================================================
// LÓGICA DE FORMULARIO MEDICINA NUCLEAR CONVENCIONAL
// ==============================================================================
function selectConvStudy(studyName) {
  document.querySelectorAll('.conv-card').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('.conv-card').forEach(card => {
    const radio = card.querySelector('input');
    if (radio && radio.value === studyName) {
      card.classList.add('selected');
      radio.checked = true;
    }
  });
}

function selectConvPriority(val) {
  document.querySelectorAll('#tab-conv-request .priority-option-card').forEach(c => c.classList.remove('selected'));
  let cardId = 'card-conv-p2';
  if (val === 'Urgente') cardId = 'card-conv-p1';
  else if (val === 'Ordinaria') cardId = 'card-conv-p3';

  const card = document.getElementById(cardId);
  if (card) {
    card.classList.add('selected');
    const input = typeof card.querySelector === 'function' ? card.querySelector('input') : null;
    if (input) input.checked = true;
  }
}

function handleConvSubmit(event) {
  event.preventDefault();

  const studyType = document.querySelector('input[name="conv-study-type"]:checked')?.value || 'Gammagrafía Ósea / SPECT-CT';
  const service = document.getElementById('conv-service').value;
  const docName = document.getElementById('conv-doc-name').value;
  const patientName = document.getElementById('conv-patient-name').value.trim();
  const nhc = document.getElementById('conv-nhc').value.trim();
  const weight = parseFloat(document.getElementById('conv-weight').value);
  const mobility = document.getElementById('conv-mobility').value;
  const diagnosis = document.getElementById('conv-diagnosis').value.trim();
  const nextVisit = document.getElementById('conv-urgency-date').value.trim();
  const summary = document.getElementById('conv-summary').value.trim();
  const priority = document.querySelector('input[name="conv-priority"]:checked')?.value || 'Preferente';

  const subId = `sub_${Math.floor(10000000 + Math.random() * 90000000)}`;
  const respId = `resp_${Math.floor(10000000 + Math.random() * 90000000)}`;
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  const newPetitionRecord = {
    "Submission ID": subId,
    "Respondent ID": respId,
    "Modalidad": "CONVENCIONAL",
    "Fecha Solicitud": dateStr,
    "NHC / Historia Clínica": nhc,
    "Nombre del Paciente": patientName,
    "Nombre y Apellidos": patientName,
    "Sexo": "No especificado",
    "Edad": 60,
    "Talla (cm)": 170,
    "Peso (kg)": weight,
    "Servicio Solicitante": service,
    "Médico Solicitante": docName,
    "Diagnóstico Clínico": diagnosis,
    "Motivo de Solicitud": studyType,
    "Tipo de Estudio PET Solicitado": studyType,
    "Carácter de la Petición": priority,
    "Prioridad Calculada": priority === 'Urgente' ? '🔴 P1' : (priority === 'Preferente' ? '🟡 P2' : '🟢 P3'),
    "Ventana Clínica (Días Laborables)": priority === 'Urgente' ? 7 : (priority === 'Preferente' ? 14 : 30),
    "Fecha Próxima Consulta": nextVisit,
    "Fecha Cita Asignada": "",
    "Hora Cita Asignada": "",
    "¿El paciente está ingresado?": "No",
    "¿Precisa sedación?": "No",
    "Movilidad / Traslado": mobility,
    "¿Tiene Diabetes Mellitus?": "No",
    "Glucemia (mg/dL)": 100,
    "Fin Tratamiento QT/RT": "",
    "Alergias Conocidas": "Ninguna",
    "Contraindicación Contraste": "No",
    "Portador Objetos Metálicos": "No",
    "Alertas Técnicas": "Medicina Nuclear Convencional",
    "Estado de Triaje": "Pendiente de Triaje",
    "Resumen Clínico": summary
  };

  // Iniciar Paso de Doble Confirmación (NO guardar hasta confirmación explícita)
  pendingPetitionToConfirm = newPetitionRecord;
  pendingFormType = 'conv';
  openDoubleConfirmationModal(newPetitionRecord, false);
  showToast('Por favor, revise los datos del volante e imprima el PDF antes de confirmar.', 'info');
}

function resetConvForm() {
  document.getElementById('conv-request-form').reset();
  if (currentUser) document.getElementById('conv-doc-name').value = currentUser.name;
  selectConvStudy('Gammagrafía Ósea / SPECT-CT');
  selectConvPriority('Preferente');
}

function loadSampleConvData() {
  document.getElementById('conv-patient-name').value = 'Mercedes Valls Herrero';
  document.getElementById('conv-nhc').value = 'NHC-554210';
  document.getElementById('conv-weight').value = 65;
  document.getElementById('conv-diagnosis').value = 'Carcinoma de mama infiltrante en mama izquierda. Cirugía programada con biopsia de ganglio centinela.';
  document.getElementById('conv-urgency-date').value = 'Intervención quirúrgica programada para el 21/10/2026 a las 08:30 h';
  document.getElementById('conv-summary').value = 'Inyección periareolar de 99mTc-Nanocoloides y detección gammagráfica prequirúrgica de ganglio centinela axilar.';

  selectConvStudy('Biopsia Selectiva Ganglio Centinela (BSGC)');
  selectConvPriority('Urgente');
  showToast('Caso convencional de ejemplo cargado (Ganglio Centinela BSGC).', 'success');
}

// ==============================================================================
// KPIs y Métricas (Exclusivos de las peticiones del médico en sesión)
// ==============================================================================
function updateKpis() {
  const myPetitions = petitions.filter(isPetitionFromCurrentDoctor);
  const total = myPetitions.length;
  let petCount = 0;
  let convCount = 0;
  let p1Count = 0;
  let p2Count = 0;
  let p3Count = 0;

  myPetitions.forEach(p => {
    const mod = p["Modalidad"] || (p.modality) || "PET";
    const prio = p["Carácter de la Petición"] || p.priority || "";

    if (mod === 'PET') petCount++;
    else convCount++;

    if (prio === 'Urgente' || prio.includes('P1')) p1Count++;
    else if (prio === 'Preferente' || prio.includes('P2')) p2Count++;
    else p3Count++;
  });

  const elTotal = document.getElementById('kpi-total-requests');
  if (elTotal) elTotal.textContent = total;
  const elPet = document.getElementById('kpi-pet-requests');
  if (elPet) elPet.textContent = petCount;
  const elConv = document.getElementById('kpi-conv-requests');
  if (elConv) elConv.textContent = convCount;
  const elP1 = document.getElementById('kpi-p1-requests');
  if (elP1) elP1.textContent = p1Count;
  const elP2 = document.getElementById('kpi-p2-requests');
  if (elP2) elP2.textContent = p2Count;
  const elP3 = document.getElementById('kpi-p3-requests');
  if (elP3) elP3.textContent = p3Count;

  const elTabBadge = document.getElementById('tab-badge-my-count');
  if (elTabBadge) elTabBadge.textContent = total;
  const dbBadge = document.getElementById('tab-badge-db-count');
  if (dbBadge) dbBadge.textContent = total;
}

// ==============================================================================
// Tabla de Mis Peticiones (Privacidad médica estricta: solo pacientes del propio médico)
// ==============================================================================
function renderPetitionsTable() {
  const tbody = document.getElementById('petitions-table-body');
  if (!tbody) return;

  const myPetitions = petitions.filter(isPetitionFromCurrentDoctor);

  const searchTerm = (document.getElementById('filter-search-input')?.value || '').toLowerCase().trim();
  const modalityFilter = document.getElementById('filter-modality-select')?.value || 'TODOS';
  const statusFilter = document.getElementById('filter-status-select')?.value || 'TODOS';

  const filtered = myPetitions.filter(p => {
    const nhc = (p["NHC / Historia Clínica"] || p.nhc || '').toLowerCase();
    const name = (p["Nombre del Paciente"] || p.patientName || '').toLowerCase();
    const diag = (p["Diagnóstico Clínico"] || p.diagnosis || '').toLowerCase();
    const study = (p["Tipo de Estudio PET Solicitado"] || p.studyType || '').toLowerCase();
    const mod = p["Modalidad"] || p.modality || "PET";
    const status = p["Estado de Triaje"] || p.status || "Pendiente de Triaje";

    if (searchTerm) {
      if (!nhc.includes(searchTerm) && !name.includes(searchTerm) && !diag.includes(searchTerm) && !study.includes(searchTerm)) {
        return false;
      }
    }

    if (modalityFilter === 'PET' && mod !== 'PET') return false;
    if (modalityFilter === 'CONVENCIONAL' && mod !== 'CONVENCIONAL') return false;

    if (statusFilter !== 'TODOS' && status !== statusFilter) return false;

    return true;
  });

  if (filtered.length === 0) {
    const docName = currentUser?.name || 'su usuario';
    tbody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align: center; padding: 2.5rem; color: #64748B;">
          🔒 No se encontraron solicitudes registradas para <strong>${docName}</strong> que coincidan con los filtros seleccionados.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(p => {
    const id = p["Submission ID"] || p.id;
    const mod = p["Modalidad"] || p.modality || "PET";
    const date = p["Fecha Solicitud"] || p.date;
    const nhc = p["NHC / Historia Clínica"] || p.nhc;
    const patient = p["Nombre del Paciente"] || p.patientName;
    const study = p["Tipo de Estudio PET Solicitado"] || p.studyType;
    const prio = p["Carácter de la Petición"] || p.priority || "Preferente";
    const status = p["Estado de Triaje"] || p.status || "Pendiente de Triaje";
    const assignedDate = p["Fecha Cita Asignada"] || p.assignedDate;
    const assignedTime = p["Hora Cita Asignada"] || p.assignedTime;

    let priorityClass = 'p2';
    if (prio === 'Urgente' || prio.includes('P1')) priorityClass = 'p1';
    else if (prio === 'Ordinaria' || prio === 'Ordinario' || prio.includes('P3')) priorityClass = 'p3';

    let modalityBadge = mod === 'PET' ? `<span class="badge-modality pet">☢️ PET/CT</span>` : `<span class="badge-modality conv">⚛️ CONV.</span>`;

    let statusClass = 'pendiente';
    let statusIcon = '⏳';
    if (status === 'Cita Asignada') {
      statusClass = 'citado';
      statusIcon = '📅';
    } else if (status === 'Realizado') {
      statusClass = 'realizado';
      statusIcon = '✅';
    }

    const assignedDateText = assignedDate ? `<strong>${assignedDate}</strong><br><span style="font-size:0.75rem; color:#64748B;">${assignedTime || ''}</span>` : '<span style="color:#94A3B8;">En triaje</span>';

    return `
      <tr>
        <td><strong style="color: var(--blue-corporate);">${id}</strong></td>
        <td>${modalityBadge}</td>
        <td>${date}</td>
        <td><code>${nhc}</code></td>
        <td><strong>${patient}</strong></td>
        <td><span style="font-weight: 600; color: #1E293B;">${study}</span></td>
        <td><span class="badge-priority ${priorityClass}">${prio}</span></td>
        <td><span class="badge-status ${statusClass}">${statusIcon} ${status}</span></td>
        <td>${assignedDateText}</td>
        <td style="text-align: right; white-space: nowrap;">
          <button class="btn btn-secondary" style="padding: 0.35rem 0.65rem; font-size: 0.78rem;" onclick="openOfficialSheetById('${id}')" title="Ver Volante Imprimible">
            🖨️ Volante
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// ==============================================================================
// GESTOR DE BASE DE DATOS (Interoperabilidad con Triaje PET - Vista Filtrada)
// ==============================================================================
function renderDatabaseView() {
  const myPetitions = petitions.filter(isPetitionFromCurrentDoctor);
  const total = myPetitions.length;
  let petCount = 0;
  let convCount = 0;

  myPetitions.forEach(p => {
    const mod = p["Modalidad"] || p.modality || "PET";
    if (mod === 'PET') petCount++;
    else convCount++;
  });

  const totalEl = document.getElementById('db-stat-total');
  const petEl = document.getElementById('db-stat-pet');
  const convEl = document.getElementById('db-stat-conv');
  const updatedEl = document.getElementById('db-stat-updated');
  const dbBadge = document.getElementById('tab-badge-db-count');

  if (totalEl) totalEl.textContent = total;
  if (petEl) petEl.textContent = petCount;
  if (convEl) convEl.textContent = convCount;
  if (updatedEl) updatedEl.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (dbBadge) dbBadge.textContent = total;

  // Filtrado de la tabla de base de datos
  const searchTerm = (document.getElementById('db-search-input')?.value || '').toLowerCase().trim();
  const modalityFilter = document.getElementById('db-filter-modality')?.value || 'TODOS';
  const tbody = document.getElementById('db-table-body');

  if (!tbody) return;

  const filtered = myPetitions.filter(p => {
    const mod = p["Modalidad"] || p.modality || "PET";
    const nhc = (p["NHC / Historia Clínica"] || p.nhc || '').toLowerCase();
    const name = (p["Nombre del Paciente"] || p.patientName || '').toLowerCase();
    const diag = (p["Diagnóstico Clínico"] || p.diagnosis || '').toLowerCase();
    const subId = (p["Submission ID"] || p.id || '').toLowerCase();

    if (modalityFilter === 'PET' && mod !== 'PET') return false;
    if (modalityFilter === 'CONVENCIONAL' && mod !== 'CONVENCIONAL') return false;

    if (searchTerm) {
      if (!nhc.includes(searchTerm) && !name.includes(searchTerm) && !diag.includes(searchTerm) && !subId.includes(searchTerm)) {
        return false;
      }
    }
    return true;
  });

  tbody.innerHTML = filtered.map(p => {
    const id = p["Submission ID"] || p.id;
    const mod = p["Modalidad"] || p.modality || "PET";
    const date = p["Fecha Solicitud"] || p.date;
    const nhc = p["NHC / Historia Clínica"] || p.nhc;
    const patient = p["Nombre del Paciente"] || p.patientName;
    const service = p["Servicio Solicitante"] || p.service;
    const doc = p["Médico Solicitante"] || p.docName;
    const diag = p["Diagnóstico Clínico"] || p.diagnosis;
    const study = p["Tipo de Estudio PET Solicitado"] || p.studyType;
    const carac = p["Carácter de la Petición"] || p.priority;
    const prioCalc = p["Prioridad Calculada"] || (carac === 'Urgente' ? '🔴 P1' : '🟡 P2');
    const nextVisit = p["Fecha Próxima Consulta"] || p.nextVisit || '--';
    const cita = p["Fecha Cita Asignada"] ? `${p["Fecha Cita Asignada"]} ${p["Hora Cita Asignada"] || ''}` : 'Sin asignar';
    const ing = p["¿El paciente está ingresado?"] || p.inpatient || 'No';
    const diab = p["¿Tiene Diabetes Mellitus?"] || p.diabetes || 'No';
    const alerg = p["Alergias Conocidas"] || p.allergies || 'Ninguna';
    const alert = p["Alertas Técnicas"] || 'Ninguna';

    return `
      <tr>
        <td><code>${id}</code></td>
        <td><strong>${mod}</strong></td>
        <td>${date}</td>
        <td><code>${nhc}</code></td>
        <td><strong>${patient}</strong></td>
        <td>${service}</td>
        <td>${doc}</td>
        <td title="${diag}">${diag}</td>
        <td>${study}</td>
        <td>${carac}</td>
        <td>${prioCalc}</td>
        <td>${nextVisit}</td>
        <td>${cita}</td>
        <td>${ing}</td>
        <td>${diab}</td>
        <td>${alerg}</td>
        <td><small>${alert}</small></td>
      </tr>
    `;
  }).join('');

  // Actualizar el visor JSON crudo
  const rawContainer = document.getElementById('db-json-raw-display');
  if (rawContainer) {
    rawContainer.textContent = JSON.stringify(petitions, null, 2);
  }
}

// Descargar JSON oficial (esquema idéntico a pacientes_pet_ct_250.json)
// Exportar las peticiones exclusivas del médico activo a JSON
function exportMyPetitionsToJson() {
  const myPetitions = petitions.filter(isPetitionFromCurrentDoctor);
  const docNameClean = (currentUser?.name || 'facultativo').replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, '_');
  const filename = `mis_peticiones_${docNameClean}_${new Date().toISOString().split('T')[0]}.json`;

  const blob = new Blob([JSON.stringify(myPetitions, null, 2)], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.setAttribute("href", url);
  a.setAttribute("download", filename);
  document.body.appendChild(a);
  a.click();
  a.remove();
  showToast(`✅ Exportadas ${myPetitions.length} peticiones de ${currentUser?.name || 'su usuario'}.`, 'success');
}

function downloadDatabaseJson() {
  exportMyPetitionsToJson();
}

// Descargar CSV oficial con los campos del médico activo
function downloadDatabaseCsv() {
  const myPetitions = petitions.filter(isPetitionFromCurrentDoctor);
  if (myPetitions.length === 0) {
    showToast('No hay peticiones para exportar para este facultativo.', 'warning');
    return;
  }

  // Columnas oficiales
  const headers = [
    "Submission ID",
    "Respondent ID",
    "Modalidad",
    "Fecha Solicitud",
    "NHC / Historia Clínica",
    "Nombre del Paciente",
    "Nombre y Apellidos",
    "Sexo",
    "Edad",
    "Talla (cm)",
    "Peso (kg)",
    "Servicio Solicitante",
    "Médico Solicitante",
    "Diagnóstico Clínico",
    "Motivo de Solicitud",
    "Tipo de Estudio PET Solicitado",
    "Carácter de la Petición",
    "Prioridad Calculada",
    "Ventana Clínica (Días Laborables)",
    "Fecha Próxima Consulta",
    "Fecha Cita Asignada",
    "Hora Cita Asignada",
    "¿El paciente está ingresado?",
    "¿Precisa sedación?",
    "Movilidad / Traslado",
    "¿Tiene Diabetes Mellitus?",
    "Glucemia (mg/dL)",
    "Fin Tratamiento QT/RT",
    "Alergias Conocidas",
    "Contraindicación Contraste",
    "Portador Objetos Metálicos",
    "Alertas Técnicas",
    "Estado de Triaje",
    "Resumen Clínico"
  ];

  let csvContent = "\uFEFF" + headers.join(",") + "\n";

  myPetitions.forEach(row => {
    const values = headers.map(header => {
      let val = row[header];
      if (val === undefined || val === null) val = "";
      val = String(val).replace(/"/g, '""');
      if (val.includes(",") || val.includes("\n") || val.includes('"')) {
        return `"${val}"`;
      }
      return val;
    });
    csvContent += values.join(",") + "\n";
  });

  const docNameClean = (currentUser?.name || 'facultativo').replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, '_');
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.setAttribute("href", url);
  a.setAttribute("download", `peticiones_${docNameClean}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(a);
  a.click();
  a.remove();
  showToast(`Base de datos CSV de ${currentUser?.name || 'su usuario'} exportada correctamente.`, 'success');
}

// Importar archivo JSON a la base de datos
function importDatabaseFromFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importedData = JSON.parse(e.target.result);
      if (Array.isArray(importedData) && importedData.length > 0) {
        petitions = importedData;
        savePetitionsToStorage();
        showToast(`✅ Base de datos restaurada: ${petitions.length} solicitudes importadas.`, 'success');
      } else {
        showToast('El archivo no contiene un formato de peticiones válido.', 'error');
      }
    } catch (err) {
      showToast('Error parseando archivo JSON: ' + err.message, 'error');
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

// Restablecer base de datos
function resetDatabaseToFactory() {
  if (confirm('¿Desea restablecer la base de datos a los casos hospitalarios iniciales?')) {
    petitions = [...INITIAL_DATABASE];
    savePetitionsToStorage();
    showToast('Base de datos restablecida a los valores de prueba originales.', 'info');
  }
}

// Copiar JSON
function copyRawJsonToClipboard() {
  const rawText = JSON.stringify(petitions, null, 2);
  navigator.clipboard.writeText(rawText).then(() => {
    showToast('JSON copiado al portapapeles.', 'success');
  }).catch(() => {
    showToast('No se pudo copiar automáticamente. Selecciónelo manualmente.', 'warning');
  });
}

// ==============================================================================
// Modal de Volante Oficial Imprimible
// ==============================================================================
function openOfficialSheetById(id) {
  const p = petitions.find(item => (item["Submission ID"] === id || item.id === id));
  if (p) openOfficialSheetModal(p, true);
}

function previewOfficialSheet(type) {
  if (type === 'pet') {
    const petType = document.querySelector('input[name="tally-pet-type"]:checked')?.value || '18F-FDG';
    const p = {
      "Submission ID": "sub_PREVIEW",
      "Modalidad": "PET",
      "Fecha Solicitud": new Date().toISOString().split('T')[0],
      "NHC / Historia Clínica": document.getElementById('pet-nhc').value || 'NHC-BORRADOR',
      "Nombre del Paciente": document.getElementById('pet-patient-name').value || 'Paciente en Curso',
      "Peso (kg)": document.getElementById('pet-weight').value || 70,
      "Talla (cm)": document.getElementById('pet-height').value || 170,
      "Servicio Solicitante": document.getElementById('pet-service').value,
      "Médico Solicitante": currentUser?.name || 'Dr. Facultativo',
      "Tipo de Estudio PET Solicitado": petType,
      "Diagnóstico Clínico": document.getElementById('fdg-diagnosis')?.value || 'Diagnóstico preliminar',
      "Fecha Próxima Consulta": document.getElementById('pet-next-visit').value || '--',
      "¿Precisa sedación?": document.getElementById('pet-sedation').value,
      "¿Tiene Diabetes Mellitus?": document.getElementById('pet-diabetes').value,
      "Movilidad / Traslado": document.getElementById('pet-patient-mobility').value,
      "Alergias Conocidas": tallyRiskFactors.allergies ? 'Sí' : 'Ninguna',
      "Contraindicación Contraste": tallyRiskFactors.contrast ? 'Sí' : 'No',
      "Portador Objetos Metálicos": tallyRiskFactors.metal ? 'Sí' : 'No',
      "Resumen Clínico": document.getElementById('pet-summary').value || 'Borrador de solicitud.',
      "Carácter de la Petición": document.querySelector('input[name="pet-priority"]:checked')?.value || 'Preferente'
    };
    openOfficialSheetModal(p);
  } else {
    const studyType = document.querySelector('input[name="conv-study-type"]:checked')?.value || 'Gammagrafía Ósea';
    const p = {
      "Submission ID": "sub_PREVIEW",
      "Modalidad": "CONVENCIONAL",
      "Fecha Solicitud": new Date().toISOString().split('T')[0],
      "NHC / Historia Clínica": document.getElementById('conv-nhc').value || 'NHC-BORRADOR',
      "Nombre del Paciente": document.getElementById('conv-patient-name').value || 'Paciente en Curso',
      "Peso (kg)": document.getElementById('conv-weight').value || 70,
      "Talla (cm)": 170,
      "Servicio Solicitante": document.getElementById('conv-service').value,
      "Médico Solicitante": currentUser?.name || 'Dr. Facultativo',
      "Tipo de Estudio PET Solicitado": studyType,
      "Diagnóstico Clínico": document.getElementById('conv-diagnosis').value || 'Sospecha preliminar',
      "Fecha Próxima Consulta": document.getElementById('conv-urgency-date').value || '--',
      "¿Precisa sedación?": "No",
      "¿Tiene Diabetes Mellitus?": "No",
      "Movilidad / Traslado": document.getElementById('conv-mobility').value,
      "Alergias Conocidas": "Ninguna",
      "Contraindicación Contraste": "No",
      "Portador Objetos Metálicos": "No",
      "Resumen Clínico": document.getElementById('conv-summary').value || 'Borrador de solicitud.',
      "Carácter de la Petición": document.querySelector('input[name="conv-priority"]:checked')?.value || 'Preferente'
    };
    openDoubleConfirmationModal(p, false);
  }
}

function openDoubleConfirmationModal(p, isAlreadyConfirmed = false) {
  currentViewingPetition = p;

  const mod = p["Modalidad"] || p.modality || "PET";
  const id = p["Submission ID"] || p.id || "sub_0000";

  const headerTitle = document.getElementById('sheet-modal-header-title');
  if (headerTitle) {
    headerTitle.textContent = isAlreadyConfirmed 
      ? (mod === 'PET' ? '📄 Volante Registrado — PET / CT Molecular' : '📄 Volante Registrado — Medicina Nuclear Convencional')
      : (mod === 'PET' ? '📄 Doble Confirmación — Volante PET / CT' : '📄 Doble Confirmación — Volante Medicina Nuclear');
  }

  const docTitle = document.getElementById('sheet-header-doc-title');
  if (docTitle) {
    docTitle.textContent = mod === 'PET' ? 'VOLANTE OFICIAL DE PETICIÓN PET / CT' : 'VOLANTE DE MEDICINA NUCLEAR CONVENCIONAL';
  }

  document.getElementById('sheet-sub-id').textContent = id;
  document.getElementById('sheet-barcode-text').textContent = `||| ${id.replace('sub_', '')} |||||`;
  document.getElementById('sheet-timestamp').textContent = `Fecha: ${p["Fecha Solicitud"] || p.date || ''}`;

  document.getElementById('sheet-nhc').textContent = p["NHC / Historia Clínica"] || p.nhc || '--';
  document.getElementById('sheet-name').textContent = p["Nombre del Paciente"] || p.patientName || '--';
  document.getElementById('sheet-weight-height').textContent = `${p["Peso (kg)"] || p.weight || '--'} kg / ${p["Talla (cm)"] || p.height || '--'} cm`;
  document.getElementById('sheet-regime-mobility').textContent = `${p["Movilidad / Traslado"] || p.mobility || 'Autónomo'} / Ingr: ${p["¿El paciente está ingresado?"] || p.inpatient || 'No'}`;
  document.getElementById('sheet-sedation').textContent = p["¿Precisa sedación?"] || p.sedation || 'No';
  document.getElementById('sheet-diabetes').textContent = p["¿Tiene Diabetes Mellitus?"] || p.diabetes || 'No';

  document.getElementById('sheet-doc-name').textContent = p["Médico Solicitante"] || p.docName || '--';
  document.getElementById('sheet-doc-service').textContent = p["Servicio Solicitante"] || p.service || '--';
  document.getElementById('sheet-next-visit').textContent = p["Fecha Próxima Consulta"] || p.nextVisit || '--';

  document.getElementById('sheet-study-type').textContent = p["Tipo de Estudio PET Solicitado"] || p.studyType || '--';
  document.getElementById('sheet-priority').textContent = p["Carácter de la Petición"] || p.priority || '--';
  document.getElementById('sheet-diag').textContent = p["Diagnóstico Clínico"] || p.diagnosis || p["Motivo de Solicitud"] || '--';
  document.getElementById('sheet-summary').textContent = `"${p["Resumen Clínico"] || p.summary || ''}"`;

  document.getElementById('sheet-allergies').textContent = p["Alergias Conocidas"] || p.allergies || 'Ninguna';
  document.getElementById('sheet-contrast').textContent = p["Contraindicación Contraste"] || p.contrastContra || 'No';
  document.getElementById('sheet-metal').textContent = p["Portador Objetos Metálicos"] || p.metalObjects || 'No';

  document.getElementById('sheet-sign-doc').textContent = `${p["Médico Solicitante"] || p.docName} (${p["Servicio Solicitante"] || p.service})`;

  const banner = document.getElementById('sheet-double-confirm-banner');
  const bannerIcon = document.getElementById('sheet-banner-icon');
  const bannerTitle = document.getElementById('sheet-banner-title');
  const bannerDesc = document.getElementById('sheet-banner-desc');
  const bannerBadge = document.getElementById('sheet-banner-badge');
  const btnCancel = document.getElementById('btn-sheet-cancel');
  const btnConfirm = document.getElementById('btn-final-confirm-petition');

  if (isAlreadyConfirmed) {
    if (banner) {
      banner.style.background = '#ECFDF5';
      banner.style.borderColor = '#10B981';
    }
    if (bannerIcon) bannerIcon.textContent = '🟢';
    if (bannerTitle) {
      bannerTitle.textContent = 'Solicitud Registrada y Confirmada Oficialmente';
      bannerTitle.style.color = '#065F46';
    }
    if (bannerDesc) {
      bannerDesc.textContent = 'Esta petición ya ha sido firmada electrónicamente con doble confirmación y archivada en el repositorio hospitalario.';
      bannerDesc.style.color = '#047857';
    }
    if (bannerBadge) {
      bannerBadge.textContent = 'CONFIRMADA Y REGISTRADA';
      bannerBadge.style.background = '#10B981';
    }
    if (btnCancel) {
      btnCancel.textContent = 'Cerrar';
      btnCancel.onclick = () => closeModal('modal-official-sheet');
    }
    if (btnConfirm) {
      btnConfirm.style.display = 'none';
    }
  } else {
    if (banner) {
      banner.style.background = '#FEF3C7';
      banner.style.borderColor = '#F59E0B';
    }
    if (bannerIcon) bannerIcon.textContent = '⚠️';
    if (bannerTitle) {
      bannerTitle.textContent = 'Paso 2 de 2: Doble Confirmación Requerida';
      bannerTitle.style.color = '#92400E';
    }
    if (bannerDesc) {
      bannerDesc.textContent = 'Por favor, revise minuciosamente los datos clínicos. Puede imprimir el PDF o guardarlo ahora. Para formalizar el registro oficial, pulse «Confirmar Solicitud Definitiva».';
      bannerDesc.style.color = '#B45309';
    }
    if (bannerBadge) {
      bannerBadge.textContent = 'PENDIENTE DE CONFIRMAR';
      bannerBadge.style.background = '#F59E0B';
    }
    if (btnCancel) {
      btnCancel.textContent = '✏️ Modificar Datos / Volver';
      btnCancel.onclick = () => closeModal('modal-official-sheet');
    }
    if (btnConfirm) {
      btnConfirm.style.display = 'inline-flex';
      btnConfirm.disabled = false;
      btnConfirm.innerHTML = '✅ Confirmar Solicitud Definitiva';
      btnConfirm.style.background = '#059669';
      btnConfirm.style.borderColor = '#059669';
      btnConfirm.style.opacity = '1';
    }
  }

  document.getElementById('modal-official-sheet').classList.remove('hidden');
}

function openOfficialSheetModal(p, isAlreadyConfirmed = false) {
  openDoubleConfirmationModal(p, isAlreadyConfirmed);
}

function executeFinalConfirmation() {
  if (!pendingPetitionToConfirm) {
    showToast('No hay ninguna petición pendiente de confirmación.', 'warning');
    return;
  }

  const p = pendingPetitionToConfirm;
  const patientName = p["Nombre del Paciente"] || 'Paciente';
  const subId = p["Submission ID"] || 'REQ-0000';

  // 1. Guardar en base de datos oficial
  petitions.unshift(p);
  savePetitionsToStorage(p);

  // 2. Modificar el banner a estado confirmado
  const banner = document.getElementById('sheet-double-confirm-banner');
  const bannerIcon = document.getElementById('sheet-banner-icon');
  const bannerTitle = document.getElementById('sheet-banner-title');
  const bannerDesc = document.getElementById('sheet-banner-desc');
  const bannerBadge = document.getElementById('sheet-banner-badge');
  const btnCancel = document.getElementById('btn-sheet-cancel');
  const btnConfirm = document.getElementById('btn-final-confirm-petition');

  if (banner) {
    banner.style.background = '#ECFDF5';
    banner.style.borderColor = '#10B981';
  }
  if (bannerIcon) bannerIcon.textContent = '✅';
  if (bannerTitle) {
    bannerTitle.textContent = '¡Petición Confirmada y Registrada Oficialmente!';
    bannerTitle.style.color = '#065F46';
  }
  if (bannerDesc) {
    bannerDesc.textContent = `La solicitud ha completado con éxito la doble confirmación clínica. Código oficial de registro: ${subId}.`;
    bannerDesc.style.color = '#047857';
  }
  if (bannerBadge) {
    bannerBadge.textContent = 'CONFIRMADA Y REGISTRADA';
    bannerBadge.style.background = '#10B981';
  }

  // 3. Modificar botones de pie de modal
  if (btnConfirm) {
    btnConfirm.disabled = true;
    btnConfirm.innerHTML = '✔️ Solicitud Doblemente Confirmada';
    btnConfirm.style.background = '#059669';
    btnConfirm.style.opacity = '0.9';
  }
  if (btnCancel) {
    btnCancel.textContent = 'Cerrar y Ver Mis Peticiones';
    btnCancel.onclick = () => {
      closeModal('modal-official-sheet');
      switchTab('tab-my-requests');
    };
  }

  // 4. Limpiar el formulario correspondiente
  if (pendingFormType === 'pet') {
    resetPetForm();
  } else {
    resetConvForm();
  }

  pendingPetitionToConfirm = null;
  showToast(`✅ ¡Petición ${subId} (${patientName}) confirmada y registrada definitivamente!`, 'success');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.add('hidden');
}

function saveAsDraft(type) {
  showToast(`Borrador de solicitud ${type.toUpperCase()} guardado temporalmente.`, 'info');
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  else if (type === 'error') icon = '❌';
  else if (type === 'warning') icon = '⚠️';

  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => {
      if (typeof toast.remove === 'function') {
        toast.remove();
      } else if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 4000);
}

async function syncWithBackendServer() {
  showToast("⏳ Sincronizando base de datos con servidor y Triaje PET/CT...", "info");
  try {
    await savePetitionsToStorage();
    await loadPetitionsDatabase();
    showToast(`✅ Base de datos sincronizada: ${petitions.length} solicitudes activas en peticiones_db.json`, "success");
  } catch (err) {
    showToast("⚠️ Error sincronizando con servidor: " + err.message, "error");
  }
}
