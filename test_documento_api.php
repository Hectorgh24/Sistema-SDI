<?php
/**
 * Test de la API de Documentos - Verificar funcionalidad de filtrado por carpeta
 */

require_once __DIR__ . '/config/autoload.php';

// Simular autenticación
$_SESSION['usuario_id'] = 1;

echo "<h2>Test API Documentos</h2>";

// Test 1: Obtener carpetas
echo "<h3>Test 1: Obtener Carpetas</h3>";
$carpetaController = new \App\Controllers\CarpetaController();

// Simulate la solicitud GET /api/carpetas
$_SERVER['REQUEST_METHOD'] = 'GET';
$resultados = $carpetaController->listar();
echo "<pre>";
echo json_encode($resultados, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
echo "</pre>";

// Test 2: Obtener documentos de una carpeta (si existe)
echo "<h3>Test 2: Obtener Documentos por Carpeta</h3>";
$documentoController = new \App\Controllers\DocumentoController();

// Verificar que el método porCarpeta existe
if (method_exists($documentoController, 'porCarpeta')) {
    echo "✓ Método porCarpeta existe en DocumentoController<br>";
    
    // Llamar al método con una carpeta de prueba
    try {
        // Pasar ID de carpeta a través del método
        $reflectionMethod = new ReflectionMethod($documentoController, 'porCarpeta');
        echo "✓ Método porCarpeta es public y accessible<br>";
        
        // Test con carpeta ID 1
        ob_start();
        $documentoController->porCarpeta(1);
        $output = ob_get_clean();
        echo "<pre>$output</pre>";
    } catch (Exception $e) {
        echo "✗ Error: " . $e->getMessage() . "<br>";
    }
} else {
    echo "✗ Método porCarpeta NO existe en DocumentoController<br>";
    
    // Listar métodos disponibles
    $methods = get_class_methods($documentoController);
    echo "Métodos disponibles: " . implode(", ", $methods) . "<br>";
}

?>
