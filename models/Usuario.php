<?php
/**
 * Modelo Usuario - SDI Gestión Documental
 * Maneja todas las operaciones relacionadas con usuarios
 * 
 * Seguridad: Todas las consultas usan Prepared Statements
 */

require_once __DIR__ . '/../config/autoload.php';

class Usuario {
    private $pdo;
    
    public function __construct() {
        $this->pdo = getDBConnection();
    }
    
    /**
     * Busca un usuario por email
     * 
     * @param string $email Email del usuario
     * @return array|false Datos del usuario o false si no existe
     */
    public function buscarPorEmail(string $email) {
        try {
            $sql = "SELECT u.id_usuario, u.nombre, u.apellido_paterno, u.apellido_materno, u.email, u.password_hash, 
                           u.id_rol, u.estado, u.fecha_registro,
                           r.nombre_rol, r.descripcion as rol_descripcion,
                           TRIM(CONCAT(u.nombre, ' ', u.apellido_paterno, IF(u.apellido_materno IS NOT NULL AND u.apellido_materno != '', CONCAT(' ', u.apellido_materno), ''))) as nombre_completo
                    FROM usuarios u
                    INNER JOIN roles r ON u.id_rol = r.id_rol
                    WHERE u.email = :email
                    LIMIT 1";
            
            $stmt = executeQuery($sql, ['email' => $email]);
            $usuario = $stmt->fetch();
            
            return $usuario ? $usuario : false;
            
        } catch (PDOException $e) {
            error_log("Error al buscar usuario por email: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Busca un usuario por ID
     * 
     * @param int $id_usuario ID del usuario
     * @return array|false Datos del usuario o false si no existe
     */
    public function buscarPorId(int $id_usuario) {
        try {
            $sql = "SELECT u.id_usuario, u.nombre, u.apellido_paterno, u.apellido_materno, u.email, 
                           u.id_rol, u.estado, u.fecha_registro,
                           r.nombre_rol, r.descripcion as rol_descripcion,
                           TRIM(CONCAT(u.nombre, ' ', u.apellido_paterno, IF(u.apellido_materno IS NOT NULL AND u.apellido_materno != '', CONCAT(' ', u.apellido_materno), ''))) as nombre_completo
                    FROM usuarios u
                    INNER JOIN roles r ON u.id_rol = r.id_rol
                    WHERE u.id_usuario = :id_usuario
                    LIMIT 1";
            
            $stmt = executeQuery($sql, ['id_usuario' => $id_usuario]);
            $usuario = $stmt->fetch();
            
            return $usuario ? $usuario : false;
            
        } catch (PDOException $e) {
            error_log("Error al buscar usuario por ID: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Verifica las credenciales de un usuario
     * 
     * @param string $email Email del usuario
     * @param string $password Contraseña en texto plano
     * @return array|false Datos del usuario si las credenciales son correctas, false en caso contrario
     */
    public function verificarCredenciales(string $email, string $password) {
        $usuario = $this->buscarPorEmail($email);
        
        if (!$usuario) {
            return false;
        }
        
        // Verificar que el usuario esté activo
        if ($usuario['estado'] !== ESTADO_ACTIVO) {
            return false;
        }
        
        // Verificar contraseña usando password_verify()
        if (!password_verify($password, $usuario['password_hash'])) {
            return false;
        }
        
        // Eliminar password_hash del array antes de retornar
        unset($usuario['password_hash']);
        
        return $usuario;
    }
    
    /**
     * Crea un nuevo usuario
     * 
     * @param array $datos Datos del usuario ['nombre', 'apellido_paterno', 'apellido_materno', 'email', 'password', 'id_rol']
     * @return int|false ID del usuario creado o false si hay error
     */
    public function crear(array $datos) {
        try {
            // Validar datos requeridos
            $camposRequeridos = ['nombre', 'apellido_paterno', 'email', 'password', 'id_rol'];
            foreach ($camposRequeridos as $campo) {
                if (!isset($datos[$campo]) || empty($datos[$campo])) {
                    return false;
                }
            }
            
            // Verificar que el email no exista
            if ($this->buscarPorEmail($datos['email'])) {
                return false; // Email ya existe
            }
            
            // Hash de la contraseña
            $passwordHash = password_hash($datos['password'], PASSWORD_DEFAULT);
            
            $sql = "INSERT INTO usuarios (nombre, apellido_paterno, apellido_materno, email, password_hash, id_rol, estado)
                    VALUES (:nombre, :apellido_paterno, :apellido_materno, :email, :password_hash, :id_rol, :estado)";
            
            $params = [
                'nombre' => sanitizeInput($datos['nombre']),
                'apellido_paterno' => sanitizeInput($datos['apellido_paterno']),
                'apellido_materno' => isset($datos['apellido_materno']) ? sanitizeInput($datos['apellido_materno']) : null,
                'email' => sanitizeInput($datos['email']),
                'password_hash' => $passwordHash,
                'id_rol' => validateInt($datos['id_rol']),
                'estado' => ESTADO_ACTIVO
            ];
            
            $stmt = executeQuery($sql, $params);
            
            return $this->pdo->lastInsertId();
            
        } catch (PDOException $e) {
            error_log("Error al crear usuario: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Actualiza la contraseña de un usuario
     * 
     * @param int $id_usuario ID del usuario
     * @param string $nuevaPassword Nueva contraseña en texto plano
     * @return bool True si se actualizó correctamente
     */
    public function actualizarPassword(int $id_usuario, string $nuevaPassword) {
        try {
            $passwordHash = password_hash($nuevaPassword, PASSWORD_DEFAULT);
            
            $sql = "UPDATE usuarios 
                    SET password_hash = :password_hash
                    WHERE id_usuario = :id_usuario";
            
            $params = [
                'password_hash' => $passwordHash,
                'id_usuario' => $id_usuario
            ];
            
            $stmt = executeQuery($sql, $params);
            
            return $stmt->rowCount() > 0;
            
        } catch (PDOException $e) {
            error_log("Error al actualizar contraseña: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Actualiza el estado de un usuario
     * 
     * @param int $id_usuario ID del usuario
     * @param string $estado Nuevo estado ('activo' o 'inactivo')
     * @return bool True si se actualizó correctamente
     */
    public function actualizarEstado(int $id_usuario, string $estado) {
        try {
            if (!in_array($estado, [ESTADO_ACTIVO, ESTADO_INACTIVO])) {
                return false;
            }
            
            $sql = "UPDATE usuarios 
                    SET estado = :estado
                    WHERE id_usuario = :id_usuario";
            
            $params = [
                'estado' => $estado,
                'id_usuario' => $id_usuario
            ];
            
            $stmt = executeQuery($sql, $params);
            
            return $stmt->rowCount() > 0;
            
        } catch (PDOException $e) {
            error_log("Error al actualizar estado: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Obtiene todos los usuarios (con paginación opcional)
     * 
     * @param int $limit Límite de resultados
     * @param int $offset Offset para paginación
     * @return array Lista de usuarios
     */
    public function listar(int $limit = 50, int $offset = 0) {
        try {
            $sql = "SELECT u.id_usuario, u.nombre, u.apellido_paterno, u.apellido_materno, u.email, 
                           u.id_rol, u.estado, u.fecha_registro,
                           r.nombre_rol, r.descripcion as rol_descripcion,
                           TRIM(CONCAT(u.nombre, ' ', u.apellido_paterno, IF(u.apellido_materno IS NOT NULL AND u.apellido_materno != '', CONCAT(' ', u.apellido_materno), ''))) as nombre_completo
                    FROM usuarios u
                    INNER JOIN roles r ON u.id_rol = r.id_rol
                    ORDER BY u.fecha_registro DESC
                    LIMIT :limit OFFSET :offset";
            
            $params = [
                'limit' => $limit,
                'offset' => $offset
            ];
            
            $stmt = executeQuery($sql, $params);
            
            return $stmt->fetchAll();
            
        } catch (PDOException $e) {
            error_log("Error al listar usuarios: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Cuenta el total de usuarios
     * 
     * @return int Total de usuarios
     */
    public function contar() {
        try {
            $sql = "SELECT COUNT(*) as total FROM usuarios";
            $stmt = executeQuery($sql);
            $resultado = $stmt->fetch();
            
            return (int) $resultado['total'];
            
        } catch (PDOException $e) {
            error_log("Error al contar usuarios: " . $e->getMessage());
            return 0;
        }
    }
    
    /**
     * Actualiza un usuario existente
     * 
     * @param int $id_usuario ID del usuario
     * @param array $datos Datos a actualizar ['nombre', 'apellido_paterno', 'apellido_materno', 'email', 'password', 'id_rol', 'estado']
     * @return bool True si se actualizó correctamente
     */
    public function actualizar(int $id_usuario, array $datos) {
        try {
            // Verificar que el usuario existe
            $usuarioActual = $this->buscarPorId($id_usuario);
            if (!$usuarioActual) {
                return false;
            }
            
            // Construir la consulta dinámicamente según los campos proporcionados
            $campos = [];
            $params = ['id_usuario' => $id_usuario];
            
            if (isset($datos['nombre']) && !empty($datos['nombre'])) {
                $campos[] = "nombre = :nombre";
                $params['nombre'] = sanitizeInput($datos['nombre']);
            }
            
            if (isset($datos['apellido_paterno']) && !empty($datos['apellido_paterno'])) {
                $campos[] = "apellido_paterno = :apellido_paterno";
                $params['apellido_paterno'] = sanitizeInput($datos['apellido_paterno']);
            }
            
            if (isset($datos['apellido_materno'])) {
                $campos[] = "apellido_materno = :apellido_materno";
                $params['apellido_materno'] = !empty($datos['apellido_materno']) ? sanitizeInput($datos['apellido_materno']) : null;
            }
            
            if (isset($datos['email']) && !empty($datos['email'])) {
                // Verificar que el email no esté en uso por otro usuario
                $usuarioConEmail = $this->buscarPorEmail($datos['email']);
                if ($usuarioConEmail && $usuarioConEmail['id_usuario'] != $id_usuario) {
                    return false; // Email ya está en uso
                }
                $campos[] = "email = :email";
                $params['email'] = sanitizeInput($datos['email']);
            }
            
            if (isset($datos['password']) && !empty($datos['password'])) {
                $campos[] = "password_hash = :password_hash";
                $params['password_hash'] = password_hash($datos['password'], PASSWORD_DEFAULT);
            }
            
            if (isset($datos['id_rol'])) {
                $idRol = validateInt($datos['id_rol']);
                if ($idRol) {
                    $campos[] = "id_rol = :id_rol";
                    $params['id_rol'] = $idRol;
                }
            }
            
            if (isset($datos['estado']) && in_array($datos['estado'], [ESTADO_ACTIVO, ESTADO_INACTIVO])) {
                $campos[] = "estado = :estado";
                $params['estado'] = $datos['estado'];
            }
            
            if (empty($campos)) {
                return false; // No hay nada que actualizar
            }
            
            $sql = "UPDATE usuarios SET " . implode(", ", $campos) . " WHERE id_usuario = :id_usuario";
            $stmt = executeQuery($sql, $params);
            
            return $stmt->rowCount() > 0;
            
        } catch (PDOException $e) {
            error_log("Error al actualizar usuario: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Elimina un usuario (cambia su estado a inactivo)
     * 
     * @param int $id_usuario ID del usuario
     * @return bool True si se eliminó correctamente
     */
    public function eliminar(int $id_usuario) {
        return $this->actualizarEstado($id_usuario, ESTADO_INACTIVO);
    }
    
    /**
     * Obtiene todos los roles disponibles
     * 
     * @return array Lista de roles
     */
    public function obtenerRoles() {
        try {
            $sql = "SELECT id_rol, nombre_rol, descripcion FROM roles ORDER BY id_rol";
            $stmt = executeQuery($sql);
            return $stmt->fetchAll();
            
        } catch (PDOException $e) {
            error_log("Error al obtener roles: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Busca usuarios con filtros y paginación
     * 
     * @param array $filtros Filtros de búsqueda ['busqueda', 'rol', 'estado']
     * @param int $limit Límite de resultados
     * @param int $offset Offset para paginación
     * @return array Lista de usuarios
     */
    public function buscar(array $filtros = [], int $limit = 50, int $offset = 0) {
        try {
            $sql = "SELECT u.id_usuario, u.nombre, u.apellido_paterno, u.apellido_materno, u.email, 
                           u.id_rol, u.estado, u.fecha_registro,
                           r.nombre_rol, r.descripcion as rol_descripcion,
                           TRIM(CONCAT(u.nombre, ' ', u.apellido_paterno, IF(u.apellido_materno IS NOT NULL AND u.apellido_materno != '', CONCAT(' ', u.apellido_materno), ''))) as nombre_completo
                    FROM usuarios u
                    INNER JOIN roles r ON u.id_rol = r.id_rol
                    WHERE 1=1";
            
            $params = [];
            
            // Filtro de búsqueda (nombre completo o email)
            if (!empty($filtros['busqueda'])) {
                $sql .= " AND (TRIM(CONCAT(u.nombre, ' ', u.apellido_paterno, IF(u.apellido_materno IS NOT NULL AND u.apellido_materno != '', CONCAT(' ', u.apellido_materno), ''))) LIKE :busqueda 
                          OR u.email LIKE :busqueda 
                          OR u.nombre LIKE :busqueda 
                          OR u.apellido_paterno LIKE :busqueda)";
                $params['busqueda'] = '%' . sanitizeInput($filtros['busqueda']) . '%';
            }
            
            // Filtro por rol
            if (!empty($filtros['rol'])) {
                $idRol = validateInt($filtros['rol']);
                if ($idRol) {
                    $sql .= " AND u.id_rol = :id_rol";
                    $params['id_rol'] = $idRol;
                }
            }
            
            // Filtro por estado
            if (!empty($filtros['estado']) && in_array($filtros['estado'], [ESTADO_ACTIVO, ESTADO_INACTIVO])) {
                $sql .= " AND u.estado = :estado";
                $params['estado'] = $filtros['estado'];
            }
            
            $sql .= " ORDER BY u.fecha_registro DESC LIMIT :limit OFFSET :offset";
            $params['limit'] = $limit;
            $params['offset'] = $offset;
            
            $stmt = executeQuery($sql, $params);
            return $stmt->fetchAll();
            
        } catch (PDOException $e) {
            error_log("Error al buscar usuarios: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Cuenta usuarios con filtros
     * 
     * @param array $filtros Filtros de búsqueda
     * @return int Total de usuarios
     */
    public function contarConFiltros(array $filtros = []) {
        try {
            $sql = "SELECT COUNT(*) as total FROM usuarios u WHERE 1=1";
            $params = [];
            
            if (!empty($filtros['busqueda'])) {
                $sql .= " AND (TRIM(CONCAT(u.nombre, ' ', u.apellido_paterno, IF(u.apellido_materno IS NOT NULL AND u.apellido_materno != '', CONCAT(' ', u.apellido_materno), ''))) LIKE :busqueda 
                          OR u.email LIKE :busqueda 
                          OR u.nombre LIKE :busqueda 
                          OR u.apellido_paterno LIKE :busqueda)";
                $params['busqueda'] = '%' . sanitizeInput($filtros['busqueda']) . '%';
            }
            
            if (!empty($filtros['rol'])) {
                $idRol = validateInt($filtros['rol']);
                if ($idRol) {
                    $sql .= " AND u.id_rol = :id_rol";
                    $params['id_rol'] = $idRol;
                }
            }
            
            if (!empty($filtros['estado']) && in_array($filtros['estado'], [ESTADO_ACTIVO, ESTADO_INACTIVO])) {
                $sql .= " AND u.estado = :estado";
                $params['estado'] = $filtros['estado'];
            }
            
            $stmt = executeQuery($sql, $params);
            $resultado = $stmt->fetch();
            
            return (int) $resultado['total'];
            
        } catch (PDOException $e) {
            error_log("Error al contar usuarios con filtros: " . $e->getMessage());
            return 0;
        }
    }
}

