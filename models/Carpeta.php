<?php
namespace App\Models;

use PDO;
use PDOException;

/**
 * Model: Carpeta
 * 
 * Gestiona las carpetas físicas del sistema.
 * Las carpetas son contenedores lógicos para documentos.
 * 
 * @author SDI Development Team
 * @version 2.0
 */
class Carpeta
{
    protected $db;
    protected const TABLE = 'carpetas_fisicas';

    /**
     * Constructor
     * 
     * @param PDO $db Conexión a base de datos
     */
    public function __construct(PDO $db = null)
    {
        $this->db = $db ?? getDBConnection();
    }

    /**
     * Obtener carpeta por ID
     * 
     * @param int $id_carpeta ID de la carpeta
     * @return array|null Datos de la carpeta
     */
    public function obtenerPorId($id_carpeta)
    {
        $sql = "SELECT cf.*, u.nombre, u.apellido_paterno
                FROM " . self::TABLE . " cf
                LEFT JOIN usuarios u ON cf.creado_por_id = u.id_usuario
                WHERE cf.id_carpeta = :id";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id_carpeta]);

        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    /**
     * Obtener carpeta por etiqueta identificadora
     * 
     * @param string $etiqueta Etiqueta única de la carpeta
     * @return array|null Datos de la carpeta
     */
    public function obtenerPorEtiqueta($etiqueta)
    {
        $sql = "SELECT * FROM " . self::TABLE . " WHERE etiqueta_identificadora = :etiqueta";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':etiqueta' => $etiqueta]);

        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    /**
     * Listar todas las carpetas con paginación
     * 
     * @param int $limit Límite de registros
     * @param int $offset Desplazamiento
     * @return array Arreglo de carpetas
     */
    public function listar($limit = 10, $offset = 0)
    {
        $sql = "SELECT cf.*, u.nombre, u.apellido_paterno, COUNT(rd.id_registro) as cantidad_documentos
                FROM " . self::TABLE . " cf
                LEFT JOIN usuarios u ON cf.creado_por_id = u.id_usuario
                LEFT JOIN registros_documentos rd ON cf.id_carpeta = rd.id_carpeta
                GROUP BY cf.id_carpeta
                ORDER BY cf.fecha_creacion DESC
                LIMIT :limit OFFSET :offset";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Obtener número máximo de carpeta
     * 
     * @return int|null Número máximo de carpeta o null si no hay carpetas
     */
    public function obtenerMaximoCarpeta()
    {
        $sql = "SELECT MAX(no_carpeta_fisica) as maximo FROM " . self::TABLE;
        $stmt = $this->db->prepare($sql);
        $stmt->execute();

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return !empty($result['maximo']) ? (int)$result['maximo'] : null;
    }

    /**
     * Contar total de carpetas
     * 
     * @return int Total de carpetas
     */
    public function contar()
    {
        $sql = "SELECT COUNT(*) as total FROM " . self::TABLE;
        $stmt = $this->db->prepare($sql);
        $stmt->execute();

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return (int)($result['total'] ?? 0);
    }

    /**
     * Crear nueva carpeta
     * 
     * @param array $data Datos de la carpeta
     *   - no_carpeta_fisica (requerido): Número secuencial
     *   - titulo (requerido): Título de la carpeta
     *   - etiqueta_identificadora (requerido): Código único
     *   - descripcion (opcional)
     *   - estado_gestion (opcional): pendiente, en_revision, archivado, cancelado
     *   - creado_por_id (requerido): ID del usuario
     * 
     * @return int|false ID de la carpeta creada
     */
    public function crear($data)
    {
        try {
            $required = ['no_carpeta_fisica', 'titulo', 'etiqueta_identificadora', 'creado_por_id'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    throw new \Exception("Campo requerido faltante: $field");
                }
            }

            // Verificar unicidad de etiqueta
            if ($this->obtenerPorEtiqueta($data['etiqueta_identificadora'])) {
                throw new \Exception("La etiqueta ya existe");
            }

            // Verificar unicidad de título
            $stmt = $this->db->prepare("SELECT id_carpeta FROM " . self::TABLE . " WHERE titulo = :titulo");
            $stmt->execute([':titulo' => $data['titulo']]);
            if ($stmt->fetch(PDO::FETCH_ASSOC)) {
                throw new \Exception("El título ya existe");
            }

            $this->db->beginTransaction();

            $sql = "INSERT INTO " . self::TABLE . "
                    (no_carpeta_fisica, titulo, etiqueta_identificadora, descripcion, estado_gestion, creado_por_id)
                    VALUES (:no_carpeta, :titulo, :etiqueta, :descripcion, :estado_gestion, :creado_por_id)";

            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                ':no_carpeta'      => (int)$data['no_carpeta_fisica'],
                ':titulo'          => trim($data['titulo']),
                ':etiqueta'        => trim($data['etiqueta_identificadora']),
                ':descripcion'     => trim($data['descripcion'] ?? ''),
                ':estado_gestion'  => $data['estado_gestion'] ?? 'pendiente',
                ':creado_por_id'   => $data['creado_por_id']
            ]);

            $id_carpeta = (int)$this->db->lastInsertId();
            $this->db->commit();

            return $id_carpeta;

        } catch (PDOException $e) {
            $this->db->rollBack();
            logger("Error creando carpeta: " . $e->getMessage(), 'ERROR');
            return false;
        } catch (\Exception $e) {
            $this->db->rollBack();
            logger("Error validación carpeta: " . $e->getMessage(), 'WARNING');
            throw $e;
        }
    }

    /**
     * Actualizar carpeta
     * 
     * @param int $id_carpeta ID de la carpeta
     * @param array $data Datos a actualizar
     * @return bool True si se actualizó
     */
    public function actualizar($id_carpeta, $data)
    {
        try {
            $updates = [];
            $params = [':id' => $id_carpeta];

            $updatable = ['titulo', 'etiqueta_identificadora', 'descripcion', 'no_carpeta_fisica', 'estado_gestion'];

            foreach ($data as $key => $value) {
                if (in_array($key, $updatable) && $value !== null) {
                    // Validar unicidad de etiqueta si se actualiza
                    if ($key === 'etiqueta_identificadora') {
                        $existing = $this->db->prepare(
                            "SELECT id_carpeta FROM " . self::TABLE . " WHERE etiqueta_identificadora = :etiqueta AND id_carpeta != :id"
                        );
                        $existing->execute([':etiqueta' => $value, ':id' => $id_carpeta]);
                        if ($existing->fetch()) {
                            throw new \Exception("La etiqueta ya existe");
                        }
                    }

                    // Validar unicidad de título si se actualiza
                    if ($key === 'titulo') {
                        $existing = $this->db->prepare(
                            "SELECT id_carpeta FROM " . self::TABLE . " WHERE titulo = :titulo AND id_carpeta != :id"
                        );
                        $existing->execute([':titulo' => $value, ':id' => $id_carpeta]);
                        if ($existing->fetch()) {
                            throw new \Exception("El título ya existe");
                        }
                    }

                    $updates[] = "$key = :$key";
                    $params[":$key"] = is_string($value) ? trim($value) : $value;
                }
            }

            if (empty($updates)) {
                return true;
            }

            $sql = "UPDATE " . self::TABLE . " SET " . implode(', ', $updates) . " WHERE id_carpeta = :id";
            $stmt = $this->db->prepare($sql);

            return $stmt->execute($params);

        } catch (PDOException $e) {
            logger("Error actualizando carpeta: " . $e->getMessage(), 'ERROR');
            return false;
        } catch (\Exception $e) {
            logger("Error validación carpeta: " . $e->getMessage(), 'WARNING');
            throw $e;
        }
    }

    /**
     * Eliminar carpeta (solo si no tiene documentos)
     * 
     * @param int $id_carpeta ID de la carpeta
     * @return bool True si se eliminó
     */
    public function eliminar($id_carpeta)
    {
        try {
            // Verificar que la carpeta no tenga documentos
            $sql = "SELECT COUNT(*) as total FROM registros_documentos WHERE id_carpeta = :id";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([':id' => $id_carpeta]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($result['total'] > 0) {
                throw new \Exception("No se puede eliminar una carpeta que contiene documentos");
            }

            $sql = "DELETE FROM " . self::TABLE . " WHERE id_carpeta = :id";
            $stmt = $this->db->prepare($sql);

            return $stmt->execute([':id' => $id_carpeta]);

        } catch (PDOException $e) {
            logger("Error eliminando carpeta: " . $e->getMessage(), 'ERROR');
            return false;
        } catch (\Exception $e) {
            logger("Error validación carpeta: " . $e->getMessage(), 'WARNING');
            throw $e;
        }
    }
}
?>
