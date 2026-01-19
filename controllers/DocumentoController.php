<?php
namespace App\Controllers;

use App\Models\Documento;
use App\Models\Categoria;
use App\Models\Carpeta;
use App\Models\Rol;
use App\Middleware\Autenticacion;
use App\Middleware\Autorizacion;

/**
 * Controller: DocumentoController
 * 
 * Gestiona las operaciones CRUD de documentos.
 * Control de acceso: Administrativo y Estudiantes (sus propios documentos)
 * 
 * @author SDI Development Team
 * @version 2.0
 */
class DocumentoController
{
    protected $documentoModel;
    protected $categoriaModel;
    protected $carpetaModel;

    public function __construct()
    {
        $this->documentoModel = new Documento();
        $this->categoriaModel = new Categoria();
        $this->carpetaModel = new Carpeta();
    }

    /**
     * Listar documentos con paginación
     * GET /api/documentos?page=1&limit=10&estado_gestion=pendiente
     */
    public function listar()
    {
        try {
            Autenticacion::requerirAutenticacion();

            $page = max(1, (int)($_GET['page'] ?? 1));
            $limit = min(50, (int)($_GET['limit'] ?? 10));
            $offset = ($page - 1) * $limit;

            $filtros = [];

            if (!empty($_GET['estado_gestion'])) {
                $filtros['estado_gestion'] = $_GET['estado_gestion'];
            }

            if (!empty($_GET['estado_respaldo'])) {
                $filtros['estado_respaldo'] = $_GET['estado_respaldo'];
            }

            if (!empty($_GET['id_carpeta'])) {
                $filtros['id_carpeta'] = (int)$_GET['id_carpeta'];
            }

            if (!empty($_GET['id_categoria'])) {
                $filtros['id_categoria'] = (int)$_GET['id_categoria'];
            }

            // Estudiantes solo ven sus propios documentos
            if (Autorizacion::esEstudiante()) {
                $filtros['id_usuario_captura'] = Autenticacion::getId();
            }

            $documentos = $this->documentoModel->listar($filtros, $limit, $offset);
            $total = $this->documentoModel->contarConFiltros($filtros);

            $data = [
                'documentos' => $documentos,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'pages' => ceil($total / $limit)
                ]
            ];

            response(true, 'Documentos obtenidos', $data, 200);

        } catch (\Exception $e) {
            logger("Error listando documentos: " . $e->getMessage(), 'ERROR');
            response(false, $e->getMessage(), null, 400);
        }
    }

    /**
     * Obtener documento por ID
     * GET /api/documentos/:id
     */
    /**
     * Obtener documentos por carpeta
     * GET /api/documentos/por-carpeta/:id_carpeta
     */
    public function porCarpeta($id_carpeta)
    {
        try {
            Autenticacion::requerirAutenticacion();

            $id_carpeta = (int)$id_carpeta;

            if ($id_carpeta <= 0) {
                response(false, 'ID de carpeta inválido', null, 400);
            }

            // Verificar que la carpeta existe
            if (!$this->carpetaModel->obtenerPorId($id_carpeta)) {
                response(false, 'Carpeta no encontrada', null, 404);
            }

            // Obtener documentos de la carpeta
            $documentos = $this->documentoModel->listarPorCarpeta($id_carpeta);

            response(true, 'Documentos obtenidos', $documentos, 200);

        } catch (\Exception $e) {
            logger("Error obteniendo documentos por carpeta: " . $e->getMessage(), 'ERROR');
            response(false, $e->getMessage(), null, 400);
        }
    }

    /**
     * Obtener documento por ID
     */
    public function obtener($id)
    {
        try {
            Autenticacion::requerirAutenticacion();

            $documento = $this->documentoModel->obtenerPorId((int)$id);

            if (!$documento) {
                response(false, 'Documento no encontrado', null, 404);
            }

            // Estudiantes solo pueden ver sus propios documentos
            if (Autorizacion::esEstudiante() && $documento['id_usuario_captura'] !== Autenticacion::getId()) {
                response(false, 'No tiene permisos', null, 403);
            }

            response(true, 'Documento obtenido', $documento, 200);

        } catch (\Exception $e) {
            logger("Error obteniendo documento: " . $e->getMessage(), 'ERROR');
            response(false, $e->getMessage(), null, 400);
        }
    }

    /**
     * Crear nuevo documento
     * POST /api/documentos/crear
     * Soporta multipart/form-data con archivos adjuntos
     */
    public function crear()
    {
        try {
            Autenticacion::requerirAutenticacion();
            Autorizacion::requerirAcceso('crear_documento');

            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                response(false, 'Método no permitido', null, 405);
            }

            // Detectar si es JSON o multipart
            $isMultipart = strpos($_SERVER['CONTENT_TYPE'] ?? '', 'multipart/form-data') !== false;

            if ($isMultipart) {
                // Procesar multipart/form-data (con archivo)
                return $this->crearDocumentoConArchivo();
            } else {
                // Procesar JSON
                return $this->crearDocumentoJSON();
            }
        } catch (\Exception $e) {
            logger("Error creando documento: " . $e->getMessage(), 'ERROR');
            response(false, $e->getMessage(), null, 400);
        }
    }

    /**
     * Crear documento desde JSON (REFACTORIZADO - SIMPLE)
     * @private
     */
    private function crearDocumentoJSON()
    {
        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input) {
            response(false, 'Datos inválidos', null, 400);
        }

        // Validaciones de campos requeridos
        $camposRequeridos = ['no_oficio', 'id_carpeta', 'emitido_por', 'fecha_documento', 'descripcion', 'capturado_por'];
        foreach ($camposRequeridos as $campo) {
            if (empty($input[$campo]) && $input[$campo] !== '0') {
                response(false, "Campo requerido: $campo", null, 400);
            }
        }

        // Validar que la carpeta exista
        if (!$this->carpetaModel->obtenerPorId((int)$input['id_carpeta'])) {
            response(false, 'Carpeta inválida', null, 400);
        }

        // Validar unicidad de No. Oficio
        $existente = $this->documentoModel->obtenerPorNumeroOficio($input['no_oficio']);
        if ($existente) {
            response(false, 'El número de oficio ya existe', null, 400);
        }

        // Validar fecha de oficio no sea en el futuro
        $hoy = date('Y-m-d');
        if ($input['fecha_documento'] > $hoy) {
            response(false, 'La fecha del oficio no puede ser en el futuro', null, 400);
        }

        // Crear documento
        $id_documento = $this->documentoModel->crearDocumentoSimple([
            'no_oficio'              => trim($input['no_oficio']),
            'id_carpeta'             => (int)$input['id_carpeta'],
            'auditoria'              => trim($input['auditoria'] ?? ''),
            'emitido_por'            => trim($input['emitido_por']),
            'fecha_documento'        => $input['fecha_documento'],
            'fecha_archivo'          => date('Y-m-d'), // Automático
            'descripcion'            => trim($input['descripcion']),
            'capturado_por'          => trim($input['capturado_por']),
            'id_usuario_captura'     => Autenticacion::getId()
        ]);

        if (!$id_documento) {
            response(false, 'Error al crear documento', null, 500);
        }

        $documento = $this->documentoModel->obtenerDocumentoSimple($id_documento);

        logger("Documento creado: ID $id_documento, No. Oficio: {$input['no_oficio']}", 'INFO');
        response(true, 'Documento registrado correctamente', $documento, 201);
    }

    /**
     * Crear documento desde multipart/form-data (con archivo)
     * @private
     */
    private function crearDocumentoConArchivo()
    {
        // Validaciones básicas
        if (empty($_POST['id_carpeta'])) {
            response(false, 'Carpeta requerida', null, 400);
        }

        if (empty($_POST['fecha_documento'])) {
            response(false, 'Fecha del documento requerida', null, 400);
        }

        $id_categoria = $_POST['id_categoria'] ?? null;
        if (!$id_categoria || !$this->categoriaModel->obtenerPorId($id_categoria)) {
            response(false, 'Categoría inválida', null, 400);
        }

        $id_carpeta = (int)$_POST['id_carpeta'];
        if (!$this->carpetaModel->obtenerPorId($id_carpeta)) {
            response(false, 'Carpeta inválida', null, 400);
        }

        // Crear documento
        $id_documento = $this->documentoModel->crear([
            'id_categoria'      => $id_categoria,
            'id_carpeta'        => $id_carpeta,
            'id_usuario_captura' => Autenticacion::getId(),
            'fecha_documento'   => $_POST['fecha_documento'],
            'valores'           => []
        ]);

        if (!$id_documento) {
            response(false, 'Error al crear documento', null, 500);
        }

        // Procesar valores dinámicos si existen
        if (!empty($_POST['valores_dinamicos'])) {
            try {
                $valoresDinamicos = json_decode($_POST['valores_dinamicos'], true);
                if (is_array($valoresDinamicos)) {
                    // Actualizar documento con valores
                    $this->documentoModel->actualizar($id_documento, [
                        'valores' => $valoresDinamicos
                    ]);
                }
            } catch (\Exception $e) {
                logger("Error procesando valores dinámicos: " . $e->getMessage(), 'ERROR');
            }
        }

        // Procesar archivo adjunto si existe
        if (!empty($_FILES['archivo']) && $_FILES['archivo']['error'] === UPLOAD_ERR_OK) {
            try {
                $this->guardarArchivoAdjunto($id_documento, $_FILES['archivo']);
            } catch (\Exception $e) {
                logger("Error guardando archivo: " . $e->getMessage(), 'WARNING');
                // No fallar si falla el archivo, el documento ya está creado
            }
        }

        $documento = $this->documentoModel->obtenerPorId($id_documento);

        logger("Documento creado con archivo: ID $id_documento", 'INFO');
        response(true, 'Documento creado', $documento, 201);
    }

    /**
     * Guardar archivo adjunto
     * @private
     */
    private function guardarArchivoAdjunto($id_documento, $archivo)
    {
        // Validaciones de archivo
        $extensionesPermitidas = ['pdf', 'jpg', 'jpeg', 'png', 'docx', 'doc'];
        $tiposPermitidos = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword'
        ];

        $nombreArchivo = $archivo['name'];
        $ext = strtolower(pathinfo($nombreArchivo, PATHINFO_EXTENSION));
        $tipoMime = $archivo['type'];

        if (!in_array($ext, $extensionesPermitidas)) {
            throw new \Exception("Tipo de archivo no permitido");
        }

        if (!in_array($tipoMime, $tiposPermitidos)) {
            throw new \Exception("MIME type no permitido");
        }

        if ($archivo['size'] > 10 * 1024 * 1024) { // 10MB máx
            throw new \Exception("Archivo muy grande (máx 10MB)");
        }

        // Crear directorio de uploads si no existe
        $uploadsDir = APP_ROOT . '/public/uploads';
        if (!is_dir($uploadsDir)) {
            mkdir($uploadsDir, 0755, true);
        }

        // Generar nombre único para el archivo
        $nombreBase = 'doc_' . $id_documento . '_' . time();
        $rutaArchivo = $uploadsDir . '/' . $nombreBase . '.' . $ext;
        $rutaRelativa = '/public/uploads/' . $nombreBase . '.' . $ext;

        // Mover archivo
        if (!move_uploaded_file($archivo['tmp_name'], $rutaArchivo)) {
            throw new \Exception("Error al guardar archivo");
        }

        // Registrar en BD
        $success = $this->documentoModel->guardarArchivoAdjunto(
            $id_documento,
            $rutaRelativa,
            $nombreBase,
            $ext,
            $tipoMime,
            $archivo['size']
        );

        if (!$success) {
            // Eliminar archivo si falló el registro en BD
            @unlink($rutaArchivo);
            throw new \Exception("Error al registrar archivo en BD");
        }

        logger("Archivo guardado para documento $id_documento: $rutaRelativa", 'INFO');
        return true;
    }

    /**
     * Actualizar documento
     * PUT /api/documentos/:id
     */
    public function actualizar($id)
    {
        try {
            Autenticacion::requerirAutenticacion();
            Autorizacion::requerirAcceso('editar_documento');

            if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
                response(false, 'Método no permitido', null, 405);
            }

            $documento = $this->documentoModel->obtenerPorId((int)$id);

            if (!$documento) {
                response(false, 'Documento no encontrado', null, 404);
            }

            // Estudiantes solo pueden editar sus propios documentos
            if (Autorizacion::esEstudiante() && $documento['id_usuario_captura'] !== Autenticacion::getId()) {
                response(false, 'No puede editar este documento', null, 403);
            }

            $input = json_decode(file_get_contents('php://input'), true);

            if (!$input) {
                response(false, 'Datos inválidos', null, 400);
            }

            $this->documentoModel->actualizar((int)$id, $input);

            $documentoActualizado = $this->documentoModel->obtenerPorId((int)$id);

            logger("Documento actualizado: ID $id", 'INFO');
            response(true, 'Documento actualizado', $documentoActualizado, 200);

        } catch (\Exception $e) {
            logger("Error actualizando documento: " . $e->getMessage(), 'ERROR');
            response(false, $e->getMessage(), null, 400);
        }
    }

    /**
     * Cambiar estado de gestión
     * PATCH /api/documentos/:id/estado_gestion
     */
    public function cambiarEstadoGestion($id)
    {
        try {
            Autenticacion::requerirAutenticacion();

            if ($_SERVER['REQUEST_METHOD'] !== 'PATCH') {
                response(false, 'Método no permitido', null, 405);
            }

            $documento = $this->documentoModel->obtenerPorId((int)$id);

            if (!$documento) {
                response(false, 'Documento no encontrado', null, 404);
            }

            $input = json_decode(file_get_contents('php://input'), true);

            if (!$input || empty($input['estado'])) {
                response(false, 'Estado requerido', null, 400);
            }

            $this->documentoModel->cambiarEstadoGestion((int)$id, $input['estado']);

            $documentoActualizado = $this->documentoModel->obtenerPorId((int)$id);

            response(true, 'Estado actualizado', $documentoActualizado, 200);

        } catch (\Exception $e) {
            logger("Error cambiando estado: " . $e->getMessage(), 'ERROR');
            response(false, $e->getMessage(), null, 400);
        }
    }

    /**
     * Eliminar documento
     * DELETE /api/documentos/:id
     */
    public function eliminar($id)
    {
        try {
            Autenticacion::requerirAutenticacion();
            Autorizacion::requerirRol(Rol::ADMINISTRADOR);

            if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
                response(false, 'Método no permitido', null, 405);
            }

            $documento = $this->documentoModel->obtenerPorId((int)$id);

            if (!$documento) {
                response(false, 'Documento no encontrado', null, 404);
            }

            $this->documentoModel->cancelar((int)$id);

            logger("Documento eliminado: ID $id", 'INFO');
            response(true, 'Documento eliminado', null, 200);

        } catch (\Exception $e) {
            logger("Error eliminando documento: " . $e->getMessage(), 'ERROR');
            response(false, $e->getMessage(), null, 400);
        }
    }

    /**
     * Obtener estadísticas de documentos
     * GET /api/documentos/estadisticas
     */
    public function estadisticas()
    {
        try {
            Autenticacion::requerirAutenticacion();

            $stats = $this->documentoModel->obtenerEstadisticas();

            response(true, 'Estadísticas obtenidas', $stats, 200);

        } catch (\Exception $e) {
            logger("Error obteniendo estadísticas: " . $e->getMessage(), 'ERROR');
            response(false, $e->getMessage(), null, 400);
        }
    }
}
?>
