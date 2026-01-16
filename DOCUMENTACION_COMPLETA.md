# 📋 SDI - Sistema de Gestión Documental

**Versión 2.0** - Arquitectura MVC + AJAX Completamente Refactorizada

Sistema profesional de gestión documental con separación limpia de código, seguridad robusta y control de acceso basado en roles.

---

## 📖 Tabla de Contenidos

1. [🚀 Inicio Rápido](#-inicio-rápido-5-minutos)
2. [🏗️ Arquitectura del Sistema](#-arquitectura-del-sistema)
3. [🔐 Seguridad y Autenticación](#-seguridad-y-autenticación)
4. [👥 Gestión de Roles y Permisos](#-gestión-de-roles-y-permisos)
5. [📦 Módulos del Sistema](#-módulos-del-sistema)
6. [🚀 API REST](#-api-rest)
7. [📊 Base de Datos](#-base-de-datos)
8. [🛠️ Instalación y Configuración](#️-instalación-y-configuración)
9. [🧪 Testing y Verificación](#-testing-y-verificación)
10. [🚨 Solución de Problemas Comunes](#-solución-de-problemas-comunes)
11. [📚 Guías de Desarrollo](#-guías-de-desarrollo)
12. [🔮 Referencia Técnica](#-referencia-técnica)

---

## 🚀 Inicio Rápido (5 minutos)

### Requisitos del Sistema
- **PHP 7.4+** con extensiones: PDO, MySQLi, JSON, BCrypt
- **MySQL 5.7+** o **MariaDB 10.3+**
- **Apache 2.4+** con mod_rewrite habilitado
- **XAMPP** (recomendado para desarrollo)

### Instalación Express

#### Paso 1: Importar Base de Datos
```sql
CREATE DATABASE sdi_gestion;
USE sdi_gestion;
SOURCE database/schema.sql;
```

#### Paso 2: Configurar Conexión
Editar `config/db.php`:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'sdi_gestion');
define('DB_USER', 'root');
define('DB_PASS', 'password');
```

#### Paso 3: Acceder al Sistema
```
http://localhost/Programa-Gestion-SDI/index.html
```

**Credenciales por defecto:**
- Email: `admin@sdi.local`
- Contraseña: `admin123`

---

## 🏗️ Arquitectura del Sistema

### Principios de Diseño
- **MVC (Model-View-Controller):** Separación clara de responsabilidades
- **REST API:** Comunicación vía endpoints JSON
- **AJAX Dinámico:** Interfaz sin recargas de página
- **PSR-4 Autoloading:** Carga automática de clases
- **Seguridad por Capas:** Múltiples niveles de protección

### Estructura del Proyecto

```
Programa-Gestion-SDI/
├── 📁 api/                          # APIs REST (devuelven JSON)
│   ├── auth.php                  # Autenticación y sesiones
│   ├── usuarios.php              # CRUD de usuarios (Admin)
│   ├── documentos.php            # CRUD de documentos
│   ├── carpetas.php             # CRUD de carpetas
│   ├── categorias.php            # CRUD de categorías
│   └── dashboard.php             # Estadísticas del sistema
├── 📁 models/                       # Clases PHP (PDO)
│   ├── Usuario.php               # Modelo de usuarios
│   ├── Documento.php            # Modelo de documentos
│   ├── Carpeta.php              # Modelo de carpetas
│   └── Categoria.php            # Modelo de categorías
├── 📁 controllers/                 # Lógica de negocio
│   ├── AuthController.php         # Control de autenticación
│   ├── UsuarioController.php      # Gestión de usuarios
│   ├── DocumentoController.php   # Gestión de documentos
│   ├── CarpetaController.php     # Gestión de carpetas
│   └── CategoriaController.php   # Gestión de categorías
├── 📁 middleware/                   # Capas de seguridad
│   ├── Autenticacion.php        # Verificación de sesión
│   └── Autorizacion.php         # Control de permisos
├── 📁 config/                      # Configuración
│   ├── db.php                   # Conexión a base de datos
│   ├── constants.php             # Roles y permisos
│   └── autoload.php              # Carga automática de clases
├── 📁 public/                      # Archivos públicos
│   ├── js/                      # JavaScript AJAX
│   │   ├── auth.js              # Autenticación frontend
│   │   ├── api.js               # Cliente HTTP
│   │   ├── ui.js                # Componentes UI
│   │   └── modules/
│   │       ├── archivo-general.js # Gestión principal
│   │       └── dashboard.js      # Panel de control
│   ├── css/                     # Estilos (Tailwind CSS)
│   └── index.html               # Aplicación principal
├── 📁 database/                    # Scripts de base de datos
│   ├── schema.sql               # Estructura completa
│   └── crear_admin.php          # Usuario administrador
├── 📁 index.html                  # Punto de entrada principal
├── 📁 login.html                  # Página de login
└── 📁 router.php                  # Enrutador principal
```

---

## 🔐 Seguridad y Autenticación

### Implementación de Seguridad

#### 🔒 Protección contra Inyección SQL
- **PDO Prepared Statements:** Todas las consultas usan parámetros vinculados
- **Validación de Entrada:** Sanitización de datos en todos los niveles

#### 🔑 Gestión de Contraseñas
```php
// Hashing con BCrypt (cost 12)
$hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

// Verificación
if (password_verify($input, $hash)) {
    // Contraseña correcta
}
```

#### 🍪 Gestión de Sesiones
```php
// Configuración segura de sesiones
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1);
ini_set('session.use_strict_mode', 1);
ini_set('session.cookie_samesite', 'Strict');
```

#### 🛡️ Control de Acceso (RBAC)
- **3 Niveles de Roles:** Administrador, Personal Administrativo, Estudiante SS
- **Permisos Granulares:** Control específico por módulo y acción
- **Middleware de Autorización:** Verificación en cada endpoint

---

## 👥 Gestión de Roles y Permisos

### Matriz de Permisos

| Módulo | Administrador | Personal Administrativo | Estudiante SS |
|----------|--------------|---------------------|--------------|
| **Usuarios** | ✅ CRUD | ❌ | ❌ |
| **Documentos** | ✅ CRUD | ✅ CRUD | ✅ Propios |
| **Carpetas** | ✅ CRUD | ✅ CRUD | ✅ Ver |
| **Categorías** | ✅ CRUD | ✅ CRUD | ❌ |
| **Dashboard** | ✅ Ver | ✅ Ver | ❌ |

### Definición de Roles

#### 👑 Administrador (`admin@sdi.local`)
- Acceso completo a todos los módulos
- Gestión de usuarios y permisos
- Configuración del sistema
- Todas las operaciones CRUD

#### 📋 Personal Administrativo
- Gestión completa de documentos
- Gestión de carpetas y categorías
- No puede gestionar usuarios
- Acceso a estadísticas básicas

#### 🎓 Estudiante SS
- Solo puede ver y gestionar sus propios documentos
- Acceso de lectura a carpetas públicas
- No puede crear carpetas nuevas
- Sin acceso a configuración

---

## 📦 Módulos del Sistema

### 1. 🏠 Dashboard - Panel de Control
- **Estadísticas en tiempo real:** Documentos, usuarios, actividad
- **Gráficos interactivos:** Tendencias y distribuciones
- **Accesos rápidos:** Atajos a funciones comunes
- **Filtros por fecha:** Análisis por períodos específicos

### 2. 👤 Gestión de Usuarios (Administrador)
- **CRUD Completo:** Crear, leer, actualizar, eliminar usuarios
- **Asignación de Roles:** Cambio dinámico de permisos
- **Validación de Email:** Verificación de unicidad
- **Historial de Cambios:** Auditoría de modificaciones

### 3. 📄 Gestión de Documentos
- **Campos Dinámicos:** Configurables según categoría
- **Control de Estados:** Pendiente → En Revisión → Archivado/Cancelado
- **Búsqueda Avanzada:** Filtros múltiples y全文 búsqueda
- **Versionamiento:** Historial de cambios por documento

### 4. 📁 Gestión de Carpetas Físicas
- **Organización Jerárquica:** Estructura de carpetas anidadas
- **Numeración Automática:** Secuencia automática de identificadores
- **Control de Acceso:** Permisos por carpeta
- **Metadatos:** Descripción y etiquetas identificadoras

### 5. 🏷️ Gestión de Categorías
- **Campos Personalizables:** Definición de estructura por categoría
- **Tipos de Datos:** Texto, número, fecha, booleano, archivo
- **Validación de Reglas:** Configuración de campos obligatorios
- **Herencia:** Categorías base con especialización

---

## 🚀 API REST

### Arquitectura RESTful
- **Verbos HTTP:** GET, POST, PUT, DELETE, PATCH
- **Respuestas JSON:** Estructura estandarizada
- **Códigos HTTP:** Proper status codes (200, 201, 400, 401, 403, 404, 500)
- **CORS:** Configurado para dominios específicos

### Endpoints Principales

#### 🔐 Autenticación
```http
POST   /api/auth/login              # Email + Password
GET    /api/auth/verificar          # Verificar sesión
POST   /api/auth/logout             # Cerrar sesión
```

#### 👥 Usuarios (Admin Only)
```http
GET    /api/usuarios                # Listar usuarios
POST   /api/usuarios                # Crear usuario
GET    /api/usuarios/:id            # Obtener usuario
PUT    /api/usuarios/:id            # Actualizar usuario
DELETE /api/usuarios/:id            # Eliminar usuario
```

#### 📄 Documentos
```http
GET    /api/documentos              # Listar documentos
POST   /api/documentos              # Crear documento
GET    /api/documentos/:id            # Obtener documento
PUT    /api/documentos/:id            # Actualizar documento
PATCH  /api/documentos/:id/estado   # Cambiar estado
DELETE /api/documentos/:id            # Eliminar documento
GET    /api/documentos/por-carpeta/:id  # Documentos por carpeta
```

#### 📁 Carpetas
```http
GET    /api/carpetas               # Listar carpetas
POST   /api/carpetas               # Crear carpeta
GET    /api/carpetas/:id            # Obtener carpeta
PUT    /api/carpetas/:id            # Actualizar carpeta
DELETE /api/carpetas/:id            # Eliminar carpeta
```

### Formato de Respuesta
```json
{
  "success": true,
  "message": "Operación completada exitosamente",
  "data": {
    // Datos solicitados
  },
  "status": 200,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 📊 Base de Datos

### Esquema Relacional

#### Tablas Principales

##### 📋 `usuarios`
```sql
CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellido_paterno VARCHAR(100) NOT NULL,
    apellido_materno VARCHAR(100),
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    id_rol INT NOT NULL,
    estado ENUM('activo', 'inactivo') DEFAULT 'activo',
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_rol) REFERENCES roles(id_rol)
);
```

##### 📄 `registros_documentos`
```sql
CREATE TABLE registros_documentos (
    id_registro INT AUTO_INCREMENT PRIMARY KEY,
    no_oficio VARCHAR(50) NOT NULL,
    id_carpeta INT,
    id_categoria INT NOT NULL,
    emitido_por VARCHAR(200) NOT NULL,
    fecha_oficio DATE NOT NULL,
    descripcion TEXT,
    estado_gestion ENUM('pendiente', 'en_revision', 'archivado', 'cancelado') DEFAULT 'pendiente',
    capturado_por VARCHAR(200) NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_carpeta) REFERENCES carpetas_fisicas(id_carpeta),
    FOREIGN KEY (id_categoria) REFERENCES cat_categorias(id_categoria)
);
```

##### 📁 `carpetas_fisicas`
```sql
CREATE TABLE carpetas_fisicas (
    id_carpeta INT AUTO_INCREMENT PRIMARY KEY,
    no_carpeta_fisica INT UNIQUE NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    etiqueta_identificadora VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    estado_gestion ENUM('pendiente', 'en_revision', 'archivado', 'cancelado') DEFAULT 'pendiente',
    id_usuario_creador INT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario_creador) REFERENCES usuarios(id_usuario)
);
```

##### 🏷️ `cat_categorias` y `conf_columnas_categoria`
```sql
CREATE TABLE cat_categorias (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre_categoria VARCHAR(100) NOT NULL,
    descripcion_categoria TEXT,
    estado ENUM('activa', 'inactiva') DEFAULT 'activa',
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE conf_columnas_categoria (
    id_columna INT AUTO_INCREMENT PRIMARY KEY,
    id_categoria INT NOT NULL,
    nombre_campo VARCHAR(100) NOT NULL,
    tipo_dato ENUM('texto_corto', 'texto_largo', 'numero_entero', 'numero_decimal', 'fecha', 'booleano') NOT NULL,
    longitud_maxima INT,
    es_obligatorio BOOLEAN DEFAULT FALSE,
    orden_visualizacion INT DEFAULT 1,
    FOREIGN KEY (id_categoria) REFERENCES cat_categorias(id_categoria)
);
```

##### 📊 `detalles_valores_documento`
```sql
CREATE TABLE detalles_valores_documento (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_registro INT NOT NULL,
    id_columna INT NOT NULL,
    valor_texto TEXT,
    valor_numero DECIMAL(15,4),
    valor_fecha DATE,
    valor_booleano BOOLEAN,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_registro) REFERENCES registros_documentos(id_registro),
    FOREIGN KEY (id_columna) REFERENCES conf_columnas_categoria(id_columna)
);
```

### Índices de Rendimiento
```sql
-- Búsquedas rápidas
CREATE INDEX idx_documentos_estado ON registros_documentos(estado_gestion);
CREATE INDEX idx_documentos_categoria ON registros_documentos(id_categoria);
CREATE INDEX idx_documentos_carpeta ON registros_documentos(id_carpeta);
CREATE INDEX idx_carpetas_estado ON carpetas_fisicas(estado_gestion);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(id_rol);

-- Búsquedas de texto全文
CREATE FULLTEXT INDEX ft_documentos_descripcion ON registros_documentos(descripcion);
CREATE FULLTEXT INDEX ft_carpetas_titulo ON carpetas_fisicas(titulo);
```

---

## 🛠️ Instalación y Configuración

### Requisitos del Servidor

#### 🔧 Configuración PHP Requerida
```ini
; php.ini
memory_limit = 256M
max_execution_time = 300
upload_max_filesize = 10M
post_max_size = 10M
file_uploads = On
session.gc_maxlifetime = 7200
session.cookie_lifetime = 7200
```

#### 🌐 Configuración Apache
```apache
; .htaccess
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^api/(.*)$ api/$1 [L,QSA]

# Headers de seguridad
Header always set X-Content-Type-Options: "nosniff"
Header always set X-Frame-Options: "DENY"
Header always set X-XSS-Protection: "1; mode=block"
```

### Variables de Entorno
```php
// config/constants.php
define('APP_NAME', 'SDI - Sistema de Gestión Documental');
define('APP_VERSION', '2.0.0');
define('APP_ENV', 'production'); // 'development' para debug
define('DEBUG_MODE', false);
define('TIMEZONE', 'America/Mexico_City');
date_default_timezone_set(TIMEZONE);
```

---

## 🧪 Testing y Verificación

### Suite de Tests Automatizados

#### 🔍 Verificación de Instalación
Acceder a: `http://localhost/Programa-Gestion-SDI/VERIFICACION_COMPLETA.php`

**Validaciones automáticas:**
- ✅ Conexión a base de datos
- ✅ Estructura de tablas
- ✅ Extensiones PHP requeridas
- ✅ Permisos de escritura
- ✅ Configuración de seguridad
- ✅ Funcionamiento de APIs

#### 🧪 Tests de API Endpoints
```javascript
// Test de autenticación
fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        email: 'admin@sdi.local',
        password: 'admin123'
    })
});

// Test de CRUD documentos
fetch('/api/documentos', {
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + token }
});
```

### 📊 Reportes de Sistema
- **Logs de Aplicación:** `logs/app-YYYY-MM-DD.log`
- **Logs de Errores:** Revisar `error_log` de Apache
- **Monitor de Rendimiento:** Tiempos de respuesta de API
- **Auditoría:** Registro de todas las acciones críticas

---

## 🚨 Solución de Problemas Comunes

### Error 404 - Página No Encontrada
**Causas Comunes:**
- `mod_rewrite` no habilitado en Apache
- Archivo `.htaccess` ausente o incorrecto
- Configuración incorrecta de `DocumentRoot`

**Soluciones:**
```apache
# Habilitar mod_rewrite
a2enmod rewrite

# Verificar configuración
apache2ctl -M | grep rewrite

# Reiniciar Apache
sudo systemctl restart apache2
```

### Error 500 - Error Interno del Servidor
**Diagnóstico Rápido:**
```php
<?php
// Habilitar visualización de errores
ini_set('display_errors', 1);
ini_set('error_reporting', E_ALL);

// Verificar sintaxis
php -l index.html
php -l api/auth.php
```

**Problemas Frecuentes:**
- Error de sintaxis PHP
- Conexión a base de datos fallida
- Permisos de archivo incorrectos
- Extensiones PHP faltantes

### Error de Autenticación
**Verificación:**
```php
// Verificar usuario administrador
SELECT * FROM usuarios WHERE email = 'admin@sdi.local' AND estado = 'activo';

// Verificar estructura de contraseñas
DESCRIBE usuarios;
```

### Problemas de Rendimiento
**Optimizaciones:**
```sql
-- Consultas optimizadas
EXPLAIN SELECT * FROM registros_documentos WHERE estado_gestion = 'pendiente';

-- Índices faltantes
SHOW INDEX FROM registros_documentos;

-- Limpiar caché
FLUSH TABLES;
```

---

## 📚 Guías de Desarrollo

### 🔧 Guía para Desarrolladores

#### Estándares de Código
- **PSR-4:** Autoloading y namespaces
- **MVC Estricto:** Separación de responsabilidades
- **API RESTful:** Verbos HTTP adecuados
- **Seguridad First:** Validación en todas las capas

#### Flujo de Trabajo
1. **Setup del Entorno:** Configurar servidor local
2. **Rama de Desarrollo:** `git checkout -b feature/nueva-funcionalidad`
3. **Testing Local:** Verificar funcionamiento completo
4. **Code Review:** Revisión por pares del equipo
5. **Integración:** Merge a rama principal
6. **Despliegue:** Actualizar servidor de producción

#### Buenas Prácticas
```php
<?php
// Nombres descriptivos
function obtenerDocumentosPorEstado($estado) {
    // No usar variables como $tmp, $temp
}

// Comentarios de documentación
/**
 * Obtiene documentos según su estado
 * @param string $estado Estado del documento
 * @return array Lista de documentos
 */
function obtenerDocumentosPorEstado($estado) {
    // Implementación
}

// Manejo de errores
try {
    $resultado = $api->call($endpoint, $data);
} catch (Exception $e) {
    error_log("Error en API: " . $e->getMessage());
    return ['success' => false, 'message' => $e->getMessage()];
}
```

### 🎨 Guía de Estilos y Frontend

#### Arquitectura JavaScript Modular
```javascript
// Módulo principal
const archivoGeneralModule = {
    // Estado del módulo
    carpetas: [],
    documentosPorCarpeta: [],
    
    // Métodos públicos
    async init() { /* Inicialización */ },
    async cargarCarpetas() { /* Cargar datos */ },
    async crearCarpeta() { /* Crear carpeta */ }
};

// Módulo de API
const api = {
    baseURL: '/Programa-Gestion-SDI/api',
    
    async get(endpoint, params = {}) {
        const url = new URL(endpoint, this.baseURL);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
        
        const response = await fetch(url);
        return this._processResponse(response);
    },
    
    async post(endpoint, data) {
        // Implementación POST
    }
};
```

#### Sistema de Componentes UI
```javascript
// Sistema de notificaciones
const ui = {
    toast(mensaje, tipo = 'info', duracion = 3000) {
        // Crear notificación no intrusiva
    },
    
    modal(titulo, contenido, botones = []) {
        // Crear modal reutilizable
    },
    
    confirmToast(mensaje, onConfirm, tipo = 'eliminar') {
        // Confirmación con estilo moderno
    }
};
```

---

## 🔮 Referencia Técnica

### Constantes y Configuración
```php
<?php
// config/constants.php
define('ROLES', [
    'ADMINISTRADOR' => 1,
    'PERSONAL_ADMINISTRATIVO' => 2,
    'ESTUDIANTE_SS' => 3
]);

define('PERMISOS', [
    'USUERS_VER' => 1,
    'USUERS_CREAR' => 2,
    'USUERS_EDITAR' => 4,
    'USUORS_ELIMINAR' => 8,
    'DOCUMENTOS_VER' => 16,
    'DOCUMENTOS_CREAR' => 32,
    'DOCUMENTOS_EDITAR' => 64,
    'DOCUMENTOS_ELIMINAR' => 128,
    'CARPETAS_VER' => 256,
    'CARPETAS_CREAR' => 512,
    'CARPETAS_EDITAR' => 1024,
    'CARPETAS_ELIMINAR' => 2048
]);

define('ESTADOS_DOCUMENTO', [
    'PENDIENTE' => 'pendiente',
    'EN_REVISION' => 'en_revision',
    'ARCHIVADO' => 'archivado',
    'CANCELADO' => 'cancelado'
]);
```

### Funciones Helper
```php
<?php
// helpers/seguridad.php
function sanitizarEntrada($data) {
    if (is_array($data)) {
        return array_map('htmlspecialchars', $data);
    }
    return htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
}

function validarEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

function generarTokenCSRF() {
    return bin2hex(random_bytes(32));
}

function verificarTokenCSRF($token) {
    return hash_equals($_SESSION['csrf_token'], $token);
}
```

### Queries SQL Optimizadas
```sql
-- Búsqueda全文 con paginación
SELECT 
    rd.id_registro,
    rd.no_oficio,
    rd.descripcion,
    cc.nombre_categoria,
    cf.no_carpeta_fisica,
    MATCH(rd.descripcion) AGAINST(? IN BOOLEAN MODE) as relevancia
FROM registros_documentos rd
JOIN cat_categorias cc ON rd.id_categoria = cc.id_categoria
LEFT JOIN carpetas_fisicas cf ON rd.id_carpeta = cf.id_carpeta
WHERE 
    rd.estado_gestion IN ('pendiente', 'en_revision')
    AND MATCH(rd.descripcion) AGAINST(? IN BOOLEAN MODE)
ORDER BY 
    relevancia DESC,
    rd.fecha_creacion DESC
LIMIT 20 OFFSET ?;

-- Estadísticas eficientes
SELECT 
    COUNT(*) as total_documentos,
    SUM(CASE WHEN estado_gestion = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
    SUM(CASE WHEN estado_gestion = 'en_revision' THEN 1 ELSE 0 END) as en_revision,
    SUM(CASE WHEN estado_gestion = 'archivado' THEN 1 ELSE 0 END) as archivados,
    SUM(CASE WHEN estado_gestion = 'cancelado' THEN 1 ELSE 0 END) as cancelados
FROM registros_documentos
WHERE fecha_creacion >= DATE_SUB(NOW(), INTERVAL 30 DAY);
```

---

## 📄 Licencia y Soporte

### Licencia de Uso
```
MIT License

Copyright (c) 2024 SDI Development Team

Se concede permiso, libre de cargo, a cualquier persona que obtenga una copia
de este software y archivos de documentación asociados, para tratar el Software
sin restricciones, incluyendo sin limitación los derechos a usar, copiar,
modificar, fusionar, publicar, distribuir, sublicenciar y/o vender copias
del Software, y a permitir a las personas a quienes se les proporcione el Software
hacerlo, bajo las siguientes condiciones:

El aviso de copyright anterior y este aviso de permiso deberán incluirse
en todas las copias o partes sustanciales del Software.
```

### Soporte Técnico
- **Documentación Completa:** Este archivo
- **Issues y Bugs:** Reportar vía GitHub Issues
- **Sugerencias:** Enviar pull requests con mejoras
- **Consultas:** Contactar al equipo de desarrollo

### Versionamiento
- **Version 2.0.0:** Enero 2024 - Arquitectura MVC completa
- **Version 1.0.0:** Diciembre 2023 - Versión inicial
- **Próxima Versión:** 2.1.0 - Planeada para Marzo 2024

---

## 🎯 Conclusión

El **SDI - Sistema de Gestión Documental v2.0** representa una solución empresarial
completa para la gestión documental, con:

✅ **Arquitectura Profesional:** MVC + REST API + AJAX  
✅ **Seguridad Robusta:** Múltiples capas de protección  
✅ **Escalabilidad:** Diseño modular y extensible  
✅ **Usabilidad:** Interfaz moderna e intuitiva  
✅ **Mantenibilidad:** Código limpio y documentado  

El sistema está **listo para producción** y cumple con los estándares más altos
de desarrollo web moderno, garantizando seguridad, rendimiento y mantenibilidad
a largo plazo.

---

**Desarrollado con ❤️ por el equipo SDI Development Team**
