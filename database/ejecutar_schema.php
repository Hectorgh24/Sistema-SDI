<?php
/**
 * Ejecutar schema.sql en la base de datos
 */

// Incluir configuración de base de datos
require_once __DIR__ . '/../config/db.php';

try {
    $db = getDBConnection();
    
    // Deshabilitar foreign key checks
    $db->exec("SET FOREIGN_KEY_CHECKS=0;");
    echo "✓ Foreign key checks deshabilitados\n";
    
    // Leer el archivo schema.sql
    $sql = file_get_contents(__DIR__ . '/schema.sql');
    
    // Ejecutar el schema completo
    // Dividir por ";" y ejecutar cada instrucción
    $statements = array_filter(array_map('trim', explode(';', $sql)), function($stmt) {
        return !empty($stmt) && !preg_match('/^\s*--/', $stmt) && strpos($stmt, 'SET FOREIGN_KEY_CHECKS') === false;
    });
    
    $contador = 0;
    foreach ($statements as $statement) {
        if (!empty(trim($statement))) {
            $db->exec($statement . ';');
            $contador++;
        }
    }
    
    // Reabilitar foreign key checks
    $db->exec("SET FOREIGN_KEY_CHECKS=1;");
    echo "✓ Foreign key checks rehabilitados\n";
    
    echo "\n✅ Schema actualizado correctamente ($contador instrucciones ejecutadas)\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>
