# Portal Clínico de Prescripción Médica — PET/CT & Medicina Nuclear

Plataforma hospitalaria de prescripción médica con **Base de Datos Clínica Maestra** interoperable y 100% compatible con el sistema **Triaje PET/CT** (`pacientes_pet_ct_250.json` / CSV).

---

## 🗄️ Sistema de Base de Datos Implementado

La base de datos del portal utiliza la misma estructura, columnas y nomenclatura oficial que el programa de Triaje PET:

1. **Archivos de Base de Datos en el Proyecto:**
   * [`database/peticiones_db.json`](file:///Users/oscarysara/Library/CloudStorage/GoogleDrive-oscarferreiradavila@gmail.com/Mi%20unidad/Antigravititi%20IDE/PET/pet_peticion_medica/database/peticiones_db.json): Archivo maestro en formato JSON con los registros estructurados de peticiones.
   * [`database/peticiones_db.csv`](file:///Users/oscarysara/Library/CloudStorage/GoogleDrive-oscarferreiradavila@gmail.com/Mi%20unidad/Antigravititi%20IDE/PET/pet_peticion_medica/database/peticiones_db.csv): Versión tabular para Excel o Google Sheets.
   * [`database/schema_info.json`](file:///Users/oscarysara/Library/CloudStorage/GoogleDrive-oscarferreiradavila@gmail.com/Mi%20unidad/Antigravititi%20IDE/PET/pet_peticion_medica/database/schema_info.json): Diccionario del esquema y tipos de datos.

2. **Esquema de Campos de la Base de Datos:**
   * `Submission ID`: Identificador único de solicitud (`sub_...`).
   * `Respondent ID`: Identificador de terminal / sesión médica (`resp_...`).
   * `Modalidad`: `PET` o `CONVENCIONAL`.
   * `Fecha Solicitud`: Fecha en formato ISO (`YYYY-MM-DD`).
   * `NHC / Historia Clínica`: Número de historia del paciente.
   * `Nombre del Paciente` & `Nombre y Apellidos`: Nombre completo.
   * `Sexo`, `Edad`, `Talla (cm)`, `Peso (kg)`: Parámetros dosimétricos.
   * `Servicio Solicitante`: Servicio hospitalario prescriptor.
   * `Médico Solicitante`: Nombre del facultativo prescriptor.
   * `Diagnóstico Clínico`: Sospecha o patología oncológica/infecciosa.
   * `Motivo de Solicitud`: Objetivo del examen.
   * `Tipo de Estudio PET Solicitado`: Trazador y protocolo clínico seleccionado:
     1. `FDG Oncológico / Inflamatorio`
     2. `FDG con Contraste Iodado`
     3. `FDG con Endocarditis + Protocolo HEP`
     4. `68Ga-PSMA`
     5. `68Ga-DOTATOC Tumores Neuroendocrinos`
     6. `18F-Colina`
     7. `18F-Paratiroides`
     8. `FDG Neurológico Normal`
     9. `FDG Neurológico + Neurofisioneurología`
     10. `18F-PSMA`
   * `Carácter de la Petición`: `Urgente`, `Preferente`, `Ordinaria`.
   * `Prioridad Calculada`: `🔴 P1`, `🟡 P2`, `🟢 P3`.
   * `Ventana Clínica (Días Laborables)`: 7, 14 o 30 días.
   * `Fecha Próxima Consulta`: Fecha de la próxima cita o comité.
   * `Fecha Cita Asignada` & `Hora Cita Asignada`: Asignadas por triaje.
   * `¿El paciente está ingresado?`: Hospitalización y traslado.
   * `¿Precisa sedación?`: Manejo anestésico / ansiolítico.
   * `Movilidad / Traslado`: `Autónomo`, `Movilidad reducida`, `Encamado`.
   * `¿Tiene Diabetes Mellitus?` & `Glucemia (mg/dL)`: Protocolo de glucosa.
   * `Fin Tratamiento QT/RT`: Control de ventana libre de tratamiento.
   * `Alergias Conocidas`: Yodo, Penicilina o ninguna.
   * `Contraindicación Contraste` & `Portador Objetos Metálicos`.
   * `Alertas Técnicas`: Resumen de alertas para el Servicio de Medicina Nuclear.
   * `Estado de Triaje`: `Pendiente de Triaje`, `Cita Asignada`, `Realizado`.
   * `Resumen Clínico`: Texto detallado con antecedentes.

---

## 💻 Panel de Gestión de Base de Datos en la App Web
En la pestaña **"🗄️ Base de Datos Clínica"** puedes:
* **Ver en Vivo:** Tabla interactiva con búsqueda por cualquier campo y filtro por modalidad.
* **Descargar JSON:** Genera un archivo `.json` que se puede importar directamente en la suite de Triaje PET.
* **Descargar CSV:** Exporta los datos formateados listos para abrir en Google Sheets o Excel.
* **Importar JSON:** Carga cualquier archivo JSON para restaurar o agregar solicitudes.
* **Restablecer:** Devuelve la base de datos a sus valores iniciales de prueba.
* **Visor Crudo en Tiempo Real:** Inspecciona el JSON exacto con un botón para copiarlo al portapapeles.
