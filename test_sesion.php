<?php
/**
 * Test crear carpeta sin sesión (para ver el error)
 */

// Obtener el input del usuario
$input = json_decode(file_get_contents('php://input'), true) ?? [
    'no_carpeta_fisica' => 3,
    'titulo' => 'Test Sin Sesión',
    'etiqueta_identificadora' => 'NOSESION-001',
    'descripcion' => 'Prueba sin sesión'
];

echo json_encode([
    'metodo' => $_SERVER['REQUEST_METHOD'],
    'input' => $input,
    'session' => $_SESSION ?? [],
    'has_session_id' => isset($_SESSION['id_usuario']),
    'message' => 'Este es un test para verificar la estructura'
], JSON_PRETTY_PRINT);
?>
