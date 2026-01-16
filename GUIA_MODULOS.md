# 📦 Guía de Módulos - SDI Sistema de Gestión

**Versión 2.0** - Creación y Extensión de Módulos

---

## 🎯 Objetivo

Proporcionar una guía paso a paso para crear nuevos módulos en el sistema SDI, manteniendo la arquitectura MVC y los estándares de calidad establecidos.

---

## 🏗️ Arquitectura de Módulos

### Estructura Base
```
nuevo-modulo/
├── controllers/
│   └── NuevoModuloController.php
├── models/
│   └── NuevoModuloModel.php
├── public/js/modules/
│   └── nuevo-modulo.js
├── views/
│   └── nuevo-modulo/
│       ├── index.html
│       ├── crear.html
│       ├── editar.html
│       └── listar.html
└── database/
    └── migrate_nuevo_modulo.sql
```

### Flujo de Datos
```
Frontend (JavaScript) 
    ↓ API Call
Backend (PHP Controller)
    ↓ Business Logic
Backend (PHP Model)
    ↓ Database Operations
MySQL Database
```

---

## 📝 Paso 1: Base de Datos

### Diseño de Tablas
```sql
-- Tabla principal del módulo
CREATE TABLE nuevo_modulo (
    id_modulo INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    estado ENUM('activo', 'inactivo') DEFAULT 'activo',
    id_usuario_creador INT NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario_creador) REFERENCES usuarios(id_usuario),
    
    -- Índices para rendimiento
    INDEX idx_nuevo_modulo_estado (estado),
    INDEX idx_nuevo_modulo_usuario (id_usuario_creador),
    INDEX idx_nuevo_modulo_fecha (fecha_creacion)
);

-- Tabla de detalles adicionales (opcional)
CREATE TABLE detalles_nuevo_modulo (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_modulo INT NOT NULL,
    campo VARCHAR(100) NOT NULL,
    valor TEXT,
    tipo_dato VARCHAR(50) DEFAULT 'texto',
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_modulo) REFERENCES nuevo_modulo(id_modulo)
);
```

### Script de Migración
```php
<?php
/**
 * Migración para nuevo módulo
 * 
 * @author SDI Development Team
 * @version 2.0.0
 */

// database/migrate_nuevo_modulo.php
require_once '../config/autoload.php';

function migrarNuevoModulo() {
    $db = Database::getInstance();
    
    try {
        // Crear tablas
        $sql = file_get_contents(__DIR__ . '/nuevo_modulo.sql');
        $db->exec($sql);
        
        echo "✅ Migración de nuevo_modulo completada\n";
        
    } catch (Exception $e) {
        echo "❌ Error en migración: " . $e->getMessage() . "\n";
        return false;
    }
    
    return true;
}

// Ejecutar migración
if (basename(__FILE__) === 'migrate_nuevo_modulo.php') {
    migrarNuevoModulo();
}
?>
```

---

## 🔧 Paso 2: Backend - Model

### Estructura del Modelo
```php
<?php
/**
 * Modelo para Nuevo Módulo
 * 
 * @author SDI Development Team
 * @version 2.0.0
 */

class NuevoModuloModel {
    private $db;
    private $tabla = 'nuevo_modulo';
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * Obtener todos los registros con paginación
     * 
     * @param int $pagina Número de página
     * @param int $limite Límite de resultados
     * @param array $filtros Filtros de búsqueda
     * @return array Registros encontrados
     */
    public function obtenerTodos($pagina = 1, $limite = 20, $filtros = []) {
        $offset = ($pagina - 1) * $limite;
        
        $sql = "SELECT nm.*, u.nombres, u.apellido_paterno 
                FROM {$this->tabla} nm
                LEFT JOIN usuarios u ON nm.id_usuario_creador = u.id_usuario
                WHERE 1=1";
        
        // Aplicar filtros
        if (!empty($filtros['nombre'])) {
            $sql .= " AND nm.nombre LIKE :nombre";
        }
        
        if (!empty($filtros['estado'])) {
            $sql .= " AND nm.estado = :estado";
        }
        
        $sql .= " ORDER BY nm.fecha_creacion DESC 
                  LIMIT :limite OFFSET :offset";
        
        $stmt = $this->db->prepare($sql);
        
        // Bind parameters
        $stmt->bindParam(':limite', $limite, PDO::PARAM_INT);
        $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
        
        if (!empty($filtros['nombre'])) {
            $stmt->bindValue(':nombre', '%' . $filtros['nombre'] . '%');
        }
        
        if (!empty($filtros['estado'])) {
            $stmt->bindValue(':estado', $filtros['estado']);
        }
        
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
        $sql = "SELECT nm.*, u.nombres, u.apellido_paterno 
                FROM {$this->tabla} nm
                LEFT JOIN usuarios u ON nm.id_usuario_creador = u.id_usuario
                WHERE nm.id_modulo = :id";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Crear nuevo registro
     * 
     * @param array $datos Datos del registro
     * @return int ID del registro creado
     */
    public function crear($datos) {
        $sql = "INSERT INTO {$this->tabla} 
                       (nombre, descripcion, estado, id_usuario_creador) 
                       VALUES (:nombre, :descripcion, :estado, :id_usuario_creador)";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':nombre' => $datos['nombre'],
            ':descripcion' => $datos['descripcion'] ?? null,
            ':estado' => $datos['estado'] ?? 'activo',
            ':id_usuario_creador' => $_SESSION['id_usuario']
        ]);
        
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
        
        $sql = "UPDATE {$this->tabla} SET " . implode(', ', $setClause) . 
                WHERE id_modulo = :id";
        
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
        $sql = "DELETE FROM {$this->tabla} WHERE id_modulo = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        
        return $stmt->execute();
    }
    
    /**
     * Contar registros por estado
     * 
     * @param string $estado Estado a contar
     * @return int Total de registros
     */
    public function contarPorEstado($estado) {
        $sql = "SELECT COUNT(*) as total FROM {$this->tabla} WHERE estado = :estado";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':estado', $estado);
        $stmt->execute();
        
        $resultado = $stmt->fetch(PDO::FETCH_ASSOC);
        return (int) $resultado['total'];
    }
}
?>
```

---

## 🎮 Paso 3: Backend - Controller

### Estructura del Controlador
```php
<?php
/**
 * Controlador para Nuevo Módulo
 * 
 * @author SDI Development Team
 * @version 2.0.0
 */

require_once '../config/autoload.php';
require_once '../middleware/Autorizacion.php';

class NuevoModuloController {
    private $modelo;
    
    public function __construct() {
        $this->modelo = new NuevoModuloModel();
    }
    
    /**
     * Listar registros
     * Endpoint: GET /api/nuevo-modulo
     */
    public function listar() {
        try {
            // Verificar permisos
            if (!tienePermiso('VER_NUEVO_MODULO')) {
                response(false, 'No tienes permisos para ver este módulo', null, 403);
                return;
            }
            
            $pagina = $_GET['pagina'] ?? 1;
            $limite = $_GET['limite'] ?? 20;
            $filtros = [
                'nombre' => $_GET['nombre'] ?? '',
                'estado' => $_GET['estado'] ?? ''
            ];
            
            $registros = $this->modelo->obtenerTodos($pagina, $limite, $filtros);
            $total = $this->modelo->contarTotal($filtros);
            
            response(true, 'Registros obtenidos', [
                'registros' => $registros,
                'paginacion' => [
                    'pagina_actual' => (int) $pagina,
                    'total_registros' => $total,
                    'total_paginas' => ceil($total / $limite),
                    'limite_por_pagina' => (int) $limite
                ]
            ]);
            
        } catch (Exception $e) {
            error_log("Error en NuevoModuloController::listar: " . $e->getMessage());
            response(false, 'Error al obtener registros', null, 500);
        }
    }
    
    /**
     * Obtener registro por ID
     * Endpoint: GET /api/nuevo-modulo/:id
     */
    public function obtener($id) {
        try {
            if (!tienePermiso('VER_NUEVO_MODULO')) {
                response(false, 'No tienes permisos para ver este módulo', null, 403);
                return;
            }
            
            $registro = $this->modelo->obtenerPorId($id);
            
            if (!$registro) {
                response(false, 'Registro no encontrado', null, 404);
                return;
            }
            
            response(true, 'Registro obtenido', $registro);
            
        } catch (Exception $e) {
            error_log("Error en NuevoModuloController::obtener: " . $e->getMessage());
            response(false, 'Error al obtener registro', null, 500);
        }
    }
    
    /**
     * Crear nuevo registro
     * Endpoint: POST /api/nuevo-modulo
     */
    public function crear() {
        try {
            if (!tienePermiso('CREAR_NUEVO_MODULO')) {
                response(false, 'No tienes permisos para crear en este módulo', null, 403);
                return;
            }
            
            $datos = json_decode(file_get_contents('php://input'), true);
            
            // Validar datos requeridos
            if (empty($datos['nombre'])) {
                response(false, 'El nombre es requerido', null, 400);
                return;
            }
            
            // Validaciones adicionales
            if (strlen($datos['nombre']) < 3) {
                response(false, 'El nombre debe tener al menos 3 caracteres', null, 400);
                return;
            }
            
            $id = $this->modelo->crear($datos);
            
            response(true, 'Registro creado exitosamente', [
                'id' => $id,
                'mensaje' => 'Nuevo módulo creado correctamente'
            ], 201);
            
        } catch (Exception $e) {
            error_log("Error en NuevoModuloController::crear: " . $e->getMessage());
            response(false, 'Error al crear registro', null, 500);
        }
    }
    
    /**
     * Actualizar registro existente
     * Endpoint: PUT /api/nuevo-modulo/:id
     */
    public function actualizar($id) {
        try {
            if (!tienePermiso('EDITAR_NUEVO_MODULO')) {
                response(false, 'No tienes permisos para editar este módulo', null, 403);
                return;
            }
            
            $datos = json_decode(file_get_contents('php://input'), true);
            
            // Verificar que el registro existe
            $registroExistente = $this->modelo->obtenerPorId($id);
            if (!$registroExistente) {
                response(false, 'Registro no encontrado', null, 404);
                return;
            }
            
            // Validaciones
            if (!empty($datos['nombre']) && strlen($datos['nombre']) < 3) {
                response(false, 'El nombre debe tener al menos 3 caracteres', null, 400);
                return;
            }
            
            $this->modelo->actualizar($id, $datos);
            
            response(true, 'Registro actualizado exitosamente', [
                'id' => $id,
                'mensaje' => 'Módulo actualizado correctamente'
            ]);
            
        } catch (Exception $e) {
            error_log("Error en NuevoModuloController::actualizar: " . $e->getMessage());
            response(false, 'Error al actualizar registro', null, 500);
        }
    }
    
    /**
     * Eliminar registro
     * Endpoint: DELETE /api/nuevo-modulo/:id
     */
    public function eliminar($id) {
        try {
            if (!tienePermiso('ELIMINAR_NUEVO_MODULO')) {
                response(false, 'No tienes permisos para eliminar este módulo', null, 403);
                return;
            }
            
            // Verificar que el registro existe
            $registroExistente = $this->modelo->obtenerPorId($id);
            if (!$registroExistente) {
                response(false, 'Registro no encontrado', null, 404);
                return;
            }
            
            $this->modelo->eliminar($id);
            
            response(true, 'Registro eliminado exitosamente', [
                'id' => $id,
                'mensaje' => 'Módulo eliminado correctamente'
            ]);
            
        } catch (Exception $e) {
            error_log("Error en NuevoModuloController::eliminar: " . $e->getMessage());
            response(false, 'Error al eliminar registro', null, 500);
        }
    }
}
?>
```

---

## 🌐 Paso 4: Frontend - JavaScript Module

### Estructura del Módulo
```javascript
/**
 * Módulo para gestión de Nuevo Módulo
 * 
 * @author SDI Development Team
 * @version 2.0.0
 */

const nuevoModuloModule = {
    // Estado del módulo
    registros: [],
    paginaActual: 1,
    filtrosActuales: {},
    
    /**
     * Inicializar módulo
     */
    async init() {
        await this.cargarRegistros();
        this.attachEventListeners();
        this.actualizarUI();
    },
    
    /**
     * Cargar registros desde API
     */
    async cargarRegistros() {
        try {
            const params = new URLSearchParams({
                pagina: this.paginaActual,
                ...this.filtrosActuales
            });
            
            const respuesta = await api.get(`/nuevo-modulo?${params}`);
            
            if (respuesta.success) {
                this.registros = respuesta.data.registros;
                this.actualizarPaginacion(respuesta.data.paginacion);
            }
        } catch (error) {
            ui.toast('Error al cargar registros', 'error');
        }
    },
    
    /**
     * Adjuntar event listeners
     */
    attachEventListeners() {
        // Formulario de creación
        const formCrear = document.getElementById('formCrearNuevoModulo');
        if (formCrear) {
            formCrear.addEventListener('submit', (e) => this.handleCrear(e));
        }
        
        // Formulario de búsqueda
        const formBusqueda = document.getElementById('formBusquedaNuevoModulo');
        if (formBusqueda) {
            formBusqueda.addEventListener('submit', (e) => this.handleBusqueda(e));
        }
        
        // Paginación
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('pagina-nuevo-modulo')) {
                this.handlePaginacion(e);
            }
        });
    },
    
    /**
     * Manejar creación de registro
     */
    async handleCrear(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const datos = Object.fromEntries(formData);
        
        try {
            const respuesta = await api.post('/nuevo-modulo', datos);
            
            if (respuesta.success) {
                ui.toast('Registro creado exitosamente', 'success');
                event.target.reset();
                await this.cargarRegistros();
                this.actualizarUI();
            } else {
                ui.toast(respuesta.message || 'Error al crear registro', 'error');
            }
        } catch (error) {
            ui.toast('Error al crear registro', 'error');
        }
    },
    
    /**
     * Manejar búsqueda
     */
    async handleBusqueda(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        this.filtrosActuales = Object.fromEntries(formData);
        this.paginaActual = 1; // Resetear a primera página
        
        await this.cargarRegistros();
        this.actualizarUI();
    },
    
    /**
     * Manejar paginación
     */
    async handlePaginacion(event) {
        const pagina = parseInt(event.target.dataset.pagina);
        if (pagina === this.paginaActual) return;
        
        this.paginaActual = pagina;
        await this.cargarRegistros();
        this.actualizarUI();
    },
    
    /**
     * Actualizar interfaz
     */
    actualizarUI() {
        this.renderizarTabla();
        this.renderizarPaginacion();
    },
    
    /**
     * Renderizar tabla de registros
     */
    renderizarTabla() {
        const tbody = document.getElementById('tablaNuevoModulo');
        if (!tbody) return;
        
        if (this.registros.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-8">
                        <div class="text-gray-500">
                            <i class="fas fa-inbox text-4xl mb-2"></i>
                            <p>No se encontraron registros</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = this.registros.map(registro => `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3 border-b">${registro.id_modulo}</td>
                <td class="px-4 py-3 border-b font-medium">${registro.nombre}</td>
                <td class="px-4 py-3 border-b">${registro.descripcion || '-'}</td>
                <td class="px-4 py-3 border-b">
                    <span class="px-2 py-1 rounded-full text-xs ${
                        registro.estado === 'activo' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                    }">
                        ${registro.estado}
                    </span>
                </td>
                <td class="px-4 py-3 border-b text-sm text-gray-600">
                    ${new Date(registro.fecha_creacion).toLocaleDateString()}
                </td>
                <td class="px-4 py-3 border-b">
                    <button onclick="nuevoModuloModule.editar(${registro.id_modulo})" 
                            class="text-blue-600 hover:text-blue-800 mr-2">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="nuevoModuloModule.eliminar(${registro.id_modulo}, '${registro.nombre}')" 
                            class="text-red-600 hover:text-red-800">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    },
    
    /**
     * Renderizar paginación
     */
    renderizarPaginacion() {
        const paginacionDiv = document.getElementById('paginacionNuevoModulo');
        if (!paginacionDiv) return;
        
        // Implementar lógica de paginación
        // ... (código de paginación)
    },
    
    /**
     * Editar registro
     */
    async editar(id) {
        try {
            const respuesta = await api.get(`/nuevo-modulo/${id}`);
            
            if (respuesta.success) {
                // Mostrar modal con formulario de edición
                this.mostrarModalEdicion(respuesta.data);
            } else {
                ui.toast('Error al obtener registro', 'error');
            }
        } catch (error) {
            ui.toast('Error al obtener registro', 'error');
        }
    },
    
    /**
     * Eliminar registro
     */
    async eliminar(id, nombre) {
        if (!confirm(`¿Estás seguro de eliminar "${nombre}"?`)) {
            return;
        }
        
        try {
            const respuesta = await api.delete(`/nuevo-modulo/${id}`);
            
            if (respuesta.success) {
                ui.toast('Registro eliminado exitosamente', 'success');
                await this.cargarRegistros();
                this.actualizarUI();
            } else {
                ui.toast(respuesta.message || 'Error al eliminar registro', 'error');
            }
        } catch (error) {
            ui.toast('Error al eliminar registro', 'error');
        }
    },
    
    /**
     * Mostrar modal de edición
     */
    mostrarModalEdicion(registro) {
        // Implementar modal de edición
        // ... (código del modal)
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    nuevoModuloModule.init();
});
```

---

## 🎨 Paso 5: Frontend - Vistas HTML

### Vista Principal (index.html)
```html
<!-- Sección del nuevo módulo -->
<div id="nuevo-modulo" class="modulo-section">
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-2xl font-bold mb-6 text-gray-800">
            <i class="fas fa-cube mr-2 text-blue-600"></i>
            Gestión de Nuevo Módulo
        </h2>
        
        <!-- Formulario de búsqueda -->
        <div class="bg-gray-50 rounded-lg p-4 mb-6">
            <form id="formBusquedaNuevoModulo" class="flex flex-wrap gap-4">
                <div class="flex-1 min-w-64">
                    <input type="text" 
                           name="nombre" 
                           placeholder="Buscar por nombre..." 
                           class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                </div>
                <div class="flex-1 min-w-48">
                    <select name="estado" class="w-full px-4 py-2 border rounded-lg">
                        <option value="">Todos los estados</option>
                        <option value="activo">Activo</option>
                        <option value="inactivo">Inactivo</option>
                    </select>
                </div>
                <button type="submit" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <i class="fas fa-search mr-2"></i>Buscar
                </button>
            </form>
        </div>
        
        <!-- Botón de crear -->
        <div class="mb-6">
            <button onclick="nuevoModuloModule.mostrarModalCreacion()" 
                    class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
                <i class="fas fa-plus mr-2"></i>
                Crear Nuevo Registro
            </button>
        </div>
        
        <!-- Tabla de registros -->
        <div class="overflow-x-auto">
            <table class="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                        <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                </thead>
                <tbody id="tablaNuevoModulo">
                    <!-- Las filas se generan dinámicamente -->
                </tbody>
            </table>
        </div>
        
        <!-- Paginación -->
        <div id="paginacionNuevoModulo" class="flex justify-center mt-6">
            <!-- Paginación generada dinámicamente -->
        </div>
    </div>
</div>
```

---

## 🔧 Paso 6: Configuración y Permisos

### Agregar Permisos al Sistema
```php
// config/constants.php - Agregar nuevos permisos
define('PERMISOS', [
    // ... permisos existentes ...
    'VER_NUEVO_MODULO' => 256,
    'CREAR_NUEVO_MODULO' => 512,
    'EDITAR_NUEVO_MODULO' => 1024,
    'ELIMINAR_NUEVO_MODULO' => 2048
]);

// Asignar permisos a roles
define('PERMISOS_ROL_ADMINISTRADOR', PERMISOS['VER_NUEVO_MODULO'] | PERMISOS['CREAR_NUEVO_MODULO'] | PERMISOS['EDITAR_NUEVO_MODULO'] | PERMISOS['ELIMINAR_NUEVO_MODULO']);
```

### Agregar Endpoint al Router
```php
// router.php - Agregar nuevas rutas
case 'nuevo-modulo':
    require_once 'controllers/NuevoModuloController.php';
    $controller = new NuevoModuloController();
    
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            if (isset($_GET['id'])) {
                $controller->obtener($_GET['id']);
            } else {
                $controller->listar();
            }
            break;
            
        case 'POST':
            $controller->crear();
            break;
            
        case 'PUT':
            $controller->actualizar($_GET['id']);
            break;
            
        case 'DELETE':
            $controller->eliminar($_GET['id']);
            break;
            
        default:
            response(false, 'Método no permitido', null, 405);
    }
    break;
```

---

## 🧪 Paso 7: Testing

### Tests Unitarios
```php
<?php
/**
 * Tests para NuevoModulo
 */
class NuevoModuloTest extends PHPUnit\Framework\TestCase {
    private $modelo;
    
    protected function setUp(): void {
        $this->modelo = new NuevoModuloModel();
    }
    
    public function testCrearRegistro() {
        $datos = [
            'nombre' => 'Test Module',
            'descripcion' => 'Módulo de prueba'
        ];
        
        $id = $this->modelo->crear($datos);
        
        $this->assertIsInt($id);
        $this->assertGreaterThan(0, $id);
    }
    
    public function testObtenerRegistro() {
        $id = $this->modelo->crear(['nombre' => 'Test']);
        $registro = $this->modelo->obtenerPorId($id);
        
        $this->assertIsArray($registro);
        $this->assertArrayHasKey('nombre', $registro);
        $this->assertEquals('Test Module', $registro['nombre']);
    }
}
?>
```

### Tests de Integración
```javascript
describe('API de Nuevo Módulo', () => {
    beforeEach(async () => {
        // Login y obtener token
        const loginResponse = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@sdi.local',
                password: 'admin123'
            })
        });
        
        const loginResult = await loginResponse.json();
        localStorage.setItem('token', loginResult.data.token);
    });
    
    test('debe crear un nuevo registro', async () => {
        const datos = {
            nombre: 'Test Module',
            descripcion: 'Módulo de prueba'
        };
        
        const response = await fetch('/api/nuevo-modulo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify(datos)
        });
        
        const result = await response.json();
        
        expect(response.status).toBe(201);
        expect(result.success).toBe(true);
    });
});
```

---

## 📋 Checklist Final

### Verificación de Implementación
- [ ] Base de datos creada con migración
- [ ] Modelo con todos los métodos CRUD
- [ ] Controlador con todos los endpoints REST
- [ ] Módulo JavaScript funcional
- [ ] Vistas HTML responsive y funcionales
- [ ] Permisos configurados correctamente
- [ ] Tests unitarios escritos
- [ ] Documentación completa
- [ ] Integración con el sistema principal

### Calidad de Código
- [ ] Código sigue PSR-4
- [ ] Nomenclatura consistente
- [ ] Comentarios PHPDoc y JSDoc
- [ ] Manejo de errores implementado
- [ ] Validación de entrada y salida
- [ ] Seguridad implementada (CSRF, XSS, SQLi)

---

## 🎉 Conclusión

Siguiendo esta guía, podrás crear módulos completos y profesionales para el sistema SDI, manteniendo la calidad y consistencia del código base.

**Recuerda:** Cada módulo debe ser una pieza bien construida que se integre perfectamente con el sistema existente.

---

**Versión:** 2.0.0  
**Actualizado:** Enero 2024  
**Autores:** SDI Development Team
