<?php
// Diagnóstico de la BD
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');

require_once __DIR__ . '/config/db.php';

try {
    $db = getDBConnection();
    
    // 1. Verificar que la tabla existe
    $result = $db->query("SHOW TABLES LIKE 'carpetas_fisicas'");
    $tableExists = $result->rowCount() > 0;
    
    // 2. Obtener estructura de la tabla
    $columns = $db->query("SHOW COLUMNS FROM carpetas_fisicas")->fetchAll(PDO::FETCH_ASSOC);
    $columnNames = array_column($columns, 'Field');
    
    // 3. Contar carpetas existentes
    $carpetas = $db->query("SELECT COUNT(*) as total FROM carpetas_fisicas")->fetch(PDO::FETCH_ASSOC);
    
    // 4. Mostrar primeras carpetas
    $samples = $db->query("SELECT * FROM carpetas_fisicas LIMIT 3")->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'diagnostico' => [
            'tabla_existe' => $tableExists,
            'columnas' => $columnNames,
            'titulo_existe' => in_array('titulo', $columnNames),
            'total_carpetas' => $carpetas['total'],
            'primeras_carpetas' => $samples
        ]
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
