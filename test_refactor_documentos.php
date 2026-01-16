<?php
/**
 * Script de prueba rápida para validar refactorización de documentos
 */

require_once __DIR__ . '/config/autoload.php';

echo "═══════════════════════════════════════════════════════════\n";
echo "TEST: Refactorización de Documentos\n";
echo "═══════════════════════════════════════════════════════════\n\n";

// Test 1: Verificar que el modelo tiene los métodos nuevos
echo "Test 1: Verificar métodos del modelo Documento...\n";
$documento = new \App\Models\Documento();

$metodos = ['crearDocumentoSimple', 'obtenerDocumentoSimple', 'obtenerPorNumeroOficio', 'listarPorCarpeta'];
foreach ($metodos as $metodo) {
    if (method_exists($documento, $metodo)) {
        echo "  ✓ Método '$metodo' existe\n";
    } else {
        echo "  ✗ Método '$metodo' NO existe\n";
    }
}

// Test 2: Verificar que el controlador tiene el método crear
echo "\nTest 2: Verificar método crear en DocumentoController...\n";
$controlador = new \App\Controllers\DocumentoController();
if (method_exists($controlador, 'crear')) {
    echo "  ✓ Método 'crear' existe en DocumentoController\n";
} else {
    echo "  ✗ Método 'crear' NO existe en DocumentoController\n";
}

// Test 3: Verificar estructura del formulario HTML
echo "\nTest 3: Verificar campos del formulario en archivo-general.js...\n";
$archivoJs = file_get_contents(__DIR__ . '/public/js/modules/archivo-general.js');
$campos = ['noOficio' => 'noOficio', 'carpetaDocumento' => 'carpetaDocumento', 'auditoria' => 'auditoria', 'emitidoPor' => 'emitidoPor', 'fechaOficio' => 'fechaOficio', 'fechaArchivoDisplay' => 'fechaArchivoDisplay', 'descripcion' => 'descripcion', 'capturadoPor' => 'capturadoPor'];
foreach ($campos as $campo => $mostrar) {
    if (strpos($archivoJs, "id=\"$campo\"") !== false) {
        echo "  ✓ Campo '$mostrar' presente en formulario\n";
    } else {
        echo "  ✗ Campo '$mostrar' NO presente en formulario\n";
    }
}

// Test 4: Verificar funciones de toast
echo "\nTest 4: Verificar funciones toast para documentos...\n";
if (strpos($archivoJs, 'mostrarToastFormularioDocumento') !== false) {
    echo "  ✓ Función 'mostrarToastFormularioDocumento' definida\n";
} else {
    echo "  ✗ Función 'mostrarToastFormularioDocumento' NO definida\n";
}

if (strpos($archivoJs, 'toastDocumentoContainer') !== false) {
    echo "  ✓ Contenedor 'toastDocumentoContainer' presente\n";
} else {
    echo "  ✗ Contenedor 'toastDocumentoContainer' NO presente\n";
}

// Test 5: Verificar carpetas disponibles
echo "\nTest 5: Verificar que hay carpetas en BD...\n";
$carpeta = new \App\Models\Carpeta();
$carpetas = $carpeta->listar([], 10);
echo "  ✓ Carpetas disponibles: " . count($carpetas) . "\n";

if (count($carpetas) > 0) {
    echo "  Primera carpeta: " . $carpetas[0]['etiqueta_identificadora'] . " (ID: " . $carpetas[0]['id_carpeta'] . ")\n";
}

echo "\n═══════════════════════════════════════════════════════════\n";
echo "TESTS COMPLETADOS\n";
echo "═══════════════════════════════════════════════════════════\n";
?>
