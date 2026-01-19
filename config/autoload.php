<?php
/**
 * Autoloader PSR-4 y Bootstrap - SDI Gestión Documental
 * 
 * Carga automática de clases usando namespace App\
 * Inicialización de configuración global y sesiones
 * 
 * Namespaces soportados:
 * - App\Models          => /app/models
 * - App\Controllers     => /app/controllers
 * - App\Middleware      => /app/middleware
 * - App\Services        => /app/services
 * - App\Traits          => /app/traits
 * 
 * @author SDI Development Team
 * @version 2.0
 */

// ============================================================================
// 1. DEFINIR CONSTANTES GLOBALES
// ============================================================================

if (!defined('APP_ROOT')) {
    define('APP_ROOT', dirname(__DIR__));
}

// Determinar ambiente (desarrollo/producción)
if (!defined('ENVIRONMENT')) {
    define('ENVIRONMENT', 'development'); // Cambiar a 'production' en servidor
}

// Configurar error reporting - NO mostrar warnings en output
if (ENVIRONMENT === 'production') {
    error_reporting(E_ALL);
    ini_set('display_errors', '0');
} else {
    // En desarrollo, loguear errores pero no mostrarlos (para no romper JSON)
    error_reporting(E_ALL);
    ini_set('display_errors', '0');
}

// Configuración de zona horaria
date_default_timezone_set('America/Mexico_City');

// ============================================================================
// 2. CARGAR CONFIGURACIÓN BASE (Antes del autoloader)
// ============================================================================

require_once APP_ROOT . '/config/constants.php';
require_once APP_ROOT . '/config/db.php';
require_once __DIR__ . '/../helpers/seguridad.php';

// ============================================================================
// 3. REGISTRAR AUTOLOADER PSR-4
// ============================================================================

spl_autoload_register(function ($class) {
    // Namespace raíz de aplicación
    $prefix = 'App\\';
    $baseDir = APP_ROOT . DIRECTORY_SEPARATOR;

    // Verificar si la clase pertenece al namespace App\
    if (strpos($class, $prefix) !== 0) {
        return false; // No es nuestro namespace
    }

    // Remover el prefijo "App\"
    $relativeClass = substr($class, strlen($prefix));

    // Convertir namespace a ruta de archivo
    // Ejemplo: App\Models\Usuario => Models/Usuario.php
    $file = $baseDir . str_replace('\\', DIRECTORY_SEPARATOR, $relativeClass) . '.php';

    // Si el archivo existe, cargarlo
    if (file_exists($file)) {
        require_once $file;
        return true;
    }

    // Buscar también en la carpeta controllers/ (para compatibilidad)
    if (strpos($class, 'Controllers') !== false) {
        $controllerFile = APP_ROOT . DIRECTORY_SEPARATOR . 'controllers' . DIRECTORY_SEPARATOR . basename($file);
        if (file_exists($controllerFile)) {
            require_once $controllerFile;
            return true;
        }
    }

    return false;
});

// ============================================================================
// 4. INICIAR SESIÓN SEGURA
// ============================================================================

if (!function_exists('startSecureSession')) {
    require_once APP_ROOT . '/helpers/seguridad.php';
}

// Configurar parámetros de sesión antes de iniciar
if (!session_id()) {
    session_name('SDI_Session');
    session_set_cookie_params([
        'lifetime' => 3600,
        'path'     => '/',
        'domain'   => $_SERVER['HTTP_HOST'] ?? 'localhost',
        'secure'   => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on',
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
    session_start();
}

// ============================================================================
// 5. CONFIGURAR MANEJO DE ERRORES
// ============================================================================

if (ENVIRONMENT === 'development') {
    error_reporting(E_ALL);
    ini_set('display_errors', '1');
    ini_set('display_startup_errors', '1');
} else {
    error_reporting(E_ALL & ~E_DEPRECATED & ~E_STRICT);
    ini_set('display_errors', '0');
    ini_set('log_errors', '1');
    ini_set('error_log', APP_ROOT . '/logs/errors.log');
}

// ============================================================================
// 6. DEFINIR FUNCIONES AUXILIARES DE DESARROLLO
// ============================================================================

/**
 * Función auxiliar: dd (Dump and Die)
 * Imprime una variable y detiene la ejecución
 * Uso: dd($variable);
 * 
 * @param mixed ...$vars Variables a mostrar
 */
if (!function_exists('dd')) {
    function dd(...$vars) {
        echo '<pre style="background:#1f2937; color:#10b981; padding:15px; border-radius:4px; font-family:\'Monaco\',monospace; border:1px solid #374151;">';
        foreach ($vars as $var) {
            var_dump($var);
        }
        echo '</pre>';
        die();
    }
}

/**
 * Nota: La función logger() está definida en helpers/seguridad.php
 * que se carga antes de este archivo, por lo que no se redefine aquí.
 */

/**
 * Función auxiliar: response
 * Devuelve una respuesta JSON estructurada
 * Asegura que siempre se devuelva JSON válido, incluso si hay errores
 * 
 * @param bool $success Estado de la operación
 * @param string $message Mensaje de respuesta
 * @param mixed $data Datos adicionales (opcional)
 * @param int $statusCode Código HTTP (opcional)
 */
if (!function_exists('response')) {
    function response($success = true, $message = '', $data = null, $statusCode = 200) {
        // Limpiar cualquier output previo que pueda romper el JSON
        if (ob_get_level() > 0) {
            ob_clean();
        }
        
        // Asegurar que no haya errores de PHP en el output
        $error = error_get_last();
        if ($error && ($error['type'] === E_ERROR || $error['type'] === E_PARSE || $error['type'] === E_CORE_ERROR)) {
            logger("Error PHP detectado antes de response: " . $error['message'], 'ERROR', [
                'file' => $error['file'],
                'line' => $error['line']
            ]);
        }
        
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        
        $response = [
            'success' => (bool)$success,
            'message' => (string)$message,
            'data'    => $data,
            'timestamp' => date('Y-m-d H:i:s')
        ];
        
        try {
            $json = json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
            
            if ($json === false) {
                // Si hay error al codificar JSON, intentar sin datos problemáticos
                $response['data'] = null;
                $response['json_error'] = json_last_error_msg();
                $json = json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
                
                if ($json === false) {
                    // Último recurso: respuesta mínima
                    $json = '{"success":false,"message":"Error al generar respuesta","data":null,"timestamp":"' . date('Y-m-d H:i:s') . '"}';
                }
            }
            
            echo $json;
            
        } catch (\Exception $e) {
            // Si todo falla, respuesta de emergencia
            logger("Error crítico en response(): " . $e->getMessage(), 'ERROR');
            echo '{"success":false,"message":"Error crítico del servidor","data":null,"timestamp":"' . date('Y-m-d H:i:s') . '"}';
        }
        
        exit;
    }
}
?>

