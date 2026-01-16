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
            <div class="rounded-lg shadow p-6" style="background-color: var(--card-bg); border: 1px solid var(--border-color);">
                <h1 class="text-3xl font-bold mb-2" style="color: var(--text-primary);">Archivo General SDI</h1>
                <p class="mb-8" style="color: var(--text-secondary);">Gestiona carpetas físicas y documentos de auditoría</p>

                <!-- Pestañas -->
                <div class="flex space-x-4 mb-8 border-b" style="border-color: var(--border-color);">
                    <button onclick="archivoGeneralModule.cambiarPestana('carpetas')" 
                            id="btnCarpetas" 
                            class="px-4 py-3 font-semibold transition border-b-2" 
                            style="color: var(--text-primary); border-color: #3b82f6;">
                        <i class="fas fa-folder mr-2"></i>Crear Carpeta
                    </button>
                    <button onclick="archivoGeneralModule.cambiarPestana('documentos')" 
                            id="btnDocumentos" 
                            class="px-4 py-3 font-semibold transition border-b-2" 
                            style="color: var(--text-secondary); border-color: transparent;">
                        <i class="fas fa-file-alt mr-2"></i>Registrar Documento
                    </button>
                </div>

                <!-- Contenedor de contenido dinámico -->
                <div id="contenidoArchivo">
                    ${await this.mostrarFormularioCarpeta()}
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
        }
    },

    /**
     * Mostrar formulario para crear carpeta
     */
    async mostrarFormularioCarpeta() {
        return `
            <form id="formCarpeta" class="space-y-6 max-w-2xl">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Número de Carpeta Física -->
                    <div>
                        <label for="noCarpeta" class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                            <i class="fas fa-number mr-2"></i>No. Carpeta Física <span class="text-red-500">*</span>
                        </label>
                        <input 
                            type="number" 
                            id="noCarpeta" 
                            name="no_carpeta_fisica" 
                            required
                            placeholder="Ej: 1, 2, 3..."
                            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            style="background-color: var(--card-bg); color: var(--text-primary); border-color: var(--border-color);"
                        >
                    </div>

                    <!-- Etiqueta Identificadora -->
                    <div>
                        <label for="etiqueta" class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                            <i class="fas fa-tag mr-2"></i>Etiqueta Identificadora <span class="text-red-500">*</span>
                        </label>
                        <input 
                            type="text" 
                            id="etiqueta" 
                            name="etiqueta_identificadora" 
                            required
                            placeholder="Ej: AUD-2024-001"
                            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            style="background-color: var(--card-bg); color: var(--text-primary); border-color: var(--border-color);"
                        >
                    </div>
                </div>

                <!-- Descripción -->
                <div>
                    <label for="descripcion" class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                        <i class="fas fa-align-left mr-2"></i>Descripción (Opcional)
                    </label>
                    <textarea 
                        id="descripcion" 
                        name="descripcion" 
                        rows="3"
                        placeholder="Describe el contenido o propósito de esta carpeta..."
                        class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style="background-color: var(--card-bg); color: var(--text-primary); border-color: var(--border-color);"
                    ></textarea>
                </div>

                <!-- Estado de Gestión -->
                <div>
                    <label for="estadoGestion" class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                        <i class="fas fa-clipboard-list mr-2"></i>Estado de Gestión
                    </label>
                    <select 
                        id="estadoGestion" 
                        name="estado_gestion"
                        class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style="background-color: var(--card-bg); color: var(--text-primary); border-color: var(--border-color);"
                    >
                        <option value="pendiente">Pendiente</option>
                        <option value="en_revision">En Revisión</option>
                        <option value="archivado">Archivado</option>
                        <option value="cancelado">Cancelado</option>
                    </select>
                </div>

                <!-- Botones de acción -->
                <div class="flex gap-4">
                    <button 
                        type="submit" 
                        class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                    >
                        <i class="fas fa-save mr-2"></i>Crear Carpeta
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

            <!-- Tabla de Carpetas Existentes -->
            <div class="mt-12">
                <h2 class="text-2xl font-bold mb-6" style="color: var(--text-primary);">Carpetas Registradas</h2>
                <div class="overflow-x-auto rounded-lg border" style="border-color: var(--border-color);">
                    <table class="w-full text-sm" style="background-color: var(--card-bg);">
                        <thead style="background-color: var(--bg-secondary); border-bottom: 2px solid var(--border-color);">
                            <tr>
                                <th class="px-6 py-3 text-left font-semibold" style="color: var(--text-primary);">No. Carpeta</th>
                                <th class="px-6 py-3 text-left font-semibold" style="color: var(--text-primary);">Etiqueta</th>
                                <th class="px-6 py-3 text-left font-semibold" style="color: var(--text-primary);">Descripción</th>
                                <th class="px-6 py-3 text-left font-semibold" style="color: var(--text-primary);">Estado</th>
                                <th class="px-6 py-3 text-left font-semibold" style="color: var(--text-primary);">Creado Por</th>
                                <th class="px-6 py-3 text-left font-semibold" style="color: var(--text-primary);">Fecha</th>
                            </tr>
                        </thead>
                        <tbody id="tablaCarpetas">
                            ${await this.renderizarTablaCarpetas()}
                        </tbody>
                    </table>
                </div>
            </div>

            <script>
                document.getElementById('formCarpeta').addEventListener('submit', function(e) {
                    e.preventDefault();
                    archivoGeneralModule.crearCarpeta(new FormData(this));
                });
            </script>
        `;
    },

    /**
     * Renderizar tabla de carpetas
     */
    async renderizarTablaCarpetas() {
        if (this.carpetas.length === 0) {
            return '<tr><td colspan="6" class="px-6 py-4 text-center" style="color: var(--text-secondary);">No hay carpetas registradas</td></tr>';
        }

        return this.carpetas.map(carpeta => {
            const estado = carpeta.estado_gestion || 'pendiente';
            const coloresEstado = {
                'pendiente': { bg: '#fef3c7', text: '#92400e' },
                'en_revision': { bg: '#dbeafe', text: '#1e40af' },
                'archivado': { bg: '#e5e7eb', text: '#374151' },
                'cancelado': { bg: '#fee2e2', text: '#991b1b' }
            };
            const colores = coloresEstado[estado] || coloresEstado['pendiente'];
            const fechaFormato = new Date(carpeta.fecha_creacion).toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
            const nombreCreador = carpeta.nombre ? `${carpeta.nombre} ${carpeta.apellido_paterno || ''}` : 'Sistema';

            return `
                <tr style="border-bottom: 1px solid var(--border-color);">
                    <td class="px-6 py-4" style="color: var(--text-primary);"><strong>${carpeta.no_carpeta_fisica}</strong></td>
                    <td class="px-6 py-4" style="color: var(--text-primary);">
                        <i class="fas fa-folder mr-2" style="color: #3b82f6;"></i>${carpeta.etiqueta_identificadora}
                    </td>
                    <td class="px-6 py-4" style="color: var(--text-secondary);">${carpeta.descripcion || '-'}</td>
                    <td class="px-6 py-4">
                        <span class="px-3 py-1 rounded-full text-xs font-semibold" style="background-color: ${colores.bg}; color: ${colores.text};">
                            ${estado.replace('_', ' ').toUpperCase()}
                        </span>
                    </td>
                    <td class="px-6 py-4" style="color: var(--text-secondary);">${nombreCreador}</td>
                    <td class="px-6 py-4" style="color: var(--text-secondary);">${fechaFormato}</td>
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
                etiqueta_identificadora: formData.get('etiqueta_identificadora'),
                descripcion: formData.get('descripcion'),
                estado_gestion: formData.get('estado_gestion') || 'pendiente'
            };

            // Validar que la etiqueta no exista
            const existe = this.carpetas.some(c => c.etiqueta_identificadora === datos.etiqueta_identificadora);
            if (existe) {
                ui.toast('La etiqueta ya existe en otra carpeta', 'error');
                return;
            }

            const resultado = await api.post('/carpetas/crear', datos);

            if (resultado.success) {
                ui.toast('Carpeta creada exitosamente', 'success');
                // Recargar carpetas
                await this.cargarCarpetas();
                // Actualizar tabla
                const tablaCarpetas = document.getElementById('tablaCarpetas');
                if (tablaCarpetas) {
                    tablaCarpetas.innerHTML = await this.renderizarTablaCarpetas();
                }
                // Limpiar formulario
                document.getElementById('formCarpeta').reset();
            } else {
                ui.toast(resultado.message || 'Error al crear carpeta', 'error');
            }
        } catch (error) {
            console.error('Error creando carpeta:', error);
            ui.toast('Error al crear la carpeta', 'error');
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
    }
};
