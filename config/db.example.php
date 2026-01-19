<?php
// Archivo: config/db.example.php
// COPIA ESTE ARCHIVO A db.php Y CONFIGURA TUS CREDENCIALES

// 1. Definición de Constantes (Con protección para no definirlas doble)
if (!defined('DB_HOST')) define('DB_HOST', 'localhost');
if (!defined('DB_PORT')) define('DB_PORT', '3307'); // Tu puerto configurado
if (!defined('DB_NAME')) define('DB_NAME', 'SDI_Gestion_Documental');
if (!defined('DB_USER')) define('DB_USER', 'root');
if (!defined('DB_PASS')) define('DB_PASS', ''); // Cambiar en producción
if (!defined('DB_CHARSET')) define('DB_CHARSET', 'utf8mb4');

// 2. Función de Conexión (Singleton simple)
if (!function_exists('getDBConnection')) {
    function getDBConnection() {
        static $pdo = null;
        if ($pdo === null) {
            try {
                $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
                $options = [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ];
                $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
            } catch (PDOException $e) {
                error_log("Connection Error: " . $e->getMessage());
                die("Error de conexión a la base de datos.");
            }
        }
        return $pdo;
    }
}

// 3. LA FUNCIÓN QUE FALTABA (executeQuery)
// Esta es la función que tus modelos están buscando desesperadamente.
if (!function_exists('executeQuery')) {
    function executeQuery($sql, $params = []) {
        try {
            $pdo = getDBConnection();
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            // --- MODO DEBUG ACTIVADO ---
            echo "<div style='background-color: #fee2e2; border: 2px solid #ef4444; color: #991b1b; padding: 1rem; margin: 1rem; font-family: sans-serif; border-radius: 0.5rem;'>";
            echo "<h2 style='margin-top:0'>🛑 Error SQL Detectado</h2>";
            echo "<p><strong>Mensaje:</strong> " . htmlspecialchars($e->getMessage()) . "</p>";
            echo "<p><strong>Ubicación:</strong> " . $e->getFile() . " en línea " . $e->getLine() . "</p>";
            echo "<hr style='border-color: #fca5a5;'>";
            echo "<p><strong>Consulta SQL intentada:</strong></p>";
            echo "<code style='background: #1f2937; color: #10b981; display: block; padding: 10px; border-radius: 4px;'>" . htmlspecialchars($sql) . "</code>";
            echo "</div>";
            die(); // Detener ejecución para ver el error
        }
    }
}
?>
