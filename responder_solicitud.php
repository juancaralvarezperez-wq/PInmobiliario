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
    responder(401, "Debes iniciar sesión.");
}

if (($_SESSION["rol"] ?? "") !== "vendedor") {
    responder(403, "Acceso exclusivo para vendedores.");
}

$datos = json_decode(file_get_contents("php://input"), true);

if (!is_array($datos)) {
    responder(400, "Datos no válidos.");
}

$idSolicitud = filter_var(
    $datos["id_solicitud"] ?? null,
    FILTER_VALIDATE_INT,
    ["options" => ["min_range" => 1]]
);

$respuesta = trim($datos["respuesta"] ?? "");

if (!$idSolicitud) {
    responder(400, "Solicitud no válida.");
}

if (mb_strlen($respuesta) < 5 || mb_strlen($respuesta) > 3000) {
    responder(400, "La respuesta debe tener entre 5 y 3000 caracteres.");
}

$idVendedor = (int) $_SESSION["id_usuario"];

try {
    require_once "conexion.php";

    $conexion->beginTransaction();

    // Comprobar que la solicitud pertenezca al vendedor
    $sqlVerificar = "
        SELECT s.id_solicitud, s.estado_solicitud
        FROM solicitudes_contacto s
        INNER JOIN inmuebles i
            ON s.id_inmueble = i.id_inmueble
        WHERE s.id_solicitud = ?
          AND i.id_vendedor = ?
        FOR UPDATE
    ";

    $verificar = $conexion->prepare($sqlVerificar);
    $verificar->execute([$idSolicitud, $idVendedor]);

    $solicitud = $verificar->fetch(PDO::FETCH_ASSOC);

    if (!$solicitud) {
        $conexion->rollBack();
        responder(404, "Solicitud no encontrada.");
    }

    if ($solicitud["estado_solicitud"] === "cancelada") {
        $conexion->rollBack();
        responder(409, "No puedes responder una solicitud cancelada.");
    }

    // Guardar respuesta
    $sqlRespuesta = "
        INSERT INTO respuestas_solicitud
        (id_solicitud, id_vendedor, respuesta)
        VALUES (?, ?, ?)
    ";

    $guardar = $conexion->prepare($sqlRespuesta);

    $guardar->execute([
        $idSolicitud,
        $idVendedor,
        $respuesta
    ]);

    // Cambiar estado
    $sqlEstado = "
        UPDATE solicitudes_contacto
        SET estado_solicitud = 'atendida'
        WHERE id_solicitud = ?
    ";

    $actualizar = $conexion->prepare($sqlEstado);
    $actualizar->execute([$idSolicitud]);

    $conexion->commit();

    responder(200, "Respuesta guardada correctamente.", true);

} catch (Throwable $error) {
    if (isset($conexion) && $conexion->inTransaction()) {
        $conexion->rollBack();
    }

    error_log("Error al responder solicitud: " . $error->getMessage());

    responder(500, "No se pudo guardar la respuesta.");
}
?>
