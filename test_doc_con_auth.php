<?php
/**
 * Test completo API Documentos con autenticación
 */

// Iniciar sesión antes de incluir autoload
session_start();

require_once __DIR__ . '/config/autoload.php';

// Crear una sesión simulada con usuario admin
$_SESSION['id_usuario'] = 1;
$_SESSION['email'] = 'admin@sdi.local';
$_SESSION['rol'] = 'administrador';
$_SESSION['nombre'] = 'Admin';
$_SESSION['apellido'] = 'Usuario';

echo "<h1>Test API Documentos - Con Autenticación</h1>";

// Test 1: Obtener carpetas
echo "<h2>Test 1: Listar Carpetas</h2>";
try {
    $carpetaController = new \App\Controllers\CarpetaController();
    $_SERVER['REQUEST_METHOD'] = 'GET';
    ob_start();
    $carpetaController->listar();
    $output = ob_get_clean();
    echo "<pre>" . htmlspecialchars($output) . "</pre>";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}

// Test 2: Verificar que porCarpeta existe
echo "<h2>Test 2: Verificar método porCarpeta</h2>";
$documentoController = new \App\Controllers\DocumentoController();
if (method_exists($documentoController, 'porCarpeta')) {
    echo "✓ Método 'porCarpeta' existe<br>";
    
    // Obtener lista de métodos
    $methods = get_class_methods($documentoController);
    echo "Métodos en DocumentoController: <br>";
    foreach ($methods as $method) {
        if (strpos($method, 'por') !== false || strpos($method, 'listar') !== false) {
            echo "  - <strong>$method</strong><br>";
        }
    }
} else {
    echo "✗ Método 'porCarpeta' NO existe<br>";
}

// Test 3: Llamar a porCarpeta directamente
echo "<h2>Test 3: Obtener Documentos por Carpeta (ID=1)</h2>";
try {
    $_SERVER['REQUEST_METHOD'] = 'GET';
    ob_start();
    $documentoController->porCarpeta(1);
    $output = ob_get_clean();
    echo "<pre>" . htmlspecialchars($output) . "</pre>";
} catch (Exception $e) {
    echo "Error: " . htmlspecialchars($e->getMessage());
}

?>
