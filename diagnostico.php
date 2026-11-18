<?php
header("Content-Type: application/json; charset=utf-8");

echo json_encode([
    "usuario" => getenv("AIVEN_DB_USER") ?: "NO CONFIGURADO",
    "password_configurada" => getenv("AIVEN_DB_PASSWORD") !== false
        && getenv("AIVEN_DB_PASSWORD") !== "",
    "certificado_existe" => file_exists("C:/xampp/certificados/ca.pem"),
    "pdo_mysql_disponible" => extension_loaded("pdo_mysql")
], JSON_PRETTY_PRINT);
?>