<?php
namespace App\Controllers;

use App\Models\Carpeta;
use App\Models\Rol;
use App\Middleware\Autenticacion;
use App\Middleware\Autorizacion;

/**
 * Controller: CarpetaController
 * 
 * Gestiona carpetas físicas del sistema.
 * Acceso: Administrativo y Admin
 * 
 * @author SDI Development Team
 * @version 2.0
 */
class CarpetaController
{
    protected $carpetaModel;

    public function __construct()
    {
        $this->carpetaModel = new Carpeta();
    }

    public function listar()
    {
        try {
            Autenticacion::requerirAutenticacion();
            Autorizacion::requerirAcceso('crear_carpeta');

            $page = max(1, (int)($_GET['page'] ?? 1));
            $limit = min(50, (int)($_GET['limit'] ?? 10));
            $offset = ($page - 1) * $limit;

            $carpetas = $this->carpetaModel->listar($limit, $offset);
            $total = $this->carpetaModel->contar();

            $data = [
                'carpetas' => $carpetas,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'pages' => ceil($total / $limit)
                ]
            ];

            response(true, 'Carpetas obtenidas', $data, 200);
        } catch (\Exception $e) {
            logger("Error listando carpetas: " . $e->getMessage(), 'ERROR');
            response(false, $e->getMessage(), null, 400);
        }
    }

    public function obtener($id)
    {
        try {
            Autenticacion::requerirAutenticacion();

            $carpeta = $this->carpetaModel->obtenerPorId((int)$id);

            if (!$carpeta) {
                response(false, 'Carpeta no encontrada', null, 404);
            }

            response(true, 'Carpeta obtenida', $carpeta, 200);
        } catch (\Exception $e) {
            logger("Error obteniendo carpeta: " . $e->getMessage(), 'ERROR');
            response(false, $e->getMessage(), null, 400);
        }
    }

    public function crear()
    {
        try {
            Autenticacion::requerirAutenticacion();
            Autorizacion::requerirAcceso('crear_carpeta');

            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                response(false, 'Método no permitido', null, 405);
            }

            $input = json_decode(file_get_contents('php://input'), true);

            if (!$input || empty($input['titulo']) || empty($input['etiqueta_identificadora'])) {
                response(false, 'Datos requeridos faltantes (título y etiqueta)', null, 400);
            }

            // VALIDACIÓN: Calcular automáticamente el número de carpeta si no viene correcto
            $noCarpetaFisica = isset($input['no_carpeta_fisica']) ? (int)$input['no_carpeta_fisica'] : null;
            $estadoGestion = $input['estado_gestion'] ?? 'pendiente';
            
            // Estados que requieren numeración secuencial estricta
            $estadosConSecuencial = ['pendiente', 'en_revision'];
            
            if (in_array($estadoGestion, $estadosConSecuencial)) {
                // Si no viene un número válido, calcularlo automáticamente
                if (!$noCarpetaFisica || $noCarpetaFisica <= 0) {
                    $carpetaMaxima = $this->carpetaModel->obtenerMaximoCarpeta();
                    $noCarpetaFisica = ($carpetaMaxima === null) ? 1 : $carpetaMaxima + 1;
                    logger("Número de carpeta calculado automáticamente: $noCarpetaFisica", 'INFO');
                }
            } else {
                // Para estados 'cancelado' y 'archivado', permitir cualquier número positivo
                if (!$noCarpetaFisica || $noCarpetaFisica <= 0) {
                    response(false, "Número de carpeta inválido. Debe ser un número positivo", null, 400);
                }
            }

            $id_carpeta = $this->carpetaModel->crear([
                'no_carpeta_fisica'       => $noCarpetaFisica,
                'titulo'                  => $input['titulo'],
                'etiqueta_identificadora' => $input['etiqueta_identificadora'],
                'descripcion'             => $input['descripcion'] ?? '',
                'estado_gestion'          => $input['estado_gestion'] ?? 'pendiente',
                'creado_por_id'           => Autenticacion::getId()
            ]);

            if (!$id_carpeta) {
                response(false, 'Error al crear carpeta', null, 500);
            }

            $carpeta = $this->carpetaModel->obtenerPorId($id_carpeta);

            logger("Carpeta creada: ID $id_carpeta", 'INFO');
            response(true, 'Carpeta creada', $carpeta, 201);
        } catch (\Exception $e) {
            logger("Error creando carpeta: " . $e->getMessage(), 'ERROR');
            response(false, $e->getMessage(), null, 400);
        }
    }

    public function actualizar($id)
    {
        try {
            Autenticacion::requerirAutenticacion();
            Autorizacion::requerirAcceso('editar_carpeta');

            if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
                response(false, 'Método no permitido', null, 405);
            }

            if (!$this->carpetaModel->obtenerPorId((int)$id)) {
                response(false, 'Carpeta no encontrada', null, 404);
            }

            $input = json_decode(file_get_contents('php://input'), true);

            if (!$input) {
                response(false, 'Datos inválidos', null, 400);
            }

            $this->carpetaModel->actualizar((int)$id, $input);

            $carpeta = $this->carpetaModel->obtenerPorId((int)$id);

            logger("Carpeta actualizada: ID $id", 'INFO');
            response(true, 'Carpeta actualizada', $carpeta, 200);
        } catch (\Exception $e) {
            logger("Error actualizando carpeta: " . $e->getMessage(), 'ERROR');
            response(false, $e->getMessage(), null, 400);
        }
    }

    public function eliminar($id)
    {
        try {
            Autenticacion::requerirAutenticacion();
            Autorizacion::requerirRol(Rol::ADMINISTRADOR);

            if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
                response(false, 'Método no permitido', null, 405);
            }

            if (!$this->carpetaModel->obtenerPorId((int)$id)) {
                response(false, 'Carpeta no encontrada', null, 404);
            }

            $this->carpetaModel->eliminar((int)$id);

            logger("Carpeta eliminada: ID $id", 'INFO');
            response(true, 'Carpeta eliminada', null, 200);
        } catch (\Exception $e) {
            logger("Error eliminando carpeta: " . $e->getMessage(), 'ERROR');
            response(false, $e->getMessage(), null, 400);
        }
    }
}
?>
