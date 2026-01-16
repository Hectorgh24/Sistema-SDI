<?php
/**
 * Test crear carpeta directamente
 */

require_once 'config/autoload.php';
require_once 'helpers/seguridad.php';

try {
    // Simular sesión de usuario
    $_SESSION['id_usuario'] = 1;
    $_SESSION['email'] = 'hectorggh24@gmail.com';
    $_SESSION['rol'] = 'administrador';
    
    // Datos de prueba
    $datos = [
        'no_carpeta_fisica' => 2,
        'titulo' => 'Carpeta Prueba 2',
        'etiqueta_identificadora' => 'TEST-002',
        'descripcion' => 'Esta es una carpeta de prueba',
        'estado_gestion' => 'pendiente',
        'creado_por_id' => 1
    ];
    
    // Crear modelo
    $carpeta = new \App\Models\Carpeta();
    
    // Intentar crear
    $resultado = $carpeta->crear($datos);
    
    echo json_encode([
        'success' => true,
        'message' => 'Carpeta creada exitosamente',
        'id_carpeta' => $resultado,
        'datos' => $datos
    ], JSON_PRETTY_PRINT);
    
} catch (\Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'datos' => $datos ?? []
    ], JSON_PRETTY_PRINT);
}
?>
