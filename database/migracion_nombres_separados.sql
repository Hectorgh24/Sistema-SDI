-- =====================================================
-- MIGRACIÓN: Separar nombre_completo en 3 campos
-- SDI Gestión Documental
-- =====================================================
-- 
-- IMPORTANTE: 
-- 1. Hacer backup de la base de datos antes de ejecutar
-- 2. Ejecutar en orden las sentencias
-- 3. Verificar que no haya errores
--
-- =====================================================

USE SDI_Gestion_Documental;

-- Paso 1: Agregar las nuevas columnas
ALTER TABLE usuarios 
ADD COLUMN nombre VARCHAR(60) NULL AFTER id_usuario,
ADD COLUMN apellido_paterno VARCHAR(60) NULL AFTER nombre,
ADD COLUMN apellido_materno VARCHAR(60) NULL AFTER apellido_paterno;

-- Paso 2: Migrar datos existentes (dividir nombre_completo en los 3 campos)
-- Esta consulta intenta dividir el nombre_completo en partes
-- Ajusta según tus datos reales si es necesario
UPDATE usuarios 
SET 
    nombre = TRIM(SUBSTRING_INDEX(nombre_completo, ' ', 1)),
    apellido_paterno = CASE 
        WHEN LOCATE(' ', nombre_completo) > 0 
        THEN TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(nombre_completo, ' ', 2), ' ', -1))
        ELSE ''
    END,
    apellido_materno = CASE 
        WHEN (LENGTH(nombre_completo) - LENGTH(REPLACE(nombre_completo, ' ', ''))) >= 2
        THEN TRIM(SUBSTRING_INDEX(nombre_completo, ' ', -1))
        ELSE ''
    END
WHERE nombre_completo IS NOT NULL AND nombre_completo != '';

-- Paso 3: Hacer las columnas NOT NULL (después de migrar datos)
ALTER TABLE usuarios 
MODIFY COLUMN nombre VARCHAR(60) NOT NULL,
MODIFY COLUMN apellido_paterno VARCHAR(60) NOT NULL,
MODIFY COLUMN apellido_materno VARCHAR(60) NULL; -- Apellido materno puede ser opcional

-- Paso 4: Eliminar la columna antigua nombre_completo
ALTER TABLE usuarios 
DROP COLUMN nombre_completo;

-- =====================================================
-- VERIFICACIÓN (Opcional - ejecutar para verificar)
-- =====================================================
-- SELECT 
--     id_usuario,
--     nombre,
--     apellido_paterno,
--     apellido_materno,
--     CONCAT(nombre, ' ', apellido_paterno, ' ', IFNULL(apellido_materno, '')) as nombre_completo,
--     email
-- FROM usuarios
-- LIMIT 10;
-- =====================================================

