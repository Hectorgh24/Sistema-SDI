# Guía de Prueba - Módulo Archivo General SDI

## ✅ Checklist de Pruebas

### 1. Autenticación Previa
Antes de ejecutar cualquier prueba, asegúrate de estar autenticado. Si usas Postman o cURL, incluye las cookies de sesión.

### 2. Prueba de Creación de Carpeta

#### 2.1 Crear Carpeta Válida
```bash
curl -X POST http://localhost/Programa-Gestion-SDI/api/carpetas/crear \
  -H "Content-Type: application/json" \
  -d '{
    "no_carpeta_fisica": 1,
    "etiqueta_identificadora": "AUD-2024-001",
    "descripcion": "Auditorías internas 2024"
  }'
```

**Respuesta Esperada**: `201 Created`
```json
{
  "success": true,
  "message": "Carpeta creada",
  "data": {
    "id_carpeta": 1,
    "no_carpeta_fisica": 1,
    "etiqueta_identificadora": "AUD-2024-001",
    ...
  }
}
```

#### 2.2 Intentar Crear Carpeta con Etiqueta Duplicada
```bash
curl -X POST http://localhost/Programa-Gestion-SDI/api/carpetas/crear \
  -H "Content-Type: application/json" \
  -d '{
    "no_carpeta_fisica": 2,
    "etiqueta_identificadora": "AUD-2024-001"
  }'
```

**Respuesta Esperada**: `400 Bad Request`
```json
{
  "success": false,
  "message": "Violación de restricción UNIQUE en etiqueta_identificadora"
}
```

#### 2.3 Crear Carpeta sin Campos Requeridos
```bash
curl -X POST http://localhost/Programa-Gestion-SDI/api/carpetas/crear \
  -H "Content-Type: application/json" \
  -d '{
    "etiqueta_identificadora": "AUD-2024-002"
  }'
```

**Respuesta Esperada**: `400 Bad Request`
```json
{
  "success": false,
  "message": "Datos requeridos faltantes"
}
```

### 3. Prueba de Obtención de Carpetas

```bash
curl -X GET "http://localhost/Programa-Gestion-SDI/api/carpetas?limit=10&page=1"
```

**Respuesta Esperada**: `200 OK`
```json
{
  "success": true,
  "message": "Carpetas obtenidas",
  "data": {
    "carpetas": [
      {
        "id_carpeta": 1,
        "no_carpeta_fisica": 1,
        "etiqueta_identificadora": "AUD-2024-001",
        "descripcion": "..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

### 4. Prueba de Obtención de Columnas de Categoría

#### 4.1 Obtener Columnas de Auditoría
```bash
curl -X GET "http://localhost/Programa-Gestion-SDI/api/categorias/1/columnas"
```

**Respuesta Esperada**: `200 OK`
```json
{
  "success": true,
  "message": "Columnas obtenidas",
  "data": {
    "columnas": [
      {
        "id_columna": 1,
        "id_categoria": 1,
        "nombre_campo": "No. Oficio",
        "tipo_dato": "texto_corto",
        "es_obligatorio": 1,
        "orden_visualizacion": 1,
        "longitud_maxima": 255
      },
      {
        "id_columna": 2,
        "id_categoria": 1,
        "nombre_campo": "Seguimiento Oficio",
        "tipo_dato": "texto_corto",
        "es_obligatorio": 0,
        "orden_visualizacion": 2
      },
      ...
    ]
  }
}
```

### 5. Prueba de Registro de Documento con Archivo

#### 5.1 Crear Documento con Archivo Adjunto
```bash
# Crear un archivo de prueba
echo "Contenido de prueba" > documento.txt

# Enviar documento
curl -X POST http://localhost/Programa-Gestion-SDI/api/documentos/crear \
  -F "id_carpeta=1" \
  -F "fecha_documento=2024-01-15" \
  -F "id_categoria=1" \
  -F "valores_dinamicos={\"1\":\"AUD-2024-001\",\"2\":\"SEG-001\",\"3\":\"Auditoría Q1\",\"4\":\"Dirección\",\"5\":\"Descripción del documento\",\"6\":\"Comentarios\"}" \
  -F "archivo=@documento.txt"
```

**Respuesta Esperada**: `201 Created`
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
        "id_valor": 1,
        "id_registro": 1,
        "id_columna": 1,
        "valor_texto": "AUD-2024-001"
      },
      ...
    ],
    "archivos": [
      {
        "id_archivo": 1,
        "id_registro": 1,
        "nombre_base": "doc_1_1705348800",
        "extension_archivo": "txt",
        "tipo_mime": "text/plain",
        "peso_bytes": 20,
        "ruta_almacenamiento": "/public/uploads/doc_1_1705348800.txt"
      }
    ]
  }
}
```

#### 5.2 Crear Documento sin Archivo
```bash
curl -X POST http://localhost/Programa-Gestion-SDI/api/documentos/crear \
  -F "id_carpeta=1" \
  -F "fecha_documento=2024-01-16" \
  -F "id_categoria=1" \
  -F "valores_dinamicos={\"1\":\"AUD-2024-002\",\"4\":\"Dirección\"}"
```

**Respuesta Esperada**: `201 Created` (sin archivos adjuntos)

#### 5.3 Intentar Subir Archivo Demasiado Grande
```bash
# Crear archivo de 11MB
dd if=/dev/zero of=archivo_grande.bin bs=1M count=11

curl -X POST http://localhost/Programa-Gestion-SDI/api/documentos/crear \
  -F "id_carpeta=1" \
  -F "fecha_documento=2024-01-15" \
  -F "id_categoria=1" \
  -F "valores_dinamicos={\"1\":\"AUD-2024-003\"}" \
  -F "archivo=@archivo_grande.bin"
```

**Respuesta Esperada**: `400 Bad Request`
```json
{
  "success": false,
  "message": "El archivo no puede exceder 10MB"
}
```

#### 5.4 Intentar Subir Tipo de Archivo No Permitido
```bash
curl -X POST http://localhost/Programa-Gestion-SDI/api/documentos/crear \
  -F "id_carpeta=1" \
  -F "fecha_documento=2024-01-15" \
  -F "id_categoria=1" \
  -F "valores_dinamicos={\"1\":\"AUD-2024-004\"}" \
  -F "archivo=@script.exe"
```

**Respuesta Esperada**: `400 Bad Request`
```json
{
  "success": false,
  "message": "Tipo de archivo no permitido"
}
```

### 6. Prueba de UI (Frontend)

#### 6.1 Acceder al Módulo
1. Inicia sesión en la aplicación
2. Haz clic en el módulo "Archivo General SDI" en el dashboard
3. Verifica que se carguen dos pestañas: "Crear Carpeta" y "Registrar Documento"

#### 6.2 Crear Carpeta desde UI
1. Llena el formulario de carpeta:
   - No. Carpeta Física: 1
   - Etiqueta: AUD-2024-TEST-001
   - Descripción: Test desde UI
2. Haz clic en "Crear Carpeta"
3. Verifica que aparezca en la lista de carpetas
4. Verifica que el dropdown de documentos se actualice

#### 6.3 Registrar Documento desde UI
1. Cambio a la pestaña "Registrar Documento"
2. Selecciona una carpeta del dropdown
3. Ingresa la fecha
4. Completa los campos dinámicos:
   - No. Oficio: AUD-2024-001
   - Emitido Por: Test
   - Descripción: Test documento
5. Arrastra un PDF al área de drag & drop (o haz clic)
6. Haz clic en "Registrar Documento"
7. Verifica el mensaje de éxito

### 7. Validaciones de Seguridad

#### 7.1 Sin Autenticación
```bash
curl -X POST http://localhost/Programa-Gestion-SDI/api/documentos/crear \
  -F "id_carpeta=1"
```

**Respuesta Esperada**: `401 Unauthorized` o redireccionamiento a login

#### 7.2 Sin Permisos (Rol Insuficiente)
- Usuario con rol "Estudiante SS" intenta crear documento
- Verifica que obtenga error de permisos

### 8. Verificación de Archivos

#### 8.1 Verificar Ubicación de Archivos
```bash
ls -la /xampp/htdocs/Programa-Gestion-SDI/public/uploads/
```

Deberías ver archivos como:
```
doc_1_1705348800.pdf
doc_2_1705348801.pdf
```

#### 8.2 Verificar Contenido en BD
```sql
SELECT * FROM archivos_adjuntos;
SELECT * FROM detalles_valores_documento WHERE id_registro = 1;
```

### 9. Prueba de Rendimiento

#### 9.1 Crear 10 Documentos Rápidamente
```bash
for i in {1..10}; do
  curl -X POST http://localhost/Programa-Gestion-SDI/api/documentos/crear \
    -F "id_carpeta=1" \
    -F "fecha_documento=2024-01-15" \
    -F "id_categoria=1" \
    -F "valores_dinamicos={\"1\":\"AUD-2024-$i\"}"
done
```

Verifica que:
- No haya errores de base de datos
- El servidor responda rápidamente
- Los IDs sean secuenciales y únicos

### 10. Casos Extremos

#### 10.1 Valores Dinámicos Inválidos
```bash
curl -X POST http://localhost/Programa-Gestion-SDI/api/documentos/crear \
  -F "id_carpeta=1" \
  -F "fecha_documento=2024-01-15" \
  -F "id_categoria=1" \
  -F "valores_dinamicos=invalid_json"
```

**Esperado**: Manejo de error graceful

#### 10.2 ID de Carpeta Inválido
```bash
curl -X POST http://localhost/Programa-Gestion-SDI/api/documentos/crear \
  -F "id_carpeta=9999" \
  -F "fecha_documento=2024-01-15" \
  -F "id_categoria=1"
```

**Respuesta Esperada**: `400 Bad Request`

## 📋 Matriz de Prueba

| Caso | Entrada | Esperado | Estado |
|------|---------|----------|--------|
| Crear carpeta válida | Datos completos | 201, carpeta creada | ☐ |
| Carpeta etiqueta duplicada | Etiqueta existente | 400 | ☐ |
| Crear documento con archivo | PDF 2MB | 201, archivo guardado | ☐ |
| Documento archivo > 10MB | Archivo 15MB | 400 | ☐ |
| Documento tipo inválido | .exe | 400 | ☐ |
| Sin autenticación | Sin cookies | 401 | ☐ |
| Campos dinámicos | Valores correctos | 201 | ☐ |
| Drag & drop UI | PDF arrastrado | Se carga | ☐ |

## 🐛 Troubleshooting

### Error: "Carpeta inválida"
- Verifica que el ID de carpeta exista: `SELECT * FROM carpetas_fisicas WHERE id_carpeta = 1;`

### Error: "Tipo de archivo no permitido"
- Verifica que el MIME type sea correcto
- Comprueba la lista en `DocumentoController::guardarArchivoAdjunto()`

### Archivo no se guarda en /uploads
- Verifica permisos de carpeta: `chmod 755 /xampp/htdocs/Programa-Gestion-SDI/public/uploads`
- Comprueba que `APP_ROOT` esté definido correctamente

### Campos dinámicos no aparecen
- Verifica que la categoría "Auditoría" tenga ID 1
- Confirma que haya columnas definidas: `SELECT * FROM conf_columnas_categoria WHERE id_categoria = 1;`

---

**Última actualización**: Enero 2026
