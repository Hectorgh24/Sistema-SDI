<?php
/**
 * Script para crear usuario administrador inicial
 * ACTUALIZADO: Compatible con la nueva estructura de nombres separados
 * 
 * IMPORTANTE: Eliminar este archivo después de crear el admin
 */

require_once __DIR__ . '/../config/autoload.php';
require_once __DIR__ . '/../models/Usuario.php';

$usuarioModel = new Usuario();

// Datos del administrador (CAMBIAR ESTOS VALORES)
$datosAdmin = [
    'nombre' => 'Hector', // CAMBIAR - Nombre
    'apellido_paterno' => 'Gonzalez', // CAMBIAR - Apellido Paterno
    'apellido_materno' => 'Herrera', // Opcional - Apellido Materno (puede dejarse vacío)
    'email' => 'hectorggh24@gmail.com', // CAMBIAR - Email del administrador
    'password' => 'Admin123!', // CAMBIAR - Debe ser una contraseña segura (mínimo 8 caracteres)
    'id_rol' => 1 // ID del rol Administrador (según el INSERT en schema.sql)
];

// Validar que la contraseña sea segura
if (strlen($datosAdmin['password']) < 8) {
    die('Error: La contraseña debe tener al menos 8 caracteres.');
}

// Verificar si el email ya existe
$usuarioExistente = $usuarioModel->buscarPorEmail($datosAdmin['email']);
if ($usuarioExistente) {
    echo "⚠️  ADVERTENCIA: Ya existe un usuario con el email: {$datosAdmin['email']}\n";
    echo "¿Deseas continuar de todos modos? Esto fallará si el email está en uso.\n\n";
}

// Crear el usuario
$idUsuario = $usuarioModel->crear($datosAdmin);

if ($idUsuario) {
    echo "✅ Usuario administrador creado exitosamente!\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "ID: $idUsuario\n";
    echo "Nombre: {$datosAdmin['nombre']} {$datosAdmin['apellido_paterno']}";
    if (!empty($datosAdmin['apellido_materno'])) {
        echo " {$datosAdmin['apellido_materno']}";
    }
    echo "\n";
    echo "Email: {$datosAdmin['email']}\n";
    echo "Contraseña: {$datosAdmin['password']}\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "\n";
    echo "⚠️  IMPORTANTE:\n";
    echo "1. Cambia la contraseña después del primer login\n";
    echo "2. ELIMINA este archivo (crear_admin.php) por seguridad\n";
    echo "3. Guarda estas credenciales en un lugar seguro\n";
} else {
    echo "❌ Error al crear el usuario administrador.\n";
    echo "\n";
    echo "Posibles causas:\n";
    echo "- El email ya está en uso\n";
    echo "- Error en la conexión a la base de datos\n";
    echo "- La estructura de la tabla no coincide (¿ejecutaste la migración?)\n";
    echo "\n";
    echo "Verifica los logs de error para más detalles.\n";
}

