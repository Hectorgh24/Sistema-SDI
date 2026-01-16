# 🚀 Inicio Rápido - SDI Sistema de Gestión

**Tiempo estimado:** 5 minutos

## 📋 Requisitos Previos

### Software Necesario
- **XAMPP 8.0+** (Apache + MySQL + PHP)
- **PHP 7.4+** con extensiones: PDO, MySQLi, JSON, BCrypt
- **MySQL 5.7+** o **MariaDB 10.3+**
- **Navegador Moderno:** Chrome 80+, Firefox 75+, Safari 13+

### Verificación Rápida
```bash
# Verificar versión de PHP
php --version

# Verificar extensiones cargadas
php -m | grep -E "(pdo|mysql|json|bcrypt)"

# Verificar MySQL/MariaDB
mysql --version
# o
mariadb --version
```

---

## ⚡ Instalación Express

### Paso 1: Descargar y Extraer
```bash
# Si usas Git (recomendado)
git clone https://github.com/tu-repo/Programa-Gestion-SDI.git
cd Programa-Gestion-SDI

# O descarga manual
# Extraer el ZIP en C:\xampp\htdocs\Programa-Gestion-SDI\
```

### Paso 2: Crear Base de Datos
```sql
-- Abrir phpMyAdmin: http://localhost/phpmyadmin
-- Crear base de datos: sdi_gestion
-- Importar el archivo: database/schema.sql
```

### Paso 3: Configurar Conexión
Editar `config/db.php`:
```php
<?php
define('DB_HOST', 'localhost');
define('DB_NAME', 'sdi_gestion');
define('DB_USER', 'root');
define('DB_PASS', 'password'); // Tu contraseña de MySQL
?>
```

### Paso 4: Crear Usuario Administrador
Ejecutar en navegador:
```
http://localhost/Programa-Gestion-SDI/database/crear_admin.php
```

---

## 🌐 Acceso al Sistema

### URL Principal
```
http://localhost/Programa-Gestion-SDI/index.html
```

### Credenciales por Defecto
- **Email:** `admin@sdi.local`
- **Contraseña:** `admin123`

---

## 🔍 Verificación de Instalación

### Test de Conexión a BD
```php
<?php
// Crear archivo: test_conexion.php
require_once 'config/db.php';
require_once 'config/autoload.php';

try {
    $db = Database::getInstance();
    echo "✅ Conexión a base de datos exitosa";
    
    // Verificar tablas
    $tablas = ['usuarios', 'registros_documentos', 'carpetas_fisicas', 'cat_categorias'];
    foreach ($tablas as $tabla) {
        $result = $db->query("SHOW TABLES LIKE '$tabla'");
        if ($result->rowCount() > 0) {
            echo "✅ Tabla '$tabla' existe";
        } else {
            echo "❌ Tabla '$tabla' NO existe";
        }
    }
} catch (Exception $e) {
    echo "❌ Error de conexión: " . $e->getMessage();
}
?>
```

### Test de APIs
```javascript
// Abrir: http://localhost/Programa-Gestion-SDI/test_api.html

// Test de autenticación
fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        email: 'admin@sdi.local',
        password: 'admin123'
    })
})
.then(response => response.json())
.then(data => console.log('✅ Login:', data))
.catch(error => console.error('❌ Error:', error));
```

---

## 🎯 Primeros Pasos

### 1. Iniciar Sesión
1. Ir a `http://localhost/Programa-Gestion-SDI/login.html`
2. Ingresar credenciales:
   - Email: `admin@sdi.local`
   - Contraseña: `admin123`
3. Hacer clic en **"Iniciar Sesión"**

### 2. Explorar el Dashboard
1. **Panel Superior:** Ver estadísticas generales
2. **Menú Lateral:** Navegar por módulos
3. **Módulos Disponibles:**
   - 📄 Gestión de Documentos
   - 📁 Gestión de Carpetas
   - 👥 Gestión de Usuarios (Admin)
   - 🏷️ Gestión de Categorías

### 3. Crear Primer Documento
1. Ir a **Gestión de Documentos**
2. Hacer clic en **"Registrar Nuevo Documento"**
3. Completar formulario:
   - No. de Oficio: `OF-2024-001`
   - Emitido Por: `Departamento de Auditoría`
   - Descripción: `Documento de prueba`
   - Seleccionar carpeta existente
4. Hacer clic en **"Registrar Documento"**

### 4. Probar Búsqueda y Filtros
1. En la sección de documentos, usar los filtros:
   - Búsqueda por número de oficio
   - Filtro por estado (pendiente, en revisión, archivado)
   - Filtro por carpeta específica
2. Verificar que los resultados se actualicen dinámicamente

---

## 🛠️ Configuración Adicional

### Activar Modo Debug (Desarrollo)
```php
// En config/constants.php
define('DEBUG_MODE', true);
define('APP_ENV', 'development');

// Ver errores en pantalla
ini_set('display_errors', 1);
ini_set('error_reporting', E_ALL);
```

### Configurar URL Amigable (Opcional)
```apache
# En .htaccess
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]
```

### Optimizar Rendimiento
```php
// Configuración recomendada en php.ini
memory_limit = 256M
max_execution_time = 300
upload_max_filesize = 10M
post_max_size = 10M
```

---

## 🔧 Comandos Útiles

### Reiniciar Servicios (XAMPP)
```bash
# Reiniciar Apache
sudo /opt/lampp/lampp restartapache

# Reiniciar MySQL
sudo /opt/lampp/lampp restartmysql

# Verificar estado
sudo /opt/lampp/lampp status
```

### Ver Logs del Sistema
```bash
# Logs de Apache
tail -f /opt/lampp/logs/apache_error.log

# Logs de PHP
tail -f /opt/lampp/logs/php_error_log

# Logs de MySQL
tail -f /opt/lampp/logs/mysql/mysql_error.log
```

---

## 🚨 Solución de Problemas Comunes

### Error: "No se puede conectar a la base de datos"
**Soluciones:**
1. Verificar que MySQL/MariaDB esté corriendo
2. Confirmar credenciales en `config/db.php`
3. Verificar que la base de datos `sdi_gestion` exista
4. Revisar permisos del usuario de MySQL

### Error: "Página no encontrada (404)"
**Soluciones:**
1. Verificar que `mod_rewrite` esté habilitado en Apache
2. Confirmar que `.htaccess` exista en la raíz
3. Revisar `DocumentRoot` en configuración de Apache

### Error: "Contraseña incorrecta"
**Soluciones:**
1. Ejecutar `database/crear_admin.php` para resetear
2. Verificar tabla `usuarios` tenga el registro del admin
3. Limpiar caché del navegador

### Error: "Las APIs no responden"
**Soluciones:**
1. Verificar que `router.php` esté en la raíz
2. Revisar headers CORS en `.htaccess`
3. Habilitar `display_errors` en PHP para ver detalles

---

## 📚 Documentación Adicional

- **[DOCUMENTACION_COMPLETA.md](DOCUMENTACION_COMPLETA.md)** - Guía técnica completa
- **[GUIA_DESARROLLO.md](GUIA_DESARROLLO.md)** - Guía para desarrolladores
- **[GUIA_MODULOS.md](GUIA_MODULOS.md)** - Crear nuevos módulos

---

## ✅ Verificación Final

### Checklist de Instalación Correcta
- [ ] Base de datos creada y schema importado
- [ ] Archivo `config/db.php` configurado correctamente
- [ ] Usuario administrador creado
- [ ] Login funcional con credenciales por defecto
- [ ] Dashboard carga correctamente
- [ ] APIs responden correctamente
- [ ] No hay errores en consola del navegador
- [ ] Logs del sistema sin errores críticos

---

## 🎉 ¡Listo para Usar!

Si todos los pasos anteriores se completaron exitosamente, el sistema está listo para uso.

**URL de Acceso:** `http://localhost/Programa-Gestion-SDI/index.html`

**Soporte:** Revisar [DOCUMENTACION_COMPLETA.md](DOCUMENTACION_COMPLETA.md) para documentación técnica detallada.

---

**Tiempo total estimado:** 5 minutos  
**Nivel de dificultad:** ⭐ Principiante
