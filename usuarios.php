<?php
/**
 * Router del Módulo de Usuarios - SDI Gestión Documental
 * Maneja todas las peticiones del módulo de gestión de usuarios
 */

require_once __DIR__ . '/config/autoload.php';
require_once __DIR__ . '/controllers/UsuarioController.php';

$controller = new UsuarioController();

// Obtener acción
$accion = getGet('accion', 'index');

// Ejecutar acción correspondiente
switch ($accion) {
    case 'formulario':
        $controller->formulario();
        break;
    
    case 'crear':
        $controller->crear();
        break;
    
    case 'actualizar':
        $controller->actualizar();
        break;
    
    case 'eliminar':
        $controller->eliminar();
        break;
    
    case 'index':
    default:
        $controller->index();
        break;
}

