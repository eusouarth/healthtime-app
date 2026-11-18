<?php
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");
date_default_timezone_set('America/Bahia');

try {
    $pdo = new PDO("sqlite:" . __DIR__ . "/../healthtime_app.db");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $pdo->exec("CREATE TABLE IF NOT EXISTS observacoes_medicas (id INTEGER PRIMARY KEY AUTOINCREMENT, texto TEXT, data_hora TEXT)");

    $input = json_decode(file_get_contents('php://input'), true);
    
    $textoRecebido = $input['texto'] ?? $input['parecer'] ?? $input['observacao'] ?? $input['mensagem'] ?? null;

    if ($textoRecebido) {
        $stmt = $pdo->prepare("INSERT INTO observacoes_medicas (texto, data_hora) VALUES (?, ?)");
        $stmt->execute([$textoRecebido, date('d/m/Y H:i:s')]);
        echo json_encode(['status' => 'sucesso', 'recebido' => $textoRecebido]);
    } else {
        echo json_encode(['status' => 'erro', 'msg' => 'Texto vazio']);
    }
} catch (Exception $e) { 
    echo json_encode(['status' => 'erro', 'mensagem' => $e->getMessage()]); 
}
?>