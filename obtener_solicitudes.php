<?php
header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-store");

session_start();

function responder($codigo, $datos) {
    http_response_code($codigo);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    responder(405, [
        "success" => false,
        "message" => "Método no permitido."
    ]);
}

if (!isset($_SESSION["id_usuario"])) {
    responder(401, [
        "success" => false,
        "message" => "Debes iniciar sesión."
    ]);
}

if (($_SESSION["rol"] ?? "") !== "vendedor") {
    responder(403, [
        "success" => false,
        "message" => "Acceso exclusivo para vendedores."
    ]);
}

try {
    require_once "conexion.php";

    $idVendedor = (int) $_SESSION["id_usuario"];

    $sql = "
        SELECT
            s.id_solicitud,
            s.id_inmueble,
            s.nombre_contacto,
            s.correo_contacto,
            s.telefono_contacto,
            s.mensaje,
            s.estado_solicitud,
            s.fecha_solicitud,
            i.titulo AS propiedad,
            r.respuesta,
            r.fecha_respuesta

        FROM solicitudes_contacto s

        INNER JOIN inmuebles i
            ON s.id_inmueble = i.id_inmueble

        LEFT JOIN respuestas_solicitud r
            ON r.id_respuesta = (
                SELECT MAX(r2.id_respuesta)
                FROM respuestas_solicitud r2
                WHERE r2.id_solicitud = s.id_solicitud
            )

        WHERE i.id_vendedor = ?

        ORDER BY s.fecha_solicitud DESC, s.id_solicitud DESC
    ";

    $consulta = $conexion->prepare($sql);
    $consulta->execute([$idVendedor]);

    $solicitudes = $consulta->fetchAll(PDO::FETCH_ASSOC);

    responder(200, [
        "success" => true,
        "solicitudes" => $solicitudes
    ]);

} catch (Throwable $error) {
    error_log("Error solicitudes: " . $error->getMessage());

    responder(500, [
        "success" => false,
        "message" => "No se pudieron cargar las solicitudes."
    ]);
}
?>
