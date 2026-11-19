
<?php
header("Content-Type: application/json; charset=utf-8");

try {
    require_once "conexion.php";

    $metodo = $_SERVER["REQUEST_METHOD"] ?? "GET";

    if ($metodo !== "GET") {
        http_response_code(405);
        echo json_encode([
            "success" => false,
            "message" => "Método no permitido."
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $texto = trim((string) ($_GET["texto"] ?? ""));
    $operacion = trim((string) ($_GET["operacion"] ?? ""));
    $tipo = trim((string) ($_GET["tipo"] ?? ""));
    $ciudad = trim((string) ($_GET["ciudad"] ?? ""));
    $estado = trim((string) ($_GET["estado"] ?? ""));
    $precioMin = $_GET["precio_min"] ?? null;
    $precioMax = $_GET["precio_max"] ?? null;
    $superficieMin = $_GET["superficie_min"] ?? null;
    $habitaciones = $_GET["habitaciones"] ?? null;
    $banos = $_GET["banos"] ?? null;

    if ($texto !== "" && mb_strlen($texto) > 100) {
        throw new InvalidArgumentException("El texto de búsqueda es demasiado largo.");
    }

    if ($operacion !== "" && !in_array($operacion, ["venta", "renta"], true)) {
        throw new InvalidArgumentException("Operación no válida.");
    }

    if ($tipo !== "" && !in_array($tipo, [
        "casa",
        "departamento",
        "terreno",
        "local",
        "oficina"
    ], true)) {
        throw new InvalidArgumentException("Tipo de inmueble no válido.");
    }

    if ($precioMin !== null && $precioMin !== "" &&
        (!is_numeric($precioMin) || (float) $precioMin < 0)) {
        throw new InvalidArgumentException("El precio mínimo no es válido.");
    }

    if ($precioMax !== null && $precioMax !== "" &&
        (!is_numeric($precioMax) || (float) $precioMax < 0)) {
        throw new InvalidArgumentException("El precio máximo no es válido.");
    }

    if ($precioMin !== "" && $precioMax !== "" &&
        is_numeric($precioMin) && is_numeric($precioMax) &&
        (float) $precioMin > (float) $precioMax) {
        throw new InvalidArgumentException(
            "El precio mínimo no puede superar al precio máximo."
        );
    }

    $sql = "SELECT
                i.id_inmueble AS id,
                i.id_vendedor,
                i.titulo,
                i.descripcion,
                i.tipo,
                i.operacion,
                i.precio,
                i.direccion,
                i.ciudad,
                i.estado,
                i.codigo_postal,
                i.superficie,
                i.habitaciones,
                i.banos,
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
            WHERE i.estado_publicacion = 'publicado'";

    $parametros = [];

    if ($texto !== "") {
        $sql .= " AND (
            i.titulo LIKE ?
            OR i.descripcion LIKE ?
            OR i.direccion LIKE ?
            OR i.ciudad LIKE ?
            OR i.estado LIKE ?
        )";
        $textoSql = "%" . $texto . "%";
        array_push(
            $parametros,
            $textoSql,
            $textoSql,
            $textoSql,
            $textoSql,
            $textoSql
        );
    }

    if ($operacion !== "") {
        $sql .= " AND i.operacion = ?";
        $parametros[] = $operacion;
    }

    if ($tipo !== "") {
        $sql .= " AND i.tipo = ?";
        $parametros[] = $tipo;
    }

    if ($ciudad !== "") {
        $sql .= " AND i.ciudad LIKE ?";
        $parametros[] = "%" . $ciudad . "%";
    }

    if ($estado !== "") {
        $sql .= " AND i.estado = ?";
        $parametros[] = $estado;
    }

    if ($precioMin !== null && $precioMin !== "") {
        $sql .= " AND i.precio >= ?";
        $parametros[] = (float) $precioMin;
    }

    if ($precioMax !== null && $precioMax !== "") {
        $sql .= " AND i.precio <= ?";
        $parametros[] = (float) $precioMax;
    }

    if ($superficieMin !== null && $superficieMin !== "") {
        if (!is_numeric($superficieMin) || (float) $superficieMin < 0) {
            throw new InvalidArgumentException(
                "La superficie mínima no es válida."
            );
        }
        $sql .= " AND i.superficie >= ?";
        $parametros[] = (float) $superficieMin;
    }

    if ($habitaciones !== null && $habitaciones !== "") {
        if (!ctype_digit((string) $habitaciones) || (int) $habitaciones < 0) {
            throw new InvalidArgumentException(
                "El número de habitaciones no es válido."
            );
        }
        $sql .= " AND i.habitaciones >= ?";
        $parametros[] = (int) $habitaciones;
    }

    if ($banos !== null && $banos !== "") {
        if (!ctype_digit((string) $banos) || (int) $banos < 0) {
            throw new InvalidArgumentException(
                "El número de baños no es válido."
            );
        }
        $sql .= " AND i.banos >= ?";
        $parametros[] = (int) $banos;
    }

    $sql .= " ORDER BY i.fecha_publicacion DESC, i.id_inmueble DESC";

    $consulta = $conexion->prepare($sql);
    $consulta->execute($parametros);

    $propiedades = $consulta->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "propiedades" => $propiedades
    ], JSON_UNESCAPED_UNICODE);

} catch (InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
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