<?php
/**
 * Test directo de API con sesión
 */
session_start();

// Simular que estamos autenticados
$_SESSION['id_usuario'] = 1;
$_SESSION['email'] = 'hectorggh24@gmail.com';
$_SESSION['rol'] = 'administrador';

// Cambiar ruta
$_SERVER['REQUEST_URI'] = '/Programa-Gestion-SDI/api/carpetas/crear';
$_SERVER['REQUEST_METHOD'] = 'POST';

// Ejecutar router
require_once __DIR__ . '/router.php';
?>
