<?php
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
date_default_timezone_set('America/Bahia');

try {
    $pdo = new PDO("sqlite:" . __DIR__ . "/../healthtime_app.db");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec("CREATE TABLE IF NOT EXISTS alertas_emergencia (id INTEGER PRIMARY KEY AUTOINCREMENT, bpm INTEGER, spo2 INTEGER, tipo_evento TEXT, descricao TEXT, data_hora TEXT)");

    $input = json_decode(file_get_contents('php://input'), true);
    if ($input) {
        $dataHora = date('d/m/Y H:i:s');
        
        // 1. Garante primeiro o salvamento no banco local do seu App
        $stmt = $pdo->prepare("INSERT INTO alertas_emergencia (bpm, spo2, tipo_evento, descricao, data_hora) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$input['bpm'], $input['spo2'], $input['tipo_evento'], $input['descricao'], $dataHora]);

        // 2. Envia para o Codespaces do Site da Mari via cURL (mais rápido, seguro e sem travar)
        $urlSiteMari = "https://musical-space-barnacle-g44r4x7w7v44h96x5-8000.app.github.dev/api/receber_alerta.php";
        
        $payload = json_encode([
            'bpm' => $input['bpm'],
            'spo2' => $input['spo2'],
            'tipo_evento' => $input['tipo_evento'],
            'descricao' => $input['descricao'],
            'data_hora' => $dataHora
        ]);

        $ch = curl_init($urlSiteMari);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 4);
        curl_exec($ch);
        curl_close($ch);

        echo json_encode(['status' => 'sucesso']);
    }
} catch (Exception $e) { 
    echo json_encode(['status' => 'erro', 'mensagem' => $e->getMessage()]); 
}
?>