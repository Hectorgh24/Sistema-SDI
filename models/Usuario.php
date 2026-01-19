<?php
namespace App\Models;

use PDO;
use PDOException;

/**
 * Model: Usuario
 * 
 * Gestiona todas las operaciones CRUD para usuarios del sistema.
 * Implementa validaciones y control de acceso por rol.
 * 
 * Estados de usuario: activo | inactivo | suspendido
 * 
 * @author SDI Development Team
 * @version 2.0
 */
class Usuario
{
    protected $db;
    protected const TABLE = 'usuarios';

    /**
     * Constructor - Inyección de dependencias
     * 
     * @param PDO $db Conexión a base de datos
     */
    public function __construct(PDO $db = null)
    {
        $this->db = $db ?? getDBConnection();
    }

    /**
     * Obtener usuario por ID
     * 
     * @param int $id_usuario ID del usuario
     * @return array|null Datos del usuario o null si no existe
     */
    public function obtenerPorId($id_usuario)
    {
        $sql = "SELECT u.id_usuario, u.nombre, u.apellido_paterno, u.apellido_materno,
                       u.email, u.estado, u.fecha_registro, u.password_hash, r.nombre_rol, r.id_rol
                FROM " . self::TABLE . " u
                JOIN roles r ON u.id_rol = r.id_rol
                WHERE u.id_usuario = :id";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id_usuario]);
        
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    /**
     * Obtener usuario por email
     * 
     * @param string $email Email del usuario
     * @return array|null Datos del usuario
     */
    public function obtenerPorEmail($email)
    {
        try {
            logger("MODEL: Buscando usuario en BD con email: $email", 'DEBUG');
            
            $sql = "SELECT u.*, r.nombre_rol, r.id_rol
                    FROM " . self::TABLE . " u
                    JOIN roles r ON u.id_rol = r.id_rol
                    WHERE u.email = :email";

            logger("MODEL: SQL Query preparada para email", 'DEBUG');
            
            $stmt = $this->db->prepare($sql);
            logger("MODEL: Ejecutando query con email: $email", 'DEBUG');
            $stmt->execute([':email' => $email]);
            
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result) {
                logger("MODEL: ✓ Usuario encontrado en BD - ID: " . $result['id_usuario'] . ", nombre: " . ($result['nombre'] ?? 'NULL') . ", estado: " . $result['estado'], 'DEBUG');
                // Log de campos para debug
                logger("MODEL: Campos del usuario: " . json_encode(array_keys($result)), 'DEBUG');
            } else {
                logger("MODEL: ✗ Usuario NO encontrado en BD para email: $email", 'DEBUG');
            }
            
            return $result ?: null;
            
        } catch (PDOException $e) {
            logger("MODEL: Error BD al obtener usuario por email - " . $e->getMessage(), 'ERROR', ['email' => $email, 'code' => $e->getCode()]);
            return null;
        }
    }

    /**
     * Listar todos los usuarios con paginación y filtros
     * 
     * @param int $limit Límite de registros por página
     * @param int $offset Desplazamiento
     * @param string $estado Filtrar por estado (opcional)
     * @param string $rol Filtrar por rol (opcional)
     * @return array Arreglo de usuarios
     */
    public function listar($limit = 10, $offset = 0, $estado = null, $rol = null)
    {
        $sql = "SELECT u.id_usuario, u.nombre, u.apellido_paterno, u.apellido_materno,
                       u.email, u.estado, u.fecha_registro, r.nombre_rol
                FROM " . self::TABLE . " u
                JOIN roles r ON u.id_rol = r.id_rol
                WHERE 1=1";

        $params = [];

        if ($estado !== null) {
            $sql .= " AND u.estado = :estado";
            $params[':estado'] = $estado;
        }

        if ($rol !== null) {
            $sql .= " AND r.nombre_rol = :rol";
            $params[':rol'] = $rol;
        }

        $sql .= " ORDER BY u.fecha_registro DESC LIMIT :limit OFFSET :offset";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }

        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Contar total de usuarios con filtros opcionales
     * 
     * @param string $estado Filtrar por estado
     * @param string $rol Filtrar por rol
     * @return int Total de usuarios
     */
    public function contar($estado = null, $rol = null)
    {
        $sql = "SELECT COUNT(*) as total FROM " . self::TABLE . " u
                JOIN roles r ON u.id_rol = r.id_rol WHERE 1=1";

        $params = [];

        if ($estado !== null) {
            $sql .= " AND u.estado = :estado";
            $params[':estado'] = $estado;
        }

        if ($rol !== null) {
            $sql .= " AND r.nombre_rol = :rol";
            $params[':rol'] = $rol;
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return (int)($result['total'] ?? 0);
    }

    /**
     * Crear nuevo usuario
     * 
     * @param array $data Datos del usuario
     *   - nombre (requerido)
     *   - apellido_paterno (requerido)
     *   - apellido_materno (opcional)
     *   - email (requerido)
     *   - password (requerido, será hasheado)
     *   - id_rol (requerido)
     * 
     * @return array|false Datos del usuario creado o false
     * @throws Exception Si falta información requerida
     */
    public function crear($data)
    {
        // Validaciones
        $required = ['nombre', 'apellido_paterno', 'email', 'password', 'id_rol'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new \Exception("Campo requerido faltante: $field");
            }
        }

        // Verificar que el email sea único
        if ($this->obtenerPorEmail($data['email'])) {
            throw new \Exception("El email ya está registrado");
        }

        // Verificar que el rol exista
        $rolesModel = new Rol($this->db);
        if (!$rolesModel->obtenerPorId($data['id_rol'])) {
            throw new \Exception("Rol inválido");
        }

        try {
            $this->db->beginTransaction();

            // Hash de la contraseña con BCRYPT
            $passwordHash = password_hash($data['password'], PASSWORD_BCRYPT, ['cost' => 10]);

            $sql = "INSERT INTO " . self::TABLE . "
                    (id_rol, nombre, apellido_paterno, apellido_materno, email, password_hash, estado)
                    VALUES (:id_rol, :nombre, :apellido_paterno, :apellido_materno, :email, :password_hash, :estado)";

            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                ':id_rol'              => $data['id_rol'],
                ':nombre'              => trim($data['nombre']),
                ':apellido_paterno'    => trim($data['apellido_paterno']),
                ':apellido_materno'    => trim($data['apellido_materno'] ?? ''),
                ':email'               => strtolower(trim($data['email'])),
                ':password_hash'       => $passwordHash,
                ':estado'              => 'activo'
            ]);

            $id_usuario = $this->db->lastInsertId();
            $this->db->commit();

            // Retornar datos del usuario creado (sin contraseña)
            return $this->obtenerPorId($id_usuario);

        } catch (PDOException $e) {
            $this->db->rollBack();
            logger("Error creando usuario: " . $e->getMessage(), 'ERROR');
            throw new \Exception("Error al crear usuario");
        }
    }

    /**
     * Actualizar usuario
     * 
     * @param int $id_usuario ID del usuario
     * @param array $data Datos a actualizar
     * @return array|false Datos actualizados
     */
    public function actualizar($id_usuario, $data)
    {
        try {
            $this->db->beginTransaction();

            // Campos que se pueden actualizar
            $updatable = ['nombre', 'apellido_paterno', 'apellido_materno', 'email', 'estado', 'id_rol'];
            $updates = [];
            $params = [':id' => $id_usuario];

            foreach ($data as $key => $value) {
                if (in_array($key, $updatable) && $value !== null) {
                    if ($key === 'email') {
                        // Verificar unicidad del email
                        $existing = $this->db->prepare(
                            "SELECT id_usuario FROM " . self::TABLE . " WHERE email = :email AND id_usuario != :id"
                        );
                        $existing->execute([':email' => $value, ':id' => $id_usuario]);
                        if ($existing->fetch()) {
                            throw new \Exception("El email ya está en uso");
                        }
                        $value = strtolower(trim($value));
                    }
                    
                    $updates[] = "$key = :$key";
                    $params[":$key"] = is_string($value) ? trim($value) : $value;
                }
            }

            if (empty($updates)) {
                return $this->obtenerPorId($id_usuario);
            }

            $sql = "UPDATE " . self::TABLE . " SET " . implode(', ', $updates) . " WHERE id_usuario = :id";
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            $this->db->commit();
            return $this->obtenerPorId($id_usuario);

        } catch (PDOException $e) {
            $this->db->rollBack();
            logger("Error actualizando usuario: " . $e->getMessage(), 'ERROR');
            throw new \Exception("Error al actualizar usuario");
        }
    }

    /**
     * Cambiar contraseña de usuario
     * 
     * @param int $id_usuario ID del usuario
     * @param string $password_actual Contraseña actual
     * @param string $password_nueva Nueva contraseña
     * @return bool True si se cambió exitosamente
     */
    public function cambiarPassword($id_usuario, $password_actual, $password_nueva)
    {
        $usuario = $this->obtenerPorId($id_usuario);
        if (!$usuario) {
            throw new \Exception("Usuario no encontrado");
        }

        // Verificar contraseña actual
        if (!password_verify($password_actual, $usuario['password_hash'] ?? '')) {
            throw new \Exception("Contraseña actual incorrecta");
        }

        $passwordHash = password_hash($password_nueva, PASSWORD_BCRYPT, ['cost' => 10]);

        $sql = "UPDATE " . self::TABLE . " SET password_hash = :password WHERE id_usuario = :id";
        $stmt = $this->db->prepare($sql);
        
        return $stmt->execute([
            ':password' => $passwordHash,
            ':id' => $id_usuario
        ]);
    }

    /**
     * Verificar contraseña de usuario
     * 
     * @param string $password Contraseña en texto plano
     * @param string $hash Hash almacenado
     * @return bool True si la contraseña es correcta
     */
    public function verificarPassword($password, $hash)
    {
        return password_verify($password, $hash);
    }

    /**
     * Eliminar usuario (cambiar a inactivo)
     * 
     * @param int $id_usuario ID del usuario
     * @return bool True si se eliminó exitosamente
     */
    public function eliminar($id_usuario)
    {
        // En lugar de eliminar físicamente, marcar como inactivo
        $sql = "UPDATE " . self::TABLE . " SET estado = :estado WHERE id_usuario = :id";
        $stmt = $this->db->prepare($sql);
        
        return $stmt->execute([
            ':estado' => 'inactivo',
            ':id' => $id_usuario
        ]);
    }

    /**
     * Cambiar estado de usuario
     * 
     * @param int $id_usuario ID del usuario
     * @param string $estado Nuevo estado: activo | inactivo | suspendido
     * @return bool True si cambió exitosamente
     */
    public function cambiarEstado($id_usuario, $estado)
    {
        $estados_validos = ['activo', 'inactivo', 'suspendido'];
        
        if (!in_array($estado, $estados_validos)) {
            throw new \Exception("Estado inválido: $estado");
        }

        $sql = "UPDATE " . self::TABLE . " SET estado = :estado WHERE id_usuario = :id";
        $stmt = $this->db->prepare($sql);
        
        return $stmt->execute([
            ':estado' => $estado,
            ':id' => $id_usuario
        ]);
    }

    /**
     * Obtener estadísticas de usuarios
     * 
     * @return array Estadísticas generales
     */
    public function obtenerEstadisticas()
    {
        $sql = "SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN estado = 'activo' THEN 1 ELSE 0 END) as activos,
                    SUM(CASE WHEN estado = 'inactivo' THEN 1 ELSE 0 END) as inactivos,
                    SUM(CASE WHEN estado = 'suspendido' THEN 1 ELSE 0 END) as suspendidos
                FROM " . self::TABLE;

        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
?>
