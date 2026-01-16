<?php
/**
 * Script para ejecutar schema directamente
 */

try {
    // Conexión inicial
    $db = new PDO("mysql:host=localhost;port=3307;charset=utf8mb4", 'root', '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    
    echo "=== LIMPIANDO BD ANTERIOR ===\n";
    $db->exec("DROP DATABASE IF EXISTS `sdi_gestion_documental`;");
    echo "✓ BD anterior eliminada\n\n";
    
    echo "=== CREANDO BD ===\n";
    $db->exec("CREATE DATABASE `sdi_gestion_documental` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
    echo "✓ BD creada\n\n";
    
    // Leer schema completo
    $schema = file_get_contents(__DIR__ . '/database/schema.sql');
    
    // Ejecutar como un bloque completo
    echo "=== EJECUTANDO SCHEMA ===\n";
    $db->exec($schema);
    echo "✓ Schema ejecutado correctamente\n\n";
    
    // Verificar
    $db->exec("USE `sdi_gestion_documental`;");
    $result = $db->query("SELECT COUNT(*) as total FROM usuarios;")->fetch();
    
    if ($result['total'] > 0) {
        echo "✅ BD creada exitosamente\n";
        echo "✓ Usuarios en BD: {$result['total']}\n";
        
        // Mostrar usuario
        $user = $db->query("SELECT id_usuario, nombre, email FROM usuarios LIMIT 1;")->fetch();
        echo "\nUsuario de prueba:\n";
        echo "  - ID: {$user['id_usuario']}\n";
        echo "  - Nombre: {$user['nombre']}\n";
        echo "  - Email: {$user['email']}\n";
    } else {
        echo "❌ BD creada pero sin usuarios\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Línea: " . $e->getLine() . "\n";
}
?>
