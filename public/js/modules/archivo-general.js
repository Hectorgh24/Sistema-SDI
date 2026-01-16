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
    columnasCategoriaAuditoria: [],
    idCategoriaAuditoria: null,
    modoActual: 'carpetas', // 'carpetas' o 'documentos'

    /**
     * Inicializar módulo
     */
    async init() {
        try {
            // Cargar carpetas disponibles
            await this.cargarCarpetas();
            
            // Cargar configuración de campos dinámicos para Auditoría
            await this.cargarColumnasAuditoria();
            
            // Attachear listeners después de cargar vistas
            setTimeout(() => {
                this.attachFormularioCarpetaListener();
            }, 100);
        } catch (error) {
            console.error('Error inicializando Archivo General:', error);
            ui.toast('Error inicializando módulo', 'error');
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
                <div class="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                    <button 
                        type="submit" 
                        class="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition font-semibold shadow-md hover:shadow-lg text-base"
                    >
                        <i class="fas fa-save mr-2"></i>Crear Carpeta
                    </button>
                    <button 
                        type="reset" 
                        class="px-8 py-3 border-2 rounded-lg transition font-semibold text-base"
                        style="color: var(--text-primary); border-color: var(--border-color); background-color: var(--bg-secondary);"
                    >
                        <i class="fas fa-redo mr-2"></i>Limpiar
                    </button>
                </div>
            </form>

            <!-- Tabla de Carpetas Existentes -->
            <div class="mt-16 w-full">
                <div class="text-center mb-8">
                    <h2 class="text-2xl md:text-3xl font-bold mb-2 inline-flex items-center gap-2" style="color: var(--text-primary);">
                        <i class="fas fa-list" style="color: #3b82f6;"></i>Carpetas Registradas
                    </h2>
                    <p class="text-sm" style="color: var(--text-secondary);"><span id="totalCarpetas">${this.carpetas.length}</span> carpeta(s) en total</p>
                </div>
                
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
            const datos = {
                no_carpeta_fisica: formData.get('no_carpeta_fisica'),
                titulo: formData.get('titulo'),
                etiqueta_identificadora: formData.get('etiqueta_identificadora'),
                descripcion: formData.get('descripcion'),
                estado_gestion: formData.get('estado_gestion') || 'pendiente'
            };

            console.log('📝 Creando carpeta con datos:', datos);

            const resultado = await api.post('/carpetas/crear', datos);

            console.log('✅ Respuesta del servidor:', resultado);

            if (resultado.success) {
                ui.toast('Carpeta creada exitosamente', 'success');
                
                // Recargar carpetas
                await this.cargarCarpetas();
                console.log('📦 Carpetas cargadas:', this.carpetas);
                
                // Actualizar tabla dinámicamente
                const tablaCarpetas = document.getElementById('tablaCarpetas');
                if (tablaCarpetas) {
                    tablaCarpetas.innerHTML = await this.renderizarTablaCarpetas();
                    console.log('✏️ Tabla actualizada');
                } else {
                    console.warn('⚠️ Tabla no encontrada en DOM');
                }

                // Actualizar total
                const totalCarpetas = document.getElementById('totalCarpetas');
                if (totalCarpetas) {
                    totalCarpetas.textContent = this.carpetas.length;
                }
                
                // Limpiar formulario
                const form = document.getElementById('formCarpeta');
                if (form) {
                    form.reset();
                    // Actualizar el display del campo no_carpeta_fisica
                    setTimeout(() => {
                        document.querySelector('.no_carpeta_display').textContent = this.carpetas.length + 1;
                    }, 100);
                }
            } else {
                console.error('❌ Error en respuesta:', resultado);
                ui.toast(resultado.message || 'Error al crear carpeta', 'error');
            }
        } catch (error) {
            console.error('❌ Error creando carpeta:', error);
            ui.toast('Error al crear la carpeta: ' + error.message, 'error');
        }
    },

    /**
     * Validar que el título no se repita
     */
    validarTitulo(valor) {
        const error = document.getElementById('errorTitulo');
        const mensaje = document.getElementById('mensajeTitulo');
        
        const existe = this.carpetas.some(c => c.titulo.toLowerCase() === valor.toLowerCase());
        
        if (existe && valor) {
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
        const error = document.getElementById('errorEtiqueta');
        const mensaje = document.getElementById('mensajeEtiqueta');
        
        const existe = this.carpetas.some(c => c.etiqueta_identificadora.toLowerCase() === valor.toLowerCase());
        
        if (existe && valor) {
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
     * Mostrar formulario para registrar documento
     */
    async mostrarFormularioDocumento() {
        return `
            <form id="formDocumento" class="space-y-6 max-w-2xl">
                <!-- Selección de Carpeta Física -->
                <div>
                    <label for="carpetaDoc" class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                        <i class="fas fa-folder mr-2"></i>Carpeta Física <span class="text-red-500">*</span>
                    </label>
                    <select 
                        id="carpetaDoc" 
                        name="id_carpeta" 
                        required
                        class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style="background-color: var(--card-bg); color: var(--text-primary); border-color: var(--border-color);"
                    >
                        <option value="">Selecciona una carpeta...</option>
                        ${this.carpetas.map(c => `<option value="${c.id_carpeta}">${c.etiqueta_identificadora} (No. ${c.no_carpeta_fisica})</option>`).join('')}
                    </select>
                </div>

                <!-- Fecha del Documento -->
                <div>
                    <label for="fechaDoc" class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                        <i class="fas fa-calendar mr-2"></i>Fecha del Documento <span class="text-red-500">*</span>
                    </label>
                    <input 
                        type="date" 
                        id="fechaDoc" 
                        name="fecha_documento" 
                        required
                        class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style="background-color: var(--card-bg); color: var(--text-primary); border-color: var(--border-color);"
                    >
                </div>

                <!-- Campos Dinámicos de Auditoría -->
                <div class="border-t pt-6" style="border-color: var(--border-color);">
                    <h3 class="text-lg font-bold mb-4" style="color: var(--text-primary);">
                        <i class="fas fa-list mr-2"></i>Datos de Auditoría
                    </h3>
                    <div id="camposDinamicos" class="space-y-4">
                        ${this.renderizarCamposDinamicos()}
                    </div>
                </div>

                <!-- Archivo Adjunto -->
                <div>
                    <label for="archivoDoc" class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                        <i class="fas fa-file-upload mr-2"></i>Archivo Adjunto (PDF, JPG, PNG, DOCX)
                    </label>
                    <div class="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-opacity-50 transition" 
                         id="dropZone"
                         style="border-color: var(--border-color); background-color: var(--bg-secondary);">
                        <input 
                            type="file" 
                            id="archivoDoc" 
                            name="archivo" 
                            accept=".pdf,.jpg,.jpeg,.png,.docx,.doc"
                            class="hidden"
                        >
                        <div>
                            <i class="fas fa-cloud-upload-alt text-4xl mb-2" style="color: #3b82f6;"></i>
                            <p style="color: var(--text-primary);">Haz clic o arrastra un archivo</p>
                            <p style="color: var(--text-secondary); font-size: 0.875rem;">PDF, JPG, PNG, DOCX (máx. 10MB)</p>
                        </div>
                        <span id="nombreArchivo" class="mt-2 block text-sm" style="color: var(--text-secondary);"></span>
                    </div>
                </div>

                <!-- Botones de acción -->
                <div class="flex gap-4">
                    <button 
                        type="submit" 
                        class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
                    >
                        <i class="fas fa-save mr-2"></i>Registrar Documento
                    </button>
                    <button 
                        type="reset" 
                        class="px-6 py-2 border rounded-lg transition font-semibold"
                        style="color: var(--text-primary); border-color: var(--border-color);"
                    >
                        <i class="fas fa-redo mr-2"></i>Limpiar
                    </button>
                </div>
            </form>

            <script>
                // Configurar drag and drop para archivo
                const dropZone = document.getElementById('dropZone');
                const archivoInput = document.getElementById('archivoDoc');
                const nombreArchivo = document.getElementById('nombreArchivo');

                dropZone.addEventListener('click', () => archivoInput.click());

                dropZone.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    dropZone.style.backgroundColor = 'var(--bg-tertiary)';
                });

                dropZone.addEventListener('dragleave', () => {
                    dropZone.style.backgroundColor = 'var(--bg-secondary)';
                });

                dropZone.addEventListener('drop', (e) => {
                    e.preventDefault();
                    dropZone.style.backgroundColor = 'var(--bg-secondary)';
                    const files = e.dataTransfer.files;
                    if (files.length > 0) {
                        archivoInput.files = files;
                        nombreArchivo.textContent = '✓ ' + files[0].name;
                    }
                });

                archivoInput.addEventListener('change', (e) => {
                    if (e.target.files.length > 0) {
                        nombreArchivo.textContent = '✓ ' + e.target.files[0].name;
                    }
                });

                document.getElementById('formDocumento').addEventListener('submit', function(e) {
                    e.preventDefault();
                    archivoGeneralModule.registrarDocumento(this);
                });
            </script>
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
            // Validar que haya carpeta seleccionada
            const idCarpeta = formulario.querySelector('[name="id_carpeta"]').value;
            if (!idCarpeta) {
                ui.toast('Selecciona una carpeta física', 'error');
                return;
            }

            // Validar que haya fecha
            const fechaDocumento = formulario.querySelector('[name="fecha_documento"]').value;
            if (!fechaDocumento) {
                ui.toast('Ingresa la fecha del documento', 'error');
                return;
            }

            // Crear FormData para enviar archivo
            const formData = new FormData();
            formData.append('id_carpeta', idCarpeta);
            formData.append('fecha_documento', fechaDocumento);
            formData.append('id_categoria', this.idCategoriaAuditoria);

            // Agregar campos dinámicos
            const campos = formulario.querySelectorAll('[data-columna-id]');
            const valoresDinamicos = {};

            campos.forEach(campo => {
                const idColumna = campo.getAttribute('data-columna-id');
                let valor = null;

                if (campo.type === 'checkbox') {
                    valor = campo.checked ? 1 : 0;
                } else {
                    valor = campo.value;
                }

                if (valor !== null && valor !== '') {
                    valoresDinamicos[idColumna] = valor;
                }
            });

            formData.append('valores_dinamicos', JSON.stringify(valoresDinamicos));

            // Agregar archivo si existe
            const archivoInput = formulario.querySelector('[name="archivo"]');
            if (archivoInput && archivoInput.files.length > 0) {
                const archivo = archivoInput.files[0];

                // Validar tamaño (máx 10MB)
                if (archivo.size > 10 * 1024 * 1024) {
                    ui.toast('El archivo no puede exceder 10MB', 'error');
                    return;
                }

                formData.append('archivo', archivo);
            }

            // Enviar datos usando fetch directamente (FormData no es compatible con api.js)
            const response = await fetch(api.baseURL + '/documentos/crear', {
                method: 'POST',
                body: formData
                // NO enviar Content-Type, el navegador lo establecerá automáticamente
            });

            const resultado = await response.json();

            if (resultado.success) {
                ui.toast('Documento registrado exitosamente', 'success');
                formulario.reset();
                document.getElementById('nombreArchivo').textContent = '';
            } else {
                ui.toast(resultado.message || 'Error al registrar documento', 'error');
            }
        } catch (error) {
            console.error('Error registrando documento:', error);
            ui.toast('Error al registrar el documento', 'error');
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
                                       placeholder="Ej: Carpeta de Auditoría 2024">
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
                                       placeholder="Ej: AUD-2024-001">
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
            const titulo = document.getElementById('edit_titulo').value.trim();
            const etiqueta = document.getElementById('edit_etiqueta').value.trim();
            const estado = document.getElementById('edit_estado').value;
            const descripcion = document.getElementById('edit_descripcion').value.trim();

            // Validar que el título no exista en otra carpeta
            const existeTitulo = this.carpetas.some(c => 
                c.id_carpeta !== id && c.titulo.toLowerCase() === titulo.toLowerCase()
            );
            if (existeTitulo) {
                const errorTitulo = document.getElementById('editErrorTitulo');
                const mensajeTitulo = document.getElementById('editMensajeTitulo');
                errorTitulo.classList.remove('hidden');
                mensajeTitulo.textContent = 'El título ya existe en otra carpeta';
                return;
            }

            // Validar que la etiqueta no exista en otra carpeta
            const existeEtiqueta = this.carpetas.some(c => 
                c.id_carpeta !== id && c.etiqueta_identificadora.toLowerCase() === etiqueta.toLowerCase()
            );
            if (existeEtiqueta) {
                const errorEtiqueta = document.getElementById('editErrorEtiqueta');
                const mensajeEtiqueta = document.getElementById('editMensajeEtiqueta');
                errorEtiqueta.classList.remove('hidden');
                mensajeEtiqueta.textContent = 'La etiqueta ya existe en otra carpeta';
                return;
            }

            const datos = {
                titulo: titulo,
                etiqueta_identificadora: etiqueta,
                descripcion: descripcion,
                estado_gestion: estado
            };

            const resultado = await api.put(`/carpetas/${id}`, datos);

            if (resultado.success) {
                ui.toast('Carpeta actualizada correctamente', 'success');
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
            ui.toast('Error al guardar cambios', 'error');
        }
    },

    /**
     * Eliminar carpeta
     */
    async eliminarCarpeta(id, etiqueta) {
        if (!confirm(`¿Está seguro de eliminar la carpeta "${etiqueta}"?\n\nEsta acción no se puede deshacer.`)) {
            return;
        }

        try {
            const resultado = await api.delete(`/carpetas/${id}`);
            
            if (resultado.success) {
                ui.toast('Carpeta eliminada correctamente', 'success');
                
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
                ui.toast(resultado.message || 'Error al eliminar carpeta', 'error');
            }
        } catch (error) {
            console.error('Error eliminando carpeta:', error);
            ui.toast('Error al eliminar la carpeta', 'error');
        }
    },

    /**
     * Abrir modal para formularios
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
