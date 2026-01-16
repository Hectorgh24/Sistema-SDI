<?php
/**
 * Script de depuración para verificar usuario
 */

require_once __DIR__ . '/config/db.php';

try {
    $db = getDBConnection();
    
    // 1. Verificar conexión a BD
    echo "✓ Conectado a BD correctamente\n\n";
    
    // 2. Listar todos los usuarios
    echo "=== USUARIOS EN LA BD ===\n";
    $stmt = $db->query("SELECT id_usuario, nombre, email, estado FROM usuarios");
    $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($usuarios)) {
        echo "❌ NO HAY USUARIOS EN LA BD!\n";
    } else {
        foreach ($usuarios as $user) {
            echo "ID: {$user['id_usuario']} | Email: {$user['email']} | Nombre: {$user['nombre']} | Estado: {$user['estado']}\n";
        }
    }
    
    // 3. Verificar hash del usuario específico
    echo "\n=== VERIFICACIÓN DE HASH ===\n";
    $stmt = $db->prepare("SELECT email, password_hash FROM usuarios WHERE email = ?");
    $stmt->execute(['hectorggh24@gmail.com']);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user) {
        echo "Email encontrado: {$user['email']}\n";
        echo "Hash almacenado: {$user['password_hash']}\n";
        
        $password_test = 'password';
        $verificacion = password_verify($password_test, $user['password_hash']);
        
        if ($verificacion) {
            echo "✓ La contraseña 'password' es CORRECTA\n";
        } else {
            echo "❌ La contraseña 'password' NO coincide con el hash\n";
            
            // Generar nuevo hash
            echo "\n=== GENERAR NUEVO HASH ===\n";
            $nuevo_hash = password_hash('password', PASSWORD_BCRYPT);
            echo "Nuevo hash: $nuevo_hash\n";
            
            // Actualizar BD
            $update = $db->prepare("UPDATE usuarios SET password_hash = ? WHERE email = ?");
            $update->execute([$nuevo_hash, 'hectorggh24@gmail.com']);
            
            echo "✓ Hash actualizado en BD\n";
        }
    } else {
        echo "❌ Usuario NO encontrado con email: hectorggh24@gmail.com\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Archivo: " . $e->getFile() . "\n";
    echo "Línea: " . $e->getLine() . "\n";
}
?>
