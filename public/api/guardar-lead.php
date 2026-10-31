<?php
/**
 * RECEPTOR DE PROSPECTOS Y REGISTRO CLÍNICO
 * Dra. Erika Rodríguez — Psicóloga UCC (ReTHUS)
 * 
 * Acciones:
 * 1. Sanitizar y validar los datos recibidos (JSON / POST).
 * 2. Guardar respaldo confidencial en archivo CSV en el servidor.
 * 3. Enviar notificación instantánea por correo a: erika.rod.psicologa@gmail.com
 */

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método no permitido']);
    exit;
}

// Obtener payload JSON o POST estándar
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data || !is_array($data)) {
    $data = $_POST;
}

// Sanitización de datos
$nombre = isset($data['nombre']) ? trim(strip_tags($data['nombre'])) : 'Participante Web';
$email = isset($data['email']) ? filter_var(trim($data['email']), FILTER_SANITIZE_EMAIL) : '';
$telefono = isset($data['telefono']) ? preg_replace('/[^0-9\+\-\s]/', '', trim($data['telefono'])) : '';
$tipoTest = isset($data['tipo_test']) ? trim(strip_tags($data['tipo_test'])) : 'General';
$diagnostico = isset($data['diagnostico']) ? trim(strip_tags($data['diagnostico'])) : (isset($data['profile_result']) ? trim(strip_tags($data['profile_result'])) : 'No especificado');
$score = isset($data['scoreLabel']) ? trim(strip_tags($data['scoreLabel'])) : '';
$comentario = isset($data['comentario_adicional']) ? trim(strip_tags($data['comentario_adicional'])) : '';
$origenUrl = isset($data['origen_url']) ? trim(strip_tags($data['origen_url'])) : 'erikarodriguezpsicologa.com';
$fecha = date('Y-m-d H:i:s');
$ip = $_SERVER['REMOTE_ADDR'] ?? 'Desconocida';

// Validación mínima
if (empty($nombre) && empty($telefono) && empty($email)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Datos insuficientes']);
    exit;
}

// 1. RESPALDO PRIVADO EN CSV
$dataDir = __DIR__ . '/data';
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0755, true);
    // Proteger carpeta de datos para que nadie pueda descargar el CSV directamente desde el navegador
    @file_put_contents($dataDir . '/.htaccess', "Order Deny,Allow\nDeny from all\n");
}

$csvFile = $dataDir . '/prospectos_erika_rodriguez.csv';
$isNewFile = !file_exists($csvFile);

$fp = @fopen($csvFile, 'a');
if ($fp) {
    if ($isNewFile) {
        // Cabecera UTF-8 BOM para que Excel abra las tildes perfectamente
        fprintf($fp, chr(0xEF).chr(0xBB).chr(0xBF));
        fputcsv($fp, ['Fecha', 'Nombre', 'WhatsApp', 'Email', 'Tipo de Registro', 'Diagnostico / Perfil', 'Puntaje', 'Reto o Comentario', 'Origen URL', 'IP']);
    }
    fputcsv($fp, [$fecha, $nombre, $telefono, $email, $tipoTest, $diagnostico, $score, $comentario, $origenUrl, $ip]);
    fclose($fp);
}

// 2. ENVÍO DE CORREO DE ALERTA A ERIKA
$destinatario = 'erika.rod.psicologa@gmail.com';
$remitente = 'contacto@erikarodriguezpsicologa.com';

// Etiquetas limpias para el asunto
$etiquetaTipo = [
    'autoestima' => 'Test de Autoestima',
    'amor' => 'Test Lenguajes del Amor',
    'vocacional' => 'Test Vocacional Proyéctate',
    'miniguia_autocritica_pdf' => 'Descarga Miniguía PDF'
][$tipoTest] ?? strtoupper($tipoTest);

$asunto = "📩 Nuevo Prospecto: " . $nombre . " — " . $etiquetaTipo;

// Formatear enlace directo a WhatsApp para que Erika toque y abra el chat
$whatsappLink = '';
if (!empty($telefono)) {
    $phoneDigits = preg_replace('/[^0-9]/', '', $telefono);
    $waGreeting = urlencode("Hola " . $nombre . ", te saluda la psicóloga Erika Rodríguez. Vi que realizaste el " . $etiquetaTipo . " en mi sitio web.");
    $whatsappLink = "https://wa.me/" . $phoneDigits . "?text=" . $waGreeting;
}

// Plantilla HTML del Correo
$mensajeHtml = '
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; background-color: #F9F8F6; margin: 0; padding: 20px; color: #242E30; }
  .container { max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #E5DED4; box-shadow: 0 4px 18px rgba(0,0,0,0.06); }
  .header { background: #0D3B42; color: #FFFFFF; padding: 24px 28px; text-align: left; }
  .header h2 { margin: 0; font-size: 20px; color: #FFFFFF; font-weight: 700; }
  .header p { margin: 6px 0 0; font-size: 13px; color: #B5CCD0; }
  .body-content { padding: 28px; }
  .badge { display: inline-block; background: #FAF0EB; color: #D8836C; font-size: 11px; font-weight: 800; letter-spacing: 0.5px; padding: 4px 10px; border-radius: 4px; text-transform: uppercase; margin-bottom: 16px; }
  .info-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  .info-table td { padding: 12px 14px; border-bottom: 1px solid #EFECE6; font-size: 14px; }
  .info-table td.label { font-weight: 700; color: #276265; width: 38%; }
  .info-table td.value { color: #242E30; }
  .cta-box { margin-top: 26px; text-align: center; padding: 20px; background: #FAF7F2; border-radius: 8px; border: 1px solid #EAE3D7; }
  .btn-wa { display: inline-block; background: #25D366; color: #FFFFFF; font-weight: 700; font-size: 15px; text-decoration: none; padding: 12px 24px; border-radius: 8px; box-shadow: 0 3px 10px rgba(37,211,102,0.3); }
  .footer { background: #F5F1EB; padding: 14px 28px; text-align: center; font-size: 11px; color: #8A999B; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Erika Rodríguez — Plataforma Web</h2>
      <p>Nuevo prospecto registrado el ' . htmlspecialchars($fecha) . '</p>
    </div>
    
    <div class="body-content">
      <span class="badge">' . htmlspecialchars($etiquetaTipo) . '</span>
      <h3 style="margin: 0 0 16px; color: #0D3B42; font-size: 18px;">Información del Paciente / Prospecto:</h3>
      
      <table class="info-table">
        <tr>
          <td class="label">👤 Nombre Completo:</td>
          <td class="value"><strong>' . htmlspecialchars($nombre) . '</strong></td>
        </tr>
        <tr>
          <td class="label">📱 Número WhatsApp:</td>
          <td class="value">' . ($telefono ? '<a href="' . $whatsappLink . '" style="color: #276265; font-weight: 700;">' . htmlspecialchars($telefono) . '</a>' : 'No proporcionado') . '</td>
        </tr>
        <tr>
          <td class="label">✉️ Correo Electrónico:</td>
          <td class="value">' . ($email ? '<a href="mailto:' . htmlspecialchars($email) . '">' . htmlspecialchars($email) . '</a>' : 'No proporcionado') . '</td>
        </tr>
        <tr>
          <td class="label">📋 Perfil / Diagnóstico:</td>
          <td class="value"><strong style="color: #D8836C;">' . htmlspecialchars($diagnostico) . '</strong> ' . ($score ? '(' . htmlspecialchars($score) . ')' : '') . '</td>
        </tr>
        ' . ($comentario ? '
        <tr>
          <td class="label">💬 Reto o Comentario:</td>
          <td class="value" style="font-style: italic; background: #FFFDF9;">"' . htmlspecialchars($comentario) . '"</td>
        </tr>' : '') . '
        <tr>
          <td class="label">🌐 Página de Origen:</td>
          <td class="value" style="font-size: 12px; color: #6C7E81;">' . htmlspecialchars($origenUrl) . '</td>
        </tr>
      </table>';

if (!empty($whatsappLink)) {
    $mensajeHtml .= '
      <div class="cta-box">
        <p style="margin: 0 0 12px; font-size: 13px; color: #57686A;">Toca el botón para abrir un chat directo con este paciente en WhatsApp:</p>
        <a href="' . $whatsappLink . '" class="btn-wa" target="_blank">Escribir a ' . htmlspecialchars($nombre) . ' por WhatsApp 💬</a>
      </div>';
}

$mensajeHtml .= '
    </div>
    
    <div class="footer">
      Este lead fue guardado automáticamente en tu archivo privado de respaldo (CSV) en Hostinger.<br>
      © ' . date('Y') . ' Erika Rodríguez Psicología • erikarodriguezpsicologa.com
    </div>
  </div>
</body>
</html>';

// Cabeceras de correo
$headers = [
    'MIME-Version: 1.0',
    'Content-type: text/html; charset=UTF-8',
    'From: Erika Rodriguez Web <' . $remitente . '>',
    'X-Mailer: PHP/' . phpversion()
];

if (!empty($email)) {
    $headers[] = 'Reply-To: ' . $nombre . ' <' . $email . '>';
}

@mail($destinatario, $asunto, $mensajeHtml, implode("\r\n", $headers));

// Respuesta Exitosa
echo json_encode([
    'success' => true,
    'message' => 'Prospecto guardado y notificado con éxito',
    'lead' => [
        'nombre' => $nombre,
        'tipo' => $tipoTest,
        'fecha' => $fecha
    ]
]);
