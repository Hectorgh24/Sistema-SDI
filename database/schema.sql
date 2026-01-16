-- ======================================================================================
-- ESQUEMA DE BASE DE DATOS: sdi_gestion_documental (Strict 3NF)
-- Fecha: 2024 | Actualizado: Enero 2026
-- Motor: MySQL / MariaDB (InnoDB)
-- ======================================================================================

USE `sdi_gestion_documental`;

SET FOREIGN_KEY_CHECKS = 0;

-- Limpieza de tablas existentes para evitar conflictos al recrear
DROP TABLE IF EXISTS archivos_adjuntos;
DROP TABLE IF EXISTS detalles_valores_documento;
DROP TABLE IF EXISTS registros_documentos;
DROP TABLE IF EXISTS conf_columnas_categoria;
DROP TABLE IF EXISTS cat_categorias;
DROP TABLE IF EXISTS carpetas_fisicas;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS roles;

SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================================
-- 1. MÓDULO DE SEGURIDAD Y USUARIOS
-- ==========================================================

-- Tabla de Roles (Catálogo)
-- Cumple 3NF: La descripción depende solo del ID del rol.
CREATE TABLE roles (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL UNIQUE, -- Ej: 'Administrador', 'Estudiante SS'
    descripcion VARCHAR(255) NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Usuarios
-- CORRECCIÓN 1NF: Nombres separados (Atómicos).
-- Cumple 3NF: El rol es una referencia externa, no hay dependencias transitivas dentro de la tabla.
CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    id_rol INT NOT NULL,
    nombre VARCHAR(60) NOT NULL,           -- Ej: "Juan Carlos"
    apellido_paterno VARCHAR(60) NOT NULL, -- Ej: "Pérez"
    apellido_materno VARCHAR(60) NULL,     -- Ej: "López" (Nullable por casos extranjeros)
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    estado ENUM('activo', 'inactivo', 'suspendido') DEFAULT 'activo',
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuarios_roles FOREIGN KEY (id_rol) REFERENCES roles(id_rol) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- 2. MÓDULO DE ORGANIZACIÓN FÍSICA
-- ==========================================================

-- Representa el contenedor físico.
CREATE TABLE carpetas_fisicas (
    id_carpeta INT AUTO_INCREMENT PRIMARY KEY,
    no_carpeta_fisica INT NOT NULL UNIQUE, -- Identificador numérico secuencial físico
    titulo VARCHAR(150) NOT NULL UNIQUE, -- Título principal de la carpeta
    etiqueta_identificadora VARCHAR(100) NOT NULL UNIQUE, -- Ej: "AUD-2023-A" (Código único de negocio)
    descripcion TEXT NULL,
    estado_gestion ENUM('pendiente', 'en_revision', 'archivado', 'cancelado') DEFAULT 'pendiente',
    creado_por_id INT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_carpetas_creador FOREIGN KEY (creado_por_id) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- 3. MÓDULO DE DEFINICIÓN DE ESTRUCTURA (METADATOS)
-- ==========================================================

-- Catálogo de Categorías (Tipos de Documentos)
CREATE TABLE cat_categorias (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre_categoria VARCHAR(100) NOT NULL UNIQUE, -- Ej: "Auditoría", "Memorándum"
    descripcion TEXT NULL,
    estado ENUM('activa', 'obsoleta') DEFAULT 'activa',
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Definición de campos dinámicos (Permite las "20 columnas" personalizables)
-- Esta tabla define el "Esquema lógico" de cada categoría.
CREATE TABLE conf_columnas_categoria (
    id_columna INT AUTO_INCREMENT PRIMARY KEY,
    id_categoria INT NOT NULL,
    nombre_campo VARCHAR(60) NOT NULL, -- Ej: "No. Oficio"
    
    -- Tipos de datos soportados para validación en backend
    tipo_dato ENUM('texto_corto', 'texto_largo', 'numero_entero', 'numero_decimal', 'fecha', 'booleano') NOT NULL DEFAULT 'texto_corto',
    
    es_obligatorio BOOLEAN DEFAULT FALSE,
    orden_visualizacion TINYINT UNSIGNED NOT NULL DEFAULT 1, -- Para ordenar inputs en el frontend
    longitud_maxima INT NULL, -- Validación extra opcional (Ej: Max 50 caracteres)
    
    -- Restricción: No puede haber dos campos con el mismo nombre en la misma categoría
    CONSTRAINT uq_campo_por_categoria UNIQUE (id_categoria, nombre_campo),
    CONSTRAINT fk_conf_categoria FOREIGN KEY (id_categoria) REFERENCES cat_categorias(id_categoria) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- 4. MÓDULO DE ALMACENAMIENTO DE DATOS (DOCUMENTOS)
-- ==========================================================

-- Encabezado del Documento (Datos fijos y de control)
CREATE TABLE registros_documentos (
    id_registro INT AUTO_INCREMENT PRIMARY KEY,
    id_categoria INT NOT NULL,      -- Define qué estructura de datos usará
    id_carpeta INT NOT NULL,        -- Define ubicación física
    id_usuario_captura INT NOT NULL, -- Trazabilidad
    
    -- Fechas críticas
    fecha_documento DATE NOT NULL,  -- La fecha que viene escrita en el papel
    fecha_sistema_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Estados del flujo de trabajo
    estado_gestion ENUM('pendiente', 'en_revision', 'archivado', 'cancelado') DEFAULT 'pendiente',
    estado_respaldo_digital ENUM('sin_respaldo', 'con_respaldo') DEFAULT 'sin_respaldo',
    
    CONSTRAINT fk_reg_categoria FOREIGN KEY (id_categoria) REFERENCES cat_categorias(id_categoria) ON DELETE RESTRICT,
    CONSTRAINT fk_reg_carpeta FOREIGN KEY (id_carpeta) REFERENCES carpetas_fisicas(id_carpeta) ON DELETE RESTRICT,
    CONSTRAINT fk_reg_usuario FOREIGN KEY (id_usuario_captura) REFERENCES usuarios(id_usuario) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Valores de los campos dinámicos (Modelo EAV - Entity Attribute Value)
-- Aquí se guardan los datos de los inputs definidos en conf_columnas_categoria
CREATE TABLE detalles_valores_documento (
    id_valor INT AUTO_INCREMENT PRIMARY KEY,
    id_registro INT NOT NULL,
    id_columna INT NOT NULL, -- Relación con la definición del campo
    
    -- Columnas tipadas para mantener integridad. Se llena solo una por fila.
    valor_texto TEXT NULL,            -- Para texto_corto y texto_largo
    valor_numero DECIMAL(20,4) NULL,  -- Para enteros y decimales
    valor_fecha DATETIME NULL,        -- Para fechas
    valor_booleano BOOLEAN NULL,      -- Para checkboxes
    
    CONSTRAINT uq_valor_unico_por_campo UNIQUE (id_registro, id_columna), -- Un solo valor por campo por documento
    CONSTRAINT fk_val_registro FOREIGN KEY (id_registro) REFERENCES registros_documentos(id_registro) ON DELETE CASCADE,
    CONSTRAINT fk_val_columna FOREIGN KEY (id_columna) REFERENCES conf_columnas_categoria(id_columna) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Archivos Adjuntos (Normalización de adjuntos)
-- CORRECCIÓN 1NF: Separación de extensión y nombre base.
CREATE TABLE archivos_adjuntos (
    id_archivo INT AUTO_INCREMENT PRIMARY KEY,
    id_registro INT NOT NULL,
    
    nombre_base VARCHAR(200) NOT NULL, -- Nombre sin extensión
    extension_archivo VARCHAR(10) NOT NULL, -- Ej: .pdf, .jpg
    tipo_mime VARCHAR(100) NOT NULL,   -- Ej: application/pdf
    peso_bytes BIGINT UNSIGNED NULL,   -- Metadato útil
    ruta_almacenamiento VARCHAR(500) NOT NULL, -- Ruta relativa o URL segura
    
    fecha_subida DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_archivo_registro FOREIGN KEY (id_registro) REFERENCES registros_documentos(id_registro) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- 5. DATOS INICIALES (SEED DATA)
-- ==========================================================

-- 5.1 Roles
INSERT INTO roles (nombre_rol, descripcion) VALUES 
('Administrador', 'Control total de sistema, usuarios y configuraciones'),
('Estudiante SS', 'Permisos de captura de documentos y consulta básica'),
('Personal Administrativo', 'Gestión de carpetas, reportes y supervisión');

-- 5.2 Usuario Admin
-- Email: hectorggh24@gmail.com
-- Password: password
INSERT INTO usuarios (id_rol, nombre, apellido_paterno, apellido_materno, email, password_hash) VALUES
(1, 'Héctor', 'González', 'Hernández', 'hectorggh24@gmail.com', '$2y$10$q7p3aTolsz9/BVdhgPsZ7.18nv2dJXFNpba/eGVYFmlouYzCHSG3a');

-- 5.3 Categoría Base: Auditoría
INSERT INTO cat_categorias (nombre_categoria, descripcion) VALUES 
('Auditoría', 'Documentación oficial de procesos de auditoría interna y externa');

-- 5.4 Definición de columnas para "Auditoría" (Simulando tu estructura actual)
-- Supongamos que el ID de 'Auditoría' es 1
INSERT INTO conf_columnas_categoria (id_categoria, nombre_campo, tipo_dato, orden_visualizacion, es_obligatorio) VALUES
(1, 'No. Oficio', 'texto_corto', 1, TRUE),
(1, 'Seguimiento Oficio', 'texto_corto', 2, FALSE),
(1, 'Nombre Auditoría', 'texto_corto', 3, FALSE),
(1, 'Emitido Por', 'texto_corto', 4, TRUE), -- Persona o entidad emisora
(1, 'Descripción Asunto', 'texto_largo', 5, TRUE),
(1, 'Comentarios Adicionales', 'texto_largo', 6, FALSE);