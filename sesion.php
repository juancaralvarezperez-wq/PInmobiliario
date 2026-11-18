<?php
header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-store");

session_start();

if (!isset($_SESSION["id_usuario"])) {
    echo json_encode([
        "autenticado" => false
    ]);
    exit;
}

echo json_encode([
    "autenticado" => true,
    "usuario" => [
        "id" => $_SESSION["id_usuario"],
        "nombre" => $_SESSION["nombre"] ?? "",
        "rol" => $_SESSION["rol"] ?? ""
    ]
], JSON_UNESCAPED_UNICODE);
?>
