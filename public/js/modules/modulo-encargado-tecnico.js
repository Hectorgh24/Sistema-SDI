/**
 * Módulo: Encargado Técnico
 * Descripción: Gestión de correspondencia técnica, asignación de folios y control de fechas límite.
 * Arquitectura: Cliente (Vanilla JS) -> API (EAV Model Support)
 * * @author SDI Development Team
 * @version 1.0.0
 */

const encargadoTecnicoModule = {
    // ========================================================================
    // ESTADO DEL MÓDULO
    // ========================================================================
    config: {
        nombreModulo: 'Encargado Técnico',
        colorTema: 'emerald', // Tailwind color palette reference
        idCategoria: null // Se llenará si el backend requiere el ID específico
    },
    
    state: {
        carpetas: [],
        documentosActuales: [], // Documentos de la carpeta seleccionada
        filtroActual: { campo: 'todos', valor: '' },
        modoVista: 'carpetas' // 'carpetas' | 'registro'
    },

    // ========================================================================
    // INICIALIZACIÓN
    // ========================================================================
    
    async init() {
        console.log(`🚀 Inicializando módulo: ${this.config.nombreModulo}`);
        try {
            // 1. Cargar carpetas existentes para poblar selects y tablas
            await this.cargarCarpetas();
            
            // 2. Renderizar la vista inicial
            await this.renderizarVistaPrincipal();
            
            // 3. Configurar listeners globales del módulo
            this.setupGlobalListeners();
            
            console.log('✅ Módulo inicializado correctamente');
        } catch (error) {
            console.error('❌ Error crítico al iniciar módulo:', error);
            ui.toast('Error al cargar el módulo técnico', 'error');
        }
    },

    // ========================================================================
    // VISTAS Y RENDERIZADO
    // ========================================================================

    async renderizarVistaPrincipal() {
        const contenedor = document.getElementById('contenido-dinamico') || document.body; // Fallback
        
        const html = `
            <div class="w-full max-w-7xl mx-auto p-4 animate-fade-in-down">
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <i class="fas fa-hard-hat text-emerald-600"></i>
                            Módulo Encargado Técnico
                        </h1>
                        <p class="text-gray-500 text-sm mt-1">Gestión de Oficios, Folios Técnicos y Plazos</p>
                    </div>
                    
                    <div class="flex bg-gray-100 p-1 rounded-lg">
                        <button onclick="encargadoTecnicoModule.cambiarVista('carpetas')" 
                            id="nav-carpetas"
                            class="px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 bg-white text-emerald-700 shadow-sm">
                            <i class="fas fa-folder mr-2"></i>Carpetas
                        </button>
                        <button onclick="encargadoTecnicoModule.cambiarVista('registro')" 
                            id="nav-registro"
                            class="px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 text-gray-600 hover:text-emerald-700">
                            <i class="fas fa-file-signature mr-2"></i>Registro de Oficios
                        </button>
                    </div>
                </div>

                <div id="vista-activa-tecnico" class="transition-all duration-300">
                    ${this.obtenerTemplateCarpetas()}
                </div>
            </div>
        `;
        
        contenedor.innerHTML = html;
        this.actualizarListenersCarpetas();
    },

    cambiarVista(vista) {
        this.state.modoVista = vista;
        const contenedor = document.getElementById('vista-activa-tecnico');
        const btnCarpetas = document.getElementById('nav-carpetas');
        const btnRegistro = document.getElementById('nav-registro');

        // Toggle clases visuales botones
        const activeClass = "bg-white text-emerald-700 shadow-sm";
        const inactiveClass = "text-gray-600 hover:text-emerald-700";

        if (vista === 'carpetas') {
            btnCarpetas.className = `px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${activeClass}`;
            btnRegistro.className = `px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${inactiveClass}`;
            contenedor.innerHTML = this.obtenerTemplateCarpetas();
            this.actualizarListenersCarpetas();
        } else {
            btnCarpetas.className = `px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${inactiveClass}`;
            btnRegistro.className = `px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${activeClass}`;
            contenedor.innerHTML = this.obtenerTemplateRegistro();
            this.actualizarListenersRegistro();
        }
    },

    // ========================================================================
    // TEMPLATES HTML (Tailwind CSS)
    // ========================================================================

    obtenerTemplateCarpetas() {
        // Calcular siguiente número sugerido
        const siguienteNum = this.state.carpetas.length > 0 
            ? Math.max(...this.state.carpetas.map(c => parseInt(c.no_carpeta_fisica) || 0)) + 1 
            : 1;

        return `
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="lg:col-span-1">
                    <form id="form-carpeta-tecnico" class="bg-white rounded-xl shadow-lg border border-emerald-100 p-6 sticky top-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Nueva Carpeta Física</h3>
                        
                        <div class="space-y-4">
                            <div>
                                <label class="block text-xs font-bold text-emerald-700 uppercase mb-1">No. Consecutivo</label>
                                <input type="number" name="no_carpeta_fisica" value="${siguienteNum}" readonly 
                                    class="w-full bg-gray-100 text-gray-600 border border-gray-200 rounded-lg px-4 py-2 focus:outline-none cursor-not-allowed">
                            </div>

                            <div>
                                <label class="block text-xs font-bold text-gray-600 uppercase mb-1">Título de Carpeta <span class="text-red-500">*</span></label>
                                <input type="text" name="titulo" placeholder="Ej: Oficios Recibidos 2026-A" required
                                    class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all">
                            </div>

                            <div>
                                <label class="block text-xs font-bold text-gray-600 uppercase mb-1">Etiqueta (Código) <span class="text-red-500">*</span></label>
                                <input type="text" name="etiqueta_identificadora" placeholder="Ej: TEC-2026-01" required
                                    class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all">
                            </div>

                            <div>
                                <label class="block text-xs font-bold text-gray-600 uppercase mb-1">Descripción</label>
                                <textarea name="descripcion" rows="3" class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"></textarea>
                            </div>

                            <button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg shadow-md hover:shadow-lg transition-all transform active:scale-95">
                                <i class="fas fa-plus-circle mr-2"></i>Crear Carpeta
                            </button>
                        </div>
                    </form>
                </div>

                <div class="lg:col-span-2">
                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div class="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 class="font-bold text-gray-700">Carpetas Disponibles</h3>
                            <span class="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">${this.state.carpetas.length} Total</span>
                        </div>
                        
                        <div class="overflow-x-auto">
                            <table class="w-full text-sm text-left text-gray-500">
                                <thead class="text-xs text-gray-700 uppercase bg-gray-50">
                                    <tr>
                                        <th class="px-6 py-3">ID Físico</th>
                                        <th class="px-6 py-3">Título / Etiqueta</th>
                                        <th class="px-6 py-3 text-center">Estado</th>
                                        <th class="px-6 py-3 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-100">
                                    ${this.renderizarFilasCarpetas()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    obtenerTemplateRegistro() {
        const opcionesCarpetas = this.state.carpetas.map(c => 
            `<option value="${c.id_carpeta}">${c.no_carpeta_fisica} - ${c.etiqueta_identificadora}</option>`
        ).join('');

        const hoy = new Date().toISOString().split('T')[0];

        return `
            <div class="space-y-6">
                <form id="form-oficio-tecnico" class="bg-white rounded-xl shadow-md border border-gray-200 p-6 md:p-8">
                    <div class="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                        <div class="p-3 bg-emerald-100 rounded-lg text-emerald-600">
                            <i class="fas fa-file-contract text-xl"></i>
                        </div>
                        <div>
                            <h2 class="text-xl font-bold text-gray-800">Nuevo Registro de Oficio</h2>
                            <p class="text-sm text-gray-500">Ingresa los metadatos del documento físico.</p>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-1">No. de Oficio <span class="text-red-500">*</span></label>
                                <input type="text" name="no_oficio" placeholder="Ej: OF-TEC-001/2026" required
                                    class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-colors">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-1">Folio Interno <span class="text-red-500">*</span></label>
                                <input type="text" name="folio" placeholder="Ej: 2026-INT-054" required
                                    class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-colors">
                            </div>
                        </div>

                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-1">Fecha Recepción <span class="text-red-500">*</span></label>
                                <input type="date" name="fecha_documento" value="${hoy}" required
                                    class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-colors">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-1">Carpeta de Archivo <span class="text-red-500">*</span></label>
                                <select name="id_carpeta" required
                                    class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-colors bg-white">
                                    <option value="">-- Seleccionar --</option>
                                    ${opcionesCarpetas}
                                </select>
                            </div>
                        </div>

                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-1">Remitente / Emisor <span class="text-red-500">*</span></label>
                                <input type="text" name="emitido_por" placeholder="Nombre o Institución" required
                                    class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-colors">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-1">Fecha Límite <span class="text-gray-400 font-normal">(Opcional)</span></label>
                                <input type="date" name="fecha_limite"
                                    class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-colors text-gray-600">
                            </div>
                        </div>

                        <div class="md:col-span-2 lg:col-span-3">
                            <label class="block text-sm font-semibold text-gray-700 mb-1">Asunto / Descripción del Trámite <span class="text-red-500">*</span></label>
                            <textarea name="descripcion" rows="2" required placeholder="Resumen breve del contenido del oficio..."
                                class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-colors resize-none"></textarea>
                        </div>
                    </div>

                    <div class="mt-8 flex items-center justify-end gap-4 border-t pt-6">
                        <button type="button" onclick="document.getElementById('form-oficio-tecnico').reset()" class="px-6 py-2.5 rounded-lg text-gray-600 font-medium hover:bg-gray-100 transition-colors">
                            Limpiar
                        </button>
                        <button type="submit" class="px-6 py-2.5 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 focus:ring-4 focus:ring-gray-300 transition-all shadow-lg flex items-center gap-2">
                            <i class="fas fa-save"></i> Guardar Registro
                        </button>
                    </div>
                </form>

                <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div class="p-6 border-b border-gray-200 flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                        <h3 class="font-bold text-gray-800 text-lg">Consulta de Oficios</h3>
                        
                        <div class="w-full md:w-64">
                            <label class="text-xs font-bold text-gray-500 uppercase">Filtrar por Carpeta</label>
                            <select id="filtro-tabla-carpeta" onchange="encargadoTecnicoModule.filtrarTablaPorCarpeta(this.value)" class="w-full mt-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm">
                                <option value="">-- Ver Todas --</option>
                                ${opcionesCarpetas}
                            </select>
                        </div>
                    </div>

                    <div class="overflow-x-auto min-h-[300px]" id="contenedor-tabla-documentos">
                        <div class="flex flex-col items-center justify-center h-64 text-gray-400">
                            <i class="fas fa-search text-4xl mb-3 opacity-30"></i>
                            <p>Selecciona una carpeta para ver los registros</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderizarFilasCarpetas() {
        if (!this.state.carpetas.length) {
            return `<tr><td colspan="4" class="px-6 py-8 text-center text-gray-400">No hay carpetas registradas. Crea la primera.</td></tr>`;
        }

        return this.state.carpetas.map(carpeta => `
            <tr class="bg-white border-b hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 font-medium text-gray-900">#${carpeta.no_carpeta_fisica}</td>
                <td class="px-6 py-4">
                    <div class="text-sm font-semibold text-gray-800">${carpeta.titulo}</div>
                    <div class="text-xs text-gray-500 font-mono bg-gray-100 inline-block px-2 py-0.5 rounded mt-1">${carpeta.etiqueta_identificadora}</div>
                </td>
                <td class="px-6 py-4 text-center">
                    <span class="bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-0.5 rounded border border-emerald-200">Activa</span>
                </td>
                <td class="px-6 py-4 text-center">
                    <button onclick="encargadoTecnicoModule.eliminarCarpeta(${carpeta.id_carpeta})" class="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-colors" title="Eliminar">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    },

    // ========================================================================
    // LÓGICA DE NEGOCIO (Controladores)
    // ========================================================================

    async cargarCarpetas() {
        try {
            const res = await api.get('/carpetas'); // Asumiendo que 'api' es global
            if (res.success) {
                this.state.carpetas = res.data.carpetas || [];
            }
        } catch (e) {
            console.error(e);
            this.state.carpetas = [];
        }
    },

    async crearCarpeta(evento) {
        evento.preventDefault();
        const form = evento.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Forzar estado activo
        data.estado_gestion = 'pendiente';

        try {
            const res = await api.post('/carpetas/crear', data);
            if (res.success) {
                ui.toast('Carpeta creada exitosamente', 'success');
                form.reset();
                await this.init(); // Recargar todo para actualizar listas
                this.cambiarVista('carpetas'); // Asegurar vista
            } else {
                ui.toast(res.message || 'Error al crear carpeta', 'error');
            }
        } catch (e) {
            ui.toast('Error de conexión', 'error');
        }
    },

    async eliminarCarpeta(id) {
        if(!confirm('¿Estás seguro? Esto podría borrar los documentos asociados.')) return;
        
        try {
            const res = await api.delete(`/carpetas/${id}`);
            if (res.success) {
                ui.toast('Carpeta eliminada', 'success');
                await this.init();
                this.cambiarVista('carpetas');
            }
        } catch (e) {
            ui.toast('Error al eliminar', 'error');
        }
    },

    async registrarDocumento(evento) {
        evento.preventDefault();
        const form = evento.target;
        const formData = new FormData(form);
        
        // Construir objeto para API
        // NOTA: El backend debe estar preparado para recibir 'folio' y 'fecha_limite'
        // y mapearlos a la tabla EAV (detalles_valores_documento)
        const payload = {
            categoria: 'Encargado Tecnico', // Flag para backend
            id_carpeta: formData.get('id_carpeta'),
            no_oficio: formData.get('no_oficio'),
            emitido_por: formData.get('emitido_por'),
            fecha_documento: formData.get('fecha_documento'),
            descripcion: formData.get('descripcion'),
            estado_gestion: 'pendiente',
            capturado_por: 'Usuario Actual', // Idealmente vendría de sesión
            
            // Campos Dinámicos (EAV)
            folio: formData.get('folio'),
            fecha_limite: formData.get('fecha_limite') || null
        };

        try {
            const res = await api.post('/documentos', payload);
            if (res.success) {
                ui.toast('Oficio registrado correctamente', 'success');
                form.reset();
                // Recargar tabla si hay filtro activo de la misma carpeta
                const filtroCarpeta = document.getElementById('filtro-tabla-carpeta');
                if (filtroCarpeta && filtroCarpeta.value == payload.id_carpeta) {
                    this.filtrarTablaPorCarpeta(payload.id_carpeta);
                }
            } else {
                ui.toast(res.message || 'Error al guardar oficio', 'error');
            }
        } catch (e) {
            ui.toast('Error de comunicación con el servidor', 'error');
        }
    },

    async filtrarTablaPorCarpeta(idCarpeta) {
        const contenedor = document.getElementById('contenedor-tabla-documentos');
        
        if (!idCarpeta) {
            contenedor.innerHTML = `<div class="flex flex-col items-center justify-center h-64 text-gray-400"><i class="fas fa-search text-4xl mb-3 opacity-30"></i><p>Selecciona una carpeta</p></div>`;
            return;
        }

        contenedor.innerHTML = `<div class="flex justify-center p-8"><i class="fas fa-spinner fa-spin text-emerald-600 text-2xl"></i></div>`;

        try {
            const res = await api.get(`/documentos/por-carpeta/${idCarpeta}`);
            const documentos = res.data || []; // Ajustar según respuesta real API

            if (documentos.length === 0) {
                contenedor.innerHTML = `<div class="text-center p-8 text-gray-500">Carpeta vacía</div>`;
                return;
            }

            // Renderizar tabla
            let filas = documentos.map(doc => {
                // Helper para extraer valor de estructura EAV o propiedad directa
                const getVal = (key) => {
                    if (doc[key]) return doc[key]; // Si viene directo
                    if (doc.valores && Array.isArray(doc.valores)) {
                        const encontrado = doc.valores.find(v => v.nombre_campo.toLowerCase().includes(key));
                        return encontrado ? encontrado.valor : '-';
                    }
                    return '-';
                };

                const folio = getVal('folio');
                const fechaLimite = getVal('límite') || getVal('limite') || 'N/A';
                
                return `
                    <tr class="hover:bg-gray-50 border-b last:border-0">
                        <td class="px-6 py-3 font-medium text-emerald-700 whitespace-nowrap">${doc.no_oficio || '-'}</td>
                        <td class="px-6 py-3 font-mono text-xs text-gray-600">${folio}</td>
                        <td class="px-6 py-3 text-gray-700 truncate max-w-xs">${doc.descripcion || '-'}</td>
                        <td class="px-6 py-3 text-gray-500 text-sm">${doc.emitido_por || '-'}</td>
                        <td class="px-6 py-3 whitespace-nowrap text-red-600 font-bold text-xs">${fechaLimite}</td>
                        <td class="px-6 py-3 text-center">
                            <button class="text-blue-600 hover:text-blue-800"><i class="fas fa-edit"></i></button>
                        </td>
                    </tr>
                `;
            }).join('');

            contenedor.innerHTML = `
                <table class="w-full text-sm text-left text-gray-500">
                    <thead class="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th class="px-6 py-3">Oficio</th>
                            <th class="px-6 py-3">Folio</th>
                            <th class="px-6 py-3">Asunto</th>
                            <th class="px-6 py-3">Remitente</th>
                            <th class="px-6 py-3">Fecha Límite</th>
                            <th class="px-6 py-3 text-center">Editar</th>
                        </tr>
                    </thead>
                    <tbody>${filas}</tbody>
                </table>
            `;

        } catch (e) {
            console.error(e);
            contenedor.innerHTML = `<div class="text-center text-red-500 p-4">Error al cargar documentos</div>`;
        }
    },

    // ========================================================================
    // LISTENERS (Event Binding)
    // ========================================================================

    setupGlobalListeners() {
        // Listeners que no dependen de la vista
    },

    actualizarListenersCarpetas() {
        const form = document.getElementById('form-carpeta-tecnico');
        if (form) form.addEventListener('submit', (e) => this.crearCarpeta(e));
    },

    actualizarListenersRegistro() {
        const form = document.getElementById('form-oficio-tecnico');
        if (form) form.addEventListener('submit', (e) => this.registrarDocumento(e));
    }
};

// Exportar globalmente
window.encargadoTecnicoModule = encargadoTecnicoModule;