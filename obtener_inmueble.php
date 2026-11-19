<?php
header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-store");
session_start();

function responderInmueble($codigo, $datos) {
    http_response_code($codigo);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER["REQUEST_METHOD"] ?? "GET") !== "GET") {
    responderInmueble(405, [
        "success" => false,
        "message" => "Método no permitido."
    ]);
}

if (!isset($_SESSION["id_usuario"])) {
    responderInmueble(401, [
        "success" => false,
        "message" => "Debes iniciar sesión."
    ]);
}

if (($_SESSION["rol"] ?? "") !== "vendedor") {
    responderInmueble(403, [
        "success" => false,
        "message" => "Solo los vendedores pueden editar propiedades."
    ]);
}

$id = filter_var(
    $_GET["id"] ?? null,
    FILTER_VALIDATE_INT,
    ["options" => ["min_range" => 1]]
);

if (!$id) {
    responderInmueble(400, [
        "success" => false,
        "message" => "Selecciona un inmueble válido."
    ]);
}

try {
    require_once "conexion.php";

    $sql = "SELECT i.*,
                   (
                       SELECT img.ruta_imagen
                       FROM imagenes_inmueble img
                       WHERE img.id_inmueble = i.id_inmueble
                       ORDER BY img.es_principal DESC, img.id_imagen ASC
                       LIMIT 1
                   ) AS imagen
            FROM inmuebles i
            WHERE i.id_inmueble = ?
              AND i.id_vendedor = ?
            LIMIT 1";

    $consulta = $conexion->prepare($sql);
    $consulta->execute([$id, (int) $_SESSION["id_usuario"]]);
    $inmueble = $consulta->fetch(PDO::FETCH_ASSOC);

    if (!$inmueble) {
        responderInmueble(404, [
            "success" => false,
            "message" => "La propiedad no existe o no te pertenece."
        ]);
    }

    responderInmueble(200, [
        "success" => true,
        "inmueble" => $inmueble
    ]);
} catch (Throwable $error) {
    error_log("Error al cargar inmueble: " . $error->getMessage());
    responderInmueble(500, [
        "success" => false,
        "message" => "No se pudo cargar la propiedad."
    ]);
}
