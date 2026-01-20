<?php
/**
 * Aplicación SDI Gestión Documental - Punto de Entrada Principal
 * 
 * Router central que:
 * 1. Carga autoloader y configuración
 * 2. Analiza la URL y despacha a controlador apropiado
 * 3. Maneja autenticación y autorización
 * 4. Retorna JSON para todas las solicitudes API
 * 
 * URLs soportadas:
 * - /api/auth/login (POST)
 * - /api/auth/logout (GET)
 * - /api/auth/verificar (GET)
 * - /api/usuarios (GET, POST)
 * - /api/usuarios/:id (GET, PUT, DELETE)
 * - /api/documentos (GET, POST)
 * - /api/carpetas (GET, POST)
 * - /api/categorias (GET, POST)
 * 
 * @author SDI Development Team
 * @version 2.0
 */

// ============================================================================
// 1. CARGAR AUTOLOADER Y CONFIGURACIÓN
// ============================================================================

require_once __DIR__ . '/config/autoload.php';

// ============================================================================
// 2. CONFIGURAR HEADERS PARA API
// ============================================================================

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// Permitir CORS si está configurado
// En producción, restringir a dominio específico
$allowedOrigins = [
    'localhost',
    '127.0.0.1',
    $_SERVER['HTTP_HOST'] ?? ''
];

if (in_array($_SERVER['HTTP_ORIGIN'] ?? '', $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
}

// Responder a preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ============================================================================
// 3. OBTENER RUTA DE LA SOLICITUD
// ============================================================================

logger("=== NUEVA SOLICITUD RECIBIDA ===", 'DEBUG');
logger("REQUEST_METHOD: " . $_SERVER['REQUEST_METHOD'], 'DEBUG');
logger("REQUEST_URI: " . $_SERVER['REQUEST_URI'], 'DEBUG');

$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$scriptName = dirname($_SERVER['SCRIPT_NAME']);

logger("Parsed requestUri: $requestUri", 'DEBUG');
logger("Script dirname: $scriptName", 'DEBUG');

// Remover el directorio del script (ej: /Programa-Gestion-SDI)
if (strpos($requestUri, $scriptName) === 0) {
    $ruta = substr($requestUri, strlen($scriptName));
} else {
    $ruta = $requestUri;
}

// Remover slash inicial y final
$ruta = trim($ruta, '/');

logger("Ruta limpia después de procesamiento: '$ruta'", 'DEBUG');

// ============================================================================
// SERVIR ARCHIVOS ESTÁTICOS
// ============================================================================
// Si la ruta no comienza con 'api', intentar servir archivo estático
if (strpos($ruta, 'api') !== 0) {
    // Archivos permitidos
    $extensionesPermitidas = ['html', 'css', 'js', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'woff', 'woff2', 'ttf', 'php'];
    $partesRuta = explode('.', $ruta);
    $extension = end($partesRuta);
    
    if (in_array($extension, $extensionesPermitidas)) {
        $rutaArchivo = __DIR__ . '/' . $ruta;
        
        // Prevenir directory traversal
        $rutaReal = realpath($rutaArchivo);
        $rutaBase = realpath(__DIR__);
        
        if ($rutaReal && strpos($rutaReal, $rutaBase) === 0 && file_exists($rutaReal)) {
            if ($extension === 'php') {
                // Ejecutar PHP
                include $rutaReal;
            } else {
                // Establecer tipo MIME correcto
                $mimeTypes = [
                    'html' => 'text/html',
                    'css'  => 'text/css',
                    'js'   => 'application/javascript',
                    'json' => 'application/json',
                    'jpg'  => 'image/jpeg',
                    'jpeg' => 'image/jpeg',
                    'png'  => 'image/png',
                    'gif'  => 'image/gif',
                    'svg'  => 'image/svg+xml',
                    'woff' => 'font/woff',
                    'woff2' => 'font/woff2',
                    'ttf'  => 'font/ttf'
                ];
                
                header('Content-Type: ' . ($mimeTypes[$extension] ?? 'text/plain'));
                readfile($rutaReal);
            }
            exit;
        }
    }
    
    // Si es raíz, servir index.html
    if (empty($ruta)) {
        $rutaArchivo = __DIR__ . '/index.html';
        if (file_exists($rutaArchivo)) {
            header('Content-Type: text/html');
            readfile($rutaArchivo);
            exit;
        }
    }
}

// Si está vacío, es la raíz
if (empty($ruta)) {
    $ruta = 'inicio';
    logger("Ruta vacía detectada, usando 'inicio'", 'DEBUG');
}

// ============================================================================
// 4. PARSEADOR DE RUTAS - Router Simple
// ============================================================================

class Router
{
    private $controller;
    private $metodo;
    private $parametros = [];
    private $ruta;

    public function __construct($ruta)
    {
        $this->ruta = $ruta;
        $this->parsearRuta();
    }

    /**
     * Parsear la ruta y extraer controlador, método y parámetros
     */
    private function parsearRuta()
    {
        logger("ROUTER: Iniciando parseo de ruta: '$this->ruta'", 'DEBUG');
        
        // Formato esperado: api/modulo/metodo o api/modulo/id/accion
        $partes = explode('/', $this->ruta);
        logger("ROUTER: Partes de la ruta: " . json_encode($partes), 'DEBUG');

        // Validar que la ruta comience con "api"
        if (empty($partes[0]) || $partes[0] !== 'api') {
            logger("ROUTER: ✗ Ruta no comienza con 'api', llamando ErrorController::notFound", 'WARNING');
            $this->controller = 'App\\Controllers\\ErrorController';
            $this->metodo = 'notFound';
            return;
        }

        // Obtener módulo (usuarios, documentos, etc)
        $modulo = $partes[1] ?? 'auth';
        logger("ROUTER: Módulo detectado: '$modulo'", 'DEBUG');
        
        // Mapear módulo a controlador
        $controladores = [
            'auth'       => 'AuthController',
            'usuarios'   => 'UsuarioController',
            'documentos' => 'DocumentoController',
            'carpetas'   => 'CarpetaController',
            'categorias' => 'CategoriaController',
            'dashboard'  => 'DashboardController'
        ];

        // Determinar controlador
        $controllerName = $controladores[$modulo] ?? 'ErrorController';
        $this->controller = 'App\\Controllers\\' . $controllerName;
        logger("ROUTER: Controlador asignado: '$this->controller'", 'DEBUG');

        // Determinar método basado en el parámetro 2 y 3
        $this->metodo = $this->determinarMetodo($modulo, $partes);
        logger("ROUTER: Método asignado: '$this->metodo'", 'DEBUG');

        // Extraer parámetros (ID, etc)
        if (!empty($partes[2]) && is_numeric($partes[2])) {
            $this->parametros[] = (int)$partes[2];
            logger("ROUTER: Parámetro ID extraído: " . $partes[2], 'DEBUG');
        } else if ($modulo === 'documentos' && $partes[2] === 'por-carpeta' && !empty($partes[3])) {
            // Caso especial: /api/documentos/por-carpeta/:id
            $this->parametros[] = (int)$partes[3];
            logger("ROUTER: Parámetro ID de carpeta extraído: " . $partes[3], 'DEBUG');
        }

        // Parámetro adicional (acción)
        if (!empty($partes[3]) && $modulo !== 'documentos') {
            $this->parametros[] = $partes[3];
            logger("ROUTER: Parámetro adicional extraído: " . $partes[3], 'DEBUG');
        }
    }

    /**
     * Determinar el método del controlador basado en la ruta
     */
    private function determinarMetodo($modulo, $partes)
    {
        $metodo = $partes[2] ?? '';
        $httpMethod = $_SERVER['REQUEST_METHOD'];

        // Casos especiales para endpoints personalizados
        if ($modulo === 'documentos' && $metodo === 'por-carpeta') {
            return 'porCarpeta';
        }

        // Métodos por defecto según verbo HTTP
        if (empty($metodo) || is_numeric($metodo)) {
            switch ($httpMethod) {
                case 'GET':
                    return empty($metodo) ? 'listar' : 'obtener';
                case 'POST':
                    return 'crear';
                case 'PUT':
                    return 'actualizar';
                case 'DELETE':
                    return 'eliminar';
                case 'PATCH':
                    return !empty($partes[3]) ? $partes[3] : 'actualizar';
                default:
                    return 'listar';
            }
        }

        // Si el parámetro 2 no es numérico, es un método explícito
        return $metodo;
    }

    /**
     * Obtener controlador a instanciar
     */
    public function getControlador()
    {
        return $this->controller;
    }

    /**
     * Obtener método a invocar
     */
    public function getMetodo()
    {
        return $this->metodo;
    }

    /**
     * Obtener parámetros
     */
    public function getParametros()
    {
        return $this->parametros;
    }
}

// ============================================================================
// 5. DESPACHAR SOLICITUD A CONTROLADOR
// ============================================================================

try {
    // Crear instancia del router
    $router = new Router($ruta);
    $controladorClass = $router->getControlador();
    $metodo = $router->getMetodo();
    $parametros = $router->getParametros();

    logger("ROUTER: Despachando a $controladorClass::$metodo()", 'INFO');
    logger("ROUTER: Parámetros: " . json_encode($parametros), 'DEBUG');

    // Verificar que el controlador existe
    if (!class_exists($controladorClass)) {
        logger("ROUTER: ✗ Controlador no encontrado: $controladorClass", 'ERROR', [
            'ruta' => $ruta,
            'controlador' => $controladorClass,
            'metodo' => $metodo
        ]);
        http_response_code(404);
        response(false, 'Ruta no encontrada: ' . $ruta, null, 404);
    }

    logger("ROUTER: ✓ Controlador existe", 'DEBUG');

    // Instanciar controlador
    try {
        $controlador = new $controladorClass();
        logger("ROUTER: ✓ Instancia del controlador creada", 'DEBUG');
    } catch (\Exception $e) {
        logger("ROUTER: ✗ Error al instanciar controlador: " . $e->getMessage(), 'ERROR', [
            'controlador' => $controladorClass,
            'exception' => get_class($e),
            'trace' => $e->getTraceAsString()
        ]);
        http_response_code(500);
        response(false, 'Error al inicializar controlador: ' . $e->getMessage(), null, 500);
    }

    // Verificar que el método existe
    if (!method_exists($controlador, $metodo)) {
        logger("ROUTER: ✗ Método no encontrado: $metodo en $controladorClass", 'ERROR', [
            'controlador' => $controladorClass,
            'metodo' => $metodo,
            'metodos_disponibles' => get_class_methods($controlador)
        ]);
        http_response_code(404);
        response(false, 'Método no encontrado: ' . $metodo, null, 404);
    }

    logger("ROUTER: ✓ Método existe, invocando...", 'DEBUG');

    // Invocar método con parámetros
    try {
        if (empty($parametros)) {
            logger("ROUTER: Ejecutando $metodo() sin parámetros", 'DEBUG');
            $controlador->$metodo();
        } else {
            logger("ROUTER: Ejecutando $metodo() con " . count($parametros) . " parámetro(s)", 'DEBUG');
            call_user_func_array([$controlador, $metodo], $parametros);
        }

        logger("ROUTER: ✓ Controlador ejecutado correctamente", 'INFO');
        
    } catch (\Exception $e) {
        logger("ROUTER: ✗ Error al ejecutar método: " . $e->getMessage(), 'ERROR', [
            'controlador' => $controladorClass,
            'metodo' => $metodo,
            'parametros' => $parametros,
            'exception' => get_class($e),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString()
        ]);
        
        // Asegurar que siempre se devuelva JSON válido
        http_response_code(500);
        response(false, 'Error al procesar solicitud: ' . $e->getMessage(), [
            'exception' => get_class($e),
            'file' => basename($e->getFile()),
            'line' => $e->getLine()
        ], 500);
    }

} catch (\Throwable $e) {
    // Capturar cualquier error fatal o excepción no capturada
    logger("ROUTER: ✗ Error fatal: " . $e->getMessage(), 'ERROR', [
        'exception' => get_class($e),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString()
    ]);
    
    // Asegurar que siempre se devuelva JSON válido
    http_response_code(500);
    response(false, 'Error interno del servidor: ' . $e->getMessage(), [
        'exception' => get_class($e),
        'file' => basename($e->getFile()),
        'line' => $e->getLine()
    ], 500);
}
?>
