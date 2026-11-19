<?php
header("Content-Type: application/json; charset=utf-8");
session_start();

function responderActualizacion($codigo, $mensaje, $exito = false) {
    http_response_code($codigo);
    echo json_encode([
        "success" => $exito,
        "message" => $mensaje
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$metodo = $_SERVER["REQUEST_METHOD"] ?? "GET";
if (!in_array($metodo, ["PUT", "PATCH"], true)) {
    responderActualizacion(405, "Método no permitido.");
}

if (!isset($_SESSION["id_usuario"])) {
    responderActualizacion(401, "Debes iniciar sesión.");
}

if (($_SESSION["rol"] ?? "") !== "vendedor") {
    responderActualizacion(403, "Solo los vendedores pueden editar propiedades.");
}

$datos = json_decode(file_get_contents("php://input"), true);
if (!is_array($datos)) {
    responderActualizacion(400, "Los datos enviados no son válidos.");
}

$id = filter_var(
    $datos["id_inmueble"] ?? null,
    FILTER_VALIDATE_INT,
    ["options" => ["min_range" => 1]]
);

if (!$id) {
    responderActualizacion(400, "Selecciona un inmueble válido.");
}

$titulo = trim($datos["titulo"] ?? "");
$descripcion = trim($datos["descripcion"] ?? "");
$tipo = $datos["tipo"] ?? "";
$operacion = $datos["operacion"] ?? "";
$precio = $datos["precio"] ?? null;
$direccion = trim($datos["direccion"] ?? "");
$ciudad = trim($datos["ciudad"] ?? "");
$estado = trim($datos["estado"] ?? "");
$codigoPostal = trim($datos["codigo_postal"] ?? "");
$latitud = $datos["latitud"] ?? null;
$longitud = $datos["longitud"] ?? null;
$superficie = $datos["superficie"] ?? null;
$habitaciones = $datos["habitaciones"] ?? null;
$banos = $datos["banos"] ?? null;
$imagen = trim($datos["imagen"] ?? "");

if (
    mb_strlen($titulo) < 5 || mb_strlen($titulo) > 90 ||
    mb_strlen($descripcion) < 20 || mb_strlen($descripcion) > 700 ||
    $direccion === "" || mb_strlen($direccion) > 255 ||
    $ciudad === "" || mb_strlen($ciudad) > 100 ||
    $estado === "" || mb_strlen($estado) > 100
) {
    responderActualizacion(400, "Revisa los datos obligatorios.");
}

if (!in_array($tipo, ["casa", "departamento", "terreno", "local", "oficina"], true)) {
    responderActualizacion(400, "Tipo de inmueble no válido.");
}

if (!in_array($operacion, ["venta", "renta"], true)) {
    responderActualizacion(400, "Tipo de publicación no válido.");
}

if (!is_numeric($precio) || (float) $precio <= 0 || (float) $precio > 999999999) {
    responderActualizacion(400, "El precio no es válido.");
}

if (!is_numeric($superficie) || (float) $superficie <= 0 || (float) $superficie > 999999) {
    responderActualizacion(400, "La superficie no es válida.");
}

if (filter_var($habitaciones, FILTER_VALIDATE_INT,
        ["options" => ["min_range" => 0, "max_range" => 100]]) === false) {
    responderActualizacion(400, "El número de habitaciones no es válido.");
}

if (filter_var($banos, FILTER_VALIDATE_INT,
        ["options" => ["min_range" => 0, "max_range" => 100]]) === false) {
    responderActualizacion(400, "El número de baños no es válido.");
}

if ($codigoPostal !== "" && !preg_match('/^\d{5}$/', $codigoPostal)) {
    responderActualizacion(400, "El código postal debe tener 5 dígitos.");
}

if ($latitud !== null && $latitud !== "" &&
    (!is_numeric($latitud) || (float) $latitud < -90 || (float) $latitud > 90)) {
    responderActualizacion(400, "La latitud no es válida.");
}

if ($longitud !== null && $longitud !== "" &&
    (!is_numeric($longitud) || (float) $longitud < -180 || (float) $longitud > 180)) {
    responderActualizacion(400, "La longitud no es válida.");
}

if ($imagen !== "" &&
    (!filter_var($imagen, FILTER_VALIDATE_URL) ||
     !in_array(strtolower(parse_url($imagen, PHP_URL_SCHEME) ?? ""),
               ["http", "https"], true))) {
    responderActualizacion(400, "La URL de la imagen no es válida.");
}

try {
    require_once "conexion.php";
    $conexion->beginTransaction();

    $verificar = $conexion->prepare(
        "SELECT id_inmueble
         FROM inmuebles
         WHERE id_inmueble = ? AND id_vendedor = ?
         LIMIT 1"
    );
    $verificar->execute([$id, (int) $_SESSION["id_usuario"]]);

    if (!$verificar->fetch(PDO::FETCH_ASSOC)) {
        $conexion->rollBack();
        responderActualizacion(404, "La propiedad no existe o no te pertenece.");
    }

    $sql = "UPDATE inmuebles
            SET titulo = ?, descripcion = ?, tipo = ?, operacion = ?,
                precio = ?, direccion = ?, ciudad = ?, estado = ?,
                codigo_postal = ?, latitud = ?, longitud = ?,
                superficie = ?, habitaciones = ?, banos = ?
            WHERE id_inmueble = ? AND id_vendedor = ?";

    $consulta = $conexion->prepare($sql);
    $consulta->execute([
        $titulo,
        $descripcion,
        $tipo,
        $operacion,
        (float) $precio,
        $direccion,
        $ciudad,
        $estado,
        $codigoPostal !== "" ? $codigoPostal : null,
        $latitud !== null && $latitud !== "" ? (float) $latitud : null,
        $longitud !== null && $longitud !== "" ? (float) $longitud : null,
        (float) $superficie,
        (int) $habitaciones,
        (int) $banos,
        $id,
        (int) $_SESSION["id_usuario"]
    ]);

    if ($imagen !== "") {
        $actualizarImagen = $conexion->prepare(
            "UPDATE imagenes_inmueble
             SET ruta_imagen = ?
             WHERE id_inmueble = ? AND es_principal = 1"
        );
        $actualizarImagen->execute([$imagen, $id]);

        if ($actualizarImagen->rowCount() === 0) {
            $insertarImagen = $conexion->prepare(
                "INSERT INTO imagenes_inmueble
                 (id_inmueble, ruta_imagen, es_principal)
                 VALUES (?, ?, 1)"
            );
            $insertarImagen->execute([$id, $imagen]);
        }
    }

    $conexion->commit();
    responderActualizacion(200, "Propiedad actualizada correctamente.", true);
} catch (Throwable $error) {
    if (isset($conexion) && $conexion->inTransaction()) {
        $conexion->rollBack();
    }
    error_log("Error al actualizar inmueble: " . $error->getMessage());
    responderActualizacion(500, "No se pudo actualizar la propiedad.");
}
