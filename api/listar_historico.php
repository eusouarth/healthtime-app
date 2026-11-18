<?php
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");

try {
    $pdo = new PDO("sqlite:" . __DIR__ . "/../healthtime_app.db");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec("CREATE TABLE IF NOT EXISTS alertas_emergencia (id INTEGER PRIMARY KEY AUTOINCREMENT, bpm INTEGER, spo2 INTEGER, tipo_evento TEXT, descricao TEXT, data_hora TEXT)");
    
    $dados = $pdo->query("SELECT * FROM alertas_emergencia ORDER BY id DESC LIMIT 10")->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($dados);
} catch (Exception $e) { 
    echo json_encode([]); 
}
?>