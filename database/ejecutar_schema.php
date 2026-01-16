<?php
/**
 * Ejecutar schema.sql en la base de datos
 */

try {
    // 1. CONEXIÓN INICIAL (sin especificar BD)
    $dsn = "mysql:host=localhost;port=3307;charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    $db = new PDO($dsn, 'root', '', $options);
    
    $dbName = 'sdi_gestion_documental';
    
    echo "=== CREANDO/VERIFICANDO BD ===\n";
    
    // 2. CREAR BD si no existe
    $db->exec("CREATE DATABASE IF NOT EXISTS `$dbName` 
              CHARACTER SET utf8mb4 
              COLLATE utf8mb4_unicode_ci;");
    echo "✓ BD '$dbName' creada/verificada\n";
    
    // 3. SELECCIONAR BD
    $db->exec("USE `$dbName`;");
    echo "✓ BD seleccionada: $dbName\n\n";
    
    // 4. DESHABILITAR FOREIGN KEYS
    $db->exec("SET FOREIGN_KEY_CHECKS=0;");
    echo "✓ Foreign key checks deshabilitados\n";
    
    // 5. LEER Y EJECUTAR SCHEMA
    $sql = file_get_contents(__DIR__ . '/schema.sql');
    
    // Dividir por ";" y ejecutar cada instrucción
    $statements = array_filter(
        array_map('trim', explode(';', $sql)), 
        function($stmt) {
            return !empty($stmt) && 
                   !preg_match('/^\s*--/', $stmt) && 
                   strpos($stmt, 'SET FOREIGN_KEY_CHECKS') === false &&
                   strpos($stmt, 'CREATE DATABASE') === false;
        }
    );
    
    $contador = 0;
    foreach ($statements as $statement) {
        if (!empty(trim($statement))) {
            $db->exec($statement . ';');
            $contador++;
        }
    }
    
    // 6. REABILITAR FOREIGN KEYS
    $db->exec("SET FOREIGN_KEY_CHECKS=1;");
    echo "✓ Foreign key checks rehabilitados\n";
    
    echo "\n✅ Schema actualizado correctamente ($contador instrucciones ejecutadas)\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>
