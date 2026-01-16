# Módulo Archivo General SDI - Documentación Técnica

## 📋 Resumen

El módulo **Archivo General SDI** proporciona funcionalidad completa para gestionar carpetas físicas y registrar documentos de auditoría con campos dinámicos, archivos adjuntos y validaciones robustas.

## 🏗️ Arquitectura

### Frontend
- **Archivo Principal**: `/public/js/modules/archivo-general.js`
- **Integración**: Cargado en `index.html`
- **Patrón**: Módulo autocontenido con métodos AJAX

### Backend
- **Controlador Actualizado**: `DocumentoController.php`
- **Controlador Extendido**: `CategoriaController.php` (nuevo método `columnas()`)
- **Modelos Actualizados**: 
  - `Documento.php` (nuevo método `guardarArchivoAdjunto()`)
  - `Categoria.php` (nuevo método `obtenerColumnas()`)

### Rutas API
```
GET  /api/carpetas               - Listar carpetas
POST /api/carpetas/crear         - Crear carpeta
GET  /api/categorias             - Listar categorías
GET  /api/categorias/:id/columnas - Obtener columnas de categoría
POST /api/documentos/crear       - Crear documento con archivo
```

## 🎯 Funcionalidades

### 1. Gestión de Carpetas Físicas

#### Vista
- Formulario de creación con validaciones
- Lista visual de carpetas existentes
- Campos:
  - `no_carpeta_fisica` (requerido, numérico)
  - `etiqueta_identificadora` (requerido, texto único, ej: AUD-2024-001)
  - `descripcion` (opcional)

#### Validaciones
```javascript
// Validación de etiqueta duplicada (cliente)
const existe = this.carpetas.some(c => c.etiqueta_identificadora === datos.etiqueta_identificadora);
```

#### Endpoint
```bash
POST /api/carpetas/crear
Content-Type: application/json

{
    "no_carpeta_fisica": 1,
    "etiqueta_identificadora": "AUD-2024-001",
    "descripcion": "Auditorías internas 2024"
}
```

### 2. Registración de Documentos de Auditoría

#### Vista
- Selección de carpeta física (dropdown)
- Fecha del documento (date input)
- Campos dinámicos EAV automáticos
- Carga de archivos adjuntos (drag & drop)

#### Campos Dinámicos (desde BD)
Los siguientes campos se cargan dinámicamente desde `conf_columnas_categoria` para la categoría "Auditoría":
1. **No. Oficio** (texto corto, obligatorio)
2. **Seguimiento Oficio** (texto corto, opcional)
3. **Nombre Auditoría** (texto corto, opcional)
4. **Emitido Por** (texto corto, obligatorio)
5. **Descripción** (texto largo, obligatorio)
6. **Comentarios Adicionales** (texto largo, opcional)

#### Archivos Adjuntos
- **Tipos permitidos**: PDF, JPG, PNG, DOCX, DOC
- **Tamaño máximo**: 10 MB
- **Almacenamiento**: `/public/uploads/`
- **Nomenclatura**: `doc_{id_documento}_{timestamp}.{ext}`
- **Registro BD**: Tabla `archivos_adjuntos`

#### Endpoint
```bash
POST /api/documentos/crear
Content-Type: multipart/form-data

Parámetros:
- id_carpeta (requerido)
- fecha_documento (requerido)
- id_categoria (requerido, será "Auditoría")
- valores_dinamicos (JSON con pares id_columna => valor)
- archivo (opcional, file)
```

## 🔄 Flujo de Procesamiento

### Creación de Carpeta
```
Frontend (formulario) 
  ↓ validación de etiqueta
  ↓ POST /api/carpetas/crear
  ↓ DocumentoController::crear()
  ↓ Carpeta::crear()
  ↓ Registrar en BD
  ↓ Actualizar lista visual
```

### Registro de Documento
```
Frontend (formulario multipart)
  ↓ validar selecciones
  ↓ POST /api/documentos/crear
  ↓ DocumentoController::crearDocumentoConArchivo()
  ├─ Crear registro en registros_documentos
  ├─ Insertar valores dinámicos en detalles_valores_documento
  ├─ Mover archivo a /public/uploads/
  └─ Registrar archivo en archivos_adjuntos
  ↓ Respuesta JSON
```

## 📦 Modelos de Datos

### Carpeta (registros)
```sql
- id_carpeta (PK)
- no_carpeta_fisica (UNIQUE)
- etiqueta_identificadora (UNIQUE)
- descripcion
- creado_por_id (FK usuarios)
- fecha_creacion
```

### Documento (registros_documentos)
```sql
- id_registro (PK)
- id_categoria (FK)
- id_carpeta (FK)
- id_usuario_captura (FK)
- fecha_documento
- estado_gestion (enum)
- estado_respaldo_digital (enum)
- fecha_sistema_creacion
```

### Valores Dinámicos (detalles_valores_documento) - EAV
```sql
- id_valor (PK)
- id_registro (FK)
- id_columna (FK conf_columnas_categoria)
- valor_texto / valor_numero / valor_fecha / valor_booleano
```

### Archivos Adjuntos (archivos_adjuntos)
```sql
- id_archivo (PK)
- id_registro (FK)
- nombre_base (sin extensión)
- extension_archivo
- tipo_mime
- peso_bytes
- ruta_almacenamiento
- fecha_subida
```

## 🔐 Seguridad y Validaciones

### Cliente
- Validación de campos requeridos
- Validación de tamaño de archivo (máx 10MB)
- Validación de extensiones permitidas
- Validación de etiqueta duplicada

### Servidor (DocumentoController)
```php
// Validación de extensión
$extensionesPermitidas = ['pdf', 'jpg', 'jpeg', 'png', 'docx', 'doc'];

// Validación de MIME type
$tiposPermitidos = ['application/pdf', 'image/jpeg', ...];

// Validación de tamaño
if ($archivo['size'] > 10 * 1024 * 1024) { throw Exception; }

// Autorización
Autenticacion::requerirAutenticacion();
Autorizacion::requerirAcceso('crear_documento');
```

## 📝 Ejemplo de Uso

### 1. Crear Carpeta
```javascript
// Frontend (archivoGeneralModule.js)
const datos = {
    no_carpeta_fisica: 1,
    etiqueta_identificadora: 'AUD-2024-001',
    descripcion: 'Auditorías internas'
};
const resultado = await api.post('/carpetas/crear', datos);
```

### 2. Registrar Documento
```javascript
// Frontend - multipart/form-data
const formData = new FormData();
formData.append('id_carpeta', 1);
formData.append('fecha_documento', '2024-01-15');
formData.append('id_categoria', 1); // Auditoría
formData.append('valores_dinamicos', JSON.stringify({
    1: 'AUD-2024-001',     // No. Oficio
    2: 'SEG-001',          // Seguimiento Oficio
    3: 'Auditoría Q1',     // Nombre Auditoría
    4: 'Dirección',        // Emitido Por
    5: 'Descripción...',   // Descripción
    6: 'Comentarios...'    // Comentarios
}));
formData.append('archivo', fileInput.files[0]);

const response = await fetch('/Programa-Gestion-SDI/api/documentos/crear', {
    method: 'POST',
    body: formData
});
```

## 🎨 Componentes de UI

### Pestañas
- **Crear Carpeta**: Formulario + lista visual
- **Registrar Documento**: Formulario con campos dinámicos

### Drag & Drop de Archivos
```javascript
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    archivoInput.files = files;
});
```

### Renderizado Dinámico de Campos
```javascript
// Según tipo de dato de conf_columnas_categoria
- texto_corto      → <input type="text">
- texto_largo      → <textarea>
- numero_entero    → <input type="number" step="1">
- numero_decimal   → <input type="number" step="0.01">
- fecha            → <input type="date">
- booleano         → <input type="checkbox">
```

## 🧪 Pruebas

### Test de Creación de Carpeta
```bash
curl -X POST http://localhost/Programa-Gestion-SDI/api/carpetas/crear \
  -H "Content-Type: application/json" \
  -d '{
    "no_carpeta_fisica": 1,
    "etiqueta_identificadora": "TEST-2024",
    "descripcion": "Test"
  }'
```

### Test de Registro de Documento
```bash
curl -X POST http://localhost/Programa-Gestion-SDI/api/documentos/crear \
  -F "id_carpeta=1" \
  -F "fecha_documento=2024-01-15" \
  -F "id_categoria=1" \
  -F "valores_dinamicos={\"1\":\"AUD-001\"}" \
  -F "archivo=@documento.pdf"
```

## 📊 Respuestas API

### Éxito (Crear Documento)
```json
{
  "success": true,
  "message": "Documento creado",
  "data": {
    "id_registro": 1,
    "id_categoria": 1,
    "id_carpeta": 1,
    "fecha_documento": "2024-01-15",
    "estado_gestion": "pendiente",
    "valores": [
      {
        "id_columna": 1,
        "nombre_campo": "No. Oficio",
        "valor_texto": "AUD-2024-001"
      }
    ],
    "archivos": [
      {
        "id_archivo": 1,
        "nombre_base": "doc_1_1705348800",
        "extension_archivo": "pdf",
        "ruta_almacenamiento": "/public/uploads/doc_1_1705348800.pdf"
      }
    ]
  }
}
```

### Error
```json
{
  "success": false,
  "message": "La etiqueta ya existe en otra carpeta",
  "data": null
}
```

## 🔧 Mantenimiento

### Limpiar Archivos Huérfanos
```sql
-- Archivos sin documento asociado
SELECT * FROM archivos_adjuntos 
WHERE id_registro NOT IN (SELECT id_registro FROM registros_documentos);
```

### Monitorear Espacio en /uploads
```bash
du -sh /xampp/htdocs/Programa-Gestion-SDI/public/uploads/
```

## 📚 Referencias

- [Schema.sql](database/schema.sql) - Estructura completa de BD
- [Documentación MVC](DOCUMENTACION_TECNICA.md)
- [API Endpoints](README.md#api-endpoints)

---

**Versión**: 1.0  
**Fecha**: Enero 2026  
**Autor**: SDI Development Team
