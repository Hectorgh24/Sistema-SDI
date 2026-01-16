# 📚 Guía de Desarrollo - SDI Sistema de Gestión

**Versión 2.0** - Estándares y Buenas Prácticas

---

## 🎯 Objetivo de la Guía

Proporcionar lineamientos claros para el desarrollo, mantenimiento y extensión del sistema SDI, asegurando calidad, consistencia y escalabilidad del código.

---

## 🏗️ Estándares de Código

### Principios Generales
- **PSR-4 Compliance:** Seguir estrictamente los estándares PHP
- **MVC Estricto:** Separación clara de responsabilidades
- **DRY (Don't Repeat Yourself):** Reutilización de código
- **KISS (Keep It Simple, Stupid):** Simplicidad sobre complejidad
- **SOLID Principles:** Aplicar principios de diseño orientado a objetos

### Convenciones de Nomenclatura

#### Variables y Funciones
```php
// ✅ Correcto - CamelCase para variables y funciones
$nombreUsuario = 'Juan Pérez';
function obtenerUsuarioPorId($idUsuario) {
    return $usuario;
}

// ❌ Incorrecto - snake_case para variables
$nombre_usuario = 'Juan Pérez';
function obtener_usuario_por_id($id_usuario) {
    return $usuario;
}
```

#### Clases y Métodos
```php
// ✅ Correcto - PascalCase para clases, camelCase para métodos
class UsuarioController {
    public function obtenerUsuario($id) {
        // Implementación
    }
    
    private function validarEmail($email) {
        // Implementación
    }
}

// ❌ Incorrecto
class usuario_controller {
    public function Obtener_Usuario($id) {
        // Implementación
    }
}
```

#### Constantes
```php
// ✅ Correcto - SCREAMING_SNAKE_CASE
define('MAX_FILE_SIZE', 10485760);
define('DEFAULT_PAGE_SIZE', 20);

// ❌ Incorrecto
define('maxFileSize', 10485760);
define('defaultPageSize', 20);
```

### Estructura de Archivos

#### Controllers
```php
<?php
/**
 * Controlador de [Módulo]
 * 
 * @author SDI Development Team
 * @version 2.0
 */

class [Modulo]Controller {
    private $modelo;
    
    public function __construct() {
        $this->modelo = new [Modulo]Model();
    }
    
    /**
     * [Descripción del método]
     * 
     * @param array $params Parámetros de entrada
     * @return array Respuesta JSON
     */
    public function [metodo]($params = []) {
        try {
            // Validar entrada
            $this->validarEntrada($params);
            
            // Ejecutar lógica de negocio
            $resultado = $this->modelo->[metodo]($params);
            
            // Retornar respuesta estandarizada
            response(true, 'Operación completada', $resultado);
            
        } catch (Exception $e) {
            // Loggear error
            error_log("Error en " . __METHOD__ . ": " . $e->getMessage());
            
            // Retornar error
            response(false, $e->getMessage(), null, 500);
        }
    }
    
    /**
     * Validar parámetros de entrada
     */
    private function validarEntrada($params) {
        // Implementación de validación
    }
}
```

#### Models
```php
<?php
/**
 * Modelo de [Entidad]
 * 
 * @author SDI Development Team
 * @version 2.0
 */

class [Entidad] {
    private $db;
    private $tabla = '[nombre_tabla]';
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * Obtener todos los registros con paginación
     * 
     * @param int $pagina Número de página
     * @param int $limite Límite de resultados por página
     * @return array Registros encontrados
     */
    public function obtenerTodos($pagina = 1, $limite = 20) {
        $offset = ($pagina - 1) * $limite;
        
        $sql = "SELECT * FROM {$this->tabla} 
                ORDER BY fecha_creacion DESC 
                LIMIT :limite OFFSET :offset";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':limite', $limite, PDO::PARAM_INT);
        $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Obtener registro por ID
     * 
     * @param int $id ID del registro
     * @return array|null Registro encontrado
     */
    public function obtenerPorId($id) {
        $sql = "SELECT * FROM {$this->tabla} WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        
        $resultado = $stmt->fetch(PDO::FETCH_ASSOC);
        return $resultado ?: null;
    }
    
    /**
     * Crear nuevo registro
     * 
     * @param array $datos Datos del registro
     * @return int ID del registro creado
     */
    public function crear($datos) {
        $sql = "INSERT INTO {$this->tabla} (columna1, columna2, columna3) 
                VALUES (:campo1, :campo2, :campo3)";
        
        $stmt = $this->db->prepare($sql);
        
        // Bind parameters
        foreach ($datos as $campo => $valor) {
            $stmt->bindValue(":$campo", $valor);
        }
        
        $stmt->execute();
        return $this->db->lastInsertId();
    }
    
    /**
     * Actualizar registro existente
     * 
     * @param int $id ID del registro
     * @param array $datos Datos a actualizar
     * @return bool Éxito de la operación
     */
    public function actualizar($id, $datos) {
        $setClause = [];
        foreach ($datos as $campo => $valor) {
            $setClause[] = "$campo = :$campo";
        }
        
        $sql = "UPDATE {$this->tabla} SET " . implode(', ', $setClause) 
                WHERE id = :id";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        
        foreach ($datos as $campo => $valor) {
            $stmt->bindValue(":$campo", $valor);
        }
        
        return $stmt->execute();
    }
    
    /**
     * Eliminar registro
     * 
     * @param int $id ID del registro
     * @return bool Éxito de la operación
     */
    public function eliminar($id) {
        $sql = "DELETE FROM {$this->tabla} WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        
        return $stmt->execute();
    }
}
```

---

## 🌐 Estándares Frontend

### JavaScript Modular
```javascript
// ✅ Correcto - Módulo autocontenido
const moduloEjemplo = {
    // Estado privado
    datos: [],
    
    // Inicialización
    async init() {
        await this.cargarDatos();
        this.attachEventListeners();
    },
    
    // Métodos públicos
    async crear(datos) {
        try {
            const resultado = await api.post('/endpoint', datos);
            this.datos.push(resultado.data);
            this.actualizarUI();
            ui.toast('Elemento creado exitosamente', 'success');
        } catch (error) {
            ui.toast('Error al crear elemento', 'error');
        }
    },
    
    // Métodos privados
    async cargarDatos() {
        const respuesta = await api.get('/endpoint');
        this.datos = respuesta.data;
    },
    
    attachEventListeners() {
        document.getElementById('formulario')
            .addEventListener('submit', (e) => this.handleSubmit(e));
    },
    
    handleSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        this.crear(Object.fromEntries(formData));
    },
    
    actualizarUI() {
        // Lógica de actualización de interfaz
    }
};

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
    moduloEjemplo.init();
});
```

### CSS Organizado
```css
/* ✅ Correcto - BEM methodology */
.componente {
    /* Estilos base */
}

.componente__elemento {
    /* Estilos de elemento */
}

.componente__elemento--modificador {
    /* Estilos modificadores */
}

.componente--estado-activo {
    /* Estilos de estado */
}

/* Variables CSS personalizadas */
:root {
    --color-primario: #3b82f6;
    --color-secundario: #6b7280;
    --color-exito: #10b981;
    --color-error: #ef4444;
    --color-advertencia: #f59e0b;
}
```

---

## 🔐 Estándares de Seguridad

### Validación de Entrada
```php
/**
 * Sanitización y validación de datos
 */
class Validador {
    /**
     * Sanitizar string para prevenir XSS
     */
    public static function sanitizarString($input) {
        return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
    }
    
    /**
     * Validar email con formato estricto
     */
    public static function validarEmail($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }
    
    /**
     * Validar contraseña según políticas
     */
    public static function validarPassword($password) {
        $errores = [];
        
        if (strlen($password) < 8) {
            $errores[] = 'La contraseña debe tener al menos 8 caracteres';
        }
        
        if (!preg_match('/[A-Z]/', $password)) {
            $errores[] = 'Debe contener al menos una mayúscula';
        }
        
        if (!preg_match('/[a-z]/', $password)) {
            $errores[] = 'Debe contener al menos una minúscula';
        }
        
        if (!preg_match('/[0-9]/', $password)) {
            $errores[] = 'Debe contener al menos un número';
        }
        
        return empty($errores) ? true : $errores;
    }
    
    /**
     * Validar número de teléfono
     */
    public static function validarTelefono($telefono) {
        return preg_match('/^[0-9]{10}$/', $telefono);
    }
}
```

### Manejo de Sesiones Seguras
```php
/**
 * Configuración de sesiones seguras
 */
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1);
ini_set('session.use_strict_mode', 1);
ini_set('session.cookie_samesite', 'Strict');
ini_set('session.cookie_lifetime', 7200); // 2 horas

// Generación de token CSRF
function generarTokenCSRF() {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

// Verificación de token CSRF
function verificarTokenCSRF($token) {
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}
```

---

## 📊 Estándares de Base de Datos

### Queries Optimizadas
```sql
-- ✅ Usar índices adecuadamente
CREATE INDEX idx_documentos_estado ON registros_documentos(estado_gestion);
CREATE INDEX idx_documentos_fecha ON registros_documentos(fecha_creacion);
CREATE INDEX idx_documentos_categoria ON registros_documentos(id_categoria);

-- ✅ Usar LIMIT para paginación
SELECT d.*, c.nombre_categoria 
FROM registros_documentos d
JOIN cat_categorias c ON d.id_categoria = c.id_categoria
WHERE d.estado_gestion = 'pendiente'
ORDER BY d.fecha_creacion DESC
LIMIT 20 OFFSET 0;

-- ✅ Evitar SELECT * en producción
SELECT d.id_registro, d.no_oficio, d.descripcion 
FROM registros_documentos d
WHERE d.id_carpeta = :id_carpeta;
```

### Transacciones Atómicas
```php
/**
 * Ejemplo de transacción compleja
 */
function crearDocumentoConCampos($datosDocumento, $camposDinamicos) {
    $db = Database::getInstance();
    
    try {
        $db->beginTransaction();
        
        // Insertar documento principal
        $sqlDocumento = "INSERT INTO registros_documentos 
                       (no_oficio, id_carpeta, id_categoria, emitido_por, fecha_oficio, descripcion, estado_gestion, capturado_por) 
                       VALUES (:no_oficio, :id_carpeta, :id_categoria, :emitido_por, :fecha_oficio, :descripcion, :estado_gestion, :capturado_por)";
        
        $stmt = $db->prepare($sqlDocumento);
        $stmt->execute([
            ':no_oficio' => $datosDocumento['no_oficio'],
            ':id_carpeta' => $datosDocumento['id_carpeta'],
            ':id_categoria' => $datosDocumento['id_categoria'],
            ':emitido_por' => $datosDocumento['emitido_por'],
            ':fecha_oficio' => $datosDocumento['fecha_oficio'],
            ':descripcion' => $datosDocumento['descripcion'],
            ':estado_gestion' => $datosDocumento['estado_gestion'],
            ':capturado_por' => $datosDocumento['capturado_por']
        ]);
        
        $idDocumento = $db->lastInsertId();
        
        // Insertar campos dinámicos
        $sqlCampo = "INSERT INTO detalles_valores_documento 
                        (id_registro, id_columna, valor_texto, valor_numero, valor_fecha, valor_booleano) 
                        VALUES (:id_registro, :id_columna, :valor_texto, :valor_numero, :valor_fecha, :valor_booleano)";
        
        $stmtCampo = $db->prepare($sqlCampo);
        
        foreach ($camposDinamicos as $campo) {
            $stmtCampo->execute([
                ':id_registro' => $idDocumento,
                ':id_columna' => $campo['id_columna'],
                ':valor_texto' => $campo['valor_texto'] ?? null,
                ':valor_numero' => $campo['valor_numero'] ?? null,
                ':valor_fecha' => $campo['valor_fecha'] ?? null,
                ':valor_booleano' => $campo['valor_booleano'] ?? null
            ]);
        }
        
        $db->commit();
        return $idDocumento;
        
    } catch (Exception $e) {
        $db->rollBack();
        throw new Exception("Error al crear documento: " . $e->getMessage());
    }
}
```

---

## 🔄 Control de Versiones

### Git Workflow
```bash
# Flujo de trabajo recomendado
git checkout -b feature/nueva-funcionalidad
# Desarrollar la funcionalidad
git add .
git commit -m "feat: agregar nueva funcionalidad"
git checkout main
git merge feature/nueva-funcionalidad
git push origin main

# Tags para versiones
git tag -a v2.0.0 -m "Versión 2.0.0 - Nueva arquitectura MVC"
git push origin v2.0.0
```

### Versionamiento Semántico
- **Major (X.0.0):** Cambios incompatibles hacia atrás
- **Minor (X.Y.0):** Nuevas funcionalidades compatibles
- **Patch (X.Y.Z):** Corrección de bugs

---

## 🧪 Testing Automatizado

### Tests Unitarios (PHPUnit)
```php
<?php
/**
 * Ejemplo de test unitario
 */
class DocumentoTest extends PHPUnit\Framework\TestCase {
    private $documentoModel;
    
    protected function setUp(): void {
        $this->documentoModel = new DocumentoModel();
    }
    
    public function testCrearDocumento() {
        $datos = [
            'no_oficio' => 'OF-2024-001',
            'id_carpeta' => 1,
            'id_categoria' => 1,
            'emitido_por' => 'Departamento de Auditoría',
            'fecha_oficio' => '2024-01-15',
            'descripcion' => 'Documento de prueba',
            'estado_gestion' => 'pendiente',
            'capturado_por' => 'admin'
        ];
        
        $id = $this->documentoModel->crear($datos);
        
        $this->assertIsInt($id);
        $this->assertGreaterThan(0, $id);
    }
    
    public function testObtenerDocumento() {
        $documento = $this->documentoModel->obtenerPorId(1);
        
        $this->assertIsArray($documento);
        $this->assertArrayHasKey('no_oficio', $documento);
    }
}
```

### Tests de Integración
```javascript
/**
 * Test de integración con API
 */
describe('API de Documentos', () => {
    test('debe crear un documento', async () => {
        const datosDocumento = {
            no_oficio: 'OF-TEST-001',
            id_carpeta: 1,
            // ... otros campos
        };
        
        const response = await fetch('/api/documentos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosDocumento)
        });
        
        const result = await response.json();
        
        expect(response.status).toBe(200);
        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('id_registro');
    });
});
```

---

## 📝 Documentación de Código

### PHPDoc Standards
```php
/**
 * Breve descripción de la función
 * 
 * Descripción más detallada si es necesario.
 * Puede abarcar múltiples líneas.
 * 
 * @param string $parametro1 Descripción del parámetro
 * @param int $parametro2 Descripción del parámetro
 * @return array Descripción del valor de retorno
 * @throws Exception Descripción de la excepción lanzada
 * 
 * @example
 * $resultado = funcionEjemplo('valor1', 42);
 * echo $resultado['clave'];
 * 
 * @since 2.0.0
 * @author SDI Development Team
 */
function funcionEjemplo($parametro1, $parametro2) {
    // Implementación
    return ['clave' => 'valor'];
}
```

### JSDoc Standards
```javascript
/**
 * Breve descripción del módulo
 * 
 * Descripción más detallada del módulo y sus componentes.
 * 
 * @module ModuloEjemplo
 * @author SDI Development Team
 * @version 2.0.0
 * 
 * @example
 * // Ejemplo de uso
 * const modulo = new ModuloEjemplo();
 * modulo.metodo();
 */
const ModuloEjemplo = {
    /**
     * Descripción del método
     * 
     * @param {string} parametro1 - Descripción del parámetro
     * @param {number} parametro2 - Descripción del parámetro
     * @returns {Object} Descripción del valor de retorno
     * 
     * @example
     * const resultado = modulo.metodo('valor', 42);
     * console.log(resultado);
     */
    metodo(parametro1, parametro2) {
        return { resultado: 'ejemplo' };
    }
};
```

---

## 🚀 Despliegue y Producción

### Configuración de Producción
```php
// config/constants.php - Producción
define('APP_ENV', 'production');
define('DEBUG_MODE', false);
define('ERROR_LOG_FILE', '/var/log/sdi/error.log');
define('ACCESS_LOG_FILE', '/var/log/sdi/access.log');

// Deshabilitar visualización de errores
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', ERROR_LOG_FILE);
```

### Optimización de Rendimiento
```php
// Caching de consultas frecuentes
class CacheManager {
    private static $cache = [];
    private static $ttl = 300; // 5 minutos
    
    public static function get($key) {
        if (isset(self::$cache[$key]) && 
            self::$cache[$key]['timestamp'] > (time() - self::$ttl)) {
            return self::$cache[$key]['data'];
        }
        return null;
    }
    
    public static function set($key, $data) {
        self::$cache[$key] = [
            'data' => $data,
            'timestamp' => time()
        ];
    }
}
```

### Monitoreo y Logging
```php
/**
 * Sistema de logging estructurado
 */
class Logger {
    const INFO = 'INFO';
    const WARNING = 'WARNING';
    const ERROR = 'ERROR';
    
    public static function log($mensaje, $nivel = self::INFO, $contexto = []) {
        $timestamp = date('Y-m-d H:i:s');
        $contextoStr = empty($contexto) ? '' : ' | ' . json_encode($contexto);
        
        $logEntry = "[{$timestamp}] [{$nivel}] {$mensaje}{$contextoStr}" . PHP_EOL;
        
        error_log($logEntry, 3, ERROR_LOG_FILE);
    }
    
    public static function info($mensaje, $contexto = []) {
        self::log($mensaje, self::INFO, $contexto);
    }
    
    public static function error($mensaje, $contexto = []) {
        self::log($mensaje, self::ERROR, $contexto);
    }
}
```

---

## 🔍 Code Review Checklist

### Revisión de Seguridad
- [ ] No hay SQL injection (prepared statements)
- [ ] Sanitización de entrada y salida
- [ ] Validación CSRF implementada
- [ ] Sesiones configuradas seguras
- [ ] Contraseñas hasheadas correctamente
- [ ] CORS configurado apropiadamente
- [ ] No hay exposición de información sensible

### Revisión de Rendimiento
- [ ] Queries optimizadas con índices
- [ ] Uso apropiado de caché
- [ ] No hay N+1 queries en loops
- [ ] Paginación implementada
- [ ] Recursos liberados correctamente

### Revisión de Calidad
- [ ] Código sigue PSR-4
- [ ] Nomenclatura consistente
- [ ] Comentarios adecuados
- [ ] Manejo de errores implementado
- [ ] Tests unitarios escritos
- [ ] Documentación completa

---

## 📚 Recursos Adicionales

### Herramientas Recomendadas
- **IDE:** PhpStorm, Visual Studio Code
- **Debugging:** Xdebug, Chrome DevTools
- **Testing:** PHPUnit, Jest, Postman
- **Version Control:** Git + GitHub/GitLab
- **Documentation:** PHPDoc, JSDoc, Markdown

### Estándares y Guías
- **PHP-FIG:** Estándares de codificación PHP
- **PSR-12:** Extended interfaces
- **JavaScript ES6+:** Modern JavaScript features
- **CSS3:** Flexbox, Grid, Custom Properties
- **MySQL 8.0+:** Latest features and optimizations

---

## 🎯 Conclusión

Esta guía establece los estándares de calidad esperados para el desarrollo del sistema SDI. Seguir estas prácticas garantizará:

✅ **Código Mantenible:** Estructura clara y documentada  
✅ **Seguridad Robusta:** Protección contra vulnerabilidades comunes  
✅ **Rendimiento Óptimo:** Queries eficientes y caché apropiado  
✅ **Calidad Consistente:** Código limpio y testeado  
✅ **Colaboración Efectiva:** Estándares compartidos por el equipo  

**Recordatorio:** El código es un activo empresarial. Invierta tiempo en escribir código limpio y documentado. El "yo futuro" te lo agradecerá.

---

**Versión:** 2.0.0  
**Actualizado:** Enero 2024  
**Autores:** SDI Development Team
