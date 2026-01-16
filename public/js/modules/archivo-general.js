/**
 * Módulo: Archivo General SDI
 * 
 * Gestiona Carpetas Físicas y Documentos (Auditorías) con campos dinámicos
 * Implementa formularios para crear carpetas y registrar documentos
 * 
 * @author SDI Development Team
 * @version 1.0
 */

const archivoGeneralModule = {
    // Estado
    carpetas: [],
    documentosPorCarpeta: [],
    documentosFiltrados: [],
    columnasCategoriaAuditoria: [],
    idCategoriaAuditoria: null,
    modoActual: 'carpetas', // 'carpetas' o 'documentos'

    /**
     * Inicializar módulo
     */
    async init() {
        try {
            // Cargar carpetas disponibles PRIMERO
            await this.cargarCarpetas();
            console.log('✓ Carpetas cargadas:', this.carpetas);
            
            // Cargar configuración de campos dinámicos para Auditoría
            await this.cargarColumnasAuditoria();
            console.log('✓ Columnas de auditoría cargadas');
            
            // Attachear listeners después de cargar vistas
            setTimeout(() => {
                this.attachFormularioCarpetaListener();
                // Inicializar el contenedor de filtro de búsqueda
                this.cambiarTipoFiltro();
                console.log('✓ Listeners attachados y filtro inicializado');
            }, 100);
        } catch (error) {
            console.error('❌ Error inicializando Archivo General:', error);
            ui.toast('Error inicializando módulo: ' + error.message, 'error');
        }
    },

    /**
     * Cargar vista principal
     */
    async cargarVista() {
        let html = `
            <div class="w-full flex flex-col items-center" style="min-height: 100vh; padding: 20px;">
                <div class="w-full max-w-6xl rounded-lg shadow p-6 md:p-8" style="background-color: var(--card-bg); border: 1px solid var(--border-color);">
                    <!-- Encabezado centrado -->
                    <div class="text-center mb-8">
                        <h1 class="text-3xl md:text-4xl font-bold mb-2" style="color: var(--text-primary);">
                            <i class="fas fa-archive mr-3" style="color: #3b82f6;"></i>Archivo General SDI
                        </h1>
                        <p class="text-base md:text-lg" style="color: var(--text-secondary);">Gestiona carpetas físicas y documentos de auditoría</p>
                    </div>

                    <!-- Pestañas centradas -->
                    <div class="flex flex-col sm:flex-row justify-center gap-2 mb-8 border-b" style="border-color: var(--border-color);">
                        <button onclick="archivoGeneralModule.cambiarPestana('carpetas')" 
                                id="btnCarpetas" 
                                class="px-6 py-3 font-semibold transition border-b-2 text-sm md:text-base whitespace-nowrap" 
                                style="color: var(--text-primary); border-color: #3b82f6;">
                            <i class="fas fa-folder mr-2"></i>Crear Carpeta
                        </button>
                        <button onclick="archivoGeneralModule.cambiarPestana('documentos')" 
                                id="btnDocumentos" 
                                class="px-6 py-3 font-semibold transition border-b-2 text-sm md:text-base whitespace-nowrap" 
                                style="color: var(--text-secondary); border-color: transparent;">
                            <i class="fas fa-file-alt mr-2"></i>Registrar Documento
                        </button>
                    </div>

                    <!-- Contenedor de contenido dinámico centrado -->
                    <div id="contenidoArchivo" class="w-full flex justify-center">
                        <div class="w-full">
                            ${await this.mostrarFormularioCarpeta()}
                        </div>
                    </div>
                </div>
            </div>
        `;
        return html;
    },

    /**
     * Cambiar entre pestañas
     */
    async cambiarPestana(pestana) {
        this.modoActual = pestana;
        
        const btnCarpetas = document.getElementById('btnCarpetas');
        const btnDocumentos = document.getElementById('btnDocumentos');
        const contenido = document.getElementById('contenidoArchivo');

        if (pestana === 'carpetas') {
            if (btnCarpetas) {
                btnCarpetas.style.borderColor = '#3b82f6';
                btnCarpetas.style.color = 'var(--text-primary)';
            }
            if (btnDocumentos) {
                btnDocumentos.style.borderColor = 'transparent';
                btnDocumentos.style.color = 'var(--text-secondary)';
            }
            // Recargar carpetas para asegurar datos frescos
            await this.cargarCarpetas();
            contenido.innerHTML = await this.mostrarFormularioCarpeta();
            // Re-attachear listener del formulario
            this.attachFormularioCarpetaListener();
        } else if (pestana === 'documentos') {
            if (btnCarpetas) {
                btnCarpetas.style.borderColor = 'transparent';
                btnCarpetas.style.color = 'var(--text-secondary)';
            }
            if (btnDocumentos) {
                btnDocumentos.style.borderColor = '#3b82f6';
                btnDocumentos.style.color = 'var(--text-primary)';
            }
            contenido.innerHTML = await this.mostrarFormularioDocumento();
            // Re-attachear listener del formulario documento
            this.attachFormularioDocumentoListener();
        }
    },

    /**
     * Attachear listener del formulario carpeta
     */
    attachFormularioCarpetaListener() {
        const form = document.getElementById('formCarpeta');
        if (form) {
            // Remover listeners anteriores
            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);
            
            document.getElementById('formCarpeta').addEventListener('submit', (e) => {
                e.preventDefault();
                this.crearCarpeta(new FormData(e.target));
            });
        }
    },

    /**
     * Attachear listener del formulario documento
     */
    attachFormularioDocumentoListener() {
        const form = document.getElementById('formDocumento');
        if (form) {
            // Remover listeners anteriores
            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);
            
            document.getElementById('formDocumento').addEventListener('submit', (e) => {
                e.preventDefault();
                this.registrarDocumento(new FormData(e.target));
            });
        }
    },

    /**
     * Obtener siguiente número de carpeta
     */
    obtenerSiguienteNoCarpeta() {
        if (this.carpetas.length === 0) {
            return 1;
        }
        
        // Encontrar el número máximo
        const numeros = this.carpetas.map(c => parseInt(c.no_carpeta_fisica) || 0);
        const maximo = Math.max(...numeros);
        return maximo + 1;
    },

    /**
     * Mostrar formulario para crear carpeta
     */
    async mostrarFormularioCarpeta() {
        const siguienteNo = this.obtenerSiguienteNoCarpeta();
        
        return `
            <form id="formCarpeta" class="w-full max-w-4xl mx-auto space-y-6">
                <!-- Campo oculto con el valor real generado -->
                <input type="hidden" id="noCarpetaReal" name="no_carpeta_fisica" value="${siguienteNo}">
                
                <!-- Sección: Información de Carpeta -->
                <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%);">
                    <h2 class="text-lg font-semibold mb-4 flex items-center" style="color: var(--text-primary);">
                        <i class="fas fa-info-circle mr-2" style="color: #3b82f6;"></i>Información de la Carpeta
                    </h2>
                    
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <!-- Número de Carpeta Física (Solo Lectura) -->
                        <div>
                            <label for="noCarpetaDisplay" class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                                <i class="fas fa-hashtag mr-2"></i>No. Carpeta Física <span class="text-green-500 font-bold" title="Generado automáticamente">AUTOMÁTICO</span>
                            </label>
                            <div class="w-full px-4 py-3 border-2 rounded-lg flex items-center gap-2 no_carpeta_display" style="background-color: var(--bg-secondary); color: var(--text-primary); border-color: #10b981; font-size: 18px; font-weight: bold; min-height: 45px;">
                                <i class="fas fa-lock" style="color: #10b981;"></i><span id="noCarpetaDisplay">${siguienteNo}</span>
                            </div>
                            <p class="text-xs mt-2" style="color: var(--text-secondary);"><i class="fas fa-check-circle mr-1" style="color: #10b981;"></i>Se genera automáticamente</p>
                        </div>

                        <!-- Título de la Carpeta -->
                        <div>
                            <label for="titulo" class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                                <i class="fas fa-heading mr-2"></i>Título <span class="text-red-500">*</span>
                            </label>
                            <div>
                                <input 
                                    type="text" 
                                    id="titulo" 
                                    name="titulo" 
                                    required
                                    placeholder="Ej: Carpeta de Auditoría 2024"
                                    class="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    style="background-color: var(--card-bg); color: var(--text-primary); border-color: var(--border-color);"
                                    onchange="archivoGeneralModule.validarTitulo(this.value)"
                                >
                                <div id="errorTitulo" class="text-xs text-red-500 mt-1 hidden">
                                    <i class="fas fa-exclamation-circle mr-1"></i><span id="mensajeTitulo"></span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Etiqueta Identificadora -->
                    <div class="mt-4">
                        <label for="etiqueta" class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                            <i class="fas fa-tag mr-2"></i>Etiqueta Identificadora <span class="text-red-500">*</span>
                        </label>
                        <div>
                            <input 
                                type="text" 
                                id="etiqueta" 
                                name="etiqueta_identificadora" 
                                required
                                placeholder="Ej: AUD-2024-001"
                                class="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                style="background-color: var(--card-bg); color: var(--text-primary); border-color: var(--border-color);"
                                onchange="archivoGeneralModule.validarEtiqueta(this.value)"
                            >
                            <div id="errorEtiqueta" class="text-xs text-red-500 mt-1 hidden">
                                <i class="fas fa-exclamation-circle mr-1"></i><span id="mensajeEtiqueta"></span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Sección: Detalles -->
                <div class="bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-lg border border-gray-200" style="background: linear-gradient(135deg, rgba(107, 114, 128, 0.05) 0%, rgba(71, 85, 105, 0.05) 100%);">
                    <h2 class="text-lg font-semibold mb-4 flex items-center" style="color: var(--text-primary);">
                        <i class="fas fa-align-left mr-2" style="color: #6b7280;"></i>Detalles
                    </h2>
                    
                    <!-- Descripción -->
                    <div>
                        <label for="descripcion" class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                            <i class="fas fa-align-left mr-2"></i>Descripción (Opcional)
                        </label>
                        <textarea 
                            id="descripcion" 
                            name="descripcion" 
                            rows="4"
                            placeholder="Describe el contenido o propósito de esta carpeta..."
                            class="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                            style="background-color: var(--card-bg); color: var(--text-primary); border-color: var(--border-color);"
                        ></textarea>
                    </div>

                    <!-- Estado de Gestión -->
                    <div class="mt-4">
                        <label for="estadoGestion" class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                            <i class="fas fa-clipboard-list mr-2"></i>Estado de Gestión
                        </label>
                        <select 
                            id="estadoGestion" 
                            name="estado_gestion"
                            class="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                            style="background-color: var(--card-bg); color: var(--text-primary); border-color: var(--border-color);"
                        >
                            <option value="pendiente">📋 Pendiente</option>
                            <option value="en_revision">🔍 En Revisión</option>
                            <option value="archivado">📦 Archivado</option>
                            <option value="cancelado">❌ Cancelado</option>
                        </select>
                    </div>
                </div>

                <!-- Botones de acción -->
                <div class="flex flex-col sm:flex-row gap-3 justify-center pt-4" id="botonesFormularioCarpeta">
                    <button 
                        type="submit" 
                        class="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition font-semibold shadow-md hover:shadow-lg text-base"
                    >
                        <i class="fas fa-save mr-2"></i>Agregar Carpeta
                    </button>
                    <button 
                        type="reset" 
                        class="px-8 py-3 border-2 rounded-lg transition font-semibold text-base"
                        style="color: var(--text-primary); border-color: var(--border-color); background-color: var(--bg-secondary);"
                    >
                        <i class="fas fa-redo mr-2"></i>Limpiar
                    </button>
                </div>
                
                <!-- Contenedor para toast del formulario carpeta -->
                <div id="toastCarpetaContainer" style="min-height: 20px; display: flex; justify-content: center; align-items: center; margin: 10px 0;"></div>
            </form>

            <!-- Tabla de Carpetas Existentes -->
            <div class="mt-16 w-full">
                <div class="text-center mb-8">
                    <h2 class="text-2xl md:text-3xl font-bold mb-2 inline-flex items-center gap-2" style="color: var(--text-primary);">
                        <i class="fas fa-list" style="color: #3b82f6;"></i>Carpetas Registradas
                    </h2>
                    <p class="text-sm" style="color: var(--text-secondary);"><span id="totalCarpetas">${this.carpetas.length}</span> carpeta(s) en total</p>
                </div>
                
                <!-- Sección de Búsqueda y Filtros -->
                <div class="mb-8 flex justify-center">
                    <div class="w-full max-w-4xl bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%);">
                        <div class="flex items-center justify-center mb-4">
                            <i class="fas fa-eye text-2xl mr-3" style="color: #3b82f6;"></i>
                            <h3 class="text-lg font-semibold" style="color: var(--text-primary);">Filtros de Búsqueda</h3>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                            <!-- Campo de Búsqueda -->
                            <div class="md:col-span-4">
                                <label for="filtroCampo" class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                                    <i class="fas fa-filter mr-2"></i>Buscar por
                                </label>
                                <select 
                                    id="filtroCampo" 
                                    class="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    style="background-color: var(--card-bg); color: var(--text-primary); border-color: var(--border-color);"
                                    onchange="archivoGeneralModule.cambiarTipoFiltro()"
                                >
                                    <option value="titulo">Título</option>
                                    <option value="etiqueta">Etiqueta</option>
                                    <option value="descripcion">Descripción</option>
                                    <option value="estado">Estado de Gestión</option>
                                    <option value="fecha">Fecha de Creación</option>
                                    <option value="creador">Creado Por</option>
                                </select>
                            </div>
                            
                            <!-- Contenedor único para valor de búsqueda (dinámico) -->
                            <div class="md:col-span-5" id="contenedorValor"></div>
                            
                            <!-- Botones -->
                            <div class="md:col-span-3 flex gap-2">
                                <button 
                                    onclick="archivoGeneralModule.buscarCarpetas()" 
                                    class="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition font-medium shadow-md hover:shadow-lg"
                                >
                                    <i class="fas fa-search mr-2"></i>Buscar
                                </button>
                                <button 
                                    onclick="archivoGeneralModule.limpiarFiltro()" 
                                    class="flex-1 px-4 py-2 border-2 rounded-lg transition font-medium"
                                    style="color: var(--text-primary); border-color: var(--border-color); background-color: var(--bg-secondary);"
                                >
                                    <i class="fas fa-times-circle mr-2"></i>Limpiar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Contenedor para toast de búsqueda -->
                <div id="toastBusquedaContainer" style="min-height: 20px; display: flex; justify-content: center; align-items: center; margin: 10px 0;"></div>
                
                <div class="overflow-x-auto rounded-lg border shadow-md" style="border-color: var(--border-color);">
                    <table class="w-full text-xs sm:text-sm" style="background-color: var(--card-bg);">
                        <thead style="background-color: var(--bg-secondary); border-bottom: 2px solid var(--border-color);">
                            <tr>
                                <th class="px-3 sm:px-6 py-3 text-left font-semibold" style="color: var(--text-primary);">
                                    <i class="fas fa-hashtag mr-1"></i>No.
                                </th>
                                <th class="px-3 sm:px-6 py-3 text-left font-semibold" style="color: var(--text-primary);">
                                    <i class="fas fa-heading mr-1"></i>Título
                                </th>
                                <th class="px-3 sm:px-6 py-3 text-left font-semibold" style="color: var(--text-primary);">
                                    <i class="fas fa-tag mr-1"></i>Etiqueta
                                </th>
                                <th class="px-3 sm:px-6 py-3 text-left font-semibold hidden md:table-cell" style="color: var(--text-primary);">
                                    <i class="fas fa-align-left mr-1"></i>Descripción
                                </th>
                                <th class="px-3 sm:px-6 py-3 text-left font-semibold" style="color: var(--text-primary);">
                                    <i class="fas fa-info-circle mr-1"></i>Estado
                                </th>
                                <th class="px-3 sm:px-6 py-3 text-left font-semibold hidden lg:table-cell" style="color: var(--text-primary);">
                                    <i class="fas fa-user mr-1"></i>Creado Por
                                </th>
                                <th class="px-3 sm:px-6 py-3 text-left font-semibold hidden sm:table-cell" style="color: var(--text-primary);">
                                    <i class="fas fa-calendar mr-1"></i>Fecha
                                </th>
                                <th class="px-3 sm:px-6 py-3 text-center font-semibold" style="color: var(--text-primary);">
                                    <i class="fas fa-cog mr-1"></i>Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody id="tablaCarpetas">
                            ${await this.renderizarTablaCarpetas()}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    /**
     * Renderizar tabla de carpetas
     */
    async renderizarTablaCarpetas() {
        if (this.carpetas.length === 0) {
            return '<tr><td colspan="8" class="px-6 py-6 text-center text-sm" style="color: var(--text-secondary);"><i class="fas fa-inbox mr-2"></i>No hay carpetas registradas aún</td></tr>';
        }

        return this.carpetas.map(carpeta => {
            const estado = carpeta.estado_gestion || 'pendiente';
            const coloresEstado = {
                'pendiente': { bg: '#fef3c7', text: '#92400e', icono: '📋' },
                'en_revision': { bg: '#dbeafe', text: '#1e40af', icono: '🔍' },
                'archivado': { bg: '#e5e7eb', text: '#374151', icono: '📦' },
                'cancelado': { bg: '#fee2e2', text: '#991b1b', icono: '❌' }
            };
            const colores = coloresEstado[estado] || coloresEstado['pendiente'];
            const fechaFormato = new Date(carpeta.fecha_creacion).toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
            const nombreCreador = carpeta.nombre ? `${carpeta.nombre} ${carpeta.apellido_paterno || ''}` : 'Sistema';
            const descripcionCorta = carpeta.descripcion ? (carpeta.descripcion.length > 50 ? carpeta.descripcion.substring(0, 50) + '...' : carpeta.descripcion) : '-';

            return `
                <tr style="border-bottom: 1px solid var(--border-color); transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='var(--bg-secondary)'" onmouseout="this.style.backgroundColor='transparent';">
                    <td class="px-3 sm:px-6 py-4 font-bold text-sm" style="color: #3b82f6;">
                        <i class="fas fa-folder-open mr-2"></i>${carpeta.no_carpeta_fisica}
                    </td>
                    <td class="px-3 sm:px-6 py-4 font-medium text-sm" style="color: var(--text-primary);">
                        <i class="fas fa-heading mr-2" style="color: #8b5cf6;"></i>${carpeta.titulo}
                    </td>
                    <td class="px-3 sm:px-6 py-4 font-medium text-sm" style="color: var(--text-primary);">
                        <i class="fas fa-tag mr-2" style="color: #6b7280;"></i>${carpeta.etiqueta_identificadora}
                    </td>
                    <td class="px-3 sm:px-6 py-4 text-xs sm:text-sm hidden md:table-cell" style="color: var(--text-secondary);" title="${carpeta.descripcion || 'Sin descripción'}">
                        ${descripcionCorta}
                    </td>
                    <td class="px-3 sm:px-6 py-4">
                        <span class="px-2 sm:px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap" style="background-color: ${colores.bg}; color: ${colores.text};">
                            ${colores.icono} ${estado.replace('_', ' ').toUpperCase()}
                        </span>
                    </td>
                    <td class="px-3 sm:px-6 py-4 text-xs sm:text-sm hidden lg:table-cell" style="color: var(--text-secondary);">
                        <i class="fas fa-user-circle mr-1"></i>${nombreCreador}
                    </td>
                    <td class="px-3 sm:px-6 py-4 text-xs sm:text-sm hidden sm:table-cell" style="color: var(--text-secondary);">
                        <i class="fas fa-clock mr-1"></i>${fechaFormato}
                    </td>
                    <td class="px-3 sm:px-6 py-4 text-center whitespace-nowrap">
                        <button onclick="archivoGeneralModule.editarCarpeta(${carpeta.id_carpeta})" 
                                class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-3 transition" 
                                title="Editar carpeta">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="archivoGeneralModule.eliminarCarpeta(${carpeta.id_carpeta}, '${carpeta.titulo}')" 
                                class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition" 
                                title="Eliminar carpeta">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    /**
     * Crear carpeta
     */
    async crearCarpeta(formData) {
        try {
            // Obtener valores del formulario
            const titulo = (formData.get('titulo') || '').trim();
            const etiqueta = (formData.get('etiqueta_identificadora') || '').trim();
            const descripcion = (formData.get('descripcion') || '').trim();
            const estado = (formData.get('estado_gestion') || 'pendiente').trim();
            const noCarpeta = parseInt(formData.get('no_carpeta_fisica'));

            // Validar que los campos requeridos no estén vacíos
            if (!titulo) {
                this.mostrarToastFormularioCarpeta('El título es requerido', 'error');
                return;
            }
            if (!etiqueta) {
                this.mostrarToastFormularioCarpeta('La etiqueta es requerida', 'error');
                return;
            }

            const datos = {
                no_carpeta_fisica: noCarpeta,
                titulo: titulo,
                etiqueta_identificadora: etiqueta,
                descripcion: descripcion,
                estado_gestion: estado
            };

            console.log('📝 Creando carpeta con datos:', datos);

            const resultado = await api.post('/carpetas/crear', datos);

            console.log('✅ Respuesta del servidor:', resultado);

            if (resultado.success) {
                this.mostrarToastFormularioCarpeta('✓ Carpeta agregada exitosamente', 'success');
                
                // Recargar carpetas
                await this.cargarCarpetas();
                console.log('📦 Carpetas cargadas:', this.carpetas);
                
                // Actualizar tabla dinámicamente
                const tablaCarpetas = document.getElementById('tablaCarpetas');
                if (tablaCarpetas) {
                    tablaCarpetas.innerHTML = await this.renderizarTablaCarpetas();
                    console.log('✏️ Tabla actualizada');
                }

                // Actualizar total
                const totalCarpetas = document.getElementById('totalCarpetas');
                if (totalCarpetas) {
                    totalCarpetas.textContent = this.carpetas.length;
                }
                
                // Actualizar el número de carpeta en el formulario
                const siguienteNo = this.obtenerSiguienteNoCarpeta();
                const noCarpetaDisplay = document.getElementById('noCarpetaDisplay');
                const noCarpetaReal = document.getElementById('noCarpetaReal');
                if (noCarpetaDisplay) {
                    noCarpetaDisplay.textContent = siguienteNo;
                }
                if (noCarpetaReal) {
                    noCarpetaReal.value = siguienteNo;
                }
                
                // Limpiar formulario
                const form = document.getElementById('formCarpeta');
                if (form) {
                    form.reset();
                }
            } else {
                console.error('❌ Error en respuesta:', resultado);
                this.mostrarToastFormularioCarpeta(resultado.message || 'Error al agregar carpeta', 'error');
            }
        } catch (error) {
            console.error('❌ Error creando carpeta:', error);
            this.mostrarToastFormularioCarpeta('Error: ' + (error.message || 'Error al agregar la carpeta'), 'error');
        }
    },

    /**
     * Mostrar toast de éxito centrado debajo de botones de búsqueda
     */
    mostrarToastExito(mensaje) {
        const toastContainer = document.getElementById('toastBusquedaContainer');
        if (toastContainer) {
            ui.toast(mensaje, 'success', 3000, toastContainer);
        } else {
            ui.toast(mensaje, 'success', 3000);
        }
    },

    /**
     * Mostrar toast de error centrado debajo de botones de búsqueda
     */
    mostrarToastError(mensaje) {
        const toastContainer = document.getElementById('toastBusquedaContainer');
        if (toastContainer) {
            ui.toast(mensaje, 'error', 3000, toastContainer);
        } else {
            ui.toast(mensaje, 'error', 3000);
        }
    },

    /**
     * Mostrar toast para formulario de crear carpeta (debajo del botón)
     */
    mostrarToastFormularioCarpeta(mensaje, tipo = 'success') {
        const toastContainer = document.getElementById('toastCarpetaContainer');
        if (toastContainer) {
            ui.toast(mensaje, tipo, 3000, toastContainer);
        } else {
            ui.toast(mensaje, tipo, 3000);
        }
    },

    /**
     * Mostrar toast para formulario de crear documento (debajo del botón)
     */
    mostrarToastFormularioDocumento(mensaje, tipo = 'success') {
        const toastContainer = document.getElementById('toastDocumentoContainer');
        if (toastContainer) {
            ui.toast(mensaje, tipo, 3000, toastContainer);
        } else {
            ui.toast(mensaje, tipo, 3000);
        }
    },

    /**
     * Mostrar toast de búsqueda de documentos centrado
     */
    mostrarToastBusquedaDocumento(mensaje, tipo = 'success') {
        const toastContainer = document.getElementById('toastBusquedaDocumentoContainer');
        if (toastContainer) {
            ui.toast(mensaje, tipo, 3000, toastContainer);
        } else {
            ui.toast(mensaje, tipo, 3000);
        }
    },

    /**
     * Cambiar tipo de filtro de documento
     */
    cambiarTipoFiltroDocumento() {
        const campo = document.getElementById('filtroDocumentoCampo').value;
        const contenedor = document.getElementById('contenedorValorDocumento');
        
        // Limpiar contenedor
        contenedor.innerHTML = '';
        
        switch(campo) {
            case 'estado':
                contenedor.innerHTML = `
                    <label for="filtroDocumentoValor" class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                        <i class="fas fa-info-circle mr-2"></i>Estado
                    </label>
                    <select 
                        id="filtroDocumentoValor" 
                        class="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                        style="background-color: var(--card-bg); color: var(--text-primary); border-color: var(--border-color);"
                    >
                        <option value="">-- Selecciona un estado --</option>
                        <option value="pendiente">📋 Pendiente</option>
                        <option value="en_revision">🔍 En Revisión</option>
                        <option value="archivado">📦 Archivado</option>
                        <option value="cancelado">❌ Cancelado</option>
                    </select>
                `;
                break;
                
            case 'fecha_oficio':
                contenedor.innerHTML = `
                    <label for="filtroDocumentoValor" class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                        <i class="fas fa-calendar mr-2"></i>Fecha de Oficio
                    </label>
                    <input 
                        type="date" 
                        id="filtroDocumentoValor" 
                        class="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                        style="background-color: var(--card-bg); color: var(--text-primary); border-color: var(--border-color);"
                    >
                `;
                break;
                
            default:
                // Otros campos (no_oficio, emitido_por, descripcion)
                contenedor.innerHTML = `
                    <label for="filtroDocumentoValor" class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                        <i class="fas fa-search mr-2"></i>Valor
                    </label>
                    <input 
                        type="text" 
                        id="filtroDocumentoValor" 
                        placeholder="Ingrese el valor a buscar..."
                        class="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                        style="background-color: var(--card-bg); color: var(--text-primary); border-color: var(--border-color);"
                    >
                `;
                break;
        }
    },

    /**
     * Buscar documentos según filtro
     */
    async buscarDocumentos() {
        const campo = document.getElementById('filtroDocumentoCampo').value;
        let valor = document.getElementById('filtroDocumentoValor');
        
        // Validar que el elemento existe
        if (!valor) {
            this.mostrarToastBusquedaDocumento('Error: elemento de búsqueda no encontrado', 'error');
            return;
        }
        
        // Capturar el valor según el tipo de elemento
        let valorBusqueda = '';
        if (valor.tagName === 'SELECT') {
            valorBusqueda = valor.value; // Para SELECT (estado, fecha)
        } else if (valor.tagName === 'INPUT') {
            valorBusqueda = valor.value.trim(); // Para INPUT (texto)
        } else {
            valorBusqueda = valor.value.trim();
        }
        
        console.log(`Buscando documentos - Campo: ${campo}, Valor: ${valorBusqueda}, Tipo: ${valor.tagName}`);
        
        // Requerir valor para todos los campos
        if (!valorBusqueda) {
            if (campo === 'estado') {
                this.mostrarToastBusquedaDocumento('Por favor seleccione un estado', 'error');
            } else if (campo === 'fecha_oficio') {
                this.mostrarToastBusquedaDocumento('Por favor seleccione una fecha de oficio', 'error');
            } else {
                this.mostrarToastBusquedaDocumento('Por favor ingrese un valor para buscar', 'error');
            }
            return;
        }
        
        try {
            // Filtrar documentos locales
            let documentosFiltrados = [...this.documentosPorCarpeta];
            
            switch(campo) {
                case 'no_oficio':
                    documentosFiltrados = documentosFiltrados.filter(d => {
                        const valores = d.valores || {};
                        const noOficio = valores['No. Oficio'] || '';
                        return noOficio.toLowerCase().includes(valorBusqueda.toLowerCase());
                    });
                    break;
                    
                case 'emitido_por':
                    documentosFiltrados = documentosFiltrados.filter(d => {
                        const valores = d.valores || {};
                        const emitidoPor = valores['Emitido Por'] || '';
                        return emitidoPor.toLowerCase().includes(valorBusqueda.toLowerCase());
                    });
                    break;
                    
                case 'descripcion':
                    documentosFiltrados = documentosFiltrados.filter(d => 
                        d.descripcion && d.descripcion.toLowerCase().includes(valorBusqueda.toLowerCase())
                    );
                    break;
                    
                case 'estado':
                    documentosFiltrados = documentosFiltrados.filter(d => 
                        d.estado_gestion === valorBusqueda
                    );
                    console.log(`Buscando por estado: ${valorBusqueda}, encontrados: ${documentosFiltrados.length}`);
                    break;
                    
                case 'fecha_oficio':
                    documentosFiltrados = documentosFiltrados.filter(d => {
                        const fechaDocumento = d.fecha_oficio ? new Date(d.fecha_oficio).toISOString().split('T')[0] : '';
                        return fechaDocumento === valorBusqueda;
                    });
                    console.log(`Buscando por fecha: ${valorBusqueda}, encontrados: ${documentosFiltrados.length}`);
                    break;
            }
            
            // Guardar resultados filtrados
            this.documentosFiltrados = documentosFiltrados;
            
            // Actualizar tabla con resultados
            await this.renderizarTablaDocumentosFiltrados();
            
            if (documentosFiltrados.length === 0) {
                this.mostrarToastBusquedaDocumento('No se encontraron resultados para la búsqueda', 'success');
            } else {
                this.mostrarToastBusquedaDocumento(`Se encontraron ${documentosFiltrados.length} resultado(s)`, 'success');
            }
        } catch (error) {
            console.error('Error buscando documentos:', error);
            this.mostrarToastBusquedaDocumento('Error al buscar documentos', 'error');
        }
    },

    /**
     * Limpiar filtro de documentos
     */
    async limpiarFiltroDocumento() {
        // Limpiar campos
        document.getElementById('filtroDocumentoCampo').value = 'no_oficio';
        document.getElementById('filtroDocumentoValor').value = '';
        
        // Mostrar contenedor de texto por defecto
        this.cambiarTipoFiltroDocumento();
        
        // Limpiar resultados filtrados
        this.documentosFiltrados = [];
        
        // Recargar tabla con todos los documentos
        await this.actualizarTablaDocumentos();
        
        this.mostrarToastBusquedaDocumento('Filtro limpiado correctamente', 'success');
    },

    /**
     * Renderizar tabla de documentos filtrados
     */
    async renderizarTablaDocumentosFiltrados() {
        const container = document.getElementById('tablaDocumentosContainer');
        if (!container) return;

        if (this.documentosFiltrados.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 30px; color: var(--text-secondary);">
                    <i class="fas fa-search text-4xl mb-3" style="color: #9ca3af;"></i>
                    <p>No se encontraron documentos con los criterios de búsqueda</p>
                </div>
            `;
            return;
        }

        const tablaHTML = `
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <thead>
                    <tr style="border-bottom: 2px solid var(--border-color); background-color: var(--bg-secondary);">
                        <th style="padding: 12px; text-align: left; color: var(--text-primary); font-weight: 600;">No. Oficio</th>
                        <th style="padding: 12px; text-align: left; color: var(--text-primary); font-weight: 600;">Emitido Por</th>
                        <th style="padding: 12px; text-align: left; color: var(--text-primary); font-weight: 600;">Fecha</th>
                        <th style="padding: 12px; text-align: left; color: var(--text-primary); font-weight: 600;">Estado</th>
                        <th style="padding: 12px; text-align: center; color: var(--text-primary); font-weight: 600;">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.documentosFiltrados.map((doc, index) => {
                        const estiloFila = index % 2 === 0 ? 'background-color: transparent;' : 'background-color: var(--bg-secondary);';
                        const valores = doc.valores || {};
                        const noOficio = valores['No. Oficio'] || 'N/A';
                        const emitidoPor = valores['Emitido Por'] || 'N/A';
                        const fecha = doc.fecha_oficio ? new Date(doc.fecha_oficio).toLocaleDateString('es-ES') : 'N/A';
                        const estado = doc.estado_gestion || 'pendiente';
                        
                        let colorEstado = '#ef4444'; // rojo
                        let iconoEstado = 'fa-hourglass-start';
                        
                        if (estado === 'en_revision') {
                            colorEstado = '#f59e0b';
                            iconoEstado = 'fa-hourglass-half';
                        } else if (estado === 'archivado') {
                            colorEstado = '#10b981';
                            iconoEstado = 'fa-check-circle';
                        } else if (estado === 'cancelado') {
                            colorEstado = '#6b7280';
                            iconoEstado = 'fa-ban';
                        }
                        
                        return `
                            <tr style="border-bottom: 1px solid var(--border-color); ${estiloFila}">
                                <td style="padding: 12px; color: var(--text-primary); font-weight: 600;">${noOficio}</td>
                                <td style="padding: 12px; color: var(--text-primary);">${emitidoPor}</td>
                                <td style="padding: 12px; color: var(--text-primary);">${fecha}</td>
                                <td style="padding: 12px;">
                                    <span style="display: inline-flex; align-items: center; gap: 5px; padding: 4px 8px; border-radius: 4px; background-color: ${colorEstado}20; color: ${colorEstado}; font-size: 0.85rem; font-weight: 600;">
                                        <i class="fas ${iconoEstado}"></i>${estado.replace('_', ' ')}</span>
                                </td>
                                <td style="padding: 12px; text-align: center;">
                                    <button onclick="archivoGeneralModule.verDocumento(${doc.id_registro})" title="Ver detalles" style="background: none; border: none; color: #3b82f6; cursor: pointer; font-size: 16px; margin: 0 5px;">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button onclick="archivoGeneralModule.editarDocumento(${doc.id_registro})" title="Editar" style="background: none; border: none; color: #f59e0b; cursor: pointer; font-size: 16px; margin: 0 5px;">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button onclick="archivoGeneralModule.eliminarDocumento(${doc.id_registro})" title="Eliminar" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 16px; margin: 0 5px;">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
        
        container.innerHTML = tablaHTML;
    },

    /**
     * Validar que el título no se repita
     */
    validarTitulo(valor) {
        if (!valor || !valor.trim()) {
            const error = document.getElementById('errorTitulo');
            if (error) error.classList.add('hidden');
            return;
        }

        const error = document.getElementById('errorTitulo');
        const mensaje = document.getElementById('mensajeTitulo');
        
        if (!error || !mensaje) return; // Elementos no existen aún
        
        const existe = this.carpetas.some(c => 
            c.titulo && c.titulo.toLowerCase() === valor.toLowerCase()
        );
        
        if (existe) {
            error.classList.remove('hidden');
            mensaje.textContent = 'El título ya existe en otra carpeta';
        } else {
            error.classList.add('hidden');
        }
    },

    /**
     * Validar que la etiqueta no se repita
     */
    validarEtiqueta(valor) {
        if (!valor || !valor.trim()) {
            const error = document.getElementById('errorEtiqueta');
            if (error) error.classList.add('hidden');
            return;
        }

        const error = document.getElementById('errorEtiqueta');
        const mensaje = document.getElementById('mensajeEtiqueta');
        
        if (!error || !mensaje) return; // Elementos no existen aún

        const existe = this.carpetas.some(c => 
            c.etiqueta_identificadora && c.etiqueta_identificadora.toLowerCase() === valor.toLowerCase()
        );
        
        if (existe) {
            error.classList.remove('hidden');
            mensaje.textContent = 'La etiqueta ya existe en otra carpeta';
        } else {
            error.classList.add('hidden');
        }
    },

    /**
     * Cargar carpetas disponibles
     */
    async cargarCarpetas() {
        try {
            const resultado = await api.get('/carpetas', { limit: 100 });

            if (resultado.success && resultado.data && resultado.data.carpetas) {
                this.carpetas = resultado.data.carpetas;
            }
        } catch (error) {
            console.error('Error cargando carpetas:', error);
        }
    },

    /**
     * Cargar documentos de una carpeta específica
     */
    async cargarDocumentosPorCarpeta(idCarpeta) {
        try {
            if (!idCarpeta) {
                this.documentosPorCarpeta = [];
                return;
            }

            // Llamar a API (endpoint que crearemos)
            const resultado = await api.get('/documentos/por-carpeta/' + idCarpeta);

            if (resultado.success && Array.isArray(resultado.data)) {
                this.documentosPorCarpeta = resultado.data;
                console.log(`✓ ${this.documentosPorCarpeta.length} documentos cargados para carpeta ${idCarpeta}`);
            } else {
                this.documentosPorCarpeta = [];
            }
        } catch (error) {
            console.error('Error cargando documentos:', error);
            this.documentosPorCarpeta = [];
        }
    },

    /**
     * Renderizar tabla de documentos
     */
    async renderizarTablaDocumentos() {
        const idCarpeta = document.getElementById('carpetaDocumento')?.value;
        
        if (!idCarpeta) {
            return `
                <div style="text-align: center; padding: 30px; color: var(--text-secondary);">
                    <i class="fas fa-inbox text-4xl mb-3" style="color: #9ca3af;"></i>
                    <p>Selecciona una carpeta para ver los documentos registrados</p>
                </div>
            `;
        }

        // Cargar documentos de la carpeta seleccionada
        await this.cargarDocumentosPorCarpeta(idCarpeta);

        if (this.documentosPorCarpeta.length === 0) {
            return `
                <div style="text-align: center; padding: 30px; color: var(--text-secondary);">
                    <i class="fas fa-file-alt text-4xl mb-3" style="color: #9ca3af;"></i>
                    <p>No hay documentos registrados en esta carpeta</p>
                </div>
            `;
        }

        return `
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <thead>
                    <tr style="border-bottom: 2px solid var(--border-color); background-color: var(--bg-secondary);">
                        <th style="padding: 12px; text-align: left; color: var(--text-primary); font-weight: 600;">No. Oficio</th>
                        <th style="padding: 12px; text-align: left; color: var(--text-primary); font-weight: 600;">Emitido Por</th>
                        <th style="padding: 12px; text-align: left; color: var(--text-primary); font-weight: 600;">Fecha</th>
                        <th style="padding: 12px; text-align: left; color: var(--text-primary); font-weight: 600;">Estado</th>
                        <th style="padding: 12px; text-align: center; color: var(--text-primary); font-weight: 600;">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.documentosPorCarpeta.map((doc, index) => {
                        const estiloFila = index % 2 === 0 ? 'background-color: transparent;' : 'background-color: var(--bg-secondary);';
                        const valores = doc.valores || {};
                        const noOficio = valores['No. Oficio'] || 'N/A';
                        const emitidoPor = valores['Emitido Por'] || 'N/A';
                        const fecha = doc.fecha_documento ? new Date(doc.fecha_documento).toLocaleDateString('es-ES') : 'N/A';
                        const estado = doc.estado_gestion || 'pendiente';
                        
                        let colorEstado = '#ef4444'; // rojo
                        let iconoEstado = 'fa-hourglass-start';
                        
                        if (estado === 'en_revision') {
                            colorEstado = '#f59e0b';
                            iconoEstado = 'fa-hourglass-half';
                        } else if (estado === 'archivado') {
                            colorEstado = '#10b981';
                            iconoEstado = 'fa-check-circle';
                        } else if (estado === 'cancelado') {
                            colorEstado = '#6b7280';
                            iconoEstado = 'fa-ban';
                        }
                        
                        return `
                            <tr style="border-bottom: 1px solid var(--border-color); ${estiloFila}">
                                <td style="padding: 12px; color: var(--text-primary); font-weight: 600;">${noOficio}</td>
                                <td style="padding: 12px; color: var(--text-primary);">${emitidoPor}</td>
                                <td style="padding: 12px; color: var(--text-primary);">${fecha}</td>
                                <td style="padding: 12px;">
                                    <span style="display: inline-flex; align-items: center; gap: 5px; padding: 4px 8px; border-radius: 4px; background-color: ${colorEstado}20; color: ${colorEstado}; font-size: 0.85rem; font-weight: 600;">
                                        <i class="fas ${iconoEstado}"></i>${estado.replace('_', ' ')}
                                    </span>
                                </td>
                                <td style="padding: 12px; text-align: center;">
                                    <button onclick="archivoGeneralModule.verDocumento(${doc.id_registro})" title="Ver detalles" style="background: none; border: none; color: #3b82f6; cursor: pointer; font-size: 16px; margin: 0 5px;">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button onclick="archivoGeneralModule.eliminarDocumento(${doc.id_registro})" title="Eliminar" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 16px; margin: 0 5px;">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    },

    /**
     * Actualizar tabla de documentos
     */
    async actualizarTablaDocumentos() {
        const container = document.getElementById('tablaDocumentosContainer');
        if (container) {
            container.innerHTML = await this.renderizarTablaDocumentos();
        }
    },

    /**
     * Ver detalles de un documento
     */
    verDocumento(id) {
        ui.toast('Función disponible próximamente', 'info');
    },

    /**
     * Editar un documento
     */
    async editarDocumento(id) {
        // Buscar el documento en los datos cargados
        const documento = this.documentosPorCarpeta.find(d => d.id_registro === id);
        if (!documento) {
            this.mostrarToastBusquedaDocumento('Documento no encontrado', 'error');
            return;
        }

        // Mostrar modal de edición con los datos del documento
        const valores = documento.valores || {};
        const noOficio = valores['No. Oficio'] || '';
        const emitidoPor = valores['Emitido Por'] || '';
        const descripcion = documento.descripcion || '';
        const fechaOficio = documento.fecha_oficio ? new Date(documento.fecha_oficio).toISOString().split('T')[0] : '';
        const capturadoPor = documento.capturado_por || '';
        const auditoria = documento.auditoria || '';

        const modalHTML = `
            <div class="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <h2 class="text-xl font-bold mb-6 text-gray-800">
                    <i class="fas fa-edit mr-2 text-purple-600"></i>Editar Documento
                </h2>
                
                <form id="formEditarDocumento" class="space-y-4">
                    <!-- No. Oficio -->
                    <div>
                        <label class="block text-sm font-medium mb-2 text-gray-700">
                            <i class="fas fa-barcode mr-2"></i>No. de Oficio <span class="text-red-500">*</span>
                        </label>
                        <input 
                            type="text" 
                            id="editNoOficio" 
                            value="${noOficio}"
                            required
                            class="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            style="border-color: #d1d5db;"
                        >
                    </div>

                    <!-- Emitido Por -->
                    <div>
                        <label class="block text-sm font-medium mb-2 text-gray-700">
                            <i class="fas fa-user mr-2"></i>Emitido Por <span class="text-red-500">*</span>
                        </label>
                        <input 
                            type="text" 
                            id="editEmitidoPor" 
                            value="${emitidoPor}"
                            required
                            class="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            style="border-color: #d1d5db;"
                        >
                    </div>

                    <!-- Fecha de Oficio -->
                    <div>
                        <label class="block text-sm font-medium mb-2 text-gray-700">
                            <i class="fas fa-calendar mr-2"></i>Fecha de Oficio <span class="text-red-500">*</span>
                        </label>
                        <input 
                            type="date" 
                            id="editFechaOficio" 
                            value="${fechaOficio}"
                            required
                            class="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            style="border-color: #d1d5db;"
                        >
                    </div>

                    <!-- Auditoría -->
                    <div>
                        <label class="block text-sm font-medium mb-2 text-gray-700">
                            <i class="fas fa-search mr-2"></i>Auditoría
                        </label>
                        <input 
                            type="text" 
                            id="editAuditoria" 
                            value="${auditoria}"
                            placeholder="Ej: Auditoría Interna Q1"
                            class="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            style="border-color: #d1d5db;"
                        >
                    </div>

                    <!-- Descripción -->
                    <div>
                        <label class="block text-sm font-medium mb-2 text-gray-700">
                            <i class="fas fa-align-left mr-2"></i>Descripción <span class="text-red-500">*</span>
                        </label>
                        <textarea 
                            id="editDescripcion" 
                            rows="4"
                            required
                            class="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                            style="border-color: #d1d5db;"
                        >${descripcion}</textarea>
                    </div>

                    <!-- Capturado Por -->
                    <div>
                        <label class="block text-sm font-medium mb-2 text-gray-700">
                            <i class="fas fa-keyboard mr-2"></i>Capturado Por <span class="text-red-500">*</span>
                        </label>
                        <input 
                            type="text" 
                            id="editCapturadoPor" 
                            value="${capturadoPor}"
                            required
                            class="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            style="border-color: #d1d5db;"
                        >
                    </div>

                    <!-- Botones -->
                    <div class="flex gap-3 justify-end pt-4">
                        <button 
                            type="button" 
                            onclick="ui.closeModal('modalEditarDocumento')"
                            class="px-6 py-2 border-2 rounded-lg font-medium transition"
                            style="border-color: #d1d5db; color: #6b7280;"
                        >
                            <i class="fas fa-times mr-2"></i>Cancelar
                        </button>
                        <button 
                            type="submit" 
                            class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                        >
                            <i class="fas fa-save mr-2"></i>Guardar Cambios
                        </button>
                    </div>
                </form>
            </div>
        `;

        // Mostrar modal
        ui.modal('Editar Documento', modalHTML, []);
        
        // Agregar evento submit al formulario
        setTimeout(() => {
            const form = document.getElementById('formEditarDocumento');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.guardarCambiosDocumento(id);
                });
            }
        }, 100);
    },

    /**
     * Guardar cambios del documento
     */
    async guardarCambiosDocumento(id) {
        try {
            // Obtener valores del formulario
            const noOficio = document.getElementById('editNoOficio').value.trim();
            const emitidoPor = document.getElementById('editEmitidoPor').value.trim();
            const fechaOficio = document.getElementById('editFechaOficio').value;
            const auditoria = document.getElementById('editAuditoria').value.trim();
            const descripcion = document.getElementById('editDescripcion').value.trim();
            const capturadoPor = document.getElementById('editCapturadoPor').value.trim();

            // Validaciones
            if (!noOficio) {
                ui.toast('El número de oficio es requerido', 'error');
                return;
            }
            if (!emitidoPor) {
                ui.toast('El campo "Emitido Por" es requerido', 'error');
                return;
            }
            if (!fechaOficio) {
                ui.toast('La fecha de oficio es requerida', 'error');
                return;
            }
            if (!descripcion) {
                ui.toast('La descripción es requerida', 'error');
                return;
            }
            if (!capturadoPor) {
                ui.toast('El campo "Capturado Por" es requerido', 'error');
                return;
            }

            // Preparar datos para actualizar
            const datos = {
                no_oficio: noOficio,
                emitido_por: emitidoPor,
                fecha_oficio: fechaOficio,
                auditoria: auditoria,
                descripcion: descripcion,
                capturado_por: capturadoPor
            };

            console.log('📝 Actualizando documento:', { id, datos });

            // Enviar a API (endpoint que crearemos)
            const resultado = await api.put(`/documentos/actualizar/${id}`, datos);

            console.log('✅ Respuesta del servidor:', resultado);

            if (resultado.success) {
                ui.toast('✓ Documento actualizado exitosamente', 'success');
                
                // Cerrar modal
                ui.closeModal('modalEditarDocumento');
                
                // Recargar documentos de la carpeta
                const idCarpeta = document.getElementById('carpetaDocumento')?.value;
                if (idCarpeta) {
                    await this.cargarDocumentosPorCarpeta(idCarpeta);
                    await this.actualizarTablaDocumentos();
                }
            } else {
                console.error('❌ Error en respuesta:', resultado);
                ui.toast(resultado.message || 'Error al actualizar documento', 'error');
            }
        } catch (error) {
            console.error('❌ Error actualizando documento:', error);
            ui.toast('Error: ' + (error.message || 'Error al actualizar el documento'), 'error');
        }
    },

    /**
     * Eliminar un documento
     */
    async eliminarDocumento(id) {
        ui.confirmToast(
            '¿Estás seguro de que deseas eliminar este documento? Esta acción no se puede deshacer.',
            async () => {
                try {
                    console.log('🗑️ Eliminando documento:', id);
                    
                    // Enviar a API (endpoint que crearemos)
                    const resultado = await api.delete(`/documentos/eliminar/${id}`);
                    
                    console.log('✅ Respuesta del servidor:', resultado);
                    
                    if (resultado.success) {
                        ui.toast('✓ Documento eliminado exitosamente', 'success');
                        
                        // Recargar documentos de la carpeta
                        const idCarpeta = document.getElementById('carpetaDocumento')?.value;
                        if (idCarpeta) {
                            await this.cargarDocumentosPorCarpeta(idCarpeta);
                            await this.actualizarTablaDocumentos();
                        }
                    } else {
                        console.error('❌ Error en respuesta:', resultado);
                        ui.toast(resultado.message || 'Error al eliminar documento', 'error');
                    }
                } catch (error) {
                    console.error('❌ Error eliminando documento:', error);
                    ui.toast('Error: ' + (error.message || 'Error al eliminar el documento'), 'error');
                }
            }
        );
    },

    /**
     * Mostrar formulario para registrar documento
     */
    async mostrarFormularioDocumento() {
        // Asegurar que las carpetas estén cargadas
        if (this.carpetas.length === 0) {
            await this.cargarCarpetas();
        }

        const hoy = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        
        return `
            <div class="w-full max-w-6xl mx-auto space-y-6">
                <form id="formDocumento" class="space-y-6">
                    <!-- Sección: Identificación de Oficio -->
                    <div class="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200" style="background: linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(236, 72, 153, 0.05) 100%);">
                        <h2 class="text-lg font-semibold mb-4 flex items-center" style="color: var(--text-primary);">
                            <i class="fas fa-file-invoice mr-2" style="color: #a855f7;"></i>Identificación del Oficio
                        </h2>
                        
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <!-- No. de Oficio -->
                            <div>
                                <label for="noOficio" class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                                    <i class="fas fa-barcode mr-2"></i>No. de Oficio <span class="text-red-500">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    id="noOficio" 
                                    name="no_oficio" 
                                    required
                                    placeholder="Ej: OF-2024-001"
                                    class="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                                    style="background-color: var(--card-bg); color: var(--text-primary); border-color: var(--border-color);"
                                >
                            </div>

                            <!-- No. Carpeta Física -->
                            <div>
                                <label for="carpetaDocumento" class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                                    <i class="fas fa-folder mr-2"></i>No. Carpeta Física <span class="text-red-500">*</span>
                                </label>
                                <select 
                                    id="carpetaDocumento" 
                                    name="id_carpeta" 
                                    required
                                    onchange="archivoGeneralModule.actualizarTablaDocumentos()"
                                    class="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                                    style="background-color: var(--card-bg); color: var(--text-primary); border-color: var(--border-color);"
                                >
                                    <option value="">Selecciona una carpeta...</option>
                                    ${this.carpetas.map(c => `<option value="${c.id_carpeta}">${c.no_carpeta_fisica} - ${c.etiqueta_identificadora}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Sección: Datos Principales -->
                    <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%);">
                        <h2 class="text-lg font-semibold mb-4 flex items-center" style="color: var(--text-primary);">
                            <i class="fas fa-info-circle mr-2" style="color: #3b82f6;"></i>Datos del Oficio
                        </h2>
                        
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <!-- Auditoría (Opcional) -->
                            <div>
                                <label for="auditoria" class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                                    <i class="fas fa-search mr-2"></i>Auditoría
                                </label>
                                <input 
                                    type="text" 
                                    id="auditoria" 
                                    name="auditoria" 
                                    placeholder="Ej: Auditoría Interna Q1"
                                    class="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    style="background-color: var(--card-bg); color: var(--text-primary); border-color: var(--border-color);"
                                >
                                <p class="text-xs mt-2" style="color: var(--text-secondary);"><i class="fas fa-info-circle mr-1"></i>Campo opcional</p>
                            </div>

                            <!-- Emitido Por -->
                            <div>
                                <label for="emitidoPor" class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                                    <i class="fas fa-user mr-2"></i>Emitido Por <span class="text-red-500">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    id="emitidoPor" 
                                    name="emitido_por" 
                                    required
                                    placeholder="Ej: Lic. Juan Pérez"
                                    class="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    style="background-color: var(--card-bg); color: var(--text-primary); border-color: var(--border-color);"
                                >
                            </div>

                            <!-- Fecha de Oficio -->
                            <div>
                                <label for="fechaOficio" class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                                    <i class="fas fa-calendar mr-2"></i>Fecha de Oficio <span class="text-red-500">*</span>
                                </label>
                                <input 
                                    type="date" 
                                    id="fechaOficio" 
                                    name="fecha_oficio" 
                                    required
                                    max="${hoy}"
                                    class="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    style="background-color: var(--card-bg); color: var(--text-primary); border-color: var(--border-color);"
                                >
                                <p class="text-xs mt-2" style="color: var(--text-secondary);"><i class="fas fa-clock mr-1"></i>No puede ser fecha futura</p>
                            </div>

                            <!-- Fecha de Archivo (Automática) -->
                            <div>
                                <label for="fechaArchivo" class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                                    <i class="fas fa-file-archive mr-2"></i>Fecha de Archivo
                                </label>
                                <div class="w-full px-4 py-3 border-2 rounded-lg flex items-center gap-2" style="background-color: var(--bg-secondary); color: var(--text-primary); border-color: #10b981; min-height: 45px;">
                                    <i class="fas fa-lock" style="color: #10b981;"></i><span id="fechaArchivoDisplay">${hoy}</span>
                                </div>
                                <p class="text-xs mt-2" style="color: var(--text-secondary);"><i class="fas fa-check-circle mr-1" style="color: #10b981;"></i>Se llena automáticamente</p>
                            </div>
                        </div>

                        <!-- Capturado Por -->
                        <div class="mt-4">
                            <label for="capturadoPor" class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                                <i class="fas fa-keyboard mr-2"></i>Capturado Por <span class="text-red-500">*</span>
                            </label>
                            <input 
                                type="text" 
                                id="capturadoPor" 
                                name="capturado_por" 
                                required
                                placeholder="Nombre de quien captura el documento"
                                class="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                style="background-color: var(--card-bg); color: var(--text-primary); border-color: var(--border-color);"
                            >
                        </div>
                    </div>

                    <!-- Sección: Descripción -->
                    <div class="bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-lg border border-gray-200" style="background: linear-gradient(135deg, rgba(107, 114, 128, 0.05) 0%, rgba(71, 85, 105, 0.05) 100%);">
                        <h2 class="text-lg font-semibold mb-4 flex items-center" style="color: var(--text-primary);">
                            <i class="fas fa-align-left mr-2" style="color: #6b7280;"></i>Descripción
                        </h2>
                        
                        <label for="descripcion" class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                            <i class="fas fa-align-left mr-2"></i>Asunto/Descripción <span class="text-red-500">*</span>
                        </label>
                        <textarea 
                            id="descripcion" 
                            name="descripcion" 
                            required
                            rows="4"
                            placeholder="Describe el asunto, contenido o propósito del oficio..."
                            class="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                            style="background-color: var(--card-bg); color: var(--text-primary); border-color: var(--border-color);"
                        ></textarea>
                    </div>

                    <!-- Sección: Archivo Adjunto (EN DESARROLLO - DESHABILITADO) -->
                    <div class="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-300 opacity-50 pointer-events-none" style="background: linear-gradient(135deg, rgba(234, 179, 8, 0.08) 0%, rgba(249, 115, 22, 0.08) 100%);">
                        <h2 class="text-lg font-semibold mb-4 flex items-center" style="color: var(--text-primary);">
                            <i class="fas fa-file-upload mr-2" style="color: #f97316;"></i>Archivo Adjunto
                        </h2>
                        
                        <div class="border-2 border-dashed rounded-lg p-6 text-center cursor-not-allowed" 
                             style="border-color: #fbbf24; background-color: rgba(254, 243, 199, 0.3);">
                            <div>
                                <i class="fas fa-cloud-upload-alt text-4xl mb-2" style="color: #f97316;"></i>
                                <p style="color: var(--text-primary); font-weight: 600;">Funcionalidad en desarrollo</p>
                                <p style="color: var(--text-secondary); font-size: 0.875rem;">Esta característica estará disponible próximamente</p>
                            </div>
                        </div>
                    </div>

                    <!-- Botones de acción -->
                    <div class="flex flex-col sm:flex-row gap-3 justify-center pt-4" id="botonesFormularioDocumento">
                        <button 
                            type="submit" 
                            class="px-8 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition font-semibold shadow-md hover:shadow-lg text-base"
                        >
                            <i class="fas fa-save mr-2"></i>Registrar Documento
                        </button>
                        <button 
                            type="reset" 
                            class="px-8 py-3 border-2 rounded-lg transition font-semibold text-base"
                            style="color: var(--text-primary); border-color: var(--border-color); background-color: var(--bg-secondary);"
                        >
                            <i class="fas fa-redo mr-2"></i>Limpiar
                        </button>
                    </div>
                    
                    <!-- Contenedor para toast del formulario documento -->
                    <div id="toastDocumentoContainer" style="min-height: 20px; display: flex; justify-content: center; align-items: center; margin: 10px 0;"></div>
                </form>

                <!-- TABLA DE DOCUMENTOS -->
                <div class="bg-white p-4 rounded-lg border border-gray-200 shadow">
                    <h2 class="text-lg font-semibold mb-4 flex items-center" style="color: var(--text-primary);">
                        <i class="fas fa-list mr-2" style="color: #a855f7;"></i>Documentos Registrados
                    </h2>
                    
                    <!-- Sección de Búsqueda de Documentos -->
                    <div class="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200 mb-4" style="background: linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(236, 72, 153, 0.05) 100%);">
                        <h3 class="text-md font-semibold mb-3 flex items-center" style="color: var(--text-primary);">
                            <i class="fas fa-search mr-2" style="color: #a855f7;"></i>Búsqueda de Documentos
                        </h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                            <!-- Campo de Búsqueda -->
                            <div class="md:col-span-4">
                                <label for="filtroDocumentoCampo" class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                                    <i class="fas fa-filter mr-2"></i>Buscar por
                                </label>
                                <select 
                                    id="filtroDocumentoCampo" 
                                    class="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                                    style="background-color: var(--card-bg); color: var(--text-primary); border-color: var(--border-color);"
                                    onchange="archivoGeneralModule.cambiarTipoFiltroDocumento()"
                                >
                                    <option value="no_oficio">No. Oficio</option>
                                    <option value="emitido_por">Emitido Por</option>
                                    <option value="descripcion">Descripción</option>
                                    <option value="fecha_oficio">Fecha de Oficio</option>
                                    <option value="estado">Estado</option>
                                </select>
                            </div>
                            
                            <!-- Contenedor único para valor de búsqueda (dinámico) -->
                            <div class="md:col-span-5" id="contenedorValorDocumento"></div>
                            
                            <!-- Botones -->
                            <div class="md:col-span-3 flex gap-2">
                                <button 
                                    onclick="archivoGeneralModule.buscarDocumentos()" 
                                    class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
                                >
                                    <i class="fas fa-search mr-2"></i>Buscar
                                </button>
                                <button 
                                    onclick="archivoGeneralModule.limpiarFiltroDocumento()" 
                                    class="px-4 py-2 border-2 rounded-lg transition font-semibold"
                                    style="color: var(--text-primary); border-color: var(--border-color); background-color: var(--bg-secondary);"
                                >
                                    <i class="fas fa-redo mr-2"></i>Limpiar
                                </button>
                            </div>
                        </div>
                        
                        <!-- Contenedor para toast de búsqueda de documentos -->
                        <div id="toastBusquedaDocumentoContainer" style="min-height: 20px; display: flex; justify-content: center; align-items: center; margin: 10px 0;"></div>
                    </div>
                    
                    <div id="tablaDocumentosContainer" style="overflow-x: auto;">
                        ${await this.renderizarTablaDocumentos()}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Renderizar campos dinámicos de auditoría
     */
    renderizarCamposDinamicos() {
        if (this.columnasCategoriaAuditoria.length === 0) {
            return '<p style="color: var(--text-secondary);">Cargando campos...</p>';
        }

        return this.columnasCategoriaAuditoria.map(campo => {
            let inputHtml = '';
            const isRequired = campo.es_obligatorio ? 'required' : '';
            const nombreClase = campo.nombre_campo.toLowerCase().replace(/[\s.]/g, '_');

            switch(campo.tipo_dato) {
                case 'texto_corto':
                    inputHtml = `
                        <input 
                            type="text" 
                            name="campo_${campo.id_columna}" 
                            data-columna-id="${campo.id_columna}"
                            ${isRequired}
                            placeholder="${campo.nombre_campo}"
                            maxlength="${campo.longitud_maxima || 255}"
                            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            style="background-color: var(--card-bg); color: var(--text-primary); border-color: var(--border-color);"
                        >
                    `;
                    break;

                case 'texto_largo':
                    inputHtml = `
                        <textarea 
                            name="campo_${campo.id_columna}" 
                            data-columna-id="${campo.id_columna}"
                            ${isRequired}
                            placeholder="${campo.nombre_campo}"
                            rows="3"
                            maxlength="${campo.longitud_maxima || 1000}"
                            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            style="background-color: var(--card-bg); color: var(--text-primary); border-color: var(--border-color);"
                        ></textarea>
                    `;
                    break;

                case 'numero_entero':
                    inputHtml = `
                        <input 
                            type="number" 
                            name="campo_${campo.id_columna}" 
                            data-columna-id="${campo.id_columna}"
                            ${isRequired}
                            placeholder="${campo.nombre_campo}"
                            step="1"
                            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            style="background-color: var(--card-bg); color: var(--text-primary); border-color: var(--border-color);"
                        >
                    `;
                    break;

                case 'numero_decimal':
                    inputHtml = `
                        <input 
                            type="number" 
                            name="campo_${campo.id_columna}" 
                            data-columna-id="${campo.id_columna}"
                            ${isRequired}
                            placeholder="${campo.nombre_campo}"
                            step="0.01"
                            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            style="background-color: var(--card-bg); color: var(--text-primary); border-color: var(--border-color);"
                        >
                    `;
                    break;

                case 'fecha':
                    inputHtml = `
                        <input 
                            type="date" 
                            name="campo_${campo.id_columna}" 
                            data-columna-id="${campo.id_columna}"
                            ${isRequired}
                            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            style="background-color: var(--card-bg); color: var(--text-primary); border-color: var(--border-color);"
                        >
                    `;
                    break;

                case 'booleano':
                    inputHtml = `
                        <label class="flex items-center space-x-3 cursor-pointer">
                            <input 
                                type="checkbox" 
                                name="campo_${campo.id_columna}" 
                                data-columna-id="${campo.id_columna}"
                                value="1"
                                class="w-5 h-5 rounded"
                                style="accent-color: #3b82f6;"
                            >
                            <span style="color: var(--text-primary);">${campo.nombre_campo}</span>
                        </label>
                    `;
                    break;
            }

            const etiqueta = campo.tipo_dato !== 'booleano' ? `
                <label class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                    ${campo.nombre_campo}
                    ${campo.es_obligatorio ? '<span class="text-red-500">*</span>' : ''}
                </label>
            ` : '';

            return `
                <div>
                    ${etiqueta}
                    ${inputHtml}
                </div>
            `;
        }).join('');
    },

    /**
     * Cargar columnas de la categoría Auditoría
     */
    async cargarColumnasAuditoria() {
        try {
            // Obtener ID de categoría "Auditoría"
            const resultado = await api.get('/categorias', { search: 'Auditoría' });

            if (resultado.success && resultado.data && resultado.data.categorias && resultado.data.categorias.length > 0) {
                this.idCategoriaAuditoria = resultado.data.categorias[0].id_categoria;

                // Obtener columnas de la categoría
                const resultadoColumnas = await api.get(`/categorias/${this.idCategoriaAuditoria}/columnas`);

                if (resultadoColumnas.success && resultadoColumnas.data) {
                    // Ordenar por orden_visualizacion
                    this.columnasCategoriaAuditoria = (resultadoColumnas.data.columnas || [])
                        .sort((a, b) => a.orden_visualizacion - b.orden_visualizacion);
                }
            }
        } catch (error) {
            console.error('Error cargando columnas de auditoría:', error);
        }
    },

    /**
     * Registrar documento de auditoría
     */
    async registrarDocumento(formulario) {
        try {
            // Obtener valores del formulario (FormData)
            const idCarpeta = formulario.get('id_carpeta');
            const noOficio = (formulario.get('no_oficio') || '').trim();
            const emitidoPor = (formulario.get('emitido_por') || '').trim();
            const fechaOficio = formulario.get('fecha_oficio');
            const descripcion = (formulario.get('descripcion') || '').trim();
            const capturadoPor = (formulario.get('capturado_por') || '').trim();
            const auditoria = (formulario.get('auditoria') || '').trim();

            // Validar que haya carpeta seleccionada
            if (!idCarpeta) {
                this.mostrarToastFormularioDocumento('Selecciona una carpeta física', 'error');
                return;
            }

            // Validar que haya No. Oficio
            if (!noOficio) {
                this.mostrarToastFormularioDocumento('El número de oficio es requerido', 'error');
                return;
            }

            // Validar que haya Emitido Por
            if (!emitidoPor) {
                this.mostrarToastFormularioDocumento('Especifica quién emitió el oficio', 'error');
                return;
            }

            // Validar que haya Fecha de Oficio
            if (!fechaOficio) {
                this.mostrarToastFormularioDocumento('Especifica la fecha del oficio', 'error');
                return;
            }

            // Validar que haya Descripción
            if (!descripcion) {
                this.mostrarToastFormularioDocumento('La descripción es requerida', 'error');
                return;
            }

            // Validar que haya Capturado Por
            if (!capturadoPor) {
                this.mostrarToastFormularioDocumento('Especifica quién captura el documento', 'error');
                return;
            }

            // Preparar datos
            const datos = {
                no_oficio: noOficio,
                id_carpeta: parseInt(idCarpeta),
                auditoria: auditoria,
                emitido_por: emitidoPor,
                fecha_oficio: fechaOficio,
                descripcion: descripcion,
                capturado_por: capturadoPor
            };

            console.log('📝 Registrando documento con datos:', datos);

            // Enviar a API
            const resultado = await api.post('/documentos/crear', datos);

            console.log('✅ Respuesta del servidor:', resultado);

            if (resultado.success) {
                this.mostrarToastFormularioDocumento('✓ Documento registrado exitosamente', 'success');
                
                // Recargar documentos
                await this.cargarDocumentosPorCarpeta(parseInt(idCarpeta));
                
                // Actualizar tabla si existe
                this.actualizarTablaDocumentos();
                
                // Limpiar formulario
                const form = document.getElementById('formDocumento');
                if (form) {
                    form.reset();
                }
            } else {
                console.error('❌ Error en respuesta:', resultado);
                this.mostrarToastFormularioDocumento(resultado.message || 'Error al registrar documento', 'error');
            }
        } catch (error) {
            console.error('❌ Error registrando documento:', error);
            this.mostrarToastFormularioDocumento('Error: ' + (error.message || 'Error al registrar el documento'), 'error');
        }
    },

    /**
     * Editar carpeta - Abre modal con formulario
     */
    async editarCarpeta(id) {
        try {
            const carpeta = this.carpetas.find(c => c.id_carpeta === id);
            if (!carpeta) {
                ui.toast('Carpeta no encontrada', 'error');
                return;
            }

            const html = `
                <form id="formEditarCarpeta" onsubmit="archivoGeneralModule.guardarCarpeta(event, ${id})" class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- Título -->
                        <div>
                            <label class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                                <i class="fas fa-heading mr-2 text-blue-500"></i>Título <span class="text-red-500">*</span>
                            </label>
                            <div>
                                <input type="text" 
                                       id="edit_titulo" 
                                       name="titulo" 
                                       required 
                                       value="${carpeta.titulo}"
                                       class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                       style="background-color: var(--card-bg); border-color: var(--border-color); color: var(--text-primary);"
                                       placeholder="Ej: Carpeta de Auditoría 2024"
                                       onchange="archivoGeneralModule.validarEditTitulo(this.value, ${id})">
                                <div id="editErrorTitulo" class="text-xs text-red-500 mt-1 hidden">
                                    <i class="fas fa-exclamation-circle mr-1"></i><span id="editMensajeTitulo"></span>
                                </div>
                            </div>
                        </div>

                        <!-- Etiqueta Identificadora -->
                        <div>
                            <label class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                                <i class="fas fa-tag mr-2 text-blue-500"></i>Etiqueta Identificadora <span class="text-red-500">*</span>
                            </label>
                            <div>
                                <input type="text" 
                                       id="edit_etiqueta" 
                                       name="etiqueta_identificadora" 
                                       required 
                                       value="${carpeta.etiqueta_identificadora}"
                                       class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                       style="background-color: var(--card-bg); border-color: var(--border-color); color: var(--text-primary);"
                                       placeholder="Ej: AUD-2024-001"
                                       onchange="archivoGeneralModule.validarEditEtiqueta(this.value, ${id})">
                                <div id="editErrorEtiqueta" class="text-xs text-red-500 mt-1 hidden">
                                    <i class="fas fa-exclamation-circle mr-1"></i><span id="editMensajeEtiqueta"></span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Estado de Gestión -->
                    <div>
                        <label class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                            <i class="fas fa-info-circle mr-2 text-blue-500"></i>Estado de Gestión <span class="text-red-500">*</span>
                        </label>
                        <select id="edit_estado" 
                                name="estado_gestion" 
                                required 
                                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                               style="background-color: var(--card-bg); border-color: var(--border-color); color: var(--text-primary);">
                            <option value="pendiente" ${carpeta.estado_gestion === 'pendiente' ? 'selected' : ''}>📋 Pendiente</option>
                            <option value="en_revision" ${carpeta.estado_gestion === 'en_revision' ? 'selected' : ''}>🔍 En Revisión</option>
                            <option value="archivado" ${carpeta.estado_gestion === 'archivado' ? 'selected' : ''}>📦 Archivado</option>
                            <option value="cancelado" ${carpeta.estado_gestion === 'cancelado' ? 'selected' : ''}>❌ Cancelado</option>
                        </select>
                    </div>

                    <!-- Descripción -->
                    <div>
                        <label for="edit_descripcion" class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                            <i class="fas fa-align-left mr-2 text-blue-500"></i>Descripción (Opcional)
                        </label>
                        <textarea 
                            id="edit_descripcion" 
                            name="descripcion" 
                            rows="4"
                            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            style="background-color: var(--card-bg); border-color: var(--border-color); color: var(--text-primary);"
                            placeholder="Describe el contenido o propósito de esta carpeta...">${carpeta.descripcion || ''}</textarea>
                    </div>

                    <div class="flex gap-3 justify-end pt-4 border-t" style="border-color: var(--border-color);">
                        <button type="button" 
                                onclick="archivoGeneralModule.cerrarModal()" 
                                class="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition">
                            Cancelar
                        </button>
                        <button type="submit" 
                                class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold">
                            <i class="fas fa-save mr-2"></i>Guardar Cambios
                        </button>
                    </div>
                </form>
            `;

            this.abrirModal('Editar Carpeta', html);
        } catch (error) {
            console.error('Error abriendo formulario editar:', error);
            ui.toast('Error al abrir formulario de edición', 'error');
        }
    },

    /**
     * Guardar cambios de carpeta
     */
    async guardarCarpeta(event, id) {
        event.preventDefault();

        try {
            const titulo = (document.getElementById('edit_titulo')?.value || '').trim();
            const etiqueta = (document.getElementById('edit_etiqueta')?.value || '').trim();
            const estado = document.getElementById('edit_estado')?.value || 'pendiente';
            const descripcion = (document.getElementById('edit_descripcion')?.value || '').trim();

            // Validar campos requeridos
            let hayErrores = false;
            
            // Resetear errores anteriores
            document.getElementById('editErrorTitulo').classList.add('hidden');
            document.getElementById('editErrorEtiqueta').classList.add('hidden');
            
            if (!titulo) {
                document.getElementById('editErrorTitulo').classList.remove('hidden');
                document.getElementById('editMensajeTitulo').textContent = 'El título es requerido';
                hayErrores = true;
            }
            
            if (!etiqueta) {
                document.getElementById('editErrorEtiqueta').classList.remove('hidden');
                document.getElementById('editMensajeEtiqueta').textContent = 'La etiqueta es requerida';
                hayErrores = true;
            }

            // Validar que el título no exista en otra carpeta
            const existeTitulo = this.carpetas.some(c => 
                c.id_carpeta !== id && c.titulo && c.titulo.toLowerCase() === titulo.toLowerCase()
            );
            if (existeTitulo) {
                document.getElementById('editErrorTitulo').classList.remove('hidden');
                document.getElementById('editMensajeTitulo').textContent = 'El título ya existe en otra carpeta';
                hayErrores = true;
            }

            // Validar que la etiqueta no exista en otra carpeta
            const existeEtiqueta = this.carpetas.some(c => 
                c.id_carpeta !== id && c.etiqueta_identificadora && c.etiqueta_identificadora.toLowerCase() === etiqueta.toLowerCase()
            );
            if (existeEtiqueta) {
                document.getElementById('editErrorEtiqueta').classList.remove('hidden');
                document.getElementById('editMensajeEtiqueta').textContent = 'La etiqueta ya existe en otra carpeta';
                hayErrores = true;
            }
            
            if (hayErrores) {
                return;
            }

            const datos = {
                titulo: titulo,
                etiqueta_identificadora: etiqueta,
                descripcion: descripcion,
                estado_gestion: estado
            };

            console.log('🔄 Actualizando carpeta:', id, datos);

            const resultado = await api.put(`/carpetas/${id}`, datos);

            if (resultado.success) {
                ui.toast('✓ Carpeta actualizada correctamente', 'success');
                this.cerrarModal();
                
                // Recargar carpetas
                await this.cargarCarpetas();
                
                // Actualizar tabla
                const tablaCarpetas = document.getElementById('tablaCarpetas');
                if (tablaCarpetas) {
                    tablaCarpetas.innerHTML = await this.renderizarTablaCarpetas();
                }

                // Actualizar total
                const totalCarpetas = document.getElementById('totalCarpetas');
                if (totalCarpetas) {
                    totalCarpetas.textContent = this.carpetas.length;
                }
            } else {
                ui.toast(resultado.message || 'Error al actualizar carpeta', 'error');
            }
        } catch (error) {
            console.error('Error guardando carpeta:', error);
            ui.toast('Error: ' + (error.message || 'Error al guardar cambios'), 'error');
        }
    },

    /**
     * Eliminar carpeta
     */
    async eliminarCarpeta(id, etiqueta) {
        // Usar confirmación centrada tipo toast en lugar del confirm del navegador
        ui.confirmToast(
            `¿Está seguro de eliminar la carpeta "${etiqueta}"?\n\nEsta acción no se puede deshacer.`,
            async () => {
                try {
                    const resultado = await api.delete(`/carpetas/${id}`);
                    
                    if (resultado.success) {
                        this.mostrarToastExito('Carpeta eliminada correctamente');
                        
                        // Recargar carpetas
                        await this.cargarCarpetas();
                        
                        // Actualizar tabla
                        const tablaCarpetas = document.getElementById('tablaCarpetas');
                        if (tablaCarpetas) {
                            tablaCarpetas.innerHTML = await this.renderizarTablaCarpetas();
                        }

                        // Actualizar total
                        const totalCarpetas = document.getElementById('totalCarpetas');
                        if (totalCarpetas) {
                            totalCarpetas.textContent = this.carpetas.length;
                        }
                    } else {
                        this.mostrarToastError(resultado.message || 'Error al eliminar carpeta');
                    }
                } catch (error) {
                    console.error('Error eliminando carpeta:', error);
                    this.mostrarToastError('Error: ' + (error.message || 'Error al eliminar la carpeta'));
                }
            }
        );
    },

    /**
     * Cambiar tipo de filtro (mostrar componente adecuado)
     */
    cambiarTipoFiltro() {
        const campo = document.getElementById('filtroCampo').value;
        const contenedor = document.getElementById('contenedorValor');
        
        // Limpiar contenedor
        contenedor.innerHTML = '';
        
        switch(campo) {
            case 'estado':
                contenedor.innerHTML = `
                    <label for="filtroValor" class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                        <i class="fas fa-info-circle mr-2"></i>Estado
                    </label>
                    <select 
                        id="filtroValor" 
                        class="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        style="background-color: var(--card-bg); color: var(--text-primary); border-color: var(--border-color);"
                    >
                        <option value="">-- Selecciona un estado --</option>
                        <option value="pendiente">📋 Pendiente</option>
                        <option value="en_revision">🔍 En Revisión</option>
                        <option value="archivado">📦 Archivado</option>
                        <option value="cancelado">❌ Cancelado</option>
                    </select>
                `;
                break;
                
            case 'fecha':
                contenedor.innerHTML = `
                    <label for="filtroValor" class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                        <i class="fas fa-calendar mr-2"></i>Fecha
                    </label>
                    <input 
                        type="date" 
                        id="filtroValor" 
                        class="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        style="background-color: var(--card-bg); color: var(--text-primary); border-color: var(--border-color);"
                    >
                `;
                break;
                
            default:
                // Otros campos (titulo, etiqueta, descripcion, creador)
                contenedor.innerHTML = `
                    <label for="filtroValor" class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                        <i class="fas fa-search mr-2"></i>Valor
                    </label>
                    <input 
                        type="text" 
                        id="filtroValor" 
                        placeholder="Ingrese el valor a buscar..."
                        class="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        style="background-color: var(--card-bg); color: var(--text-primary); border-color: var(--border-color);"
                    >
                `;
                break;
        }
    },

    /**
     * Buscar carpetas según filtro
     */
    async buscarCarpetas() {
        const campo = document.getElementById('filtroCampo').value;
        let valor = document.getElementById('filtroValor');
        
        // Validar que el elemento existe
        if (!valor) {
            this.mostrarToastError('Error: elemento de búsqueda no encontrado');
            return;
        }
        
        // Capturar el valor según el tipo de elemento
        let valorBusqueda = '';
        if (valor.tagName === 'SELECT') {
            valorBusqueda = valor.value; // Para SELECT (estado, fecha)
        } else if (valor.tagName === 'INPUT') {
            valorBusqueda = valor.value.trim(); // Para INPUT (texto)
        } else {
            valorBusqueda = valor.value.trim();
        }
        
        console.log(`Campo: ${campo}, Valor: ${valorBusqueda}, Tipo: ${valor.tagName}`);
        
        // Requerir valor para todos los campos
        if (!valorBusqueda) {
            if (campo === 'estado') {
                this.mostrarToastError('Por favor seleccione un estado de gestión');
            } else if (campo === 'fecha') {
                this.mostrarToastError('Por favor seleccione una fecha de creación');
            } else {
                this.mostrarToastError('Por favor ingrese un valor para buscar');
            }
            return;
        }
        
        try {
            // Filtrar localmente las carpetas cargadas
            let carpetasFiltradas = [...this.carpetas];
            
            switch(campo) {
                case 'titulo':
                    carpetasFiltradas = carpetasFiltradas.filter(c => 
                        c.titulo && c.titulo.toLowerCase().includes(valorBusqueda.toLowerCase())
                    );
                    break;
                    
                case 'etiqueta':
                    carpetasFiltradas = carpetasFiltradas.filter(c => 
                        c.etiqueta_identificadora && c.etiqueta_identificadora.toLowerCase().includes(valorBusqueda.toLowerCase())
                    );
                    break;
                    
                case 'descripcion':
                    carpetasFiltradas = carpetasFiltradas.filter(c => 
                        c.descripcion && c.descripcion.toLowerCase().includes(valorBusqueda.toLowerCase())
                    );
                    break;
                    
                case 'estado':
                    // Filtrar por el estado específico seleccionado
                    carpetasFiltradas = carpetasFiltradas.filter(c => 
                        c.estado_gestion === valorBusqueda
                    );
                    console.log(`Buscando por estado: ${valorBusqueda}, encontrados: ${carpetasFiltradas.length}`);
                    break;
                    
                case 'fecha':
                    // Filtrar por la fecha específica seleccionada
                    carpetasFiltradas = carpetasFiltradas.filter(c => {
                        const fechaCarpeta = new Date(c.fecha_creacion).toISOString().split('T')[0];
                        return fechaCarpeta === valorBusqueda;
                    });
                    console.log(`Buscando por fecha: ${valorBusqueda}, encontrados: ${carpetasFiltradas.length}`);
                    break;
                    
                case 'creador':
                    carpetasFiltradas = carpetasFiltradas.filter(c => {
                        const nombreCreador = c.nombre ? `${c.nombre} ${c.apellido_paterno || ''}`.toLowerCase() : '';
                        return nombreCreador.includes(valorBusqueda.toLowerCase());
                    });
                    break;
            }
            
            // Actualizar tabla con resultados
            const tablaCarpetas = document.getElementById('tablaCarpetas');
            if (tablaCarpetas) {
                tablaCarpetas.innerHTML = await this.renderizarTablaCarpetasFiltradas(carpetasFiltradas);
            }
            
            // Actualizar total
            const totalCarpetas = document.getElementById('totalCarpetas');
            if (totalCarpetas) {
                totalCarpetas.textContent = `${carpetasFiltradas.length} de ${this.carpetas.length}`;
            }
            
            // Mostrar resultado
            if (carpetasFiltradas.length === 0) {
                this.mostrarToastExito('No se encontraron resultados para la búsqueda');
            } else {
                this.mostrarToastExito(`Se encontraron ${carpetasFiltradas.length} resultado(s)`);
            }
            
        } catch (error) {
            console.error('Error buscando carpetas:', error);
            this.mostrarToastError('Error al realizar la búsqueda');
        }
    },

    /**
     * Limpiar filtro y mostrar todas las carpetas
     */
    async limpiarFiltro() {
        // Limpiar campos
        document.getElementById('filtroCampo').value = 'titulo';
        document.getElementById('filtroValor').value = '';
        
        // Mostrar contenedor de texto por defecto
        this.cambiarTipoFiltro();
        
        // Recargar todas las carpetas con el método por defecto
        const tablaCarpetas = document.getElementById('tablaCarpetas');
        if (tablaCarpetas) {
            tablaCarpetas.innerHTML = await this.renderizarTablaCarpetas();
        }
        
        // Actualizar total
        const totalCarpetas = document.getElementById('totalCarpetas');
        if (totalCarpetas) {
            totalCarpetas.textContent = this.carpetas.length;
        }
        
        this.mostrarToastExito('Filtro limpiado correctamente');
    },

    /**
     * Renderizar tabla de carpetas filtradas
     */
    async renderizarTablaCarpetasFiltradas(carpetasFiltradas) {
        if (carpetasFiltradas.length === 0) {
            return '<tr><td colspan="8" class="px-6 py-6 text-center text-sm" style="color: var(--text-secondary);"><i class="fas fa-search mr-2"></i>No se encontraron resultados</td></tr>';
        }

        return carpetasFiltradas.map(carpeta => {
            const estado = carpeta.estado_gestion || 'pendiente';
            const coloresEstado = {
                'pendiente': { bg: '#fef3c7', text: '#92400e', icono: '📋' },
                'en_revision': { bg: '#dbeafe', text: '#1e40af', icono: '🔍' },
                'archivado': { bg: '#e5e7eb', text: '#374151', icono: '📦' },
                'cancelado': { bg: '#fee2e2', text: '#991b1b', icono: '❌' }
            };
            const colores = coloresEstado[estado] || coloresEstado['pendiente'];
            const fechaFormato = new Date(carpeta.fecha_creacion).toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
            const nombreCreador = carpeta.nombre ? `${carpeta.nombre} ${carpeta.apellido_paterno || ''}` : 'Sistema';
            const descripcionCorta = carpeta.descripcion ? (carpeta.descripcion.length > 50 ? carpeta.descripcion.substring(0, 50) + '...' : carpeta.descripcion) : '-';

            return `
                <tr style="border-bottom: 1px solid var(--border-color); transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='var(--bg-secondary)'" onmouseout="this.style.backgroundColor='transparent';">
                    <td class="px-3 sm:px-6 py-4 font-bold text-sm" style="color: #3b82f6;">
                        <i class="fas fa-folder-open mr-2"></i>${carpeta.no_carpeta_fisica}
                    </td>
                    <td class="px-3 sm:px-6 py-4 font-medium text-sm" style="color: var(--text-primary);">
                        <i class="fas fa-heading mr-2" style="color: #8b5cf6;"></i>${carpeta.titulo}
                    </td>
                    <td class="px-3 sm:px-6 py-4 font-medium text-sm" style="color: var(--text-primary);">
                        <i class="fas fa-tag mr-2" style="color: #6b7280;"></i>${carpeta.etiqueta_identificadora}
                    </td>
                    <td class="px-3 sm:px-6 py-4 text-xs sm:text-sm hidden md:table-cell" style="color: var(--text-secondary);" title="${carpeta.descripcion || 'Sin descripción'}">
                        ${descripcionCorta}
                    </td>
                    <td class="px-3 sm:px-6 py-4">
                        <span class="px-2 sm:px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap" style="background-color: ${colores.bg}; color: ${colores.text};">
                            ${colores.icono} ${estado.replace('_', ' ').toUpperCase()}
                        </span>
                    </td>
                    <td class="px-3 sm:px-6 py-4 text-xs sm:text-sm hidden lg:table-cell" style="color: var(--text-secondary);">
                        <i class="fas fa-user-circle mr-1"></i>${nombreCreador}
                    </td>
                    <td class="px-3 sm:px-6 py-4 text-xs sm:text-sm hidden sm:table-cell" style="color: var(--text-secondary);">
                        <i class="fas fa-clock mr-1"></i>${fechaFormato}
                    </td>
                    <td class="px-3 sm:px-6 py-4 text-center whitespace-nowrap">
                        <button onclick="archivoGeneralModule.editarCarpeta(${carpeta.id_carpeta})" 
                                class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-3 transition" 
                                title="Editar carpeta">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="archivoGeneralModule.eliminarCarpeta(${carpeta.id_carpeta}, '${carpeta.titulo}')" 
                                class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition" 
                                title="Eliminar carpeta">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    /**
     * Validar título en formulario de edición
     */
    validarEditTitulo(valor, idActual) {
        if (!valor || !valor.trim()) {
            const error = document.getElementById('editErrorTitulo');
            if (error) error.classList.add('hidden');
            return;
        }

        const error = document.getElementById('editErrorTitulo');
        const mensaje = document.getElementById('editMensajeTitulo');
        
        if (!error || !mensaje) return;

        const existe = this.carpetas.some(c => 
            c.id_carpeta !== idActual && c.titulo && c.titulo.toLowerCase() === valor.toLowerCase()
        );
        
        if (existe) {
            error.classList.remove('hidden');
            mensaje.textContent = 'El título ya existe en otra carpeta';
        } else {
            error.classList.add('hidden');
        }
    },

    /**
     * Validar etiqueta en formulario de edición
     */
    validarEditEtiqueta(valor, idActual) {
        if (!valor || !valor.trim()) {
            const error = document.getElementById('editErrorEtiqueta');
            if (error) error.classList.add('hidden');
            return;
        }

        const error = document.getElementById('editErrorEtiqueta');
        const mensaje = document.getElementById('editMensajeEtiqueta');
        
        if (!error || !mensaje) return;

        const existe = this.carpetas.some(c => 
            c.id_carpeta !== idActual && c.etiqueta_identificadora && c.etiqueta_identificadora.toLowerCase() === valor.toLowerCase()
        );
        
        if (existe) {
            error.classList.remove('hidden');
            mensaje.textContent = 'La etiqueta ya existe en otra carpeta';
        } else {
            error.classList.add('hidden');
        }
    },

    /**
     * Abrir modal
     */
    abrirModal(titulo, contenido) {
        const modal = document.createElement('div');
        modal.id = 'modalArchivo';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" style="background-color: var(--card-bg);">
                <div class="sticky top-0 border-b px-6 py-4 flex justify-between items-center" style="background-color: var(--bg-secondary); border-color: var(--border-color);">
                    <h2 class="text-2xl font-bold" style="color: var(--text-primary);">${titulo}</h2>
                    <button onclick="archivoGeneralModule.cerrarModal()" 
                            class="transition text-2xl"
                            style="color: var(--text-secondary);"
                            onmouseover="this.style.color='var(--text-primary)'"
                            onmouseout="this.style.color='var(--text-secondary)'">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="p-6">
                    ${contenido}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        this.modalAbierto = modal;
    },

    /**
     * Cerrar modal
     */
    cerrarModal() {
        if (this.modalAbierto) {
            this.modalAbierto.remove();
            this.modalAbierto = null;
        }
    }
};

window.archivoGeneralModule = archivoGeneralModule;
