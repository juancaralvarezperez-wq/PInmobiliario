
<?php
header("Content-Type: application/json; charset=utf-8");

session_start();

function responder($codigo, $mensaje, $exito = false, $id = null) {
    http_response_code($codigo);

    echo json_encode([
        "success" => $exito,
        "message" => $mensaje,
        "id_inmueble" => $id
    ]);

    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    responder(405, "Método no permitido.");
}

if (!isset($_SESSION["id_usuario"])) {
    responder(401, "Debes iniciar sesión para publicar.");
}

if (($_SESSION["rol"] ?? "") !== "vendedor") {
    responder(403, "Solo los vendedores pueden publicar propiedades.");
}

$datos = json_decode(file_get_contents("php://input"), true);

if (!is_array($datos)) {
    responder(400, "Los datos enviados no son válidos.");
}

$idVendedor = (int) $_SESSION["id_usuario"];

$titulo = trim($datos["titulo"] ?? "");
$operacion = $datos["operacion"] ?? "";
$tipo = $datos["tipo"] ?? "";
$precio = $datos["precio"] ?? null;
$direccion = trim($datos["direccion"] ?? "");
$ciudad = trim($datos["ciudad"] ?? "");
$estado = trim($datos["estado"] ?? "");
$imagen = trim($datos["imagen"] ?? "");
$descripcion = trim($datos["descripcion"] ?? "");

if (
    mb_strlen($titulo) < 5 ||
    mb_strlen($titulo) > 90 ||
    mb_strlen($descripcion) < 20 ||
    mb_strlen($descripcion) > 700 ||
    $direccion === "" ||
    mb_strlen($direccion) > 255 ||
    $ciudad === "" ||
    mb_strlen($ciudad) > 100 ||
    $estado === "" ||
    mb_strlen($estado) > 100
) {
    responder(400, "Revisa los datos obligatorios.");
}

if (!in_array($operacion, ["venta", "renta"], true)) {
    responder(400, "Tipo de publicación no válido.");
}

if (!in_array($tipo, [
    "casa",
    "departamento",
    "terreno",
    "local",
    "oficina"
], true)) {
    responder(400, "Tipo de inmueble no válido.");
}

if (
    !is_numeric($precio) ||
    (float) $precio <= 0 ||
    (float) $precio > 999999999
) {
    responder(400, "El precio no es válido.");
}

if ($imagen !== "") {
    if (
        mb_strlen($imagen) > 500 ||
        !filter_var($imagen, FILTER_VALIDATE_URL) ||
        !in_array(
            strtolower(parse_url($imagen, PHP_URL_SCHEME) ?? ""),
            ["http", "https"],
            true
        )
    ) {
        responder(400, "La URL de la imagen no es válida.");
    }
}

try {
    require_once "conexion.php";

    $conexion->beginTransaction();

    $sql = "INSERT INTO inmuebles
            (
                id_vendedor,
                titulo,
                descripcion,
                tipo,
                operacion,
                precio,
                direccion,
                ciudad,
                estado,
                estado_publicacion
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'publicado')";

    $consulta = $conexion->prepare($sql);

    $consulta->execute([
        $idVendedor,
        $titulo,
        $descripcion,
        $tipo,
        $operacion,
        $precio,
        $direccion,
        $ciudad,
        $estado
    ]);

    $idInmueble = (int) $conexion->lastInsertId();

    if ($imagen !== "") {
        $sqlImagen = "INSERT INTO imagenes_inmueble
                      (id_inmueble, ruta_imagen, es_principal)
                      VALUES (?, ?, 1)";

        $consultaImagen = $conexion->prepare($sqlImagen);

        $consultaImagen->execute([
            $idInmueble,
            $imagen
        ]);
    }

    $conexion->commit();

    responder(
        201,
        "¡Propiedad publicada correctamente en Luxury360!",
        true,
        $idInmueble
    );

} catch (Throwable $e) {
    if (isset($conexion) && $conexion->inTransaction()) {
        $conexion->rollBack();
    }

    error_log("Error al publicar: " . $e->getMessage());

    responder(500, "No se pudo guardar la propiedad.");
}
?>
