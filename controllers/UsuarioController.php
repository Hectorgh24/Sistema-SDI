<?php
/**
 * Controlador de Usuarios - SDI Gestión Documental
 * Maneja el CRUD completo de usuarios
 * 
 * Seguridad: Solo Administrador puede acceder
 */

require_once __DIR__ . '/../config/autoload.php';
require_once __DIR__ . '/../models/Usuario.php';

class UsuarioController {
    private $usuarioModel;
    
    public function __construct() {
        // Requerir autenticación y rol de Administrador
        requireAuth();
        requireRole(ROL_ADMINISTRADOR);
        
        $this->usuarioModel = new Usuario();
    }
    
    /**
     * Lista todos los usuarios con búsqueda y paginación
     */
    public function index() {
        // Obtener parámetros de búsqueda y paginación
        $busqueda = getGet('busqueda', '');
        $rolFiltro = getGet('rol', '');
        $estadoFiltro = getGet('estado', '');
        $pagina = max(1, (int)getGet('pagina', 1));
        $porPagina = 10;
        $offset = ($pagina - 1) * $porPagina;
        
        // Construir filtros
        $filtros = [];
        if (!empty($busqueda)) {
            $filtros['busqueda'] = $busqueda;
        }
        if (!empty($rolFiltro)) {
            $filtros['rol'] = $rolFiltro;
        }
        if (!empty($estadoFiltro)) {
            $filtros['estado'] = $estadoFiltro;
        }
        
        // Obtener usuarios
        $usuarios = $this->usuarioModel->buscar($filtros, $porPagina, $offset);
        $totalUsuarios = $this->usuarioModel->contarConFiltros($filtros);
        $totalPaginas = ceil($totalUsuarios / $porPagina);
        
        // Obtener roles para el filtro
        $roles = $this->usuarioModel->obtenerRoles();
        
        // Mensajes de éxito/error
        $mensaje = getGet('mensaje', '');
        $error = getGet('error', '');
        
        require_once __DIR__ . '/../views/usuarios/index.php';
    }
    
    /**
     * Muestra el formulario para crear o editar usuario
     */
    public function formulario() {
        $id = getGet('id', 0);
        $usuario = null;
        $roles = $this->usuarioModel->obtenerRoles();
        
        // Si hay ID, es edición
        if ($id > 0) {
            $usuario = $this->usuarioModel->buscarPorId($id);
            if (!$usuario) {
                header('Location: /usuarios.php?error=' . urlencode('Usuario no encontrado'));
                exit;
            }
        }
        
        require_once __DIR__ . '/../views/usuarios/formulario.php';
    }
    
    /**
     * Procesa la creación de un nuevo usuario
     */
    public function crear() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            header('Location: /usuarios.php');
            exit;
        }
        
        // Validar datos
        $errores = $this->validarDatosUsuario();
        
        if (!empty($errores)) {
            $_SESSION['errores_usuario'] = $errores;
            $_SESSION['datos_usuario'] = $_POST;
            header('Location: /usuarios.php?accion=formulario');
            exit;
        }
        
        // Preparar datos
        $datos = [
            'nombre' => getPost('nombre'),
            'apellido_paterno' => getPost('apellido_paterno'),
            'apellido_materno' => getPost('apellido_materno', ''),
            'email' => getPost('email'),
            'password' => getPost('password'),
            'id_rol' => getPost('id_rol'),
            'estado' => getPost('estado', ESTADO_ACTIVO)
        ];
        
        // Crear usuario
        $idUsuario = $this->usuarioModel->crear($datos);
        
        if ($idUsuario) {
            header('Location: /usuarios.php?mensaje=' . urlencode('Usuario creado correctamente'));
        } else {
            header('Location: /usuarios.php?error=' . urlencode('Error al crear el usuario. El email puede estar en uso.'));
        }
        exit;
    }
    
    /**
     * Procesa la actualización de un usuario
     */
    public function actualizar() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            header('Location: /usuarios.php');
            exit;
        }
        
        $id = (int)getPost('id_usuario');
        
        if ($id <= 0) {
            header('Location: /usuarios.php?error=' . urlencode('ID de usuario inválido'));
            exit;
        }
        
        // Validar datos (sin requerir password)
        $errores = $this->validarDatosUsuario($id, false);
        
        if (!empty($errores)) {
            $_SESSION['errores_usuario'] = $errores;
            $_SESSION['datos_usuario'] = $_POST;
            header('Location: /usuarios.php?accion=formulario&id=' . $id);
            exit;
        }
        
        // Preparar datos
        $datos = [
            'nombre' => getPost('nombre'),
            'apellido_paterno' => getPost('apellido_paterno'),
            'apellido_materno' => getPost('apellido_materno', ''),
            'email' => getPost('email'),
            'id_rol' => getPost('id_rol'),
            'estado' => getPost('estado', ESTADO_ACTIVO)
        ];
        
        // Si se proporcionó una nueva contraseña, agregarla
        $password = getPost('password');
        if (!empty($password)) {
            $datos['password'] = $password;
        }
        
        // Actualizar usuario
        $exito = $this->usuarioModel->actualizar($id, $datos);
        
        if ($exito) {
            header('Location: /usuarios.php?mensaje=' . urlencode('Usuario actualizado correctamente'));
        } else {
            header('Location: /usuarios.php?error=' . urlencode('Error al actualizar el usuario. El email puede estar en uso.'));
        }
        exit;
    }
    
    /**
     * Elimina un usuario (cambia estado a inactivo)
     */
    public function eliminar() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            header('Location: /usuarios.php');
            exit;
        }
        
        $id = (int)getPost('id_usuario');
        
        if ($id <= 0) {
            header('Location: /usuarios.php?error=' . urlencode('ID de usuario inválido'));
            exit;
        }
        
        // No permitir eliminar el propio usuario
        if ($id == $_SESSION['usuario_id']) {
            header('Location: /usuarios.php?error=' . urlencode('No puedes eliminar tu propio usuario'));
            exit;
        }
        
        $exito = $this->usuarioModel->eliminar($id);
        
        if ($exito) {
            header('Location: /usuarios.php?mensaje=' . urlencode('Usuario eliminado correctamente'));
        } else {
            header('Location: /usuarios.php?error=' . urlencode('Error al eliminar el usuario'));
        }
        exit;
    }
    
    /**
     * Valida los datos del formulario de usuario
     * 
     * @param int|null $idUsuario ID del usuario (para edición)
     * @param bool $requerirPassword Si true, la contraseña es requerida
     * @return array Array de errores
     */
    private function validarDatosUsuario(?int $idUsuario = null, bool $requerirPassword = true): array {
        $errores = [];
        
        // Validar nombre
        $nombre = getPost('nombre');
        if (empty($nombre)) {
            $errores[] = 'El nombre es requerido';
        } elseif (strlen($nombre) < 2) {
            $errores[] = 'El nombre debe tener al menos 2 caracteres';
        } elseif (strlen($nombre) > 60) {
            $errores[] = 'El nombre no puede exceder 60 caracteres';
        }
        
        // Validar apellido paterno
        $apellidoPaterno = getPost('apellido_paterno');
        if (empty($apellidoPaterno)) {
            $errores[] = 'El apellido paterno es requerido';
        } elseif (strlen($apellidoPaterno) < 2) {
            $errores[] = 'El apellido paterno debe tener al menos 2 caracteres';
        } elseif (strlen($apellidoPaterno) > 60) {
            $errores[] = 'El apellido paterno no puede exceder 60 caracteres';
        }
        
        // Validar apellido materno (opcional)
        $apellidoMaterno = getPost('apellido_materno', '');
        if (!empty($apellidoMaterno) && strlen($apellidoMaterno) > 60) {
            $errores[] = 'El apellido materno no puede exceder 60 caracteres';
        }
        
        // Validar email
        $email = getPost('email');
        if (empty($email)) {
            $errores[] = 'El email es requerido';
        } elseif (!validateEmail($email)) {
            $errores[] = 'El email no es válido';
        } else {
            // Verificar que el email no esté en uso (excepto si es el mismo usuario)
            $usuarioExistente = $this->usuarioModel->buscarPorEmail($email);
            if ($usuarioExistente && ($idUsuario === null || $usuarioExistente['id_usuario'] != $idUsuario)) {
                $errores[] = 'El email ya está en uso';
            }
        }
        
        // Validar contraseña
        $password = getPost('password');
        if ($requerirPassword || !empty($password)) {
            if (empty($password)) {
                $errores[] = 'La contraseña es requerida';
            } elseif (strlen($password) < 6) {
                $errores[] = 'La contraseña debe tener al menos 6 caracteres';
            }
        }
        
        // Validar rol
        $idRol = getPost('id_rol');
        if (empty($idRol)) {
            $errores[] = 'El rol es requerido';
        } else {
            $idRol = validateInt($idRol);
            if (!$idRol) {
                $errores[] = 'El rol seleccionado no es válido';
            }
        }
        
        // Validar estado
        $estado = getPost('estado', ESTADO_ACTIVO);
        if (!in_array($estado, [ESTADO_ACTIVO, ESTADO_INACTIVO])) {
            $errores[] = 'El estado no es válido';
        }
        
        return $errores;
    }
}

