<?php

namespace App\Controllers;

/**
 * Controlador de Conversión Profesional con Puppeteer
 * 
 * Integra Mammoth.js (frontend) + Puppeteer (backend)
 * para conversión de Word a PDF de alta calidad
 * 
 * @author SDI Development Team
 * @version 3.0 - Profesional
 */

class ProfessionalConversionController {
    
    /**
     * Convertir HTML a PDF usando Puppeteer
     */
    public function wordToPdfWithPuppeteer() {
        header('Content-Type: application/json');
        
        try {
            // Validar método
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                throw new Exception('Método no permitido');
            }
            
            // Obtener datos JSON
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                throw new Exception('Datos JSON inválidos');
            }
            
            // Validar datos requeridos
            $html = $input['html'] ?? '';
            $fileName = $input['fileName'] ?? 'documento';
            $options = $input['options'] ?? [];
            
            if (empty($html)) {
                throw new Exception('HTML es requerido');
            }
            
            // Validar HTML básico
            if (strpos($html, '<html') === false) {
                throw new Exception('HTML inválido o incompleto');
            }
            
            // Generar PDF con Puppeteer
            $pdfData = $this->generatePDFWithPuppeteer($html, $fileName, $options);
            
            // Responder éxito
            response(true, 'PDF generado exitosamente', $pdfData, 200);
            
        } catch (Exception $e) {
            error_log("Error en conversión Puppeteer: " . $e->getMessage());
            response(false, $e->getMessage(), null, 500);
        }
    }
    
    /**
     * Generar PDF usando Puppeteer
     */
    private function generatePDFWithPuppeteer($html, $fileName, $options = []) {
        try {
            error_log("Iniciando generación PDF con Puppeteer");
            error_log("HTML length: " . strlen($html) . " caracteres");
            error_log("FileName: " . $fileName);
            
            // Crear directorio temporal
            $tempDir = sys_get_temp_dir() . '/sdi_puppeteer_' . uniqid();
            if (!mkdir($tempDir, 0755, true)) {
                throw new Exception('No se pudo crear directorio temporal');
            }
            
            try {
                // Guardar HTML temporal
                $htmlFile = $tempDir . '/document.html';
                $pdfFile = $tempDir . '/document.pdf';
                
                if (file_put_contents($htmlFile, $html) === false) {
                    throw new Exception('No se pudo guardar archivo HTML temporal');
                }
                
                error_log("HTML guardado en: $htmlFile");
                
                // Generar PDF con Puppeteer
                $this->executePuppeteer($htmlFile, $pdfFile, $options);
                
                // Verificar que se generó el PDF
                if (!file_exists($pdfFile)) {
                    throw new Exception('No se pudo generar el archivo PDF');
                }
                
                $pdfSize = filesize($pdfFile);
                error_log("PDF generado: $pdfSize bytes");
                
                if ($pdfSize < 1000) {
                    error_log("ADVERTENCIA: PDF parece muy pequeño ($pdfSize bytes)");
                }
                
                // Leer PDF y codificar
                $pdfContent = file_get_contents($pdfFile);
                if ($pdfContent === false) {
                    throw new Exception('No se pudo leer el archivo PDF generado');
                }
                
                // Preparar respuesta
                $pdfData = [
                    'content' => base64_encode($pdfContent),
                    'fileName' => $fileName,
                    'size' => $pdfSize,
                    'generatedAt' => date('Y-m-d H:i:s'),
                    'method' => 'puppeteer'
                ];
                
                // Limpiar archivos temporales
                $this->cleanupTempFiles($tempDir);
                
                return $pdfData;
                
            } finally {
                // Asegurar limpieza
                $this->cleanupTempFiles($tempDir);
            }
            
        } catch (Exception $e) {
            error_log("Error generando PDF con Puppeteer: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Ejecutar Puppeteer para generar PDF
     */
    private function executePuppeteer($htmlFile, $pdfFile, $options = []) {
        try {
            // Detectar sistema operativo
            $isWindows = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';
            
            // Configurar opciones por defecto
            $defaultOptions = [
                'format' => 'A4',
                'printBackground' => true,
                'margin' => [
                    'top' => '20mm',
                    'right' => '20mm',
                    'bottom' => '20mm',
                    'left' => '20mm'
                ]
            ];
            
            $options = array_merge($defaultOptions, $options);
            
            // Construir comando Puppeteer
            $scriptContent = $this->buildPuppeteerScript($htmlFile, $pdfFile, $options);
            $scriptFile = dirname($htmlFile) . '/puppeteer-script.js';
            
            error_log("Creando script Puppeteer en: $scriptFile");
            
            if (file_put_contents($scriptFile, $scriptContent) === false) {
                throw new Exception('No se pudo crear script de Puppeteer');
            }
            
            error_log("Script Puppeteer creado correctamente");
            error_log("Tamaño del script: " . strlen($scriptContent) . " bytes");
            
            // Ejecutar comando
            $command = $this->buildPuppeteerCommand($scriptFile, $isWindows);
            
            error_log("Ejecutando Puppeteer: $command");
            
            $output = [];
            $returnCode = 0;
            
            exec($command, $output, $returnCode);
            
            error_log("Puppeteer return code: $returnCode");
            error_log("Puppeteer output: " . implode("\n", $output));
            
            if ($returnCode !== 0) {
                $errorMsg = "Error ejecutando Puppeteer (código: $returnCode)";
                if (!empty($output)) {
                    $errorMsg .= ". Output: " . implode("\n", $output);
                }
                throw new Exception($errorMsg);
            }
            
        } catch (Exception $e) {
            error_log("Error ejecutando Puppeteer: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Construir script de Puppeteer
     */
    private function buildPuppeteerScript($htmlFile, $pdfFile, $options) {
        $margin = $options['margin'] ?? [];
        $marginTop = $margin['top'] ?? '20mm';
        $marginRight = $margin['right'] ?? '20mm';
        $marginBottom = $margin['bottom'] ?? '20mm';
        $marginLeft = $margin['left'] ?? '20mm';
        
        $format = $options['format'] ?? 'A4';
        $printBackground = $options['printBackground'] ?? true;
        $preferCSSPageSize = $options['preferCSSPageSize'] ?? false;
        
        $headerTemplate = $options['headerTemplate'] ?? '';
        $footerTemplate = $options['footerTemplate'] ?? '';
        $displayHeaderFooter = !empty($headerTemplate) || !empty($footerTemplate);
        
        $script = "
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    try {
        console.log('Iniciando Puppeteer...');
        
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu'
            ]
        });
        
        console.log('Navegador iniciado');
        
        const page = await browser.newPage();
        
        // Configurar página
        await page.setViewport({
            width: 1200,
            height: 800,
            deviceScaleFactor: 1
        });
        
        console.log('Cargando HTML...');
        
        // Cargar archivo HTML
        const htmlPath = path.resolve('$htmlFile');
        const htmlContent = fs.readFileSync(htmlPath, 'utf8');
        
        // Establecer contenido HTML
        await page.setContent(htmlContent, {
            waitUntil: ['networkidle0', 'domcontentloaded'],
            timeout: 30000
        });
        
        console.log('HTML cargado, generando PDF...');
        
        // Opciones de PDF
        const pdfOptions = {
            path: '$pdfFile',
            format: '$format',
            printBackground: " . ($printBackground ? 'true' : 'false') . ",
            margin: {
                top: '$marginTop',
                right: '$marginRight',
                bottom: '$marginBottom',
                left: '$marginLeft'
            },
            preferCSSPageSize: " . ($preferCSSPageSize ? 'true' : 'false') . ",
            displayHeaderFooter: " . ($displayHeaderFooter ? 'true' : 'false');
        ";
        
        if ($displayHeaderFooter) {
            $script .= "
            headerTemplate: `" . addslashes($headerTemplate) . "`,
            footerTemplate: `" . addslashes($footerTemplate) . "`,
            ";
        }
        
        $script .= "
        };
        
        // Generar PDF
        await page.pdf(pdfOptions);
        
        console.log('PDF generado exitosamente');
        
        await browser.close();
        
        console.log('Proceso completado');
        process.exit(0);
        
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
})();
";
        
        return $script;
    }
    
    /**
     * Construir comando para ejecutar Puppeteer
     */
    private function buildPuppeteerCommand($scriptFile, $isWindows) {
        // Obtener el directorio del proyecto
        $projectDir = dirname(__DIR__, 2); // Subir dos niveles desde controllers
        
        if ($isWindows) {
            // Windows: Usar node desde el directorio del proyecto
            return "cd \"$projectDir\" && node \"$scriptFile\" 2>&1";
        } else {
            // Linux/Mac: Usar node desde el directorio del proyecto
            return "cd \"$projectDir\" && node \"$scriptFile\" 2>&1";
        }
    }
    
    /**
     * Limpiar archivos temporales
     */
    private function cleanupTempFiles($tempDir) {
        try {
            if (is_dir($tempDir)) {
                $files = glob($tempDir . '/*');
                foreach ($files as $file) {
                    if (is_file($file)) {
                        unlink($file);
                    }
                }
                rmdir($tempDir);
                error_log("Directorio temporal limpiado: $tempDir");
            }
        } catch (Exception $e) {
            error_log("Error limpiando archivos temporales: " . $e->getMessage());
        }
    }
    
    /**
     * Verificar si Puppeteer está disponible
     */
    public function checkPuppeteerAvailability() {
        header('Content-Type: application/json');
        
        try {
            // Verificar Node.js
            $nodeVersion = shell_exec('node --version 2>&1');
            $hasNode = strpos($nodeVersion, 'v') === 0;
            
            // Verificar Puppeteer
            $puppeteerCheck = shell_exec('npm list puppeteer 2>&1');
            $hasPuppeteer = strpos($puppeteerCheck, 'puppeteer') !== false;
            
            $availability = [
                'node' => [
                    'available' => $hasNode,
                    'version' => trim($nodeVersion)
                ],
                'puppeteer' => [
                    'available' => $hasPuppeteer,
                    'installed' => $hasPuppeteer
                ],
                'ready' => $hasNode && $hasPuppeteer
            ];
            
            response(true, 'Disponibilidad verificada', $availability, 200);
            
        } catch (Exception $e) {
            response(false, $e->getMessage(), null, 500);
        }
    }
    
    /**
     * Instalar Puppeteer si no está disponible
     */
    public function installPuppeteer() {
        header('Content-Type: application/json');
        
        try {
            // Verificar Node.js
            $nodeVersion = shell_exec('node --version 2>&1');
            if (strpos($nodeVersion, 'v') !== 0) {
                throw new Exception('Node.js no está instalado');
            }
            
            // Instalar Puppeteer
            $command = 'npm install puppeteer --save 2>&1';
            $output = [];
            $returnCode = 0;
            
            exec($command, $output, $returnCode);
            
            if ($returnCode !== 0) {
                throw new Exception('Error instalando Puppeteer: ' . implode("\n", $output));
            }
            
            response(true, 'Puppeteer instalado exitosamente', [
                'output' => $output,
                'node_version' => trim($nodeVersion)
            ], 200);
            
        } catch (Exception $e) {
            response(false, $e->getMessage(), null, 500);
        }
    }
}
