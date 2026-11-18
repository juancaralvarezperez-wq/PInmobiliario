<?php

$host = "luxury-bd-luxury-fis.g.aivencloud.com";
$puerto = 13308;
$base = "inmobiliaria_db";

$usuario = getenv("AIVEN_DB_USER") ?: "avnadmin";
$contrasena = getenv("AIVEN_DB_PASSWORD");

$certificado = "C:/xampp/certificados/ca.pem";

try {

    if (!$contrasena) {
        throw new RuntimeException(
            "Falta configurar AIVEN_DB_PASSWORD"
        );
    }

    $conexion = new PDO(
        "mysql:host=$host;port=$puerto;dbname=$base;charset=utf8mb4",
        $usuario,
        $contrasena,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_SSL_CA => $certificado,
            PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => true
        ]
    );

} catch (Throwable $e) {

    error_log("Error de conexión Aiven: " . $e->getMessage());

    http_response_code(500);
    exit("Error al conectar con la base de datos.");

}
?>
