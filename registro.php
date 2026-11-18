
<?php
header("Content-Type: application/json; charset=utf-8");

function responder($codigo, $mensaje, $exito = false) {
    http_response_code($codigo);

    echo json_encode([
        "success" => $exito,
        "message" => $mensaje
    ]);

    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    responder(405, "Método no permitido.");
}

$datos = json_decode(file_get_contents("php://input"), true);

if (!is_array($datos)) {
    responder(400, "Los datos enviados no son válidos.");
}

$nombre = trim($datos["nombre"] ?? "");
$correo = strtolower(trim($datos["correo"] ?? ""));
$password = $datos["password"] ?? "";
$passwordConfirm = $datos["passwordConfirm"] ?? "";
$telefono = trim($datos["telefono"] ?? "");
$rol = $datos["rol"] ?? "";

if (
    mb_strlen($nombre) < 2 ||
    mb_strlen($nombre) > 100
) {
    responder(400, "Introduce un nombre válido.");
}

if (
    !filter_var($correo, FILTER_VALIDATE_EMAIL) ||
    strlen($correo) > 150
) {
    responder(400, "Introduce un correo válido.");
}

if (strlen($password) < 8 || strlen($password) > 64) {
    responder(400, "La contraseña debe tener entre 8 y 64 caracteres.");
}

if ($password !== $passwordConfirm) {
    responder(400, "Las contraseñas no coinciden.");
}

if (!preg_match('/^[0-9]{10}$/', $telefono)) {
    responder(400, "El teléfono debe tener 10 dígitos.");
}

if (!in_array($rol, ["comprador", "vendedor"], true)) {
    responder(400, "Selecciona un tipo de cuenta válido.");
}

try {
    require_once "conexion.php";

    $consulta = $conexion->prepare(
        "SELECT id_usuario FROM usuarios WHERE correo = ? LIMIT 1"
    );

    $consulta->execute([$correo]);

    if ($consulta->fetch()) {
        responder(409, "Este correo ya está registrado.");
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);

    $sql = "INSERT INTO usuarios
            (nombre, correo, contrasena, telefono, rol)
            VALUES (?, ?, ?, ?, ?)";

    $consulta = $conexion->prepare($sql);

    $consulta->execute([
        $nombre,
        $correo,
        $hash,
        $telefono,
        $rol
    ]);

    responder(201, "¡Cuenta creada correctamente!", true);

} catch (PDOException $e) {
    error_log($e->getMessage());

    if ($e->getCode() === "23000") {
        responder(409, "Este correo ya está registrado.");
    }

    responder(500, "No se pudo registrar la cuenta.");

} catch (Throwable $e) {
    error_log($e->getMessage());
    responder(500, "Error interno del servidor.");
}
?>
