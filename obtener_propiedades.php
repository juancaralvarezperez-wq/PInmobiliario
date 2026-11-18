
<?php
header("Content-Type: application/json; charset=utf-8");

try {
    require_once "conexion.php";

    $sql = "SELECT
                i.id_inmueble AS id,
                i.titulo,
                i.descripcion,
                i.tipo,
                i.operacion,
                i.precio,
                i.direccion,
                i.ciudad,
                i.estado,
                i.fecha_publicacion,
                u.nombre AS vendedor,
                (
                    SELECT img.ruta_imagen
                    FROM imagenes_inmueble img
                    WHERE img.id_inmueble = i.id_inmueble
                    ORDER BY img.es_principal DESC, img.id_imagen ASC
                    LIMIT 1
                ) AS imagen
            FROM inmuebles i
            INNER JOIN usuarios u
                ON i.id_vendedor = u.id_usuario
            WHERE i.estado_publicacion = 'publicado'
            ORDER BY i.fecha_publicacion DESC, i.id_inmueble DESC";

    $consulta = $conexion->prepare($sql);
    $consulta->execute();

    $propiedades = $consulta->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "propiedades" => $propiedades
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    error_log($e->getMessage());

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "No se pudieron cargar las propiedades.",
        "tipo_error" => get_class($e)
    ], JSON_UNESCAPED_UNICODE);
}