<?php
header("Content-Type: application/json; charset=utf-8");

session_start();

function responder($codigo, $mensaje, $exito = false) {
    http_response_code($codigo);

    echo json_encode([
        "success" => $exito,
        "message" => $mensaje
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    responder(405, "Método no permitido.");
}

if (!isset($_SESSION["id_usuario"])) {
    responder(401, "Debes iniciar sesión para solicitar información.");
}

$datos = json_decode(file_get_contents("php://input"), true);

if (!is_array($datos)) {
    responder(400, "Los datos enviados no son válidos.");
}

$idUsuario = (int) $_SESSION["id_usuario"];
$idInmueble = filter_var(
    $datos["id_inmueble"] ?? null,
    FILTER_VALIDATE_INT,
    ["options" => ["min_range" => 1]]
);

$nombre = trim($datos["nombre_contacto"] ?? "");
$correo = trim($datos["correo_contacto"] ?? "");
$telefono = trim($datos["telefono_contacto"] ?? "");
$mensaje = trim($datos["mensaje"] ?? "");

if (!$idInmueble) {
    responder(400, "Selecciona una propiedad válida.");
}

if (
    mb_strlen($nombre) < 3 ||
    mb_strlen($nombre) > 100
) {
    responder(400, "El nombre debe tener entre 3 y 100 caracteres.");
}

if (
    mb_strlen($correo) > 150 ||
    !filter_var($correo, FILTER_VALIDATE_EMAIL)
) {
    responder(400, "Introduce un correo válido.");
}

if (mb_strlen($telefono) > 20) {
    responder(400, "El teléfono es demasiado largo.");
}

if (
    mb_strlen($mensaje) < 10 ||
    mb_strlen($mensaje) > 2000
) {
    responder(400, "El mensaje debe tener entre 10 y 2000 caracteres.");
}

try {
    require_once "conexion.php";

    // Comprobar que la propiedad existe y está publicada
    $consulta = $conexion->prepare(
        "SELECT id_inmueble
         FROM inmuebles
         WHERE id_inmueble = ?
         AND estado_publicacion = 'publicado'
         LIMIT 1"
    );

    $consulta->execute([$idInmueble]);

    if (!$consulta->fetch(PDO::FETCH_ASSOC)) {
        responder(404, "La propiedad no está disponible.");
    }

    // Registrar solicitud
    $sql = "INSERT INTO solicitudes_contacto
            (
                id_inmueble,
                id_usuario,
                nombre_contacto,
                correo_contacto,
                telefono_contacto,
                mensaje,
                estado_solicitud
            )
            VALUES (?, ?, ?, ?, ?, ?, 'pendiente')";

    $consulta = $conexion->prepare($sql);

    $consulta->execute([
        $idInmueble,
        $idUsuario,
        $nombre,
        $correo,
        $telefono !== "" ? $telefono : null,
        $mensaje
    ]);

    responder(
        201,
        "¡Tu solicitud se envió correctamente!",
        true
    );

} catch (Throwable $error) {
    error_log("Error de solicitud: " . $error->getMessage());

    responder(
        500,
        "No fue posible enviar la solicitud."
    );
}
?>
