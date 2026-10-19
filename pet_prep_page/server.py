import http.server
import socketserver
import json
import sqlite3
import os
import urllib.parse
import urllib.request
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

PORT = 8000
DB_FILE = "pet_database.db"
DEFAULT_EMAIL_DESTINO = "oscarferreiradavila@gmail.com"
NURSE_USER = os.environ.get("NURSE_USER", "enfermeria")
NURSE_PASS = os.environ.get("NURSE_PASS", "pet2026")

# Configuración SMTP opcional (si se especifican variables de entorno SMTP)
SMTP_SERVER = os.environ.get("SMTP_SERVER", "") # ej: smtp.gmail.com
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASS = os.environ.get("SMTP_PASS", "")

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS registros_enfermeria (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            origen TEXT NOT NULL,
            nivel TEXT,
            fecha_hora TEXT NOT NULL,
            paciente_nombre TEXT NOT NULL,
            paciente_telefono TEXT,
            hora_control_capilar TEXT,
            glucemia_mg_dl INTEGER,
            modo_envio TEXT,
            mensaje_escrito TEXT,
            transcripcion_audio TEXT,
            duracion_audio_segundos INTEGER,
            mensaje_alerta TEXT,
            fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()
    print(f"✅ Base de datos SQLite inicializada en: {os.path.abspath(DB_FILE)}")

def enviar_email_cancelacion(destinatario, asunto, cuerpo):
    print("\n" + "="*65)
    print(f"📧 [DISPATCH EMAIL AUTOMÁTICO] Destino: {destinatario}")
    print(f"📋 Asunto: {asunto}")
    print(f"📝 Contenido:\n{cuerpo}")
    print("="*65 + "\n")
    
    result = {"api_sent": False, "needs_activation": False, "smtp_sent": False, "detail": ""}

    # 1. Envío real a través del servicio de correo API directo (FormSubmit)
    try:
        url = f"https://formsubmit.co/ajax/{destinatario}"
        payload = json.dumps({
            "_subject": asunto,
            "destinatario": destinatario,
            "asunto": asunto,
            "contenido": cuerpo,
            "_captcha": "false"
        }).encode('utf-8')
        req = urllib.request.Request(url, data=payload, headers={
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Referer': 'https://formsubmit.co',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        })
        with urllib.request.urlopen(req, timeout=12) as resp:
            resp_body = resp.read().decode('utf-8')
            parsed = json.loads(resp_body) if resp_body else {}
            if parsed.get('success') == 'true' or parsed.get('success') is True:
                result["api_sent"] = True
                result["detail"] = "Correo entregado exitosamente por pasarela"
                print(f"✅ [API EMAIL] Correo entregado exitosamente a {destinatario}")
            elif "Activation" in parsed.get('message', ''):
                result["needs_activation"] = True
                result["detail"] = parsed.get('message')
                print(f"⚠️ [API EMAIL] FormSubmit requiere activación previa: {parsed.get('message')}")
            else:
                result["detail"] = parsed.get('message', resp_body)
                print(f"ℹ️ [API EMAIL] Respuesta pasarela: {parsed}")
    except Exception as api_err:
        result["detail"] = str(api_err)
        print(f"⚠️ Aviso en envío API de correo: {api_err}")

    # 2. Si hay configuración SMTP activa, enviar también por servidor SMTP
    if SMTP_SERVER and SMTP_USER and SMTP_PASS:
        try:
            msg = MIMEMultipart()
            msg['From'] = SMTP_USER
            msg['To'] = destinatario
            msg['Subject'] = asunto
            msg.attach(MIMEText(cuerpo, 'plain', 'utf-8'))
            
            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
                server.starttls()
                server.login(SMTP_USER, SMTP_PASS)
                server.send_message(msg)
            result["smtp_sent"] = True
            print(f"✅ Correo enviado exitosamente vía servidor SMTP a {destinatario}")
        except Exception as err:
            print(f"⚠️ Error al conectar con servidor SMTP externo: {err}")

    return result

class PETRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/citas/cancelar':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                email_destino = data.get('email_destino', DEFAULT_EMAIL_DESTINO)
                asunto = data.get('asunto', 'CANCELACION DE PRUEBA')
                motivo = data.get('motivo', 'Motivo no especificado')
                fecha_hora = data.get('fecha_hora', '')
                paciente_nombre = data.get('paciente_nombre', 'Paciente (Cancelación Cita)')
                paciente_nhc = data.get('paciente_nhc', 'No especificado')
                
                # 1. Guardar en SQLite
                conn = sqlite3.connect(DB_FILE)
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO registros_enfermeria (
                        origen, nivel, fecha_hora, paciente_nombre, mensaje_alerta
                    ) VALUES (?, ?, ?, ?, ?)
                ''', (
                    'CANCELACION_PRUEBA',
                    'CANCELACION',
                    fecha_hora,
                    f"{paciente_nombre} (NHC: {paciente_nhc})",
                    f"Estudio: PET FDG Glucosa | Motivo cancelación: {motivo} | Correo enviado a: {email_destino}"
                ))
                conn.commit()
                record_id = cursor.lastrowid
                conn.close()

                # 2. Enviar correo automático a oscarferreiradavila@gmail.com
                cuerpo_email = f"""SOLICITUD DE CANCELACIÓN DE PRUEBA PET FDG GLUCOSA

Se ha recibido una solicitud de cancelación de cita PET FDG:
------------------------------------------------------------
- Paciente: {paciente_nombre}
- Nº Historia Clínica (NHC): {paciente_nhc}
- Estudio Clínico: PET FDG Glucosa
- Asunto: {asunto}
- Destinatario: {email_destino}
- Motivo registrado: {motivo}
- Fecha y hora: {fecha_hora}
- Registro en Base de Datos: #{record_id}
------------------------------------------------------------
Mensaje generado automáticamente por el sistema de preparación PET.
"""
                email_status = enviar_email_cancelacion(email_destino, asunto, cuerpo_email)

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                response = {
                    "status": "ok",
                    "message": f"Cancelación procesada para {email_destino}",
                    "email_status": email_status,
                    "id": record_id
                }
                self.wfile.write(json.dumps(response).encode('utf-8'))
            except Exception as e:
                print(f"❌ Error al procesar cancelación: {e}")
                self.send_response(500)
                self.end_headers()

        elif self.path == '/api/enfermeria/base_datos':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                
                conn = sqlite3.connect(DB_FILE)
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO registros_enfermeria (
                        origen, nivel, fecha_hora, paciente_nombre, paciente_telefono,
                        hora_control_capilar, glucemia_mg_dl, modo_envio, mensaje_escrito,
                        transcripcion_audio, duracion_audio_segundos, mensaje_alerta
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    data.get('origen'),
                    data.get('nivel'),
                    data.get('fecha_hora'),
                    data.get('paciente_nombre'),
                    data.get('paciente_telefono'),
                    data.get('hora_control_capilar'),
                    data.get('glucemia_mg_dl'),
                    data.get('modo_envio'),
                    data.get('mensaje_escrito'),
                    data.get('transcripcion_audio'),
                    data.get('duracion_audio_segundos', 0),
                    data.get('mensaje_alerta')
                ))
                conn.commit()
                record_id = cursor.lastrowid
                conn.close()

                print(f"📥 [NUEVO REGISTRO EN BD] ID #{record_id} - Origen: {data.get('origen')} - Paciente: {data.get('paciente_nombre')}")

                self.send_response(201)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                response = {"status": "ok", "message": "Registro guardado exitosamente en BD", "id": record_id}
                self.wfile.write(json.dumps(response).encode('utf-8'))
            except Exception as e:
                print(f"❌ Error al guardar en BD: {e}")
                self.send_response(500)
                self.end_headers()

        elif self.path == '/api/auth/login':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
                user = data.get('usuario', '').strip()
                pwd = data.get('password', '').strip()
                if user == NURSE_USER and pwd == NURSE_PASS:
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    resp = {
                        "status": "ok",
                        "token": "nurse_token_auth_pet2026",
                        "usuario": NURSE_USER,
                        "nombre": "Enfermería PET-CT"
                    }
                    self.wfile.write(json.dumps(resp).encode('utf-8'))
                else:
                    self.send_response(401)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    resp = {"status": "error", "message": "Usuario o contraseña incorrectos"}
                    self.wfile.write(json.dumps(resp).encode('utf-8'))
            except Exception as e:
                self.send_response(400)
                self.end_headers()

        elif self.path == '/api/enfermeria/eliminar':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
                record_id = data.get('id')
                if not record_id:
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({"status": "error", "message": "ID requerido"}).encode('utf-8'))
                    return
                
                conn = sqlite3.connect(DB_FILE)
                cursor = conn.cursor()
                cursor.execute('DELETE FROM registros_enfermeria WHERE id = ?', (record_id,))
                conn.commit()
                rows_affected = cursor.rowcount
                conn.close()
                
                print(f"🗑️ [BD ENFERMERÍA] Registro #{record_id} eliminado de la base de datos (Atendido/Realizado)")
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                resp = {"status": "ok", "deleted_id": record_id, "rows_affected": rows_affected}
                self.wfile.write(json.dumps(resp).encode('utf-8'))
            except Exception as e:
                print(f"❌ Error al eliminar registro #{record_id}: {e}")
                self.send_response(500)
                self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()

    def do_GET(self):
        if self.path == '/api/enfermeria/panel':
            try:
                conn = sqlite3.connect(DB_FILE)
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                cursor.execute('SELECT * FROM registros_enfermeria ORDER BY id DESC')
                rows = cursor.fetchall()
                records = [dict(row) for row in rows]
                conn.close()

                dudas = []
                urgencias = []
                cancelaciones = []

                for r in records:
                    origen = str(r.get('origen') or '')
                    nivel = str(r.get('nivel') or '')
                    glucemia = r.get('glucemia_mg_dl')
                    
                    # Urgencias metabólicas diabéticas (o alertas preferentes)
                    if 'GLUCEMIA' in origen or 'ROJO' in nivel or (glucemia is not None and glucemia >= 200) or '112' in nivel:
                        urgencias.append(r)
                    elif origen == 'CANCELACION_PRUEBA':
                        cancelaciones.append(r)
                    elif origen == 'DUDAS_UNIDAD_ENFERMERIA' or nivel == 'DUDA_LLAMADA_PACIENTE':
                        dudas.append(r)

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                resp = {
                    "status": "ok",
                    "dudas": dudas,
                    "urgencias": urgencias,
                    "cancelaciones": cancelaciones,
                    "total_dudas": len(dudas),
                    "total_urgencias": len(urgencias)
                }
                self.wfile.write(json.dumps(resp).encode('utf-8'))
            except Exception as e:
                print(f"❌ Error al obtener panel: {e}")
                self.send_response(500)
                self.end_headers()

        elif self.path == '/api/enfermeria/registros':
            try:
                conn = sqlite3.connect(DB_FILE)
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                cursor.execute('SELECT * FROM registros_enfermeria ORDER BY id DESC')
                rows = cursor.fetchall()
                records = [dict(row) for row in rows]
                conn.close()

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(records).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.end_headers()
        elif self.path == '/admin' or self.path == '/admin.html':
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()
            html_admin = """<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Panel de Enfermería - Base de Datos PET</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Outfit', sans-serif; background: #0F172A; color: #F8FAFC; padding: 2rem; }
        h1 { color: #06B6D4; margin-bottom: 0.5rem; }
        .card { background: #1E293B; padding: 1.5rem; border-radius: 12px; border: 1px solid #334155; margin-top: 1.5rem; }
        table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
        th, td { padding: 0.75rem 1rem; border-bottom: 1px solid #334155; text-align: left; font-size: 0.9rem; }
        th { background: #0F172A; color: #94A3B8; }
        .badge-rojo { background: #EF4444; color: #FFF; padding: 3px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold; }
        .badge-duda { background: #0D9488; color: #FFF; padding: 3px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold; }
        .btn-refresh { background: #0D9488; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 8px; font-weight: bold; cursor: pointer; }
    </style>
</head>
<body>
    <h1>📊 Panel de Enfermería - Registros en Base de Datos SQLite</h1>
    <p>Visualización en tiempo real de consultas, cancelaciones y alertas de glucemia roja.</p>
    <button class="btn-refresh" onclick="cargarRegistros()">🔄 Actualizar datos de BD</button>
    <a href="/" style="color: #06B6D4; margin-left: 1rem;">← Volver a la web principal</a>

    <div class="card">
        <h2>Registros Almacenados (<span id="totalCount">0</span>)</h2>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Tipo / Origen</th>
                    <th>Paciente</th>
                    <th>Teléfono / Hora</th>
                    <th>Glucemia / Detalle</th>
                    <th>Mensaje / Transcripción</th>
                    <th>Fecha Registro</th>
                </tr>
            </thead>
            <tbody id="tableBody">
                <tr><td colspan="7">Cargando registros de la base de datos...</td></tr>
            </tbody>
        </table>
    </div>

    <script>
        async function cargarRegistros() {
            try {
                const res = await fetch('/api/enfermeria/registros');
                const data = await res.json();
                document.getElementById('totalCount').innerText = data.length;
                const tbody = document.getElementById('tableBody');
                tbody.innerHTML = '';
                if (data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="7">No hay registros aún en la base de datos.</td></tr>';
                    return;
                }
                data.forEach(r => {
                    let badge = '<span class="badge-duda">💬 CONSULTA DUDAS</span>';
                    if (r.origen === 'ALERTA_GLUCEMIA_DIABETES') {
                        badge = '<span class="badge-rojo">🔴 ALERTA GLUCEMIA ROJA</span>';
                    } else if (r.origen === 'CANCELACION_PRUEBA') {
                        badge = '<span class="badge-rojo" style="background:#B91C1C;">❌ CANCELACIÓN CITA</span>';
                    } else if (r.origen === 'CHATBOT_INTERACCION') {
                        badge = '<span class="badge-duda" style="background:#06B6D4;">🤖 CONSULTA CHATBOT</span>';
                    } else if (r.origen === 'CHATBOT_ALERTA_URGENTE') {
                        badge = '<span class="badge-rojo" style="background:#DC2626;">🚨 CHATBOT URGENCIA</span>';
                    }

                    let detalle = r.modo_envio ? `Modo: ${r.modo_envio}` : (r.hora_control_capilar ? `Prueba/Hora: ${r.hora_control_capilar}` : '-');
                    if (r.origen === 'ALERTA_GLUCEMIA_DIABETES') {
                        detalle = `<strong>${r.glucemia_mg_dl} mg/dL</strong> (${r.hora_control_capilar} h)`;
                    }

                    const contenido = r.mensaje_escrito 
                        ? `"${r.mensaje_escrito}"` 
                        : (r.transcripcion_audio ? `🎙️ "${r.transcripcion_audio}"` : (r.mensaje_alerta || '-'));

                    tbody.innerHTML += `<tr>
                        <td>#${r.id}</td>
                        <td>${badge}</td>
                        <td><strong>${r.paciente_nombre}</strong></td>
                        <td>${r.paciente_telefono || '-'}</td>
                        <td>${detalle}</td>
                        <td>${contenido}</td>
                        <td>${r.fecha_registro}</td>
                    </tr>`;
                });
            } catch(e) {
                console.error("Error al cargar BD:", e);
            }
        }
        cargarRegistros();
    </script>
</body>
</html>"""
            self.wfile.write(html_admin.encode('utf-8'))
        elif self.path == '/enfermeria':
            self.send_response(302)
            self.send_header('Location', '/enfermeria.html')
            self.end_headers()
        else:
            super().do_GET()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

if __name__ == "__main__":
    init_db()
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), PETRequestHandler) as httpd:
        print(f"🚀 Servidor con Base de Datos SQLite activo en http://localhost:{PORT}")
        print(f"📊 Panel de Control de Enfermería disponible en http://localhost:{PORT}/admin")
        print(f"📧 Envío automático de cancelaciones configurado a {DEFAULT_EMAIL_DESTINO}")
        httpd.serve_forever()
