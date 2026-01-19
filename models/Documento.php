<?php
namespace App\Models;

use PDO;
use PDOException;

/**
 * Model: Documento
 * 
 * Gestiona la operaciones CRUD para documentos.
 * Implementa el modelo EAV (Entity Attribute Value) para campos dinámicos.
 * 
 * Estados de gestión: pendiente | en_revision | archivado | cancelado
 * Estados de respaldo: sin_respaldo | con_respaldo
 * 
 * Estructura:
 * - registros_documentos: Encabezado del documento (metadatos)
 * - detalles_valores_documento: Valores de campos dinámicos (modelo EAV)
 * - archivos_adjuntos: Archivos asociados al documento
 * 
 * @author SDI Development Team
 * @version 2.0
 */
class Documento
{
    protected $db;
    protected const TABLE_REGISTROS = 'registros_documentos';
    protected const TABLE_DETALLES = 'detalles_valores_documento';
    protected const TABLE_ARCHIVOS = 'archivos_adjuntos';

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
     * Obtener documento completo por ID
     * 
     * @param int $id_registro ID del documento
     * @return array|null Documento con metadata y valores dinámicos
     */
    public function obtenerPorId($id_registro)
    {
        try {
            // Obtener registro principal
            $sql = "SELECT rd.*, cc.nombre_categoria, cf.etiqueta_identificadora,
                           u.nombre, u.apellido_paterno
                    FROM " . self::TABLE_REGISTROS . " rd
                    JOIN cat_categorias cc ON rd.id_categoria = cc.id_categoria
                    JOIN carpetas_fisicas cf ON rd.id_carpeta = cf.id_carpeta
                    JOIN usuarios u ON rd.id_usuario_captura = u.id_usuario
                    WHERE rd.id_registro = :id";

            $stmt = $this->db->prepare($sql);
            $stmt->execute([':id' => $id_registro]);
            $documento = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$documento) {
                return null;
            }

            // Obtener valores dinámicos
            $documento['valores'] = $this->obtenerValoresDinamicos($id_registro);

            // Obtener archivos adjuntos
            $documento['archivos'] = $this->obtenerArchivos($id_registro);

            return $documento;

        } catch (PDOException $e) {
            logger("Error obteniendo documento: " . $e->getMessage(), 'ERROR');
            return null;
        }
    }

    /**
     * Listar documentos con filtros y paginación
     * 
     * @param array $filtros Filtros de búsqueda
     * @param int $limit Límite de registros
     * @param int $offset Desplazamiento
     * @return array Arreglo de documentos
     */
    public function listar($filtros = [], $limit = 10, $offset = 0)
    {
        try {
            $sql = "SELECT rd.id_registro, rd.fecha_documento, rd.estado_gestion, 
                           rd.estado_respaldo_digital, cc.nombre_categoria, 
                           cf.etiqueta_identificadora, u.nombre, u.apellido_paterno
                    FROM " . self::TABLE_REGISTROS . " rd
                    JOIN cat_categorias cc ON rd.id_categoria = cc.id_categoria
                    JOIN carpetas_fisicas cf ON rd.id_carpeta = cf.id_carpeta
                    JOIN usuarios u ON rd.id_usuario_captura = u.id_usuario
                    WHERE 1=1";

            $params = [];

            // Aplicar filtros
            if (!empty($filtros['estado_gestion'])) {
                $sql .= " AND rd.estado_gestion = :estado_gestion";
                $params[':estado_gestion'] = $filtros['estado_gestion'];
            }

            if (!empty($filtros['estado_respaldo'])) {
                $sql .= " AND rd.estado_respaldo_digital = :estado_respaldo";
                $params[':estado_respaldo'] = $filtros['estado_respaldo'];
            }

            if (!empty($filtros['id_carpeta'])) {
                $sql .= " AND rd.id_carpeta = :id_carpeta";
                $params[':id_carpeta'] = $filtros['id_carpeta'];
            }

            if (!empty($filtros['id_categoria'])) {
                $sql .= " AND rd.id_categoria = :id_categoria";
                $params[':id_categoria'] = $filtros['id_categoria'];
            }

            if (!empty($filtros['id_usuario_captura'])) {
                $sql .= " AND rd.id_usuario_captura = :id_usuario";
                $params[':id_usuario'] = $filtros['id_usuario_captura'];
            }

            if (!empty($filtros['fecha_inicio'])) {
                $sql .= " AND rd.fecha_documento >= :fecha_inicio";
                $params[':fecha_inicio'] = $filtros['fecha_inicio'];
            }

            if (!empty($filtros['fecha_fin'])) {
                $sql .= " AND rd.fecha_documento <= :fecha_fin";
                $params[':fecha_fin'] = $filtros['fecha_fin'];
            }

            // Ordenamiento y paginación
            $sql .= " ORDER BY rd.fecha_sistema_creacion DESC LIMIT :limit OFFSET :offset";

            $stmt = $this->db->prepare($sql);
            $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);

            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }

            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);

        } catch (PDOException $e) {
            logger("Error listando documentos: " . $e->getMessage(), 'ERROR');
            return [];
        }
    }

    /**
     * Contar documentos con filtros
     * 
     * @param array $filtros Filtros de búsqueda
     * @return int Total de documentos
     */
    public function contarConFiltros($filtros = [])
    {
        try {
            $sql = "SELECT COUNT(*) as total FROM " . self::TABLE_REGISTROS . " WHERE 1=1";
            $params = [];

            if (!empty($filtros['estado_gestion'])) {
                $sql .= " AND estado_gestion = :estado_gestion";
                $params[':estado_gestion'] = $filtros['estado_gestion'];
            }

            if (!empty($filtros['estado_respaldo_digital'])) {
                $sql .= " AND estado_respaldo_digital = :estado_respaldo";
                $params[':estado_respaldo'] = $filtros['estado_respaldo_digital'];
            }

            if (!empty($filtros['id_carpeta'])) {
                $sql .= " AND id_carpeta = :id_carpeta";
                $params[':id_carpeta'] = $filtros['id_carpeta'];
            }

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return (int)($result['total'] ?? 0);

        } catch (PDOException $e) {
            logger("Error contando documentos: " . $e->getMessage(), 'ERROR');
            return 0;
        }
    }

    /**
     * Crear nuevo documento
     * 
     * @param array $data Datos del documento
     *   - id_categoria: ID de categoría
     *   - id_carpeta: ID de carpeta física
     *   - id_usuario_captura: ID de usuario que captura
     *   - fecha_documento: Fecha del documento
     *   - valores: Array asociativo con valores de campos dinámicos
     * 
     * @return int|false ID del nuevo documento o false
     */
    public function crear($data)
    {
        try {
            // Validaciones
            $required = ['id_categoria', 'id_carpeta', 'id_usuario_captura', 'fecha_documento'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    throw new \Exception("Campo requerido faltante: $field");
                }
            }

            $this->db->beginTransaction();

            // Insertar registro principal
            $sql = "INSERT INTO " . self::TABLE_REGISTROS . "
                    (id_categoria, id_carpeta, id_usuario_captura, fecha_documento, 
                     estado_gestion, estado_respaldo_digital)
                    VALUES (:id_categoria, :id_carpeta, :id_usuario_captura, :fecha_documento,
                            'pendiente', 'sin_respaldo')";

            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                ':id_categoria'      => $data['id_categoria'],
                ':id_carpeta'        => $data['id_carpeta'],
                ':id_usuario_captura' => $data['id_usuario_captura'],
                ':fecha_documento'   => $data['fecha_documento']
            ]);

            $id_registro = (int)$this->db->lastInsertId();

            // Insertar valores dinámicos si existen
            if (!empty($data['valores']) && is_array($data['valores'])) {
                $this->insertarValoresDinamicos($id_registro, $data['valores']);
            }

            $this->db->commit();
            return $id_registro;

        } catch (PDOException $e) {
            $this->db->rollBack();
            logger("Error creando documento: " . $e->getMessage(), 'ERROR');
            return false;
        } catch (\Exception $e) {
            $this->db->rollBack();
            logger("Error validación documento: " . $e->getMessage(), 'WARNING');
            throw $e;
        }
    }

    /**
     * Actualizar documento
     * 
     * @param int $id_registro ID del documento
     * @param array $data Datos a actualizar
     * @return bool True si se actualizó exitosamente
     */
    public function actualizar($id_registro, $data)
    {
        try {
            $this->db->beginTransaction();

            $updates = [];
            $params = [':id' => $id_registro];

            $updatable = ['id_categoria', 'id_carpeta', 'fecha_documento', 'estado_gestion', 'estado_respaldo_digital'];

            foreach ($data as $key => $value) {
                if (in_array($key, $updatable) && $value !== null) {
                    $updates[] = "$key = :$key";
                    $params[":$key"] = $value;
                }
            }

            if (!empty($updates)) {
                $sql = "UPDATE " . self::TABLE_REGISTROS . " SET " . implode(', ', $updates) . " WHERE id_registro = :id";
                $stmt = $this->db->prepare($sql);
                $stmt->execute($params);
            }

            // Actualizar valores dinámicos si existen
            if (!empty($data['valores']) && is_array($data['valores'])) {
                $this->actualizarValoresDinamicos($id_registro, $data['valores']);
            }

            $this->db->commit();
            return true;

        } catch (PDOException $e) {
            $this->db->rollBack();
            logger("Error actualizando documento: " . $e->getMessage(), 'ERROR');
            return false;
        }
    }

    /**
     * Cambiar estado de gestión del documento
     * 
     * @param int $id_registro ID del documento
     * @param string $estado Nuevo estado
     * @return bool True si cambió exitosamente
     */
    public function cambiarEstadoGestion($id_registro, $estado)
    {
        $estados_validos = ['pendiente', 'en_revision', 'archivado', 'cancelado'];
        
        if (!in_array($estado, $estados_validos)) {
            throw new \Exception("Estado de gestión inválido: $estado");
        }

        $sql = "UPDATE " . self::TABLE_REGISTROS . " SET estado_gestion = :estado WHERE id_registro = :id";
        $stmt = $this->db->prepare($sql);
        
        return $stmt->execute([
            ':estado' => $estado,
            ':id' => $id_registro
        ]);
    }

    /**
     * Cambiar estado de respaldo digital
     * 
     * @param int $id_registro ID del documento
     * @param string $estado Nuevo estado
     * @return bool True si cambió exitosamente
     */
    public function cambiarEstadoRespaldo($id_registro, $estado)
    {
        $estados_validos = ['sin_respaldo', 'con_respaldo'];
        
        if (!in_array($estado, $estados_validos)) {
            throw new \Exception("Estado de respaldo inválido: $estado");
        }

        $sql = "UPDATE " . self::TABLE_REGISTROS . " SET estado_respaldo_digital = :estado WHERE id_registro = :id";
        $stmt = $this->db->prepare($sql);
        
        return $stmt->execute([
            ':estado' => $estado,
            ':id' => $id_registro
        ]);
    }

    /**
     * Cancelar documento (mover a estado cancelado)
     * 
     * @param int $id_registro ID del documento
     * @param string $motivo Motivo de cancelación (opcional)
     * @return bool True si se canceló
     */
    public function cancelar($id_registro, $motivo = '')
    {
        return $this->cambiarEstadoGestion($id_registro, 'cancelado');
    }

    /**
     * Obtener valores dinámicos de un documento (modelo EAV)
     * 
     * @param int $id_registro ID del documento
     * @return array Arreglo de valores [id_columna => valor]
     */
    public function obtenerValoresDinamicos($id_registro)
    {
        try {
            $sql = "SELECT dv.id_columna, ccc.nombre_campo, ccc.tipo_dato,
                           COALESCE(dv.valor_texto, dv.valor_numero, dv.valor_fecha, dv.valor_booleano) as valor
                    FROM " . self::TABLE_DETALLES . " dv
                    JOIN conf_columnas_categoria ccc ON dv.id_columna = ccc.id_columna
                    WHERE dv.id_registro = :id";

            $stmt = $this->db->prepare($sql);
            $stmt->execute([':id' => $id_registro]);

            $valores = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $valores[$row['id_columna']] = $row;
            }

            return $valores;

        } catch (PDOException $e) {
            logger("Error obteniendo valores dinámicos: " . $e->getMessage(), 'ERROR');
            return [];
        }
    }

    /**
     * Insertar valores dinámicos para un documento
     * 
     * @param int $id_registro ID del documento
     * @param array $valores Valores a insertar [id_columna => valor]
     */
    protected function insertarValoresDinamicos($id_registro, $valores)
    {
        $sql = "INSERT INTO " . self::TABLE_DETALLES . "
                (id_registro, id_columna, valor_texto, valor_numero, valor_fecha, valor_booleano)
                VALUES (:id_registro, :id_columna, :valor_texto, :valor_numero, :valor_fecha, :valor_booleano)";

        $stmt = $this->db->prepare($sql);

        foreach ($valores as $id_columna => $valor) {
            // Obtener tipo de dato de la columna
            $tipoSql = "SELECT tipo_dato FROM conf_columnas_categoria WHERE id_columna = :id";
            $tipoStmt = $this->db->prepare($tipoSql);
            $tipoStmt->execute([':id' => $id_columna]);
            $tipoRow = $tipoStmt->fetch(PDO::FETCH_ASSOC);

            $tipo = $tipoRow['tipo_dato'] ?? 'texto_corto';

            // Mapear valor al tipo correcto
            $valorTexto = null;
            $valorNumero = null;
            $valorFecha = null;
            $valorBooleano = null;

            switch ($tipo) {
                case 'texto_corto':
                case 'texto_largo':
                    $valorTexto = $valor;
                    break;
                case 'numero_entero':
                case 'numero_decimal':
                    $valorNumero = (float)$valor;
                    break;
                case 'fecha':
                    $valorFecha = $valor;
                    break;
                case 'booleano':
                    $valorBooleano = (bool)$valor;
                    break;
            }

            $stmt->execute([
                ':id_registro'   => $id_registro,
                ':id_columna'    => $id_columna,
                ':valor_texto'   => $valorTexto,
                ':valor_numero'  => $valorNumero,
                ':valor_fecha'   => $valorFecha,
                ':valor_booleano' => $valorBooleano
            ]);
        }
    }

    /**
     * Actualizar valores dinámicos de un documento
     * 
     * @param int $id_registro ID del documento
     * @param array $valores Nuevos valores
     */
    protected function actualizarValoresDinamicos($id_registro, $valores)
    {
        $sql = "UPDATE " . self::TABLE_DETALLES . "
                SET valor_texto = :valor_texto,
                    valor_numero = :valor_numero,
                    valor_fecha = :valor_fecha,
                    valor_booleano = :valor_booleano
                WHERE id_registro = :id_registro AND id_columna = :id_columna";

        $stmt = $this->db->prepare($sql);

        foreach ($valores as $id_columna => $valor) {
            $tipoSql = "SELECT tipo_dato FROM conf_columnas_categoria WHERE id_columna = :id";
            $tipoStmt = $this->db->prepare($tipoSql);
            $tipoStmt->execute([':id' => $id_columna]);
            $tipoRow = $tipoStmt->fetch(PDO::FETCH_ASSOC);

            $tipo = $tipoRow['tipo_dato'] ?? 'texto_corto';

            $valorTexto = null;
            $valorNumero = null;
            $valorFecha = null;
            $valorBooleano = null;

            switch ($tipo) {
                case 'texto_corto':
                case 'texto_largo':
                    $valorTexto = $valor;
                    break;
                case 'numero_entero':
                case 'numero_decimal':
                    $valorNumero = (float)$valor;
                    break;
                case 'fecha':
                    $valorFecha = $valor;
                    break;
                case 'booleano':
                    $valorBooleano = (bool)$valor;
                    break;
            }

            $stmt->execute([
                ':id_registro'   => $id_registro,
                ':id_columna'    => $id_columna,
                ':valor_texto'   => $valorTexto,
                ':valor_numero'  => $valorNumero,
                ':valor_fecha'   => $valorFecha,
                ':valor_booleano' => $valorBooleano
            ]);
        }
    }

    /**
     * Obtener archivos adjuntos de un documento
     * 
     * @param int $id_registro ID del documento
     * @return array Arreglo de archivos
     */
    public function obtenerArchivos($id_registro)
    {
        try {
            $sql = "SELECT * FROM " . self::TABLE_ARCHIVOS . " WHERE id_registro = :id";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([':id' => $id_registro]);

            return $stmt->fetchAll(PDO::FETCH_ASSOC);

        } catch (PDOException $e) {
            logger("Error obteniendo archivos: " . $e->getMessage(), 'ERROR');
            return [];
        }
    }

    /**
     * Guardar archivo adjunto
     * 
     * @param int $id_registro ID del documento
     * @param string $ruta_archivo Ruta del archivo guardado
     * @param string $nombre_base Nombre sin extensión
     * @param string $extension Extensión del archivo
     * @param string $tipo_mime Tipo MIME del archivo
     * @param int $peso_bytes Tamaño del archivo en bytes
     * @return bool True si se guardó exitosamente
     */
    public function guardarArchivoAdjunto($id_registro, $ruta_archivo, $nombre_base, $extension, $tipo_mime, $peso_bytes)
    {
        try {
            $sql = "INSERT INTO " . self::TABLE_ARCHIVOS . "
                    (id_registro, nombre_base, extension_archivo, tipo_mime, peso_bytes, ruta_almacenamiento)
                    VALUES (:id_registro, :nombre_base, :extension, :tipo_mime, :peso_bytes, :ruta)";

            $stmt = $this->db->prepare($sql);
            return $stmt->execute([
                ':id_registro' => $id_registro,
                ':nombre_base' => $nombre_base,
                ':extension' => $extension,
                ':tipo_mime' => $tipo_mime,
                ':peso_bytes' => $peso_bytes,
                ':ruta' => $ruta_archivo
            ]);

        } catch (PDOException $e) {
            logger("Error guardando archivo adjunto: " . $e->getMessage(), 'ERROR');
            return false;
        }
    }

    /**
     * Contar documentos por estado de gestión
     * 
     * @param string $estado Estado a contar
     * @return int Cantidad de documentos
     */
    public function contarPorEstado($estado)
    {
        $sql = "SELECT COUNT(*) as total FROM " . self::TABLE_REGISTROS . " WHERE estado_gestion = :estado";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':estado' => $estado]);

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return (int)($result['total'] ?? 0);
    }

    /**
     * Contar documentos por estado de respaldo digital
     * 
     * @param string $estado Estado a contar
     * @return int Cantidad de documentos
     */
    public function contarPorEstadoRespaldo($estado)
    {
        $sql = "SELECT COUNT(*) as total FROM " . self::TABLE_REGISTROS . " WHERE estado_respaldo_digital = :estado";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':estado' => $estado]);

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return (int)($result['total'] ?? 0);
    }

    /**
     * Obtener estadísticas de documentos
     * 
     * @return array Estadísticas generales
     */
    public function obtenerEstadisticas()
    {
        $sql = "SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN estado_gestion = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
                    SUM(CASE WHEN estado_gestion = 'en_revision' THEN 1 ELSE 0 END) as en_revision,
                    SUM(CASE WHEN estado_gestion = 'archivado' THEN 1 ELSE 0 END) as archivados,
                    SUM(CASE WHEN estado_respaldo_digital = 'con_respaldo' THEN 1 ELSE 0 END) as con_respaldo
                FROM " . self::TABLE_REGISTROS;

        $stmt = $this->db->prepare($sql);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * ============================================================================
     * MÉTODOS SIMPLIFICADOS PARA DOCUMENTOS (REFACTORIZACIÓN)
     * Siguen el mismo patrón que el módulo de Carpetas
     * ============================================================================
     */

    /**
     * Crear documento simplificado (sin modelo EAV)
     * 
     * @param array $data Datos del documento
     * @return int|false ID del documento creado o false
     */
    public function crearDocumentoSimple($data)
    {
        try {
            // Validar campos requeridos
            $required = ['no_oficio', 'id_carpeta', 'emitido_por', 'fecha_oficio', 'descripcion', 'capturado_por', 'id_usuario_captura'];
            foreach ($required as $field) {
                if (empty($data[$field]) && $data[$field] !== '0') {
                    throw new \Exception("Campo requerido faltante: $field");
                }
            }

            // Usar tabla registros_documentos con estructura simplificada
            $sql = "INSERT INTO " . self::TABLE_REGISTROS . " 
                    (id_categoria, id_carpeta, id_usuario_captura, fecha_documento, 
                     estado_gestion, estado_respaldo_digital, fecha_sistema_creacion)
                    VALUES (:id_categoria, :id_carpeta, :id_usuario, :fecha_documento, :estado, :respaldo, NOW())";

            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                ':id_categoria'      => 1, // ID de categoría 'Auditoría'
                ':id_carpeta'        => (int)$data['id_carpeta'],
                ':id_usuario'        => (int)$data['id_usuario_captura'],
                ':fecha_documento'   => $data['fecha_oficio'],
                ':estado'            => 'pendiente',
                ':respaldo'          => 'sin_respaldo'
            ]);

            $id_documento = (int)$this->db->lastInsertId();

            // Guardar valores dinámicos en detalles_valores_documento
            $this->guardarValoresDocumento($id_documento, $data);

            logger("Documento simple creado: ID $id_documento", 'INFO');
            return $id_documento;

        } catch (PDOException $e) {
            $this->db->rollBack();
            logger("Error PDO creando documento: " . $e->getMessage(), 'ERROR');
            return false;
        } catch (\Exception $e) {
            logger("Error validación documento: " . $e->getMessage(), 'WARNING');
            throw $e;
        }
    }

    /**
     * Guardar valores dinámicos del documento
     * 
     * @param int $id_documento ID del documento
     * @param array $data Datos con valores a guardar
     */
    private function guardarValoresDocumento($id_documento, $data)
    {
        // Mapeo de campos a IDs de columna de la categoría Auditoría (id_categoria=1)
        $mapeo = [
            'no_oficio'     => 1, // No. Oficio
            'auditoria'     => 3, // Nombre Auditoría
            'emitido_por'   => 4, // Emitido Por
            'descripcion'   => 5, // Descripción Asunto
            'capturado_por' => 6  // Comentarios Adicionales (usamos para Capturado Por)
        ];

        $sql = "INSERT INTO " . self::TABLE_DETALLES . " 
                (id_registro, id_columna, valor_texto)
                VALUES (:id_registro, :id_columna, :valor)";

        $stmt = $this->db->prepare($sql);

        foreach ($mapeo as $campo => $id_columna) {
            if (isset($data[$campo]) && !empty($data[$campo])) {
                try {
                    $stmt->execute([
                        ':id_registro'  => $id_documento,
                        ':id_columna'   => $id_columna,
                        ':valor'        => trim((string)$data[$campo])
                    ]);
                } catch (PDOException $e) {
                    logger("Error guardando valor $campo: " . $e->getMessage(), 'WARNING');
                }
            }
        }
    }

    /**
     * Obtener documento simplificado por ID
     * 
     * @param int $id_documento ID del documento
     * @return array|null Documento con valores
     */
    public function obtenerDocumentoSimple($id_documento)
    {
        try {
            // Obtener registro principal
            $sql = "SELECT rd.*, 
                           cc.nombre_categoria, 
                           cf.etiqueta_identificadora, cf.no_carpeta_fisica,
                           u.nombre, u.apellido_paterno, u.apellido_materno
                    FROM " . self::TABLE_REGISTROS . " rd
                    JOIN cat_categorias cc ON rd.id_categoria = cc.id_categoria
                    JOIN carpetas_fisicas cf ON rd.id_carpeta = cf.id_carpeta
                    JOIN usuarios u ON rd.id_usuario_captura = u.id_usuario
                    WHERE rd.id_registro = :id";

            $stmt = $this->db->prepare($sql);
            $stmt->execute([':id' => $id_documento]);
            $documento = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$documento) {
                return null;
            }

            // Obtener valores dinámicos
            $sqlValores = "SELECT cc.nombre_campo, dvd.valor_texto, dvd.valor_fecha
                          FROM " . self::TABLE_DETALLES . " dvd
                          JOIN conf_columnas_categoria cc ON dvd.id_columna = cc.id_columna
                          WHERE dvd.id_registro = :id_registro";

            $stmt = $this->db->prepare($sqlValores);
            $stmt->execute([':id_registro' => $id_documento]);
            $valores = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

            // Agregar valores al documento
            $documento['valores'] = $valores;

            return $documento;

        } catch (PDOException $e) {
            logger("Error obteniendo documento simple: " . $e->getMessage(), 'ERROR');
            return null;
        }
    }

    /**
     * Obtener documento por número de oficio
     * 
     * @param string $no_oficio Número de oficio
     * @return array|null
     */
    public function obtenerPorNumeroOficio($no_oficio)
    {
        try {
            $sql = "SELECT dvd.valor_texto
                    FROM " . self::TABLE_DETALLES . " dvd
                    WHERE dvd.id_columna = 1 AND dvd.valor_texto = :no_oficio
                    LIMIT 1";

            $stmt = $this->db->prepare($sql);
            $stmt->execute([':no_oficio' => trim($no_oficio)]);
            return $stmt->fetch(PDO::FETCH_ASSOC);

        } catch (PDOException $e) {
            logger("Error buscando por número de oficio: " . $e->getMessage(), 'ERROR');
            return null;
        }
    }

    /**
     * Listar documentos simplificados por carpeta
     * 
     * @param int $id_carpeta ID de la carpeta
     * @param array $filtros Filtros adicionales
     * @param int $limit Límite de registros
     * @return array Arreglo de documentos
     */
    public function listarPorCarpeta($id_carpeta, $filtros = [], $limit = 100)
    {
        try {
            // Obtener documentos básicos
            $sql = "SELECT rd.id_registro, rd.fecha_documento, rd.estado_gestion,
                           cf.etiqueta_identificadora, cf.no_carpeta_fisica,
                           u.nombre, u.apellido_paterno
                    FROM " . self::TABLE_REGISTROS . " rd
                    JOIN carpetas_fisicas cf ON rd.id_carpeta = cf.id_carpeta
                    JOIN usuarios u ON rd.id_usuario_captura = u.id_usuario
                    WHERE rd.id_carpeta = :id_carpeta";

            if (!empty($filtros['estado_gestion'])) {
                $sql .= " AND rd.estado_gestion = :estado";
            }

            $sql .= " ORDER BY rd.fecha_sistema_creacion DESC LIMIT :limit";

            $stmt = $this->db->prepare($sql);
            $stmt->bindValue(':id_carpeta', (int)$id_carpeta);
            if (!empty($filtros['estado_gestion'])) {
                $stmt->bindValue(':estado', $filtros['estado_gestion']);
            }
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);

            $stmt->execute();
            $documentos = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Para cada documento, obtener sus valores dinámicos
            foreach ($documentos as &$documento) {
                $documento['valores'] = $this->obtenerValoresDinamicos($documento['id_registro']);
            }

            return $documentos;

        } catch (PDOException $e) {
            logger("Error listando documentos por carpeta: " . $e->getMessage(), 'ERROR');
            return [];
        }
    }
}
?>
