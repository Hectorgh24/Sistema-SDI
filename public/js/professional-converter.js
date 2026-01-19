/**
 * Conversión Profesional Word a PDF con Mammoth.js + Puppeteer
 * 
 * Flujo profesional:
 * 1. Frontend: Mammoth.js traduce .docx a HTML
 * 2. Backend: Puppeteer convierte HTML a PDF de alta calidad
 * 
 * @author SDI Development Team
 * @version 3.0 - Profesional
 */

class ProfessionalWordToPDFConverter {
    constructor() {
        this.isMammothLoaded = false;
        this.init();
    }
    
    /**
     * Inicializar el conversor profesional
     */
    async init() {
        try {
            // Cargar Mammoth.js desde CDN
            await this.loadMammoth();
            this.isMammothLoaded = true;
            console.log('[CONVERTIDOR] Mammoth.js cargado exitosamente');
        } catch (error) {
            console.error('[CONVERTIDOR] Error cargando Mammoth.js:', error);
            this.showMessage('Error cargando herramientas de conversión', 'error');
        }
    }
    
    /**
     * Cargar Mammoth.js dinámicamente
     */
    loadMammoth() {
        return new Promise((resolve, reject) => {
            if (window.mammoth) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    /**
     * Convertir archivo Word a PDF profesionalmente
     */
    async convertWordToPDF(file) {
        console.log('[CONVERTIDOR] Iniciando conversión profesional');
        console.log('[CONVERTIDOR] Archivo:', file.name, 'Tamaño:', this.formatBytes(file.size));
        
        try {
            // Validar archivo
            this.validateWordFile(file);
            
            // Paso 1: Extraer HTML con Mammoth.js
            console.log('[CONVERTIDOR] Paso 1: Extrayendo HTML con Mammoth.js...');
            const htmlContent = await this.extractHTMLWithMammoth(file);
            console.log('[CONVERTIDOR] HTML extraído:', htmlContent.length, 'caracteres');
            
            // Paso 2: Enviar HTML al backend para conversión con Puppeteer
            console.log('[CONVERTIDOR] Paso 2: Enviando al backend para conversión Puppeteer...');
            const pdfData = await this.convertHTMLToPDFWithPuppeteer(htmlContent, file.name);
            
            // Paso 3: Descargar PDF
            console.log('[CONVERTIDOR] Paso 3: Descargando PDF generado...');
            this.downloadPDF(pdfData, file.name);
            
            this.showMessage('Documento convertido exitosamente', 'success');
            
        } catch (error) {
            console.error('[CONVERTIDOR] Error en conversión:', error);
            this.showMessage(`Error: ${error.message}`, 'error');
            throw error;
        }
    }
    
    /**
     * Validar archivo Word
     */
    validateWordFile(file) {
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword'
        ];
        
        if (!validTypes.includes(file.type)) {
            throw new Error('Tipo de archivo no válido. Solo se aceptan documentos Word (.docx, .doc)');
        }
        
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            throw new Error('El archivo es demasiado grande. Máximo permitido: 50MB');
        }
    }
    
    /**
     * Extraer HTML usando Mammoth.js
     */
    async extractHTMLWithMammoth(file) {
        if (!this.isMammothLoaded) {
            throw new Error('Mammoth.js no está cargado');
        }
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (event) => {
                try {
                    const arrayBuffer = event.target.result;
                    
                    // Configurar opciones de Mammoth para mejor conversión
                    const options = {
                        styleMap: [
                            "p[style-name='Heading 1'] => h1:fresh",
                            "p[style-name='Heading 2'] => h2:fresh",
                            "p[style-name='Heading 3'] => h3:fresh",
                            "p[style-name='Title'] => h1.title:fresh",
                            "p[style-name='Subtitle'] => h2.subtitle:fresh",
                            "r[style-name='Strong'] => strong",
                            "r[style-name='Emphasis'] => em"
                        ],
                        convertImage: mammoth.images.imgElement(function(image) {
                            return image.read("base64").then(function(imageBuffer) {
                                return {
                                    src: "data:" + image.contentType + ";base64," + imageBuffer
                                };
                            });
                        }),
                        ignoreEmptyParagraphs: false
                    };
                    
                    // Extraer HTML con Mammoth
                    const result = await mammoth.convertToHtml(arrayBuffer, options);
                    
                    // Mejorar el HTML generado
                    const enhancedHTML = this.enhanceHTML(result.value);
                    
                    resolve(enhancedHTML);
                    
                } catch (error) {
                    reject(new Error(`Error extrayendo HTML: ${error.message}`));
                }
            };
            
            reader.onerror = () => reject(new Error('Error leyendo el archivo'));
            reader.readAsArrayBuffer(file);
        });
    }
    
    /**
     * Mejorar HTML generado por Mammoth
     */
    enhanceHTML(html) {
        // Envolver en estructura HTML completa
        const enhancedHTML = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Documento Convertido</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 100%;
            margin: 0;
            padding: 40px;
            background: white;
        }
        
        h1, h2, h3, h4, h5, h6 {
            color: #2c3e50;
            margin-top: 24px;
            margin-bottom: 16px;
            page-break-after: avoid;
        }
        
        h1 { font-size: 28px; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { font-size: 22px; border-bottom: 1px solid #ecf0f1; padding-bottom: 8px; }
        h3 { font-size: 18px; color: #34495e; }
        
        p {
            margin-bottom: 12px;
            text-align: justify;
            orphans: 3;
            widows: 3;
        }
        
        img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 20px auto;
            page-break-inside: avoid;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            page-break-inside: avoid;
        }
        
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        
        th {
            background-color: #f8f9fa;
            font-weight: bold;
            color: #2c3e50;
        }
        
        ul, ol {
            margin-bottom: 16px;
            padding-left: 30px;
        }
        
        li {
            margin-bottom: 6px;
        }
        
        strong, b {
            color: #2c3e50;
            font-weight: 600;
        }
        
        em, i {
            color: #7f8c8d;
            font-style: italic;
        }
        
        a {
            color: #3498db;
            text-decoration: none;
        }
        
        a:hover {
            text-decoration: underline;
        }
        
        blockquote {
            border-left: 4px solid #3498db;
            margin: 20px 0;
            padding: 10px 20px;
            background-color: #f8f9fa;
            font-style: italic;
            color: #7f8c8d;
        }
        
        code {
            background-color: #f8f9fa;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
        
        pre {
            background-color: #f8f9fa;
            padding: 16px;
            border-radius: 4px;
            overflow-x: auto;
            border: 1px solid #e9ecef;
        }
        
        pre code {
            background: none;
            padding: 0;
        }
        
        .page-break {
            page-break-before: always;
        }
        
        @media print {
            body { padding: 20px; }
            img { max-width: 100% !important; }
            .page-break { page-break-before: always; }
        }
        
        @media screen {
            body { 
                background: #f5f5f5; 
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
                border-radius: 8px;
                margin: 20px auto;
                max-width: 800px;
            }
        }
    </style>
</head>
<body>
    ${html}
</body>
</html>`;
        
        return enhancedHTML.trim();
    }
    
    /**
     * Convertir HTML a PDF con Puppeteer (backend)
     */
    async convertHTMLToPDFWithPuppeteer(htmlContent, originalFileName) {
        console.log('[PUPPETEER] Enviando HTML al backend...');
        
        const payload = {
            html: htmlContent,
            fileName: originalFileName,
            options: {
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20mm',
                    right: '20mm',
                    bottom: '20mm',
                    left: '20mm'
                },
                preferCSSPageSize: true,
                displayHeaderFooter: true,
                headerTemplate: `
                    <div style="font-size:10px; color:#666; text-align:center; width:100%;">
                        ${originalFileName} - Página <span class="pageNumber"></span> de <span class="totalPages"></span>
                    </div>
                `,
                footerTemplate: `
                    <div style="font-size:8px; color:#999; text-align:center; width:100%;">
                        Generado por SDI Professional Converter - ${new Date().toLocaleString()}
                    </div>
                `
            }
        };
        
        try {
            const response = await fetch('/api/professional/word-to-pdf-puppeteer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error del servidor (${response.status}): ${errorText}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Error en la conversión');
            }
            
            console.log('[PUPPETEER] PDF generado exitosamente:', result.data.size, 'bytes');
            return result.data;
            
        } catch (error) {
            console.error('[PUPPETEER] Error:', error);
            throw new Error(`Error en conversión Puppeteer: ${error.message}`);
        }
    }
    
    /**
     * Descargar PDF generado
     */
    downloadPDF(pdfData, originalFileName) {
        const base64Data = pdfData.content;
        const pdfFileName = originalFileName.replace(/\.[^/.]+$/, '') + '_convertido.pdf';
        
        try {
            // Decodificar base64
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            // Crear blob y descargar
            const blob = new Blob([bytes], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = pdfFileName;
            a.style.display = 'none';
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            window.URL.revokeObjectURL(url);
            
            console.log('[CONVERTIDOR] PDF descargado:', pdfFileName);
            
        } catch (error) {
            throw new Error(`Error descargando PDF: ${error.message}`);
        }
    }
    
    /**
     * Mostrar mensaje al usuario
     */
    showMessage(message, type = 'info') {
        // Usar el sistema de toast existente
        if (typeof mostrarToastHerramientas === 'function') {
            const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
            mostrarToastHerramientas(`${icon} ${message}`, type);
        } else {
            // Fallback a console/alert
            console.log(`[${type.toUpperCase()}] ${message}`);
            if (type === 'error') {
                alert(message);
            }
        }
    }
    
    /**
     * Formatear bytes para lectura humana
     */
    formatBytes(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        const threshold = 1024;
        
        for (let i = 0; i < units.length; i++) {
            if (bytes < threshold * (i + 1)) {
                return (bytes / Math.pow(threshold, i)).toFixed(1) + ' ' + units[i];
            }
        }
        
        return bytes + ' B';
    }
}

// Exportar para uso global
window.ProfessionalWordToPDFConverter = ProfessionalWordToPDFConverter;
