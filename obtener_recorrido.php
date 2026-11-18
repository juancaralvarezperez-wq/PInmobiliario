
<?php
header("Content-Type: application/json; charset=utf-8");

$id = filter_input(INPUT_GET, "id", FILTER_VALIDATE_INT);

if (!$id || $id <= 0) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "ID de propiedad no válido."
    ]);
    exit;
}

try {
    require_once "conexion.php";

    $sql = "SELECT
                i.id_inmueble,
                i.titulo,
                i.ciudad,
                i.estado,
                m.ruta_modelo,
                m.formato
            FROM inmuebles i
            LEFT JOIN modelos_3d m
                ON m.id_modelo = (
                    SELECT m2.id_modelo
                    FROM modelos_3d m2
                    WHERE m2.id_inmueble = i.id_inmueble
                      AND m2.publicado = 1
                    ORDER BY m2.id_modelo DESC
                    LIMIT 1
                )
            WHERE i.id_inmueble = ?
              AND i.estado_publicacion = 'publicado'
            LIMIT 1";

    $consulta = $conexion->prepare($sql);
    $consulta->execute([$id]);

    $propiedad = $consulta->fetch();

    if (!$propiedad) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Propiedad no encontrada."
        ]);
        exit;
    }

    echo json_encode([
        "success" => true,
        "propiedad" => $propiedad
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    error_log($e->getMessage());

    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "No se pudo consultar el recorrido."
    ]);
}
?>
