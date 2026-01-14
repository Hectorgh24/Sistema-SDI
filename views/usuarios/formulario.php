<?php
/**
 * Vista de Formulario de Usuario - SDI Gestión Documental
 * Formulario único para crear y editar usuarios
 */

// Prevenir acceso directo
if (!defined('APP_ROOT')) {
    require_once __DIR__ . '/../../config/autoload.php';
}

// Obtener datos del usuario si es edición
$esEdicion = isset($usuario) && !empty($usuario);
$titulo = $esEdicion ? 'Editar Usuario' : 'Nuevo Usuario';

// Obtener datos del formulario o del usuario
$nombre = $esEdicion ? escapeOutput($usuario['nombre']) : (isset($_SESSION['datos_usuario']['nombre']) ? escapeOutput($_SESSION['datos_usuario']['nombre']) : '');
$apellidoPaterno = $esEdicion ? escapeOutput($usuario['apellido_paterno']) : (isset($_SESSION['datos_usuario']['apellido_paterno']) ? escapeOutput($_SESSION['datos_usuario']['apellido_paterno']) : '');
$apellidoMaterno = $esEdicion ? escapeOutput($usuario['apellido_materno'] ?? '') : (isset($_SESSION['datos_usuario']['apellido_materno']) ? escapeOutput($_SESSION['datos_usuario']['apellido_materno']) : '');
$email = $esEdicion ? escapeOutput($usuario['email']) : (isset($_SESSION['datos_usuario']['email']) ? escapeOutput($_SESSION['datos_usuario']['email']) : '');
$idRol = $esEdicion ? (int)$usuario['id_rol'] : (isset($_SESSION['datos_usuario']['id_rol']) ? (int)$_SESSION['datos_usuario']['id_rol'] : '');
$estado = $esEdicion ? escapeOutput($usuario['estado']) : (isset($_SESSION['datos_usuario']['estado']) ? escapeOutput($_SESSION['datos_usuario']['estado']) : ESTADO_ACTIVO);

// Limpiar datos de sesión
unset($_SESSION['datos_usuario']);

// Obtener errores
$errores = isset($_SESSION['errores_usuario']) ? $_SESSION['errores_usuario'] : [];
unset($_SESSION['errores_usuario']);
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo escapeOutput($titulo); ?> - SDI Gestión Documental</title>
    
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <style>
        :root {
            --bg-primary: #ffffff;
            --bg-secondary: #f3f4f6;
            --bg-card: #ffffff;
            --text-primary: #111827;
            --text-secondary: #6b7280;
            --border-color: #e5e7eb;
        }
        
        [data-theme="dark"] {
            --bg-primary: #1f2937;
            --bg-secondary: #111827;
            --bg-card: #374151;
            --text-primary: #f9fafb;
            --text-secondary: #d1d5db;
            --border-color: #4b5563;
        }
        
        body {
            background-color: var(--bg-secondary);
            color: var(--text-primary);
            transition: background-color 0.3s, color 0.3s;
        }
        
        .card {
            background-color: var(--bg-card);
            border-color: var(--border-color);
        }
        
        .input-field {
            background-color: var(--bg-primary);
            border-color: var(--border-color);
            color: var(--text-primary);
        }
        
        .input-field:focus {
            border-color: #3b82f6;
            outline: none;
            ring: 2px;
            ring-color: #3b82f6;
        }
    </style>
</head>
<body>
    
    <?php include __DIR__ . '/../layouts/header.php'; ?>
    
    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <!-- Título -->
        <div class="mb-6">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white"><?php echo escapeOutput($titulo); ?></h1>
            <p class="text-gray-600 dark:text-gray-400 mt-1">
                <?php echo $esEdicion ? 'Modifica los datos del usuario' : 'Completa el formulario para crear un nuevo usuario'; ?>
            </p>
        </div>
        
        <!-- Mensajes de Error -->
        <?php if (!empty($errores)): ?>
        <div class="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded relative" role="alert">
            <ul class="list-disc list-inside">
                <?php foreach ($errores as $error): ?>
                <li><?php echo escapeOutput($error); ?></li>
                <?php endforeach; ?>
            </ul>
        </div>
        <?php endif; ?>
        
        <!-- Formulario -->
        <div class="card border rounded-lg p-6">
            <form method="POST" action="/usuarios.php?accion=<?php echo $esEdicion ? 'actualizar' : 'crear'; ?>" id="formUsuario">
                
                <?php if ($esEdicion): ?>
                <input type="hidden" name="id_usuario" value="<?php echo (int)$usuario['id_usuario']; ?>">
                <?php endif; ?>
                
                <div class="space-y-6">
                    
                    <!-- Nombre -->
                    <div>
                        <label for="nombre" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Nombre <span class="text-red-500">*</span>
                        </label>
                        <input 
                            type="text" 
                            id="nombre" 
                            name="nombre" 
                            required
                            value="<?php echo $nombre; ?>"
                            class="w-full px-3 py-2 border input-field rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                            placeholder="Ej: Juan"
                        >
                        <span class="text-red-500 text-xs mt-1 hidden" id="nombre-error"></span>
                    </div>
                    
                    <!-- Apellidos -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label for="apellido_paterno" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Apellido Paterno <span class="text-red-500">*</span>
                            </label>
                            <input 
                                type="text" 
                                id="apellido_paterno" 
                                name="apellido_paterno" 
                                required
                                value="<?php echo $apellidoPaterno; ?>"
                                class="w-full px-3 py-2 border input-field rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                                placeholder="Ej: Pérez"
                            >
                            <span class="text-red-500 text-xs mt-1 hidden" id="apellido_paterno-error"></span>
                        </div>
                        
                        <div>
                            <label for="apellido_materno" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Apellido Materno
                            </label>
                            <input 
                                type="text" 
                                id="apellido_materno" 
                                name="apellido_materno" 
                                value="<?php echo $apellidoMaterno; ?>"
                                class="w-full px-3 py-2 border input-field rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                                placeholder="Ej: García"
                            >
                            <span class="text-gray-500 text-xs mt-1">Opcional</span>
                            <span class="text-red-500 text-xs mt-1 hidden" id="apellido_materno-error"></span>
                        </div>
                    </div>
                    
                    <!-- Email -->
                    <div>
                        <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Correo Electrónico <span class="text-red-500">*</span>
                        </label>
                        <input 
                            type="email" 
                            id="email" 
                            name="email" 
                            required
                            value="<?php echo $email; ?>"
                            class="w-full px-3 py-2 border input-field rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                            placeholder="ejemplo@correo.com"
                        >
                        <span class="text-red-500 text-xs mt-1 hidden" id="email-error"></span>
                    </div>
                    
                    <!-- Contraseña -->
                    <div>
                        <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Contraseña <?php if (!$esEdicion): ?><span class="text-red-500">*</span><?php endif; ?>
                        </label>
                        <input 
                            type="password" 
                            id="password" 
                            name="password" 
                            <?php if (!$esEdicion): ?>required<?php endif; ?>
                            class="w-full px-3 py-2 border input-field rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                            placeholder="<?php echo $esEdicion ? 'Dejar vacío para no cambiar' : 'Mínimo 6 caracteres'; ?>"
                        >
                        <span class="text-gray-500 text-xs mt-1">
                            <?php if ($esEdicion): ?>
                                Deja este campo vacío si no deseas cambiar la contraseña
                            <?php else: ?>
                                Mínimo 6 caracteres
                            <?php endif; ?>
                        </span>
                        <span class="text-red-500 text-xs mt-1 hidden" id="password-error"></span>
                    </div>
                    
                    <!-- Rol -->
                    <div>
                        <label for="id_rol" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Rol (Permisos) <span class="text-red-500">*</span>
                        </label>
                        <select 
                            id="id_rol" 
                            name="id_rol" 
                            required
                            class="w-full px-3 py-2 border input-field rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                        >
                            <option value="">Selecciona un rol</option>
                            <?php foreach ($roles as $rol): ?>
                            <option value="<?php echo (int)$rol['id_rol']; ?>" <?php echo ($idRol == $rol['id_rol']) ? 'selected' : ''; ?>>
                                <?php echo escapeOutput($rol['nombre_rol']); ?> - <?php echo escapeOutput($rol['descripcion']); ?>
                            </option>
                            <?php endforeach; ?>
                        </select>
                        <span class="text-red-500 text-xs mt-1 hidden" id="id_rol-error"></span>
                    </div>
                    
                    <!-- Estado -->
                    <div>
                        <label for="estado" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Estado <span class="text-red-500">*</span>
                        </label>
                        <select 
                            id="estado" 
                            name="estado" 
                            required
                            class="w-full px-3 py-2 border input-field rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                        >
                            <option value="activo" <?php echo ($estado == ESTADO_ACTIVO) ? 'selected' : ''; ?>>Activo</option>
                            <option value="inactivo" <?php echo ($estado == ESTADO_INACTIVO) ? 'selected' : ''; ?>>Inactivo</option>
                        </select>
                    </div>
                    
                    <!-- Botones -->
                    <div class="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <a href="/usuarios.php" 
                           class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            Cancelar
                        </a>
                        <button 
                            type="submit" 
                            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            id="submitBtn"
                        >
                            <?php echo $esEdicion ? 'Actualizar Usuario' : 'Crear Usuario'; ?>
                        </button>
                    </div>
                    
                </div>
            </form>
        </div>
        
    </main>
    
    <?php include __DIR__ . '/../layouts/footer.php'; ?>
    
    <script>
        // Validación del formulario (lado del cliente)
        document.getElementById('formUsuario').addEventListener('submit', function(e) {
            const nombre = document.getElementById('nombre');
            const apellidoPaterno = document.getElementById('apellido_paterno');
            const apellidoMaterno = document.getElementById('apellido_materno');
            const email = document.getElementById('email');
            const password = document.getElementById('password');
            const idRol = document.getElementById('id_rol');
            const esEdicion = <?php echo $esEdicion ? 'true' : 'false'; ?>;
            
            let isValid = true;
            
            // Limpiar errores previos
            [nombre, apellidoPaterno, apellidoMaterno, email, password, idRol].forEach(field => {
                const errorSpan = document.getElementById(field.id + '-error');
                if (errorSpan) {
                    errorSpan.classList.add('hidden');
                    field.classList.remove('border-red-500');
                }
            });
            
            // Validar nombre
            if (!nombre.value.trim()) {
                showError('nombre', 'El nombre es requerido');
                isValid = false;
            } else if (nombre.value.trim().length < 2) {
                showError('nombre', 'El nombre debe tener al menos 2 caracteres');
                isValid = false;
            }
            
            // Validar apellido paterno
            if (!apellidoPaterno.value.trim()) {
                showError('apellido_paterno', 'El apellido paterno es requerido');
                isValid = false;
            } else if (apellidoPaterno.value.trim().length < 2) {
                showError('apellido_paterno', 'El apellido paterno debe tener al menos 2 caracteres');
                isValid = false;
            }
            
            // Validar apellido materno (opcional, pero si tiene contenido debe tener al menos 2 caracteres)
            if (apellidoMaterno.value.trim() && apellidoMaterno.value.trim().length < 2) {
                showError('apellido_materno', 'El apellido materno debe tener al menos 2 caracteres si se proporciona');
                isValid = false;
            }
            
            // Validar email
            if (!email.value.trim()) {
                showError('email', 'El email es requerido');
                isValid = false;
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
                showError('email', 'El email no es válido');
                isValid = false;
            }
            
            // Validar contraseña
            if (!esEdicion && !password.value) {
                showError('password', 'La contraseña es requerida');
                isValid = false;
            } else if (password.value && password.value.length < 6) {
                showError('password', 'La contraseña debe tener al menos 6 caracteres');
                isValid = false;
            }
            
            // Validar rol
            if (!idRol.value) {
                showError('id_rol', 'El rol es requerido');
                isValid = false;
            }
            
            if (!isValid) {
                e.preventDefault();
                return false;
            }
            
            // Deshabilitar botón durante el envío
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.disabled = true;
            submitBtn.textContent = '<?php echo $esEdicion ? 'Actualizando...' : 'Creando...'; ?>';
        });
        
        function showError(fieldId, message) {
            const field = document.getElementById(fieldId);
            const errorSpan = document.getElementById(fieldId + '-error');
            
            if (field) {
                field.classList.add('border-red-500');
            }
            
            if (errorSpan) {
                errorSpan.textContent = message;
                errorSpan.classList.remove('hidden');
            }
        }
    </script>
</body>
</html>

