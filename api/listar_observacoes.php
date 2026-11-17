<?php
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");

try {
    $pdo = new PDO("sqlite:" . __DIR__ . "/../healthtime_app.db");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec("CREATE TABLE IF NOT EXISTS observacoes_medicas (id INTEGER PRIMARY KEY AUTOINCREMENT, texto TEXT, data_hora TEXT)");
    
    $dados = $pdo->query("SELECT * FROM observacoes_medicas ORDER BY id DESC LIMIT 10")->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($dados);
} catch (Exception $e) { 
    echo json_encode([]); 
}
?>