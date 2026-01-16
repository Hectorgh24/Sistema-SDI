# 📋 SDI - Sistema de Gestión Documental

**Versión 2.0** - Arquitectura MVC + AJAX Completamente Refactorizada

Sistema profesional de gestión documental con separación limpia de código, seguridad robusta y control de acceso basado en roles.

---

## ✨ Características Principales

### 🏗️ Arquitectura Moderna
- **MVC + REST API:** Separación clara entre frontend (HTML/JS) y backend (PHP/MySQL)
- **AJAX Dinámico:** Interfaz sin recargas de página
- **PSR-4 Autoloading:** Código modular y escalable
- **30+ Endpoints:** API REST completamente funcional

### 🔐 Seguridad Empresarial
- **PDO Prepared Statements:** Protección contra SQL injection
- **BCRYPT Password Hashing:** (cost 10) Contraseñas seguras
- **Session Management:** Cookies HTTP-only con SameSite
- **RBAC:** Role-Based Access Control en 3 niveles
- **Validación de Entrada/Salida:** En todos los endpoints

### 👥 Control de Roles (3 Niveles)

| Rol | Usuarios | Documentos | Carpetas | Categorías |
|-----|----------|-----------|----------|-----------|
| 👑 **Administrador** | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ CRUD |
| 📋 **Personal Administrativo** | ❌ | ✅ CRUD | ✅ CRUD | ✅ CRUD |
| 🎓 **Estudiante SS** | ❌ | ✅ Propios | ❌ | ❌ |

### 📦 Módulos Funcionales
1. **Dashboard** - Estadísticas y resumen
2. **Usuarios** - CRUD de usuarios (Admin only)
3. **Documentos** - Gestión con estados y campos dinámicos
4. **Carpetas Físicas** - Organización de documentos
5. **Categorías** - Tipos de documentos personalizables
6. **Perfil** - Cambio de contraseña

---

## 🚀 Inicio Rápido (5 minutos)

### Requisitos
- PHP 7.4+
- MySQL 5.7+ o MariaDB 10.3+
- Apache con mod_rewrite
- XAMPP (recomendado)

### Paso 1: Importar Base de Datos
```sql
CREATE DATABASE sdi_gestion;
USE sdi_gestion;
SOURCE database/schema.sql;
```

### Paso 2: Configurar Conexión
Editar `config/db.php`:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'sdi_gestion');
define('DB_USER', 'root');
define('DB_PASS', 'password');
```

### Paso 3: Crear Usuarios de Prueba
```
http://localhost/Programa-Gestion-SDI/crear_admin_test.php
```

### Paso 4: Acceder al Sistema
```
http://localhost/Programa-Gestion-SDI/index.html

Email: admin@sdi.local
Contraseña: admin123
```

---

## 📚 Documentación

| Documento | Para quién | Tiempo |
|-----------|-----------|--------|
| **[DOCUMENTACION_COMPLETA.md](DOCUMENTACION_COMPLETA.md)** | Todo el equipo | 45 min |
| **[INICIO_RAPIDO.md](INICIO_RAPIDO.md)** | Usuarios nuevos | 5 min |
| **[GUIA_DESARROLLO.md](GUIA_DESARROLLO.md)** | Desarrolladores | 30 min |
| **[GUIA_MODULOS.md](GUIA_MODULOS.md)** | Desarrolladores | 20 min |

---

## 🛠️ Estructura del Proyecto

```
Programa-Gestion-SDI/
├── models/                     [5 modelos PDO]
├── controllers/                [7 controladores]
├── middleware/                 [Autenticación, Autorización]
├── config/                     [Configuración]
├── database/                   [Scripts BD]
├── public/                     [Archivos públicos - JS, CSS]
├── index.html                  [Aplicación Principal]
├── login.html                  [Página Login]
├── router.php                  [REST API Router]
└── [Documentación]
```

---

## 🔌 API REST - Ejemplos

### Autenticación
```javascript
POST   /api/auth/login              // Email + Password
GET    /api/auth/verificar          // Check Session
POST   /api/auth/logout             // End Session
```

### Usuarios (Admin Only)
```javascript
GET    /api/usuarios                // List
POST   /api/usuarios                // Create
GET    /api/usuarios/:id            // Get Single
PUT    /api/usuarios/:id            // Update
DELETE /api/usuarios/:id            // Delete
```

### Documentos
```javascript
GET    /api/documentos              // List
POST   /api/documentos              // Create
PATCH  /api/documentos/:id/estado   // Change Status
```

Más endpoints en **DOCUMENTACION_TECNICA.md**

---

## 🔐 Seguridad

### Implementado
✅ SQL Injection Prevention (Prepared Statements)
✅ Password Hashing (BCRYPT - cost 10)
✅ Session Security (HTTP-only cookies)
✅ RBAC (Role-Based Access Control)
✅ Input Validation
✅ Output Encoding
✅ CORS Protection
✅ .htaccess Security Headers

---

## 📊 Estadísticas

- **Modelos:** 5
- **Controladores:** 7
- **Middleware:** 2
- **Endpoints API:** 30+
- **Tablas BD:** 8
- **Roles:** 3
- **Líneas de código:** 6,000+
- **Documentación:** 1,500+

---

## 🧪 Testing

### Verificación de Instalación
```
http://localhost/Programa-Gestion-SDI/VERIFICACION_COMPLETA.php
```

### Test de Endpoints
```
http://localhost/Programa-Gestion-SDI/test_api.html
```

---

## 🐛 Solución de Problemas

### "Error 404 - Página no encontrada"
- Verificar que mod_rewrite está habilitado
- Revisar que .htaccess está presente
- Verificar ruta de acceso

### "Error 500 - Error interno del servidor"
- Revisar error.log de Apache
- Ejecutar VERIFICACION_COMPLETA.php
- Verificar credenciales de BD

### "No puedo logearme"
- Ejecutar crear_admin_test.php
- Verificar que usuario existe en BD
- Verificar que estado es 'activo'

Más soluciones en **DOCUMENTACION_TECNICA.md**

---

## 🚀 Roadmap Futuro

- [ ] Exportación a PDF de documentos
- [ ] Búsqueda avanzada y filtros complejos
- [ ] Historial de cambios y auditoría
- [ ] Notificaciones por email
- [ ] Integración con sistemas externos
- [ ] Autenticación 2FA
- [ ] Control de versiones de documentos

---

**Versión:** 2.0.0
**Estado:** Production-Ready ✅
**Última actualización:** Enero 2024
**Soporte PHP:** 7.4+

```

**Credenciales por defecto:**
- Email: `admin@sdi.local`
- Contraseña: `admin123`

## 📁 Estructura del Proyecto

```
Programa-Gestion-SDI/
├── api/                          # APIs REST (devuelven JSON)
│   ├── auth.php                  # Autenticación
│   ├── usuarios.php              # CRUD usuarios (Admin)
│   ├── documentos.php            # CRUD documentos (con control de rol)
│   ├── categorias.php            # CRUD categorías
│   ├── dashboard.php             # Datos del dashboard
│   └── logout.php                # Cierre de sesión
├── views/                        # Vistas HTML puras
│   ├── auth/
│   │   └── login.html
│   ├── documentos/
│   │   └── index.html
│   ├── usuarios/
│   │   └── index.html
│   ├── dashboard.html
│   └── layouts/
│       ├── header.html           # Navbar reutilizable
│       └── footer.html           # Footer reutilizable
├── public/
│   ├── js/                       # JavaScript AJAX
│   │   ├── auth.js
│   │   ├── documentos.js
│   │   ├── usuarios.js
│   │   └── dashboard.js
│   └── css/                      # Estilos (Tailwind CSS)
├── models/                       # Clases PHP
│   ├── Usuario.php
│   └── Documento.php
├── config/                       # Configuración
│   ├── db.php                    # Conexión PDO
│   ├── constants.php             # Constantes y roles
│   └── autoload.php              # Funciones de seguridad
├── helpers/                      # Funciones auxiliares
│   └── seguridad.php
├── database/
│   ├── schema.sql                # Estructura de BD
│   └── crear_admin.php           # Script crear admin
└── index.php                     # Router principal
```

## 👥 Roles y Permisos

### Administrador (`admin@sdi.local`)
- ✅ Gestión de usuarios (CRUD)
- ✅ Documentos (CRUD completo)
- ✅ Categorías (CRUD)
- ✅ Carpetas físicas (CRUD)
- 📊 Ver todas las estadísticas

### Personal Administrativo
- ✅ Documentos (crear, editar, NO eliminar)
- ✅ Categorías (gestionar)
- ✅ Carpetas (gestionar)
- ❌ No puede gestionar usuarios

### Estudiante SS
- ✅ Ver y gestionar sus propios documentos
- ✅ Ver carpetas disponibles
- ❌ No puede crear documentos nuevos
- ❌ No puede ver documentos de otros

## 📚 Documentación

- **[ARQUITECTURA.md](ARQUITECTURA.md)** - Guía técnica completa
- **[GUIA_RAPIDA.md](GUIA_RAPIDA.md)** - Cómo usar el sistema
- **[GUIA_MODULOS.md](GUIA_MODULOS.md)** - Crear nuevos módulos
- **[CAMBIOS.md](CAMBIOS.md)** - Resumen de refactorización

## 🔐 Seguridad Implementada

- ✅ **SQL Injection:** PDO prepared statements
- ✅ **XSS:** Sanitización de entrada y salida
- ✅ **CSRF:** Verificación de sesión
- ✅ **Password:** Hash BCRYPT
- ✅ **Soft Delete:** Recuperación de datos
- ✅ **Validación:** Input validation en cliente y servidor
- ✅ **Autenticación:** Sesiones PHP

## 🛠️ APIs Principales

### Documentos
- `GET /api/documentos.php?action=listar` - Listar documentos
- `POST /api/documentos.php?action=crear` - Crear documento
- `PUT /api/documentos.php?action=actualizar` - Actualizar
- `DELETE /api/documentos.php?action=eliminar` - Eliminar (Admin)

### Usuarios (Admin)
- `GET /api/usuarios.php?action=listar` - Listar usuarios
- `POST /api/usuarios.php?action=crear` - Crear usuario
- `PUT /api/usuarios.php?action=actualizar` - Actualizar
- `DELETE /api/usuarios.php?action=eliminar` - Eliminar

### Autenticación
- `POST /api/auth.php?action=login` - Login
- `GET /api/logout.php` - Logout

## 📊 Base de Datos

### Tablas Principales
- **usuarios** - Usuarios del sistema
- **registros_documentos** - Documentos
- **cat_categorias** - Categorías de documentos
- **conf_columnas_categoria** - Campos dinámicos
- **carpetas_fisicas** - Ubicaciones de almacenamiento
- **detalles_valores_documento** - Valores de campos dinámicos

## 🚢 Despliegue

Ver [GUIA_DESPLIEGUE.md](GUIA_DESPLIEGUE.md) para instrucciones de despliegue en servidor.

## 📝 Ejemplos

### Crear usuario vía API
```javascript
const response = await fetch('/api/usuarios.php?action=crear', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        nombres: 'Juan',
        apellido_paterno: 'Pérez',
        email: 'juan@example.com',
        password: 'micontraseña123',
        id_rol: 2
    })
});
```

### Listar documentos
```javascript
const response = await fetch('/api/documentos.php?action=listar?pagina=1');
const data = await response.json();
console.log(data.data.documentos);
```

## 🐛 Troubleshooting

**"No tienes acceso":**
- Tu rol no permite esta acción
- Contacta al administrador

**"Documento no encontrado":**
- El documento fue eliminado o no tienes permisos

**La página carga lentamente:**
- Verifica la conexión a BD
- Revisa los logs del servidor

## 📞 Soporte

- Revisa la documentación primero
- Consulta los comentarios en el código
- Revisa los logs del servidor (`php error_log`)

## 📄 Licencia

Propietario - Todos los derechos reservados

---

**Versión:** 2.0 Refactorizado  
**Última actualización:** 2024  
**Estado:** ✅ Listo para producción
