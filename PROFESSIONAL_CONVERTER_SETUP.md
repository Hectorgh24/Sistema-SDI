# SDI Professional Converter - Instalación

Este documento describe cómo instalar y configurar el sistema de conversión profesional con Mammoth.js + Puppeteer.

## Requisitos

### 1. Node.js
- Descargar e instalar Node.js desde: https://nodejs.org/
- Versión recomendada: 18.x o superior
- Verificar instalación: `node --version`

### 2. NPM (incluido con Node.js)
- Verificar instalación: `npm --version`

## Instalación

### Paso 1: Instalar Puppeteer
```bash
# En la raíz del proyecto
npm install puppeteer --save
```

### Paso 2: Verificar instalación
```bash
# Verificar que Puppeteer esté instalado
npm list puppeteer
```

### Paso 3: Probar el sistema
1. Iniciar el servidor web (XAMPP/WAMP)
2. Acceder a la aplicación SDI
3. Ir al módulo Herramientas
4. Seleccionar un archivo Word (.docx)
5. Convertir a PDF

## Flujo Profesional

```
Frontend (JavaScript)          Backend (Node.js/Puppeteer)
     ↓                                ↓
Mammoth.js (traductor)      →  Puppeteer (imprenta)
     ↓                                ↓
HTML (universal)           →  PDF (alta calidad)
```

## Características

### Frontend (Mammoth.js)
- ✅ Traduce .docx a HTML con alta fidelidad
- ✅ Mantiene formato, imágenes y estructura
- ✅ Convierte imágenes a base64
- ✅ CSS profesional para impresión

### Backend (Puppeteer)
- ✅ Renderizado HTML a PDF de alta calidad
- ✅ Soporte completo para CSS y JavaScript
- ✅ Encabezados y pies de página personalizados
- ✅ Control de márgenes y orientación
- ✅ Optimizado para impresión

## Configuración

### Opciones de Puppeteer (configurables)
```javascript
{
    format: 'A4',
    printBackground: true,
    margin: {
        top: '20mm',
        right: '20mm', 
        bottom: '20mm',
        left: '20mm'
    },
    displayHeaderFooter: true,
    headerTemplate: "...",
    footerTemplate: "..."
}
```

### Estilos CSS (personalizables)
El sistema incluye CSS profesional optimizado para:
- Tipografía legible
- Diseño responsive
- Optimización para impresión
- Manejo de imágenes
- Estructura de documentos

## Troubleshooting

### Problema: "Node.js no encontrado"
**Solución:** Instalar Node.js desde https://nodejs.org/

### Problema: "Puppeteer no instalado"
**Solución:** Ejecutar `npm install puppeteer --save`

### Problema: "Error ejecutando Puppeteer"
**Solución:** 
1. Verificar que Node.js esté en el PATH
2. Reinstalar Puppeteer: `npm uninstall puppeteer && npm install puppeteer --save`

### Problema: "PDF vacío o corrupto"
**Solución:**
1. Verificar el HTML generado por Mammoth.js
2. Revisar logs del servidor
3. Probar con un archivo Word simple

## Logs y Debugging

### Logs del Frontend
Consola del navegador - buscar:
- `[CONVERTIDOR]` - Logs del conversor profesional
- `[PUPPETEER]` - Logs de comunicación con backend

### Logs del Backend
Archivo de logs de PHP/XAMPP - buscar:
- `Puppeteer return code`
- `PDF generado: X bytes`
- `Error ejecutando Puppeteer`

## Rendimiento

### Tiempos de conversión aproximados:
- Documento simple (1-2 páginas): 2-5 segundos
- Documento medio (3-10 páginas): 5-15 segundos  
- Documento complejo (10+ páginas, imágenes): 15-30 segundos

### Limitaciones:
- Tamaño máximo: 50MB
- Páginas máximas: 100 (recomendado)
- Tiempo máximo: 60 segundos (timeout)

## Alternativas

Si Puppeteer no está disponible, el sistema automáticamente usa:
1. DomPDF (si está instalado)
2. TCPDF (si está instalado)  
3. Sistema nativo (básico pero funcional)

## Soporte

Para problemas técnicos:
1. Revisar logs detallados
2. Verificar instalación de Node.js y Puppeteer
3. Probar con archivos Word simples
4. Contactar al equipo de desarrollo SDI
