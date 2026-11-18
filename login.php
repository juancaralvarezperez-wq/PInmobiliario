
<?php
header("Content-Type: application/json; charset=utf-8");

function responder($codigo, $datos) {
    http_response_code($codigo);
    echo json_encode($datos);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    responder(405, [
        "success" => false,
        "message" => "Método no permitido."
    ]);
}

session_start();

$datos = json_decode(file_get_contents("php://input"), true);

if (!is_array($datos)) {
    responder(400, [
        "success" => false,
        "message" => "Datos inválidos."
    ]);
}

$correo = strtolower(trim($datos["email"] ?? ""));
$password = $datos["password"] ?? "";

if (!filter_var($correo, FILTER_VALIDATE_EMAIL) ||
    !is_string($password) || $password === "") {
    responder(400, [
        "success" => false,
        "message" => "Introduce correo y contraseña válidos."
    ]);
}

try {
    require_once "conexion.php";

    $sql = "SELECT id_usuario, nombre, correo, contrasena, rol
            FROM usuarios
            WHERE correo = ?
            LIMIT 1";

    $consulta = $conexion->prepare($sql);
    $consulta->execute([$correo]);

    $usuario = $consulta->fetch(PDO::FETCH_ASSOC);

    if (!$usuario ||
        !password_verify($password, $usuario["contrasena"])) {
        responder(401, [
            "success" => false,
            "message" => "Correo o contraseña incorrectos."
        ]);
    }

    session_regenerate_id(true);

    $_SESSION["id_usuario"] = $usuario["id_usuario"];
    $_SESSION["nombre"] = $usuario["nombre"];
    $_SESSION["rol"] = $usuario["rol"];

    responder(200, [
        "success" => true,
        "message" => "Inicio de sesión exitoso.",
        "usuario" => [
            "nombre" => $usuario["nombre"],
            "correo" => $usuario["correo"],
            "rol" => $usuario["rol"]
        ]
    ]);

} catch (Throwable $e) {
    error_log($e->getMessage());

    responder(500, [
        "success" => false,
        "message" => "Error interno del servidor."
    ]);
}
?>
