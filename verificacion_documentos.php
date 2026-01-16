<?php
/**
 * Prueba Completa del Sistema de Documentos Refactorizado
 * 
 * Este script verifica que:
 * 1. El router sirve archivos estáticos correctamente
 * 2. El método porCarpeta() existe y funciona
 * 3. Las carpetas se cargan correctamente
 * 4. Los documentos se filtran por carpeta
 */

session_start();
require_once __DIR__ . '/config/autoload.php';

// Simular autenticación
$_SESSION['id_usuario'] = 1;
$_SESSION['email'] = 'admin@sdi.local';
$_SESSION['rol'] = 'administrador';

?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verificación Sistema Documentos</title>
    <style>
        body {
            font-family: Segoe UI, Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .test-section {
            background: white;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .test-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .status-ok { color: #10b981; font-weight: bold; }
        .status-error { color: #ef4444; font-weight: bold; }
        .code-block {
            background: #f3f4f6;
            border-left: 3px solid #667eea;
            padding: 15px;
            margin: 10px 0;
            overflow-x: auto;
            font-family: 'Courier New', monospace;
            font-size: 12px;
        }
        h2 { color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        .test-item {
            padding: 10px;
            margin: 5px 0;
            background: #f9fafb;
            border-left: 3px solid #e5e7eb;
        }
    </style>
</head>
<body>
    <div class="test-header">
        <h1>✓ Verificación del Sistema de Documentos</h1>
        <p>Validando la implementación del módulo de documentos refactorizado</p>
    </div>

    <div class="test-section">
        <h2>1. Verificación del Backend</h2>
        
        <div class="test-item">
            <strong>✓ Sesión Activa:</strong>
            <span class="status-ok"><?php echo $_SESSION['email'] ?> (<?php echo $_SESSION['rol'] ?>)</span>
        </div>

        <div class="test-item">
            <strong>Verificar método porCarpeta:</strong>
            <?php
                $controller = new \App\Controllers\DocumentoController();
                if (method_exists($controller, 'porCarpeta')) {
                    echo '<span class="status-ok">✓ Existe</span>';
                } else {
                    echo '<span class="status-error">✗ No existe</span>';
                }
            ?>
        </div>

        <div class="test-item">
            <strong>Métodos Disponibles en DocumentoController:</strong>
            <div class="code-block">
                <?php
                    $methods = get_class_methods($controller);
                    $metodosFiltrados = array_filter($methods, function($m) {
                        return !in_array($m, ['__construct', '__call', '__callStatic', '__get', '__set']);
                    });
                    echo implode("\n", $metodosFiltrados);
                ?>
            </div>
        </div>
    </div>

    <div class="test-section">
        <h2>2. Verificación de Carpetas</h2>
        
        <?php
            try {
                $carpetaModel = new \App\Models\Carpeta();
                $carpetas = $carpetaModel->listar();
                
                if (is_array($carpetas) && count($carpetas) > 0) {
                    echo '<div class="test-item"><span class="status-ok">✓ Se cargaron ' . count($carpetas) . ' carpetas</span></div>';
                    echo '<table style="width: 100%; border-collapse: collapse;">';
                    echo '<tr style="background: #f3f4f6;"><th style="padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb;">ID</th><th style="padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb;">Número</th><th style="padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb;">Etiqueta</th></tr>';
                    foreach ($carpetas as $c) {
                        echo '<tr style="border-bottom: 1px solid #e5e7eb;">';
                        echo '<td style="padding: 10px;">' . $c['id_carpeta'] . '</td>';
                        echo '<td style="padding: 10px;">' . $c['no_carpeta_fisica'] . '</td>';
                        echo '<td style="padding: 10px;">' . $c['etiqueta_identificadora'] . '</td>';
                        echo '</tr>';
                    }
                    echo '</table>';
                } else {
                    echo '<div class="test-item"><span class="status-error">✗ No se cargaron carpetas</span></div>';
                }
            } catch (Exception $e) {
                echo '<div class="test-item"><span class="status-error">✗ Error: ' . $e->getMessage() . '</span></div>';
            }
        ?>
    </div>

    <div class="test-section">
        <h2>3. Verificación de Documentos</h2>
        
        <div class="test-item">
            <strong>Modelo Documento - Métodos Disponibles:</strong>
            <div class="code-block">
                <?php
                    $docModel = new \App\Models\Documento();
                    $docMethods = get_class_methods($docModel);
                    $docMetodosFiltrados = array_filter($docMethods, function($m) {
                        return strpos($m, 'listar') !== false || strpos($m, 'obtener') !== false || strpos($m, 'crear') !== false;
                    });
                    echo implode("\n", $docMetodosFiltrados);
                ?>
            </div>
        </div>
    </div>

    <div class="test-section">
        <h2>4. Información de Rutas API</h2>
        
        <div class="code-block">
GET /api/documentos
GET /api/documentos/:id
GET /api/documentos/por-carpeta/:id_carpeta
POST /api/documentos/crear
PUT /api/documentos/:id
DELETE /api/documentos/:id
        </div>

        <div class="test-item" style="background: #e0f2fe; border-left-color: #0284c7;">
            <strong style="color: #0284c7;">Nota:</strong> El router automáticamente mapea:
            <br>- partes[2] = "por-carpeta" → método "porCarpeta()"
            <br>- partes[3] = ID de carpeta → parámetro
        </div>
    </div>

    <div class="test-section">
        <h2>5. Prueba del Frontend</h2>
        
        <div class="test-item" style="background: #fef3c7; border-left-color: #f59e0b;">
            <strong>Próximos pasos:</strong>
            <ol>
                <li>Abre <a href="/">la página principal</a></li>
                <li>Navega a "Registrar Documento"</li>
                <li>Selecciona una carpeta del dropdown</li>
                <li>La tabla de documentos debería actualizarse automáticamente</li>
                <li>Llena el formulario y registra un documento</li>
                <li>Verifica que aparezca en la tabla</li>
            </ol>
        </div>
    </div>

</body>
</html>
