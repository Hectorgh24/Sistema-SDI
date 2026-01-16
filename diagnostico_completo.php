<?php
/**
 * Diagnóstico completo del sistema
 */
session_start();

echo "<h1>Diagnóstico SDI - Carpetas</h1>";

// 1. Verificar sesión
echo "<h2>1. Sesión</h2>";
echo "<pre>";
print_r($_SESSION);
echo "</pre>";

// 2. Verificar BD
echo "<h2>2. Base de datos</h2>";
try {
    require_once __DIR__ . '/config/autoload.php';
    $db = getDBConnection();
    $stmt = $db->prepare("SELECT COUNT(*) as total FROM carpetas_fisicas");
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "<p>Total de carpetas: " . $result['total'] . "</p>";
    
    // Listar carpetas
    echo "<h3>Carpetas existentes:</h3>";
    $stmt = $db->prepare("SELECT id_carpeta, no_carpeta_fisica, titulo, etiqueta_identificadora FROM carpetas_fisicas");
    $stmt->execute();
    $carpetas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "<pre>";
    print_r($carpetas);
    echo "</pre>";
} catch (\Exception $e) {
    echo "<p style='color: red;'>Error BD: " . $e->getMessage() . "</p>";
}

// 3. Verificar usuario
echo "<h2>3. Usuario autenticado</h2>";
try {
    if (isset($_SESSION['id_usuario'])) {
        $usuarioModel = new \App\Models\Usuario();
        $usuario = $usuarioModel->obtenerPorId($_SESSION['id_usuario']);
        echo "<pre>";
        print_r($usuario);
        echo "</pre>";
    } else {
        echo "<p style='color: red;'>No hay usuario en sesión</p>";
    }
} catch (\Exception $e) {
    echo "<p style='color: red;'>Error: " . $e->getMessage() . "</p>";
}

// 4. Verificar permisos
echo "<h2>4. Permisos</h2>";
try {
    $rolModel = new \App\Models\Rol();
    $rol = $_SESSION['rol'] ?? 'desconocido';
    $tienePermiso = $rolModel->tienePermiso($rol, 'crear_carpeta');
    echo "<p>Rol: <strong>$rol</strong></p>";
    echo "<p>Puede crear carpeta: " . ($tienePermiso ? "✓ SÍ" : "✗ NO") . "</p>";
} catch (\Exception $e) {
    echo "<p style='color: red;'>Error: " . $e->getMessage() . "</p>";
}

// 5. Test crear carpeta directamente
echo "<h2>5. Test crear carpeta</h2>";
if (isset($_SESSION['id_usuario'])) {
    try {
        $carpetaModel = new \App\Models\Carpeta();
        $maxNo = $carpetaModel->obtenerMaximoCarpeta();
        $siguienteNo = ($maxNo === null) ? 1 : $maxNo + 1;
        
        $resultado = $carpetaModel->crear([
            'no_carpeta_fisica' => $siguienteNo,
            'titulo' => 'Prueba Diagnóstico ' . time(),
            'etiqueta_identificadora' => 'DIAG-' . time(),
            'descripcion' => 'Carpeta creada por diagnóstico',
            'estado_gestion' => 'pendiente',
            'creado_por_id' => $_SESSION['id_usuario']
        ]);
        
        if ($resultado) {
            echo "<p style='color: green;'>✓ Carpeta creada exitosamente (ID: $resultado)</p>";
        } else {
            echo "<p style='color: red;'>✗ Error creando carpeta (retornó false)</p>";
        }
    } catch (\Exception $e) {
        echo "<p style='color: red;'>✗ Error: " . $e->getMessage() . "</p>";
    }
} else {
    echo "<p style='color: red;'>✗ No hay usuario autenticado</p>";
}
?>
