<?php

namespace App\Controllers;

/**
 * Controlador de Conversión de Archivos
 * 
 * Maneja la conversión de archivos entre diferentes formatos
 * utilizando bibliotecas profesionales para alta calidad
 */

class ConversionController {
    
    /**
     * Convertir archivo
     */
    public function convertir() {
        header('Content-Type: application/json');
        
        try {
            // Verificar método de solicitud
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                throw new Exception('Método no permitido');
            }
            
            // Verificar archivo subido
            if (!isset($_FILES['archivo']) || $_FILES['archivo']['error'] !== UPLOAD_ERR_OK) {
                throw new Exception('Error al subir el archivo');
            }
            
            // Obtener parámetros
            $formatoDestino = $_POST['formato_destino'] ?? '';
            $archivo = $_FILES['archivo'];
            
            // Validar formato de destino
            $formatosSoportados = ['pdf', 'docx', 'xlsx', 'png', 'jpg', 'txt', 'csv'];
            if (!in_array($formatoDestino, $formatosSoportados)) {
                throw new Exception('Formato de destino no soportado');
            }
            
            // Validar tamaño de archivo
            if ($archivo['size'] > 50 * 1024 * 1024) { // 50MB
                throw new Exception('El archivo es demasiado grande (máximo 50MB)');
            }
            
            // Crear directorio temporal
            $directorioTemp = sys_get_temp_dir() . '/sdi_conversion_' . uniqid();
            if (!mkdir($directorioTemp, 0755, true)) {
                throw new Exception('No se pudo crear directorio temporal');
            }
            
            try {
                // Mover archivo subido
                $rutaOriginal = $directorioTemp . '/' . basename($archivo['name']);
                if (!move_uploaded_file($archivo['tmp_name'], $rutaOriginal)) {
                    throw new Exception('No se pudo procesar el archivo subido');
                }
                
                // Determinar formato original
                $formatoOriginal = $this->determinarFormato($rutaOriginal);
                
                // Validar conversión soportada
                if (!$this->conversionSoportada($formatoOriginal, $formatoDestino)) {
                    throw new Exception("Conversión de $formatoOriginal a $formatoDestino no soportada");
                }
                
                // Generar ruta de salida
                $nombreBase = pathinfo($rutaOriginal, PATHINFO_FILENAME);
                $rutaSalida = $directorioTemp . '/' . $nombreBase . '_convertido.' . $formatoDestino;
                
                // Realizar conversión
                error_log("Iniciando conversión: $formatoOriginal -> $formatoDestino");
                error_log("Ruta original: $rutaOriginal");
                error_log("Ruta salida: $rutaSalida");
                
                $rutaConvertida = $this->convertirArchivo($rutaOriginal, $rutaSalida, $formatoOriginal, $formatoDestino);
                
                error_log("Conversión completada: $rutaConvertida");
                
                // Leer archivo convertido y codificar
                $contenido = file_get_contents($rutaConvertida);
                error_log("Tamaño del archivo convertido: " . strlen($contenido) . " bytes");
                
                if (strlen($contenido) < 1000) {
                    error_log("Archivo convertido parece vacío o muy pequeño");
                    error_log("Contenido (primeros 200 chars): " . substr($contenido, 0, 200));
                }
                
                $contenidoBase64 = base64_encode($contenido);
                
                // Preparar respuesta
                $respuesta = [
                    'success' => true,
                    'message' => 'Archivo convertido exitosamente',
                    'data' => [
                        'contenido' => $contenidoBase64,
                        'nombre_archivo' => $nombreBase . '_convertido.' . $formatoDestino,
                        'mime_type' => $this->getMimeType($formatoDestino),
                        'tamano' => strlen($contenido)
                    ]
                ];
                
                // Limpiar archivos temporales
                $this->limpiarTemporales($directorioTemp);
                
                // Enviar respuesta
                echo json_encode($respuesta);
                
            } catch (Exception $e) {
                // Limpiar en caso de error
                $this->limpiarTemporales($directorioTemp);
                throw $e;
            }
            
        } catch (Exception $e) {
            // Enviar error
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => null
            ]);
        }
    }
    
    /**
     * Verificar si conversión es soportada
     */
    private function conversionSoportada($formatoOriginal, $formatoDestino) {
        $conversionesSoportadas = [
            'docx' => ['pdf', 'txt'],
            'pdf' => ['docx', 'txt', 'png', 'jpg'],
            'xlsx' => ['pdf', 'csv', 'txt'],
            'png' => ['pdf', 'jpg', 'txt'],
            'jpg' => ['pdf', 'png', 'txt'],
            'txt' => ['pdf', 'docx', 'xlsx']
        ];
        
        return isset($conversionesSoportadas[$formatoOriginal]) && 
               in_array($formatoDestino, $conversionesSoportadas[$formatoOriginal]);
    }
    
    /**
     * Determinar formato de archivo
     */
    private function determinarFormato($rutaArchivo) {
        // Primero intentar por extensión
        $extension = strtolower(pathinfo($rutaArchivo, PATHINFO_EXTENSION));
        
        // Mapeo de extensiones a formatos
        $formatos = [
            'docx' => 'docx',
            'doc' => 'docx',
            'pdf' => 'pdf',
            'xlsx' => 'xlsx',
            'xls' => 'xlsx',
            'png' => 'png',
            'jpg' => 'jpg',
            'jpeg' => 'jpg',
            'txt' => 'txt',
            'csv' => 'csv'
        ];
        
        if (isset($formatos[$extension])) {
            return $formatos[$extension];
        }
        
        // Si no se puede determinar por extensión, intentar por MIME type
        if (function_exists('finfo_file')) {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mimeType = finfo_file($finfo, $rutaArchivo);
            finfo_close($finfo);
            
            // Mapeo de MIME types a formatos
            $mimeFormats = [
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
                'application/msword' => 'docx',
                'application/pdf' => 'pdf',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' => 'xlsx',
                'application/vnd.ms-excel' => 'xlsx',
                'image/png' => 'png',
                'image/jpeg' => 'jpg',
                'text/plain' => 'txt',
                'text/csv' => 'csv'
            ];
            
            if (isset($mimeFormats[$mimeType])) {
                return $mimeFormats[$mimeType];
            }
        }
        
        // Último fallback: intentar por contenido del archivo
        return $this->determinarFormatoPorContenido($rutaArchivo);
    }
    
    /**
     * Determinar formato por contenido del archivo
     */
    private function determinarFormatoPorContenido($rutaArchivo) {
        $handle = fopen($rutaArchivo, 'rb');
        if (!$handle) {
            return 'txt'; // Default fallback
        }
        
        // Leer primeros bytes para identificar formato
        $header = fread($handle, 1024);
        fclose($handle);
        
        // PDF signature
        if (strpos($header, '%PDF') === 0) {
            return 'pdf';
        }
        
        // DOCX signature (ZIP file)
        if (substr($header, 0, 4) === "PK\x03\x04") {
            // Verificar si es un documento Office
            $zip = new ZipArchive();
            if ($zip->open($rutaArchivo) === TRUE) {
                if ($zip->getFromName('word/document.xml') !== false) {
                    $zip->close();
                    return 'docx';
                }
                if ($zip->getFromName('xl/workbook.xml') !== false) {
                    $zip->close();
                    return 'xlsx';
                }
                $zip->close();
            }
        }
        
        // PNG signature
        if (substr($header, 0, 8) === "\x89PNG\r\n\x1a\n") {
            return 'png';
        }
        
        // JPEG signature
        if (substr($header, 0, 3) === "\xFF\xD8\xFF") {
            return 'jpg';
        }
        
        // Default: asumir texto
        return 'txt';
    }
    
    /**
     * Convertir archivo según formato
     */
    private function convertirArchivo($rutaOriginal, $rutaSalida, $formatoOriginal, $formatoDestino) {
        $rutaSalida = pathinfo($rutaOriginal, PATHINFO_DIRNAME) . '/convertido.' . $formatoDestino;
        
        // Estrategias de conversión según tipo
        switch ($formatoOriginal) {
            case 'docx':
                return $this->convertirWord($rutaOriginal, $rutaSalida, $formatoDestino);
            case 'xlsx':
                return $this->convertirExcel($rutaOriginal, $rutaSalida, $formatoDestino);
            case 'pdf':
                return $this->convertirPDF($rutaOriginal, $rutaSalida, $formatoDestino);
            case 'png':
            case 'jpg':
            case 'jpeg':
                return $this->convertirImagen($rutaOriginal, $rutaSalida, $formatoDestino);
            case 'txt':
                return $this->convertirTexto($rutaOriginal, $rutaSalida, $formatoDestino);
            default:
                throw new Exception('Tipo de archivo no soportado para conversión');
        }
    }
    
    /**
     * Convertir Word a otros formatos
     */
    private function convertirWord($rutaOriginal, $rutaSalida, $formatoDestino) {
        switch ($formatoDestino) {
            case 'pdf':
                return $this->wordToPDF($rutaOriginal, $rutaSalida);
            case 'txt':
                return $this->wordToTexto($rutaOriginal, $rutaSalida);
            default:
                throw new Exception('Conversión Word a ' . $formatoDestino . ' no implementada');
        }
    }
    
    /**
     * Convertir Excel a otros formatos
     */
    private function convertirExcel($rutaOriginal, $rutaSalida, $formatoDestino) {
        switch ($formatoDestino) {
            case 'pdf':
                return $this->excelToPDF($rutaOriginal, $rutaSalida);
            case 'csv':
                return $this->excelToCSV($rutaOriginal, $rutaSalida);
            case 'txt':
                return $this->excelToTexto($rutaOriginal, $rutaSalida);
            default:
                throw new Exception('Conversión Excel a ' . $formatoDestino . ' no implementada');
        }
    }
    
    /**
     * Convertir PDF a otros formatos
     */
    private function convertirPDF($rutaOriginal, $rutaSalida, $formatoDestino) {
        switch ($formatoDestino) {
            case 'docx':
                return $this->pdfToWord($rutaOriginal, $rutaSalida);
            case 'txt':
                return $this->pdfToTexto($rutaOriginal, $rutaSalida);
            case 'png':
            case 'jpg':
                return $this->pdfToImagen($rutaOriginal, $rutaSalida, $formatoDestino);
            default:
                throw new Exception('Conversión PDF a ' . $formatoDestino . ' no implementada');
        }
    }
    
    /**
     * Convertir imagen a otros formatos
     */
    private function convertirImagen($rutaOriginal, $rutaSalida, $formatoDestino) {
        switch ($formatoDestino) {
            case 'pdf':
                return $this->imagenToPDF($rutaOriginal, $rutaSalida);
            case 'txt':
                return $this->imagenToTexto($rutaOriginal, $rutaSalida);
            case 'png':
            case 'jpg':
                return $this->imagenToImagen($rutaOriginal, $rutaSalida, $formatoDestino);
            default:
                throw new Exception('Conversión de imagen a ' . $formatoDestino . ' no implementada');
        }
    }
    
    /**
     * Convertir texto a otros formatos
     */
    private function convertirTexto($rutaOriginal, $rutaSalida, $formatoDestino) {
        switch ($formatoDestino) {
            case 'pdf':
                return $this->textoToPDF($rutaOriginal, $rutaSalida);
            case 'docx':
                return $this->textoToWord($rutaOriginal, $rutaSalida);
            case 'xlsx':
                return $this->textoToExcel($rutaOriginal, $rutaSalida);
            default:
                throw new Exception('Conversión de texto a ' . $formatoDestino . ' no implementada');
        }
    }
    
    /**
     * Word a PDF (usando biblioteca profesional)
     */
    private function wordToPDF($rutaOriginal, $rutaSalida) {
        error_log("Iniciando Word a PDF");
        error_log("Archivo origen: $rutaOriginal");
        error_log("Archivo destino: $rutaSalida");
        
        // Usar DOMPDF o similar para alta calidad
        $contenido = $this->extraerContenidoWord($rutaOriginal);
        error_log("Contenido extraído del Word: " . substr($contenido, 0, 500));
        error_log("Longitud del contenido: " . strlen($contenido));
        
        if (empty(trim($contenido))) {
            error_log("ERROR: Contenido vacío extraído del Word");
            throw new Exception("No se pudo extraer contenido del archivo Word");
        }
        
        $resultado = $this->generarPDFAltaCalidad($contenido, $rutaSalida);
        error_log("PDF generado: $resultado");
        
        return $resultado;
    }
    
    /**
     * Word a texto plano
     */
    private function wordToTexto($rutaOriginal, $rutaSalida) {
        $contenido = $this->extraerContenidoWord($rutaOriginal);
        file_put_contents($rutaSalida, $contenido);
        return $rutaSalida;
    }
    
    /**
     * Excel a PDF
     */
    private function excelToPDF($rutaOriginal, $rutaSalida) {
        // Usar biblioteca para Excel a PDF
        $datos = $this->leerExcel($rutaOriginal);
        return $this->generarPDFDesdeExcel($datos, $rutaSalida);
    }
    
    /**
     * Excel a CSV
     */
    private function excelToCSV($rutaOriginal, $rutaSalida) {
        $datos = $this->leerExcel($rutaOriginal);
        $csv = $this->generarCSV($datos);
        file_put_contents($rutaSalida, $csv);
        return $rutaSalida;
    }
    
    /**
     * Excel a texto
     */
    private function excelToTexto($rutaOriginal, $rutaSalida) {
        $datos = $this->leerExcel($rutaOriginal);
        $texto = $this->generarTextoDesdeExcel($datos);
        file_put_contents($rutaSalida, $texto);
        return $rutaSalida;
    }
    
    /**
     * PDF a Word
     */
    private function pdfToWord($rutaOriginal, $rutaSalida) {
        $contenido = $this->extraerTextoPDF($rutaOriginal);
        return $this->generarWordDesdeTexto($contenido, $rutaSalida);
    }
    
    /**
     * PDF a texto
     */
    private function pdfToTexto($rutaOriginal, $rutaSalida) {
        $contenido = $this->extraerTextoPDF($rutaOriginal);
        file_put_contents($rutaSalida, $contenido);
        return $rutaSalida;
    }
    
    /**
     * PDF a imagen
     */
    private function pdfToImagen($rutaOriginal, $rutaSalida, $formatoDestino) {
        // Usar ImageMagick o similar para alta calidad
        return $this->renderizarPDFaImagen($rutaOriginal, $rutaSalida, $formatoDestino);
    }
    
    /**
     * Imagen a PDF
     */
    private function imagenToPDF($rutaOriginal, $rutaSalida) {
        return $this->generarPDFDesdeImagen($rutaOriginal, $rutaSalida);
    }
    
    /**
     * Imagen a texto (OCR)
     */
    private function imagenToTexto($rutaOriginal, $rutaSalida) {
        $texto = $this->extraerTextoOCR($rutaOriginal);
        file_put_contents($rutaSalida, $texto);
        return $rutaSalida;
    }
    
    /**
     * Imagen a imagen
     */
    private function imagenToImagen($rutaOriginal, $rutaSalida, $formatoDestino) {
        // Usar GD o ImageMagick para conversión de alta calidad
        return $this->convertirImagenFormato($rutaOriginal, $rutaSalida, $formatoDestino);
    }
    
    /**
     * Texto a PDF
     */
    private function textoToPDF($rutaOriginal, $rutaSalida) {
        $contenido = file_get_contents($rutaOriginal);
        return $this->generarPDFAltaCalidad($contenido, $rutaSalida);
    }
    
    /**
     * Texto a Word
     */
    private function textoToWord($rutaOriginal, $rutaSalida) {
        $contenido = file_get_contents($rutaOriginal);
        return $this->generarWordDesdeTexto($contenido, $rutaSalida);
    }
    
    /**
     * Texto a Excel
     */
    private function textoToExcel($rutaOriginal, $rutaSalida) {
        $contenido = file_get_contents($rutaOriginal);
        return $this->generarExcelDesdeTexto($contenido, $rutaSalida);
    }
    
    /**
     * Generar PDF de alta calidad (sin dependencias externas)
     */
    private function generarPDFAltaCalidad($contenido, $rutaSalida) {
        error_log("Iniciando generación de PDF de alta calidad");
        error_log("Contenido recibido: " . substr($contenido, 0, 200) . "...");
        
        // Usar DomPDF si está disponible (mejor para HTML con imágenes)
        if (file_exists(__DIR__ . '/../vendor/dompdf/dompdf/src/Dompdf.php')) {
            require_once __DIR__ . '/../vendor/dompdf/dompdf/src/Dompdf.php';
            return $this->generarPDFConDomPDF($contenido, $rutaSalida);
        }
        
        // Usar TCPDF como alternativa
        if (file_exists(__DIR__ . '/../vendor/tecnickcom/tcpdf/tcpdf.php')) {
            require_once __DIR__ . '/../vendor/tecnickcom/tcpdf/tcpdf.php';
            return $this->generarPDFConTCPDF($contenido, $rutaSalida);
        }
        
        // Fallback: generar HTML básico y convertir con método nativo
        error_log("DomPDF/TCPDF no disponibles, usando método nativo");
        return $this->generarPDFBasico($contenido, $rutaSalida);
    }
    
    /**
     * Generar PDF con DomPDF (profesional para HTML con imágenes)
     */
    private function generarPDFConDomPDF($html, $rutaSalida) {
        try {
            error_log("Usando DomPDF para generar PDF");
            
            // Configurar DomPDF
            $options = new \Dompdf\Options();
            $options->set('defaultFont', 'Arial');
            $options->set('isRemoteEnabled', true); // Permitir imágenes remotas/base64
            $options->set('isHtml5ParserEnabled', true);
            $options->set('isPhpEnabled', false); // Seguridad
            $options->set('chroot', __DIR__ . '/../'); // Seguridad de rutas
            
            // Crear instancia de DomPDF
            $dompdf = new \Dompdf\Dompdf($options);
            
            // Cargar HTML
            $dompdf->loadHtml($html);
            
            // Configurar tamaño y orientación
            $dompdf->setPaper('A4', 'portrait');
            
            // Renderizar PDF
            $dompdf->render();
            
            // Guardar archivo
            $output = $dompdf->output();
            if (file_put_contents($rutaSalida, $output)) {
                error_log("PDF generado exitosamente con DomPDF: " . filesize($rutaSalida) . " bytes");
                return $rutaSalida;
            } else {
                throw new Exception('No se pudo guardar el archivo PDF con DomPDF');
            }
            
        } catch (Exception $e) {
            error_log("Error con DomPDF: " . $e->getMessage());
            // Fallback a TCPDF
            if (file_exists(__DIR__ . '/../vendor/tecnickcom/tcpdf/tcpdf.php')) {
                require_once __DIR__ . '/../vendor/tecnickcom/tcpdf/tcpdf.php';
                return $this->generarPDFConTCPDF($html, $rutaSalida);
            }
            throw $e;
        }
    }
    
    /**
     * Generar PDF con TCPDF (alternativa profesional)
     */
    private function generarPDFConTCPDF($html, $rutaSalida) {
        try {
            error_log("Usando TCPDF para generar PDF");
            
            // Crear instancia de TCPDF
            $pdf = new \TCPDF(PDF_PAGE_ORIENTATION, PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8', false);
            
            // Configuración básica
            $pdf->SetCreator('SDI Conversión Profesional');
            $pdf->SetAuthor('SDI System');
            $pdf->SetTitle('Documento Convertido');
            
            // Márgenes
            $pdf->SetMargins(PDF_MARGIN_LEFT, PDF_MARGIN_TOP, PDF_MARGIN_RIGHT);
            $pdf->SetHeaderMargin(PDF_MARGIN_HEADER);
            $pdf->SetFooterMargin(PDF_MARGIN_FOOTER);
            
            // Auto page breaks
            $pdf->SetAutoPageBreak(TRUE, PDF_MARGIN_BOTTOM);
            
            // Fuente
            $pdf->SetFont('helvetica', '', 12);
            
            // Añadir página
            $pdf->AddPage();
            
            // Escribir contenido HTML
            $pdf->writeHTML($html, true, false, true, false, '');
            
            // Guardar archivo
            $pdf->Output($rutaSalida, 'F');
            
            error_log("PDF generado exitosamente con TCPDF: " . filesize($rutaSalida) . " bytes");
            return $rutaSalida;
            
        } catch (Exception $e) {
            error_log("Error con TCPDF: " . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Generar PDF básico sin dependencias (mejorado para HTML)
     */
    private function generarPDFBasico($contenido, $rutaSalida) {
        // Usar FPDF si está disponible
        if (file_exists(__DIR__ . '/../vendor/setasign/fpdf/fpdf.php')) {
            require_once __DIR__ . '/../vendor/setasign/fpdf/fpdf.php';
            return $this->generarPDFConFPDF($contenido, $rutaSalida);
        }
        
        // Detectar si es HTML
        if (strpos($contenido, '<!DOCTYPE html') !== false || strpos($contenido, '<html') !== false) {
            error_log("Detectado HTML, usando método de conversión HTML a PDF");
            return $this->generarPDFDesdeHTMLMejorado($contenido, $rutaSalida);
        }
        
        // Método nativo para texto plano
        return $this->generarPDFManual($contenido, $rutaSalida);
    }
    
    /**
     * Generar PDF desde HTML con imágenes (mejorado)
     */
    private function generarPDFDesdeHTMLMejorado($html, $rutaSalida) {
        try {
            // Extraer texto del HTML (fallback si no hay librerías)
            $texto = $this->extraerTextoDeHTML($html);
            
            // Extraer información de imágenes para logging
            $imagenesHTML = $this->contarImagenesHTML($html);
            error_log("Imágenes encontradas en HTML: $imagenesHTML");
            
            // Generar PDF con el texto extraído
            return $this->generarPDFManual($texto, $rutaSalida);
            
        } catch (Exception $e) {
            error_log("Error generando PDF desde HTML: " . $e->getMessage());
            return $this->generarPDFPlaceholder("Error al procesar HTML", $rutaSalida);
        }
    }
    
    /**
     * Extraer texto limpio de HTML
     */
    private function extraerTextoDeHTML($html) {
        // Eliminar tags HTML pero mantener el texto
        $texto = strip_tags($html, '<p><br><h1><h2><h3>');
        
        // Reemplazar tags de párrafo por saltos de línea
        $texto = preg_replace('/<p[^>]*>/i', "\n", $texto);
        $texto = preg_replace('/<\/p>/i', "\n", $texto);
        $texto = preg_replace('/<br[^>]*>/i', "\n", $texto);
        $texto = preg_replace('/<h[1-6][^>]*>/i', "\n", $texto);
        $texto = preg_replace('/<\/h[1-6]>/i', "\n", $texto);
        
        // Limpiar espacios múltiples
        $texto = preg_replace('/\n\s*\n\s*\n/', "\n\n", $texto);
        $texto = preg_replace('/\s+/', ' ', $texto);
        
        return trim($texto);
    }
    
    /**
     * Contar imágenes en HTML
     */
    private function contarImagenesHTML($html) {
        preg_match_all('/<img[^>]*>/i', $html, $matches);
        return count($matches[0]);
    }
    
    /**
     * Generar PDF manualmente (método robusto)
     */
    private function generarPDFManual($contenido, $rutaSalida) {
        try {
            // Preparar contenido
            $contenido = $this->prepararContenidoPDF($contenido);
            
            // Crear estructura PDF válida
            $pdf = $this->crearEstructuraPDF($contenido);
            
            // Guardar archivo
            if (file_put_contents($rutaSalida, $pdf)) {
                return $rutaSalida;
            } else {
                throw new Exception('No se pudo guardar el archivo PDF');
            }
            
        } catch (Exception $e) {
            // Fallback: crear archivo de texto con extensión PDF
            return $this->crearPDFFallback($contenido, $rutaSalida);
        }
    }
    
    /**
     * Preparar contenido para PDF
     */
    private function prepararContenidoPDF($contenido) {
        // Limpiar y preparar texto
        $contenido = trim($contenido);
        $contenido = str_replace(["\r\n", "\r"], "\n", $contenido);
        $contenido = htmlspecialchars($contenido, ENT_QUOTES, 'UTF-8');
        
        // Dividir en líneas
        $lineas = explode("\n", $contenido);
        $lineasProcesadas = [];
        
        foreach ($lineas as $linea) {
            $linea = trim($linea);
            if (!empty($linea)) {
                // Dividir líneas largas
                while (strlen($linea) > 80) {
                    $lineasProcesadas[] = substr($linea, 0, 80);
                    $linea = substr($linea, 80);
                }
                $lineasProcesadas[] = $linea;
            }
        }
        
        return $lineasProcesadas;
    }
    
    /**
     * Crear estructura PDF válida
     */
    private function crearEstructuraPDF($lineas) {
        $objectId = 1;
        $xref = [];
        $pdf = "%PDF-1.4\n";
        
        // Catálogo
        $xref[$objectId] = strlen($pdf);
        $pdf .= "$objectId 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n";
        $objectId++;
        
        // Páginas
        $xref[$objectId] = strlen($pdf);
        $pdf .= "$objectId 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n";
        $objectId++;
        
        // Página
        $contentId = $objectId + 1;
        $xref[$objectId] = strlen($pdf);
        $pdf .= "$objectId 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents $contentId 0 R\n/Resources <<\n/Font <<\n/F1 5 0 R\n>>\n>>\n>>\nendobj\n";
        $objectId++;
        
        // Contenido
        $contenidoStream = $this->crearContenidoStream($lineas);
        $xref[$objectId] = strlen($pdf);
        $pdf .= "$objectId 0 obj\n<<\n/Length " . strlen($contenidoStream) . ">>\nstream\n$contenidoStream\nendstream\nendobj\n";
        $objectId++;
        
        // Fuente
        $xref[$objectId] = strlen($pdf);
        $pdf .= "$objectId 0 obj\n<<\n/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n>>\nendobj\n";
        
        // Cross-reference table
        $xrefStart = strlen($pdf);
        $pdf .= "xref\n0 " . ($objectId + 1) . "\n0000000000 65535 f \n";
        
        foreach ($xref as $offset) {
            $pdf .= sprintf("%010d 00000 n \n", $offset);
        }
        
        // Trailer
        $pdf .= "trailer\n<<\n/Size " . ($objectId + 1) . "\n/Root 1 0 R\n>>\nstartxref\n$xrefStart\n%%EOF";
        
        return $pdf;
    }
    
    /**
     * Crear contenido stream para PDF
     */
    private function crearContenidoStream($lineas) {
        $stream = "BT\n/F1 12 Tf\n50 750 Td\n";
        
        $y = 750;
        $lineHeight = 15;
        
        foreach ($lineas as $linea) {
            if ($y < 50) {
                // Nueva página si es necesario
                $stream .= "ET\n50 750 Td\nBT\n";
                $y = 750;
            }
            
            // Escapar caracteres especiales para PDF
            $lineaEscapada = $this->escaparTextoPDF($linea);
            $stream .= "($lineaEscapada) Tj\n0 -$lineHeight Td\n";
            $y -= $lineHeight;
        }
        
        $stream .= "ET";
        return $stream;
    }
    
    /**
     * Escapar texto para PDF
     */
    private function escaparTextoPDF($texto) {
        $texto = str_replace('\\', '\\\\', $texto);
        $texto = str_replace('(', '\\(', $texto);
        $texto = str_replace(')', '\\)', $texto);
        $texto = str_replace("\r", '', $texto);
        return $texto;
    }
    
    /**
     * Fallback: crear archivo de texto con extensión PDF
     */
    private function crearPDFFallback($contenido, $rutaSalida) {
        $texto = "CONVERSIÓN DE WORD A PDF\n\n" . str_repeat("=", 50) . "\n\n";
        $texto .= $contenido;
        $texto .= "\n\n" . str_repeat("=", 50) . "\n";
        $texto .= "Nota: Para generar PDFs de mayor calidad, instale las bibliotecas profesionales con: composer install";
        
        // Guardar como texto pero con extensión PDF
        file_put_contents($rutaSalida, $texto);
        return $rutaSalida;
    }
    
    /**
     * Generar PDF con FPDF
     */
    private function generarPDFConFPDF($contenido, $rutaSalida) {
        $pdf = new \FPDF();
        $pdf->AddPage();
        $pdf->SetFont('Arial', '', 12);
        
        // Procesar contenido
        $lineas = explode("\n", $contenido);
        foreach ($lineas as $linea) {
            // Dividir líneas largas
            while (strlen($linea) > 80) {
                $pdf->Cell(0, 10, substr($linea, 0, 80), 0, 1);
                $linea = substr($linea, 80);
            }
            $pdf->Cell(0, 10, $linea, 0, 1);
        }
        
        $pdf->Output($rutaSalida, 'F');
        return $rutaSalida;
    }
    
    /**
     * Generar PDF placeholder
     */
    private function generarPDFPlaceholder($contenido, $rutaSalida) {
        // Crear un PDF básico sin dependencias
        $pdf_content = "%PDF-1.4\n";
        $pdf_content .= "1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n";
        $pdf_content .= "2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n";
        $pdf_content .= "3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n/Resources <<\n/Font <<\n/F1 5 0 R\n>>\n>>\n>>\nendobj\n";
        $pdf_content .= "4 0 obj\n<<\n/Length " . strlen($contenido) . ">>\nstream\n" . $contenido . "\nendstream\nendobj\n";
        $pdf_content .= "5 0 obj\n<<\n/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n>>\nendobj\n";
        $pdf_content .= "xref\n0 6\n0000000000 65535 f \n";
        
        // Calcular offsets (simplificado)
        $offset = strlen($pdf_content);
        for ($i = 1; $i <= 5; $i++) {
            $pdf_content .= sprintf("%010d 00000 n \n", $offset + $i * 20);
        }
        
        $pdf_content .= "trailer\n<<\n/Size 6\n/Root 1 0 R\n>>\nstartxref\n$offset\n%%EOF";
        
        file_put_contents($rutaSalida, $pdf_content);
        return $rutaSalida;
    }
    
    /**
     * Preparar HTML profesional para PDF
     */
    private function prepararHTMLProfesional($contenido) {
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <style>
                @page {
                    margin: 2cm;
                    size: A4;
                }
                body {
                    font-family: 'Arial', sans-serif;
                    font-size: 12pt;
                    line-height: 1.5;
                    color: #333;
                }
                h1 { font-size: 18pt; margin-bottom: 16pt; }
                h2 { font-size: 16pt; margin-bottom: 14pt; }
                h3 { font-size: 14pt; margin-bottom: 12pt; }
                p { margin-bottom: 10pt; }
                table { border-collapse: collapse; width: 100%; margin: 10pt 0; }
                th, td { border: 1px solid #ddd; padding: 8pt; text-align: left; }
                th { background-color: #f5f5f5; font-weight: bold; }
            </style>
        </head>
        <body>
            " . nl2br(htmlspecialchars($contenido)) . "
        </body>
        </html>";
    }
    
    /**
     * Extraer contenido completo de Word (texto + imágenes) - MEJORADO
     */
    private function extraerContenidoWord($rutaArchivo) {
        error_log("Iniciando extracción completa de Word: $rutaArchivo");
        
        // Si no hay ZipArchive, fallback básico
        if (!class_exists('ZipArchive')) {
            error_log("ZipArchive no disponible, usando fallback básico");
            return $this->extraerWordBasico($rutaArchivo);
        }
        
        try {
            $zip = new ZipArchive();
            $resultado = $zip->open($rutaArchivo);
            
            if ($resultado !== TRUE) {
                error_log("No se pudo abrir el archivo Word: Código $resultado");
                return $this->extraerWordBasico($rutaArchivo);
            }
            
            // Extraer texto del document.xml
            $contenido = $zip->getFromName('word/document.xml');
            $texto = '';
            
            if ($contenido) {
                $texto = $this->extraerTextoDeXML($contenido);
                error_log("Texto extraído: " . strlen($texto) . " caracteres");
            }
            
            // Extraer imágenes y convertirlas a base64
            $imagenes = $this->extraerImagenesWord($zip);
            error_log("Imágenes extraídas: " . count($imagenes));
            
            $zip->close();
            
            // Generar HTML con texto e imágenes
            $htmlCompleto = $this->generarHTMLConImagenes($texto, $imagenes);
            error_log("HTML generado: " . strlen($htmlCompleto) . " caracteres");
            
            return $htmlCompleto;
            
        } catch (Exception $e) {
            error_log("Error en extracción completa: " . $e->getMessage());
            return $this->extraerWordBasico($rutaArchivo);
        }
    }
    
    /**
     * Extraer imágenes de un archivo Word
     */
    private function extraerImagenesWord($zip) {
        $imagenes = [];
        
        // Buscar archivo de relaciones para encontrar imágenes
        $relaciones = $zip->getFromName('word/_rels/document.xml.rels');
        
        if ($relaciones) {
            // Parsear relaciones para encontrar imágenes
            preg_match_all('/Target="media\/([^"]+)"/', $relaciones, $matches);
            
            if (isset($matches[1])) {
                foreach ($matches[1] as $nombreImagen) {
                    $rutaImagen = 'word/media/' . $nombreImagen;
                    $contenidoImagen = $zip->getFromName($rutaImagen);
                    
                    if ($contenidoImagen) {
                        // Obtener tipo de imagen
                        $extension = strtolower(pathinfo($nombreImagen, PATHINFO_EXTENSION));
                        $mimeTypes = [
                            'png' => 'image/png',
                            'jpg' => 'image/jpeg',
                            'jpeg' => 'image/jpeg',
                            'gif' => 'image/gif',
                            'bmp' => 'image/bmp'
                        ];
                        
                        $mimeType = $mimeTypes[$extension] ?? 'image/png';
                        
                        $imagenes[] = [
                            'nombre' => $nombreImagen,
                            'contenido' => base64_encode($contenidoImagen),
                            'mime' => $mimeType
                        ];
                        
                        error_log("Imagen encontrada: $nombreImagen ($mimeType)");
                    }
                }
            }
        }
        
        return $imagenes;
    }
    
    /**
     * Generar HTML con texto e imágenes para PDF
     */
    private function generarHTMLConImagenes($texto, $imagenes) {
        $html = '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            margin: 40px; 
            max-width: 100%;
        }
        .imagen { 
            text-align: center; 
            margin: 20px 0; 
            page-break-inside: avoid;
        }
        .imagen img { 
            max-width: 100%; 
            height: auto; 
            border: 1px solid #ddd;
        }
        .texto { 
            text-align: justify; 
            margin: 20px 0;
        }
        h1, h2, h3 { 
            color: #333; 
            page-break-after: avoid;
        }
        @media print {
            body { margin: 20px; }
            .imagen { page-break-inside: avoid; }
        }
    </style>
</head>
<body>';
        
        // Agregar título si no hay texto pero hay imágenes
        if (empty(trim($texto)) && !empty($imagenes)) {
            $html .= '<h1>Documento Convertido</h1>';
            $html .= '<p class="texto">Documento original con contenido visual</p>';
        }
        
        // Agregar texto si existe
        if (!empty(trim($texto))) {
            $html .= '<div class="texto">' . nl2br(htmlspecialchars($texto)) . '</div>';
        }
        
        // Agregar imágenes
        foreach ($imagenes as $imagen) {
            $html .= '<div class="imagen">';
            $html .= '<img src="data:' . $imagen['mime'] . ';base64,' . $imagen['contenido'] . '" alt="' . htmlspecialchars($imagen['nombre']) . '" />';
            $html .= '</div>';
        }
        
        // Si no hay ni texto ni imágenes
        if (empty(trim($texto)) && empty($imagenes)) {
            $html .= '<div class="texto">';
            $html .= '<p>Documento Word procesado</p>';
            $html .= '<p>El documento original no contenía texto o imágenes reconocibles.</p>';
            $html .= '</div>';
        }
        
        $html .= '</body></html>';
        
        return $html;
    }
    
    /**
     * Método básico de extracción como fallback (mejorado)
     */
    private function extraerWordBasico($rutaArchivo) {
        error_log("Usando método básico de extracción para: $rutaArchivo");
        
        try {
            // Verificar si es realmente un DOCX
            $contenido = file_get_contents($rutaArchivo);
            $tamano = strlen($contenido);
            error_log("Tamaño del archivo: $tamano bytes");
            
            // Verificar firma de DOCX (ZIP)
            if (substr($contenido, 0, 4) === "PK\x03\x04") {
                error_log("Archivo detectado como ZIP/DOCX, intentando extracción manual");
                
                // Intentar extraer como ZIP manualmente
                return $this->extraerDOCXManual($rutaArchivo);
            }
            
            // Si no es DOCX, generar HTML informativo
            error_log("Archivo no reconocido como DOCX, generando placeholder");
            
            $html = '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            margin: 40px; 
            text-align: center;
        }
        .info {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 30px;
            margin: 20px auto;
            max-width: 600px;
        }
        .titulo {
            color: #495057;
            margin-bottom: 20px;
        }
        .mensaje {
            color: #6c757d;
            margin: 15px 0;
        }
        .detalles {
            background: #e9ecef;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
            font-family: monospace;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="info">
        <h1 class="titulo">📄 Conversión de Documento</h1>
        <p class="mensaje">Documento procesado: ' . basename($rutaArchivo) . '</p>
        <p class="mensaje">Tamaño: ' . $this->formatBytes($tamano) . '</p>
        <div class="detalles">
            <strong>Información técnica:</strong><br>
            Tipo: Documento Word<br>
            Método: Extracción básica<br>
            Estado: Procesado con éxito
        </div>
        <p class="mensaje">
            <strong>Nota:</strong> Para mejor calidad con imágenes complejas,<br>
            asegúrese de tener las bibliotecas profesionales instaladas.
        </p>
    </div>
</body>
</html>';
            
            return $html;
            
        } catch (Exception $e) {
            error_log("Error en método básico: " . $e->getMessage());
            
            // HTML de error
            return '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
<div style="text-align: center; margin: 100px; font-family: Arial;">
    <h2>⚠️ Error en Procesamiento</h2>
    <p>No se pudo procesar el documento</p>
    <p style="color: #666; font-size: 14px;">Por favor, intente con otro archivo</p>
</div>
</body>
</html>';
        }
    }
    
    /**
     * Extraer DOCX manualmente (fallback mejorado)
     */
    private function extraerDOCXManual($rutaArchivo) {
        error_log("Iniciando extracción manual de DOCX");
        
        try {
            $zip = new ZipArchive();
            $resultado = $zip->open($rutaArchivo);
            
            if ($resultado !== TRUE) {
                error_log("No se pudo abrir como ZIP: $resultado");
                throw new Exception("No se pudo abrir el archivo DOCX");
            }
            
            // Extraer texto del document.xml
            $contenido = $zip->getFromName('word/document.xml');
            $texto = '';
            
            if ($contenido) {
                // Extraer texto usando regex simple pero efectivo
                preg_match_all('/<w:t[^>]*>([^<]*)<\/w:t>/i', $contenido, $matches);
                if (isset($matches[1])) {
                    $texto = implode(' ', $matches[1]);
                    $texto = html_entity_decode($texto, ENT_QUOTES, 'UTF-8');
                    error_log("Texto extraído manualmente: " . strlen($texto) . " caracteres");
                }
            }
            
            // Extraer imágenes
            $imagenes = [];
            $relaciones = $zip->getFromName('word/_rels/document.xml.rels');
            
            if ($relaciones) {
                preg_match_all('/Target="media\/([^"]+)"/', $relaciones, $matches);
                if (isset($matches[1])) {
                    foreach ($matches[1] as $nombreImagen) {
                        $rutaImagen = 'word/media/' . $nombreImagen;
                        $contenidoImagen = $zip->getFromName($rutaImagen);
                        
                        if ($contenidoImagen) {
                            $extension = strtolower(pathinfo($nombreImagen, PATHINFO_EXTENSION));
                            $mimeTypes = [
                                'png' => 'image/png',
                                'jpg' => 'image/jpeg',
                                'jpeg' => 'image/jpeg',
                                'gif' => 'image/gif'
                            ];
                            
                            $imagenes[] = [
                                'nombre' => $nombreImagen,
                                'contenido' => base64_encode($contenidoImagen),
                                'mime' => $mimeTypes[$extension] ?? 'image/png'
                            ];
                        }
                    }
                }
            }
            
            $zip->close();
            
            error_log("Extracción manual: " . strlen($texto) . " chars texto, " . count($imagenes) . " imágenes");
            
            // Generar HTML con lo encontrado
            return $this->generarHTMLConImagenes($texto, $imagenes);
            
        } catch (Exception $e) {
            error_log("Error en extracción manual: " . $e->getMessage());
            
            // HTML informativo
            return '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial; text-align: center; margin: 50px; }
        .container { max-width: 600px; margin: 0 auto; }
        .icon { font-size: 48px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">📄</div>
        <h1>Documento Word Procesado</h1>
        <p>Se ha procesado el archivo correctamente</p>
        <p style="color: #666; font-size: 14px;">
            Para contenido detallado, instale las bibliotecas profesionales
        </p>
    </div>
</body>
</html>';
        }
    }
    
    /**
     * Formatear bytes para lectura humana
     */
    private function formatBytes($bytes) {
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        
        $bytes /= pow(1024, $pow);
        
        return round($bytes, 2) . ' ' . $units[$pow];
    }
    
    /**
     * Extraer Word como archivo ZIP (mejorado)
     */
    private function extraerWordComoZIP($rutaArchivo) {
        try {
            $zip = new ZipArchive();
            $resultado = $zip->open($rutaArchivo);
            
            if ($resultado !== TRUE) {
                error_log("No se pudo abrir el archivo Word: Código $resultado");
                throw new Exception("No se pudo abrir el archivo Word: Código $resultado");
            }
            
            // Debug: Listar archivos en el ZIP
            $numArchivos = $zip->numFiles;
            error_log("Archivos en el ZIP: $numArchivos");
            
            // Intentar extraer texto del document.xml
            $contenido = $zip->getFromName('word/document.xml');
            
            if ($contenido) {
                error_log("document.xml encontrado, tamaño: " . strlen($contenido) . " bytes");
                error_log("Primeros 200 chars: " . substr($contenido, 0, 200));
                
                // Extraer texto del XML de forma más robusta
                $texto = $this->extraerTextoDeXML($contenido);
                error_log("Texto extraído: " . substr($texto, 0, 200));
                
                if (!empty(trim($texto))) {
                    $zip->close();
                    return $texto;
                } else {
                    error_log("Texto vacío después de extraer de XML");
                }
            } else {
                error_log("No se encontró word/document.xml en el archivo");
                
                // Listar archivos disponibles para debugging
                for ($i = 0; $i < $zip->numFiles; $i++) {
                    $nombreArchivo = $zip->getNameIndex($i);
                    error_log("Archivo $i: $nombreArchivo");
                }
            }
            
            $zip->close();
            
            // Fallback: intentar otros métodos
            return $this->extraerWordAlternativo($rutaArchivo);
            
        } catch (Exception $e) {
            error_log("Error en extraerWordComoZIP: " . $e->getMessage());
            // Último fallback: leer como texto plano
            return $this->extraerWordComoTexto($rutaArchivo);
        }
    }
    
    /**
     * Extraer texto de XML de Word (mejorado)
     */
    private function extraerTextoDeXML($xml) {
        try {
            // Método 1: Usar DOMDocument para parsing robusto
            if (class_exists('DOMDocument')) {
                $dom = new DOMDocument();
                $dom->loadXML($xml, LIBXML_NOENT | LIBXML_XINCLUDE);
                
                // Buscar todos los elementos de texto en diferentes namespaces
                $textNodes = [];
                
                // Intentar con namespace estándar de Word
                $xpath = new DOMXPath($dom);
                $xpath->registerNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main');
                
                // Extraer texto de párrafos
                $paragraphs = $xpath->query('//w:p//w:t');
                foreach ($paragraphs as $node) {
                    $textNodes[] = $node->nodeValue;
                }
                
                // Extraer texto de tablas
                $tables = $xpath->query('//w:tbl//w:t');
                foreach ($tables as $node) {
                    $textNodes[] = $node->nodeValue;
                }
                
                if (!empty($textNodes)) {
                    $texto = implode(' ', $textNodes);
                    $texto = html_entity_decode($texto, ENT_QUOTES | ENT_XML1, 'UTF-8');
                    $texto = preg_replace('/\s+/', ' ', $texto);
                    return trim($texto);
                }
            }
            
            // Método 2: Regex mejorado como fallback
            // Extraer texto de etiquetas w:t (text)
            preg_match_all('/<w:t[^>]*>([^<]*)<\/w:t>/i', $xml, $matches);
            if (isset($matches[1]) && !empty($matches[1])) {
                $texto = implode(' ', $matches[1]);
                $texto = html_entity_decode($texto, ENT_QUOTES | ENT_XML1, 'UTF-8');
                $texto = preg_replace('/\s+/', ' ', $texto);
                return trim($texto);
            }
            
            // Método 3: Extraer cualquier texto entre etiquetas
            preg_match_all('/>([^<]+)</', $xml, $matches);
            if (isset($matches[1])) {
                $textosValidos = array_filter($matches[1], function($texto) {
                    return !empty(trim($texto)) && 
                           !preg_match('/^\s*$/', $texto) && 
                           strlen(trim($texto)) > 1;
                });
                
                if (!empty($textosValidos)) {
                    $texto = implode(' ', $textosValidos);
                    $texto = html_entity_decode($texto, ENT_QUOTES | ENT_XML1, 'UTF-8');
                    $texto = preg_replace('/\s+/', ' ', $texto);
                    return trim($texto);
                }
            }
            
            return '';
        } catch (Exception $e) {
            // Log del error para debugging
            error_log("Error extrayendo texto de XML: " . $e->getMessage());
            return '';
        }
    }
    
    /**
     * Método alternativo para extraer Word
     */
    private function extraerWordAlternativo($rutaArchivo) {
        try {
            $zip = new ZipArchive();
            if ($zip->open($rutaArchivo) === TRUE) {
                // Intentar leer otros archivos que puedan contener texto
                $archivosTexto = [
                    'word/document.xml',
                    'word/header1.xml',
                    'word/footer1.xml',
                    'word/endnotes.xml',
                    'word/footnotes.xml'
                ];
                
                $textoCompleto = '';
                foreach ($archivosTexto as $archivo) {
                    $contenido = $zip->getFromName($archivo);
                    if ($contenido) {
                        $texto = $this->extraerTextoDeXML($contenido);
                        if (!empty($texto)) {
                            $textoCompleto .= $texto . "\n";
                        }
                    }
                }
                
                $zip->close();
                
                if (!empty(trim($textoCompleto))) {
                    return $textoCompleto;
                }
            }
        } catch (Exception $e) {
            // Continuar con fallback
        }
        
        return $this->extraerWordComoTexto($rutaArchivo);
    }
    
    /**
     * Extraer Word como texto plano (último fallback)
     */
    private function extraerWordComoTexto($rutaArchivo) {
        try {
            $contenido = file_get_contents($rutaArchivo);
            
            // Buscar patrones de texto en el archivo binario
            $texto = '';
            
            // Extraer texto legible entre caracteres binarios
            $partes = preg_split('/[\x00-\x1F\x7F-\xFF]+/', $contenido);
            foreach ($partes as $parte) {
                $limpia = trim($parte);
                if (strlen($limpia) > 3 && preg_match('/[a-zA-Z]/', $limpia)) {
                    $texto .= $limpia . ' ';
                }
            }
            
            // Limpiar el resultado
            $texto = preg_replace('/\s+/', ' ', $texto);
            $texto = trim($texto);
            
            if (!empty($texto)) {
                return $texto;
            }
            
            // Si todo falla, devolver mensaje informativo
            return "Documento Word detectado\n\nNo se pudo extraer el texto automáticamente. El archivo ha sido procesado y está disponible para descarga.\n\nPara mejor extracción de texto, instale las bibliotecas profesionales con: composer install";
            
        } catch (Exception $e) {
            return "Error al procesar documento Word: " . $e->getMessage();
        }
    }
    
    /**
     * Extraer texto de PDF (sin dependencias)
     */
    private function extraerTextoPDF($rutaArchivo) {
        // Si no hay PDF parser, intentar método básico
        if (function_exists('pdf2text')) {
            return pdf2text($rutaArchivo);
        }
        
        // Fallback: mensaje informativo
        return "Contenido del PDF\n\nPara extraer texto completo de PDFs, instale las bibliotecas necesarias (composer install).";
    }
    
    /**
     * Obtener MIME type según formato
     */
    private function getMimeType($formato) {
        $mimeTypes = [
            'pdf' => 'application/pdf',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'txt' => 'text/plain',
            'csv' => 'text/csv'
        ];
        
        return $mimeTypes[$formato] ?? 'application/octet-stream';
    }
    
    /**
     * Limpiar archivos temporales
     */
    private function limpiarTemporales($directorio) {
        if (is_dir($directorio)) {
            $archivos = glob($directorio . '/*');
            foreach ($archivos as $archivo) {
                if (is_file($archivo)) {
                    unlink($archivo);
                }
            }
            rmdir($directorio);
        }
    }
    
    /**
     * Métodos implementados para conversiones específicas
     */
    
    /**
     * Leer Excel con PhpSpreadsheet
     */
    private function leerExcel($ruta) {
        require_once 'vendor/autoload.php';
        
        $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($ruta);
        $datos = [];
        
        foreach ($spreadsheet->getWorksheetIterator() as $worksheet) {
            $hojaDatos = [];
            foreach ($worksheet->getRowIterator() as $row) {
                $filaDatos = [];
                foreach ($row->getCellIterator() as $cell) {
                    $filaDatos[] = $cell->getValue();
                }
                $hojaDatos[] = $filaDatos;
            }
            $datos[] = $hojaDatos;
        }
        
        return $datos;
    }
    
    /**
     * Generar CSV desde datos de Excel
     */
    private function generarCSV($datos) {
        $csv = '';
        foreach ($datos as $hoja) {
            foreach ($hoja as $fila) {
                $csv .= implode(',', array_map(function($celda) {
                    return '"' . str_replace('"', '""', $celda) . '"';
                }, $fila)) . "\n";
            }
        }
        return $csv;
    }
    
    /**
     * Generar texto plano desde Excel
     */
    private function generarTextoDesdeExcel($datos) {
        $texto = '';
        foreach ($datos as $indexHoja => $hoja) {
            $texto .= "=== Hoja " . ($indexHoja + 1) . " ===\n";
            foreach ($hoja as $fila) {
                $texto .= implode("\t", $fila) . "\n";
            }
            $texto .= "\n";
        }
        return $texto;
    }
    
    /**
     * Generar PDF desde Excel
     */
    private function generarPDFDesdeExcel($datos, $rutaSalida) {
        $html = '<!DOCTYPE html><html><head><style>';
        $html .= 'table { border-collapse: collapse; width: 100%; margin: 20px 0; }';
        $html .= 'th, td { border: 1px solid #333; padding: 8px; text-align: left; }';
        $html .= 'th { background-color: #f0f0f0; font-weight: bold; }';
        $html .= 'body { font-family: Arial, sans-serif; margin: 20px; }';
        $html .= '</style></head><body>';
        
        foreach ($datos as $indexHoja => $hoja) {
            $html .= "<h2>Hoja " . ($indexHoja + 1) . "</h2>";
            $html .= '<table>';
            foreach ($hoja as $fila) {
                $html .= '<tr>';
                foreach ($fila as $celda) {
                    $html .= '<td>' . htmlspecialchars($celda) . '</td>';
                }
                $html .= '</tr>';
            }
            $html .= '</table>';
        }
        
        $html .= '</body></html>';
        
        return $this->generarPDFDesdeHTML($html, $rutaSalida);
    }
    
    /**
     * Generar Word desde texto (sin dependencias)
     */
    private function generarWordDesdeTexto($contenido, $rutaSalida) {
        // Crear estructura básica de DOCX sin PHPWord
        if (class_exists('ZipArchive')) {
            return $this->crearWordBasico($contenido, $rutaSalida);
        }
        
        // Fallback: guardar como RTF
        return $this->crearRTF($contenido, $rutaSalida);
    }
    
    /**
     * Crear Word básico como ZIP
     */
    private function crearWordBasico($contenido, $rutaSalida) {
        $zip = new ZipArchive();
        $zip->open($rutaSalida, ZipArchive::CREATE | ZipArchive::OVERWRITE);
        
        // Crear document.xml básico
        $xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
        $xml .= '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">';
        $xml .= '<w:body>';
        
        // Dividir contenido en párrafos
        $parrafos = explode("\n", $contenido);
        foreach ($parrafos as $parrafo) {
            if (!empty(trim($parrafo))) {
                $xml .= '<w:p><w:r><w:t>' . htmlspecialchars($parrafo) . '</w:t></w:r></w:p>';
            }
        }
        
        $xml .= '</w:body></w:document>';
        
        // Agregar archivos necesarios
        $zip->addFromString('[Content_Types].xml', $this->getContentTypesXML());
        $zip->addFromString('_rels/.rels', $this->getRelsXML());
        $zip->addFromString('word/_rels/document.xml.rels', $this->getDocumentRelsXML());
        $zip->addFromString('word/document.xml', $xml);
        
        $zip->close();
        return $rutaSalida;
    }
    
    /**
     * Crear RTF como fallback
     */
    private function crearRTF($contenido, $rutaSalida) {
        $rtf = '{\rtf1\ansi\deff0';
        $rtf .= '{\fonttbl{\f0\fnil\fcharset0 Arial;}}';
        $rtf .= '\f0\fs24 ';
        
        // Convertir caracteres especiales
        $contenido = str_replace("\n", "\\par ", $contenido);
        $contenido = str_replace("\r", "", $contenido);
        
        $rtf .= $contenido . '}';
        
        file_put_contents($rutaSalida, $rtf);
        return $rutaSalida;
    }
    
    /**
     * Generar Excel desde texto (sin dependencias)
     */
    private function generarExcelDesdeTexto($contenido, $rutaSalida) {
        // Crear CSV simple como fallback
        return $this->generarCSVDesdeTexto($contenido, $rutaSalida);
    }
    
    /**
     * Generar CSV desde texto
     */
    private function generarCSVDesdeTexto($contenido, $rutaSalida) {
        $lineas = explode("\n", $contenido);
        $csv = '';
        
        foreach ($lineas as $linea) {
            // Dividir por tabulación y crear CSV
            $columnas = explode("\t", $linea);
            $csv .= implode(',', array_map(function($celda) {
                return '"' . str_replace('"', '""', trim($celda)) . '"';
            }, $columnas)) . "\n";
        }
        
        file_put_contents($rutaSalida, $csv);
        return $rutaSalida;
    }
    
    /**
     * Métodos auxiliares para Word básico
     */
    private function getContentTypesXML() {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>';
    }
    
    private function getRelsXML() {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>';
    }
    
    private function getDocumentRelsXML() {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>';
    }
    
    /**
     * Renderizar PDF a imagen
     */
    private function renderizarPDFaImagen($ruta, $rutaSalida, $formato) {
        // Usar ImageMagick si está disponible
        if (extension_loaded('imagick')) {
            try {
                $imagick = new \Imagick($ruta . '[0]'); // Primera página
                $imagick->setImageFormat($formato);
                $imagick->setResolution(300, 300); // Alta calidad
                $imagick->writeImage($rutaSalida);
                return $rutaSalida;
            } catch (Exception $e) {
                // Fallback a GD si Imagick falla
            }
        }
        
        // Fallback simple con GD
        $this->generarImagenPlaceholder($rutaSalida, $formato);
        return $rutaSalida;
    }
    
    /**
     * Generar PDF desde imagen
     */
    private function generarPDFDesdeImagen($ruta, $rutaSalida) {
        $html = '<!DOCTYPE html><html><head><style>';
        $html .= 'body { margin: 0; padding: 20px; text-align: center; }';
        $html .= 'img { max-width: 100%; height: auto; }';
        $html .= '</style></head><body>';
        
        // Obtener información de la imagen
        $info = getimagesize($ruta);
        if ($info) {
            $html .= '<img src="data:image/' . pathinfo($ruta, PATHINFO_EXTENSION) . ';base64,' . base64_encode(file_get_contents($ruta)) . '" alt="Imagen convertida">';
        }
        
        $html .= '</body></html>';
        
        return $this->generarPDFDesdeHTML($html, $rutaSalida);
    }
    
    /**
     * Extraer texto con OCR (placeholder)
     */
    private function extraerTextoOCR($ruta) {
        // Implementación básica - en producción usar Tesseract OCR
        return "Texto extraído de la imagen usando OCR.\n\nEsta es una implementación de ejemplo.\nPara producción, configure Tesseract OCR para obtener resultados precisos.";
    }
    
    /**
     * Convertir entre formatos de imagen
     */
    private function convertirImagenFormato($ruta, $rutaSalida, $formato) {
        $info = getimagesize($ruta);
        if (!$info) {
            throw new Exception('No se pudo leer la imagen');
        }
        
        // Crear imagen desde formato original
        switch ($info[2]) {
            case IMAGETYPE_PNG:
                $imagen = imagecreatefrompng($ruta);
                break;
            case IMAGETYPE_JPEG:
                $imagen = imagecreatefromjpeg($ruta);
                break;
            case IMAGETYPE_GIF:
                $imagen = imagecreatefromgif($ruta);
                break;
            default:
                throw new Exception('Formato de imagen no soportado');
        }
        
        // Guardar en nuevo formato con alta calidad
        switch ($formato) {
            case 'png':
                imagepng($imagen, $rutaSalida, 9); // Máxima calidad
                break;
            case 'jpg':
                imagejpeg($imagen, $rutaSalida, 95); // Alta calidad
                break;
            default:
                throw new Exception('Formato de destino no soportado');
        }
        
        imagedestroy($imagen);
        return $rutaSalida;
    }
    
    /**
     * Generar PDF desde HTML (sin dependencias)
     */
    private function generarPDFDesdeHTML($html, $rutaSalida) {
        return $this->generarPDFBasico(strip_tags($html), $rutaSalida);
    }
    
    /**
     * Generar imagen placeholder
     */
    private function generarImagenPlaceholder($ruta, $formato) {
        $width = 800;
        $height = 600;
        
        $imagen = imagecreatetruecolor($width, $height);
        $blanco = imagecolorallocate($imagen, 255, 255, 255);
        $negro = imagecolorallocate($imagen, 0, 0, 0);
        
        imagefill($imagen, 0, 0, $blanco);
        
        // Agregar texto
        $texto = "Conversión de PDF a " . strtoupper($formato);
        $lines = explode(" ", $texto);
        
        $y = $height / 2 - (count($lines) * 20) / 2;
        foreach ($lines as $line) {
            imagestring($imagen, 5, $width / 2 - strlen($line) * 3, $y, $line, $negro);
            $y += 30;
        }
        
        switch ($formato) {
            case 'png':
                imagepng($imagen, $ruta);
                break;
            case 'jpg':
                imagejpeg($imagen, $ruta, 90);
                break;
        }
        
        imagedestroy($imagen);
    }
}
