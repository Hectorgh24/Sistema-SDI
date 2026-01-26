<?php
namespace App\Controllers;

use App\Models\Usuario;
use App\Models\Rol;
use App\Middleware\Autenticacion;
use App\Middleware\Autorizacion;

/**
 * Controller: UsuarioController
 * 
 * Gestiona las operaciones CRUD de usuarios.
 * Control de acceso: Solo Administrador puede gestionar usuarios.
 * 
 * @author SDI Development Team
 * @version 2.0
 */
class UsuarioController
{
    protected $usuarioModel;
    protected $rolModel;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->usuarioModel = new Usuario();
        $this->rolModel = new Rol();
    }

    /**
     * Listar usuarios con paginación
     * GET /api/usuarios?page=1&limit=10&estado=activo&rol=Administrador
     * 
     * @return void JSON response
     */
    public function listar()
    {
        try {
            // Verificar autenticación y autorización
            Autenticacion::requerirAutenticacion();
            Autorizacion::requerirRol(Rol::ADMINISTRADOR);

            // Parámetros de paginación y filtros
            $page = max(1, (int)($_GET['page'] ?? 1));
            $limit = min(50, (int)($_GET['limit'] ?? 10)); // Máximo 50
            $offset = ($page - 1) * $limit;

            $estado = $_GET['estado'] ?? null;
            $rol = $_GET['rol'] ?? null;
            $busqueda = $_GET['busqueda'] ?? null;
            $campo = $_GET['campo'] ?? null;

            // Obtener usuarios
            $usuarios = $this->usuarioModel->listar($limit, $offset, $estado, $rol, $busqueda, $campo);
            
            // Obtener total
            $total = $this->usuarioModel->contar($estado, $rol, $busqueda, $campo);

            $data = [
                'usuarios' => $usuarios,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'pages' => ceil($total / $limit)
                ]
            ];

            response(true, 'Usuarios obtenidos', $data, 200);

        } catch (\Exception $e) {
            logger("Error listando usuarios: " . $e->getMessage(), 'ERROR');
            response(false, $e->getMessage(), null, 400);
        }
    }

    /**
     * Obtener usuario por ID
     * GET /api/usuarios/:id
     * 
     * @param int $id ID del usuario
     * @return void JSON response
     */
    public function obtener($id)
    {
        try {
            Autenticacion::requerirAutenticacion();
            Autorizacion::requerirRol(Rol::ADMINISTRADOR);

            $usuario = $this->usuarioModel->obtenerPorId((int)$id);

            if (!$usuario) {
                response(false, 'Usuario no encontrado', null, 404);
            }

            response(true, 'Usuario obtenido', $usuario, 200);

        } catch (\Exception $e) {
            logger("Error obteniendo usuario: " . $e->getMessage(), 'ERROR');
            response(false, $e->getMessage(), null, 400);
        }
    }

    /**
     * Crear nuevo usuario
     * POST /api/usuarios
     * Body JSON:
     * {
     *   "nombre": "Juan",
     *   "apellido_paterno": "Pérez",
     *   "apellido_materno": "López",
     *   "email": "juan@example.com",
     *   "password": "password123",
     *   "id_rol": 1
     * }
     * 
     * @return void JSON response
     */
    public function crear()
    {
        try {
            // Verificar autenticación y autorización
            Autenticacion::requerirAutenticacion();
            Autorizacion::requerirRol(Rol::ADMINISTRADOR);

            // Validar método HTTP
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                response(false, 'Método no permitido', null, 405);
            }

            $input = json_decode(file_get_contents('php://input'), true);

            if (!$input) {
                response(false, 'Datos inválidos', null, 400);
            }

            // Validaciones
            if (empty($input['nombre'])) {
                response(false, 'Nombre requerido', null, 400);
            }

            if (empty($input['apellido_paterno'])) {
                response(false, 'Apellido paterno requerido', null, 400);
            }

            if (empty($input['email'])) {
                response(false, 'Email requerido', null, 400);
            }

            if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
                response(false, 'Formato de email inválido', null, 400);
            }

            if (empty($input['password'])) {
                response(false, 'Contraseña requerida', null, 400);
            }

            if (strlen($input['password']) < 8) {
                response(false, 'La contraseña debe tener al menos 8 caracteres', null, 400);
            }

            if (empty($input['id_rol'])) {
                response(false, 'Rol requerido', null, 400);
            }

            // Verificar que el rol exista
            if (!$this->rolModel->obtenerPorId($input['id_rol'])) {
                response(false, 'Rol inválido', null, 400);
            }

            // Crear usuario
            $usuario = $this->usuarioModel->crear([
                'nombre'            => $input['nombre'],
                'apellido_paterno'  => $input['apellido_paterno'],
                'apellido_materno'  => $input['apellido_materno'] ?? '',
                'email'             => strtolower($input['email']),
                'password'          => $input['password'],
                'id_rol'            => $input['id_rol']
            ]);

            logger("Nuevo usuario creado: " . $usuario['email'], 'INFO');
            response(true, 'Usuario creado exitosamente', $usuario, 201);

        } catch (\Exception $e) {
            logger("Error creando usuario: " . $e->getMessage(), 'ERROR');
            response(false, $e->getMessage(), null, 400);
        }
    }

    /**
     * Actualizar usuario
     * PUT /api/usuarios/:id
     * 
     * @param int $id ID del usuario
     * @return void JSON response
     */
    public function actualizar($id)
    {
        try {
            Autenticacion::requerirAutenticacion();
            Autorizacion::requerirRol(Rol::ADMINISTRADOR);

            if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
                response(false, 'Método no permitido', null, 405);
            }

            $input = json_decode(file_get_contents('php://input'), true);

            if (!$input) {
                response(false, 'Datos inválidos', null, 400);
            }

            // Verificar que el usuario exista
            if (!$this->usuarioModel->obtenerPorId((int)$id)) {
                response(false, 'Usuario no encontrado', null, 404);
            }

            // Validaciones opcionales
            if (isset($input['email'])) {
                if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
                    response(false, 'Formato de email inválido', null, 400);
                }
            }

            if (isset($input['id_rol'])) {
                if (!$this->rolModel->obtenerPorId($input['id_rol'])) {
                    response(false, 'Rol inválido', null, 400);
                }
            }

            // Actualizar usuario
            $usuario = $this->usuarioModel->actualizar((int)$id, $input);

            logger("Usuario actualizado: " . $usuario['email'], 'INFO');
            response(true, 'Usuario actualizado exitosamente', $usuario, 200);

        } catch (\Exception $e) {
            logger("Error actualizando usuario: " . $e->getMessage(), 'ERROR');
            response(false, $e->getMessage(), null, 400);
        }
    }

    /**
     * Cambiar estado de usuario
     * PATCH /api/usuarios/:id/estado
     * Body: {"estado": "activo|inactivo|suspendido"}
     * 
     * @param int $id ID del usuario
     * @return void JSON response
     */
    public function cambiarEstado($id)
    {
        try {
            Autenticacion::requerirAutenticacion();
            Autorizacion::requerirRol(Rol::ADMINISTRADOR);

            if ($_SERVER['REQUEST_METHOD'] !== 'PATCH') {
                response(false, 'Método no permitido', null, 405);
            }

            $input = json_decode(file_get_contents('php://input'), true);

            if (!$input || empty($input['estado'])) {
                response(false, 'Estado requerido', null, 400);
            }

            $usuario = $this->usuarioModel->obtenerPorId((int)$id);

            if (!$usuario) {
                response(false, 'Usuario no encontrado', null, 404);
            }

            // Cambiar estado
            $this->usuarioModel->cambiarEstado((int)$id, $input['estado']);

            $usuarioActualizado = $this->usuarioModel->obtenerPorId((int)$id);

            logger("Estado de usuario actualizado: " . $usuario['email'] . " -> " . $input['estado'], 'INFO');
            response(true, 'Estado actualizado', $usuarioActualizado, 200);

        } catch (\Exception $e) {
            logger("Error cambiando estado: " . $e->getMessage(), 'ERROR');
            response(false, $e->getMessage(), null, 400);
        }
    }

    /**
     * Eliminar usuario (cambiar a inactivo)
     * DELETE /api/usuarios/:id
     * 
     * @param int $id ID del usuario
     * @return void JSON response
     */
    public function eliminar($id)
    {
        try {
            Autenticacion::requerirAutenticacion();
            Autorizacion::requerirRol(Rol::ADMINISTRADOR);

            if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
                response(false, 'Método no permitido', null, 405);
            }

            $usuario = $this->usuarioModel->obtenerPorId((int)$id);

            if (!$usuario) {
                response(false, 'Usuario no encontrado', null, 404);
            }

            // Evitar que se elimine a sí mismo
            if ($usuario['id_usuario'] === Autenticacion::getId()) {
                response(false, 'No puede eliminarse a sí mismo', null, 403);
            }

            // Eliminar (marcar como inactivo)
            $this->usuarioModel->eliminar((int)$id);

            logger("Usuario eliminado: " . $usuario['email'], 'INFO');
            response(true, 'Usuario eliminado', null, 200);

        } catch (\Exception $e) {
            logger("Error eliminando usuario: " . $e->getMessage(), 'ERROR');
            response(false, $e->getMessage(), null, 400);
        }
    }

    /**
     * Obtener roles disponibles
     * GET /api/usuarios/roles
     * 
     * @return void JSON response
     */
    public function roles()
    {
        try {
            Autenticacion::requerirAutenticacion();
            Autorizacion::requerirRol(Rol::ADMINISTRADOR);

            $roles = $this->rolModel->listar();

            response(true, 'Roles obtenidos', $roles, 200);

        } catch (\Exception $e) {
            logger("Error obteniendo roles: " . $e->getMessage(), 'ERROR');
            response(false, $e->getMessage(), null, 400);
        }
    }

    /**
     * Obtener estadísticas de usuarios
     * GET /api/usuarios/estadisticas
     * 
     * @return void JSON response
     */
    public function estadisticas()
    {
        try {
            Autenticacion::requerirAutenticacion();
            Autorizacion::requerirRol(Rol::ADMINISTRADOR);

            $stats = $this->usuarioModel->obtenerEstadisticas();

            response(true, 'Estadísticas obtenidas', $stats, 200);

        } catch (\Exception $e) {
            logger("Error obteniendo estadísticas: " . $e->getMessage(), 'ERROR');
            response(false, $e->getMessage(), null, 400);
        }
    }
}
?>
