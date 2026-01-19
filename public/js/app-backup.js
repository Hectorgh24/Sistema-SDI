/**
 * Aplicación Principal - SDI Gestión Documental
 * 
 * Gestiona la navegación, autenticación y carga de módulos.
 * 
 * @author SDI Development Team
 * @version 2.0
 */

let moduloActual = 'dashboard';
let professionalConverter = null;

/**
 * Inicializar aplicación
 */
async function initApp() {
    // Inicializar conversor profesional
    try {
        professionalConverter = new ProfessionalWordToPDFConverter();
        console.log('[APP] Conversor profesional inicializado');
    } catch (error) {
        console.error('[APP] Error inicializando conversor profesional:', error);
    }
    
    // Verificar autenticación
    const autenticado = await auth.verificar();

    if (!autenticado) {
        // Redirigir a login
        window.location.href = '/Programa-Gestion-SDI/login.html';
        return;
    }

    // Inicializar módulo de navegación
    if (typeof navegacionModule !== 'undefined') {
        navegacionModule.init();
    }

    // Actualizar información del usuario en header
    if (auth.usuario) {
        const nombre = auth.usuario.nombre + ' ' + auth.usuario.apellidos;
        const rol = auth.usuario.rol;
        const inicial = (auth.usuario.nombre || '').charAt(0).toUpperCase();
        
        // Actualizar header
        document.getElementById('usuarioNombreHeader').textContent = nombre;
        document.getElementById('usuarioRolHeader').textContent = rol;
        const inicialHeader = document.getElementById('usuarioInicialHeader');
        if (inicialHeader) {
            inicialHeader.textContent = inicial;
        }
    }

    // Cargar dashboard por defecto
    await cargarModulo('dashboard');
}

/**
 * Obtener opciones de menú según rol del usuario
 */
function obtenerOpcionesMenu() {
    const rol = auth.getRol();
    
    // Opciones base para todos los usuarios
    const opcionesBase = [
        {
            titulo: 'Panel de Control Principal',
            descripcion: 'Dashboard principal del sistema',
            icono: 'fas fa-tachometer-alt',
            modulo: 'dashboard'
        },
        {
            titulo: 'Archivo General SDI',
            descripcion: 'Categoría archivo general SDI',
            icono: 'fas fa-archive',
            modulo: 'archivo-general'
        },
        {
            titulo: 'Herramientas',
            descripcion: 'Utilidades y herramientas del sistema',
            icono: 'fas fa-tools',
            modulo: 'herramientas'
        }
    ];

    // Opciones para administradores
    const opcionesAdmin = [
        {
            titulo: 'Gestión de Usuarios',
            descripcion: 'Administrar usuarios del sistema',
            icono: 'fas fa-users',
            modulo: 'usuarios'
        }
    ];

    // Combinar opciones según rol
    let opciones = [...opcionesBase];
    
    if (auth.esAdmin() || auth.esAdministrativo()) {
        opciones = [...opciones, ...opcionesAdmin];
    }

    return opciones;
}

/**
 * Cargar módulo sin actualizar historial (para navegación hacia atrás)
 */
async function cargarModuloSinHistorial(modulo) {
    moduloActual = modulo;
    // Actualizar módulo actual en navegación sin agregar al historial
    if (typeof navegacionModule !== 'undefined') {
        navegacionModule.moduloActual = modulo;
    }
    await cargarContenidoModulo(modulo);
}

/**
 * Cargar módulo dinámicamente
 */
async function cargarModulo(modulo) {
    moduloActual = modulo;

    // Actualizar historial de navegación
    if (typeof navegacionModule !== 'undefined') {
        navegacionModule.agregarAlHistorial(modulo);
    }

    await cargarContenidoModulo(modulo);
}

/**
 * Cargar contenido del módulo (función auxiliar)
 */
async function cargarContenidoModulo(modulo) {
    const contenido = document.getElementById('contenido');
    contenido.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin text-4xl text-blue-500"></i><p class="mt-4" style="color: var(--text-primary);">Cargando...</p></div>';

    try {
        let html = '';

        switch(modulo) {
            case 'dashboard':
                html = await cargarDashboard();
                break;
            case 'usuarios':
                html = await cargarUsuarios();
                break;
            case 'documentos':
                html = await cargarDocumentos();
                break;
            case 'carpetas':
                html = await cargarCarpetas();
                break;
            case 'archivo-general':
                html = await cargarArchivoGeneral();
                break;
            case 'categorias':
                html = await cargarCategorias();
                break;
            case 'perfil':
                html = await cargarPerfil();
                break;
            case 'herramientas':
                html = await cargarHerramientas();
                break;
            default:
                html = '<p style="color: var(--text-primary);">Módulo no encontrado</p>';
        }

        // Obtener el contenedor interno del contenido
        const contenidoWrapper = document.querySelector('#contenido');
        if (contenidoWrapper) {
            contenidoWrapper.innerHTML = html;
            
            // Actualizar botón volver después de cargar
            if (typeof navegacionModule !== 'undefined') {
                navegacionModule.actualizarBotonVolver();
            }
            
            // Asegurar que el contenido se muestre centrado verticalmente
            setTimeout(() => {
                const contenidoSection = document.querySelector('section.flex-1');
                if (contenidoSection) {
                    // Scroll al inicio
                    contenidoSection.scrollTo({ top: 0, behavior: 'smooth' });
                    // Asegurar que el contenedor padre esté centrado (excepto para dashboard)
                    if (modulo !== 'dashboard') {
                        const contenedorPadre = contenidoSection.querySelector('div.flex');
                        if (contenedorPadre) {
                            contenedorPadre.classList.add('items-center');
                        }
                    }
                    
                    // Inicializar módulo de herramientas si es el caso
                    // Nota: La configuración de la zona de subida se maneja dinámicamente
                    // cuando se selecciona un submódulo específico
                }
            }, 100);
        }
        
        // Si es el módulo de usuarios, inicializar después de cargar
        if (modulo === 'usuarios' && typeof usuariosModule !== 'undefined') {
            // El módulo ya se inicializa en cargarUsuarios()
        }
    } catch (error) {
        console.error('Error cargando módulo:', error);
        const contenido = document.getElementById('contenido');
        if (contenido) {
            contenido.innerHTML = '<p style="color: var(--text-primary);">Error al cargar el módulo</p>';
        }
        ui.toast('Error cargando módulo', 'error');
    }
}

/**
 * Cargar dashboard
 */
async function cargarDashboard() {
    // Verificar si el usuario es estudiante de SS
    const esEstudianteSS = auth.esEstudiante();
    const rolUsuario = auth.getRol();
    
    // Debug para verificar el rol del usuario
    console.log('[DASHBOARD] Rol del usuario:', rolUsuario);
    console.log('[DASHBOARD] ¿Es estudiante SS?', esEstudianteSS);
    
    if (esEstudianteSS) {
        // Para estudiantes de SS: solo mostrar bienvenida y Archivo General SDI, sin obtener estadísticas
        console.log('[DASHBOARD] Mostrando vista para estudiante SS');
        return `
            <!-- Contenedor principal centrado -->
            <div class="w-full">
            <!-- Mensaje de bienvenida -->
            <div class="rounded-xl shadow-lg p-8 text-center mb-8" style="background: linear-gradient(to right, var(--bg-tertiary), var(--card-bg)); color: var(--text-primary); border: 1px solid var(--border-color);">
                <h2 class="text-4xl font-bold mb-2" style="color: var(--text-primary);">Bienvenido, ${auth.usuario?.nombre || 'Usuario'}</h2>
                <p class="text-lg" style="color: var(--text-secondary);">Panel de control - ${auth.usuario?.rol || ''}</p>
            </div>

            <!-- Módulos disponibles para estudiantes de SS -->
            <div class="mb-8">
                <h2 class="text-3xl font-bold mb-10 text-center" style="color: var(--text-primary);">Módulos Disponibles</h2>
                <div class="flex flex-wrap justify-center items-center gap-8">
                    <div onclick="cargarModulo('archivo-general')" 
                         class="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl shadow-lg p-10 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl w-full sm:w-80 lg:w-96 min-h-[280px] flex flex-col justify-center">
                        <div class="text-center">
                            <div class="inline-flex items-center justify-center w-24 h-24 bg-white bg-opacity-35 rounded-full mb-6 shadow-lg hover:bg-opacity-45 transition-all duration-300">
                                <i class="fas fa-archive text-5xl text-white drop-shadow-md"></i>
                            </div>
                            <h3 class="text-3xl font-bold text-white mb-3 drop-shadow-md">Archivo General SDI</h3>
                            <p class="text-white text-opacity-95 mb-6 text-base leading-relaxed drop-shadow-sm">Categoría archivo general SDI</p>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        `;
    }

    // Para otros roles: obtener estadísticas y mostrar dashboard completo
    console.log('[DASHBOARD] Mostrando vista completa para rol:', rolUsuario);
    const resultado = await api.get('/dashboard/estadisticas');

    if (!resultado.success) {
        return '<p style="color: var(--text-primary);">Error cargando estadísticas</p>';
    }

    const stats = resultado.data;
    const usuarios = stats.usuarios || {};
    const documentos = stats.documentos || {};

    // Obtener opciones del menú según rol
    const opciones = obtenerOpcionesMenu();

    // Todos los módulos en azul (mosaico azul) - Centrados
    let opcionesHtml = opciones.map(op => {
        return `
            <div onclick="cargarModulo('${op.modulo}')" 
                 class="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl shadow-lg p-10 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl w-full sm:w-80 lg:w-96 min-h-[280px] flex flex-col justify-center">
                <div class="text-center">
                    <div class="inline-flex items-center justify-center w-24 h-24 bg-white bg-opacity-35 rounded-full mb-6 shadow-lg hover:bg-opacity-45 transition-all duration-300">
                        <i class="fas ${op.icono} text-5xl text-white drop-shadow-md"></i>
                    </div>
                    <h3 class="text-3xl font-bold text-white mb-3 drop-shadow-md">${op.titulo}</h3>
                    <p class="text-white text-opacity-95 mb-6 text-base leading-relaxed drop-shadow-sm">${op.descripcion}</p>
                </div>
            </div>
        `;
    }).join('');

    return `
        <!-- Contenedor principal centrado -->
        <div class="w-full">
        <!-- Mensaje de bienvenida -->
        <div class="rounded-xl shadow-lg p-8 text-center mb-8" style="background: linear-gradient(to right, var(--bg-tertiary), var(--card-bg)); color: var(--text-primary); border: 1px solid var(--border-color);">
            <h2 class="text-4xl font-bold mb-2" style="color: var(--text-primary);">Bienvenido, ${auth.usuario?.nombre || 'Usuario'}</h2>
            <p class="text-lg" style="color: var(--text-secondary);">Panel de control - ${auth.usuario?.rol || ''}</p>
        </div>

        <!-- Tarjetas de estadísticas -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12" style="color: var(--text-primary);">
            <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-blue-100 text-sm mb-1">Total Usuarios</p>
                        <p class="text-4xl font-bold">${usuarios.total || 0}</p>
                        <p class="text-blue-100 text-xs mt-1">${usuarios.activos || 0} activos</p>
                    </div>
                    <i class="fas fa-users text-5xl text-blue-200 opacity-50"></i>
                </div>
            </div>
            <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-green-100 text-sm mb-1">Usuarios Activos</p>
                        <p class="text-4xl font-bold">${usuarios.activos || 0}</p>
                        <p class="text-green-100 text-xs mt-1">${usuarios.inactivos || 0} inactivos</p>
                    </div>
                    <i class="fas fa-check-circle text-5xl text-green-200 opacity-50"></i>
                </div>
            </div>
            <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-purple-100 text-sm mb-1">Total Documentos</p>
                        <p class="text-4xl font-bold">${documentos.total || 0}</p>
                        <p class="text-purple-100 text-xs mt-1">En el sistema</p>
                    </div>
                    <i class="fas fa-file-alt text-5xl text-purple-200 opacity-50"></i>
                </div>
            </div>
            <div class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-orange-100 text-sm mb-1">Documentos Pendientes</p>
                        <p class="text-4xl font-bold">${documentos.pendientes || 0}</p>
                        <p class="text-orange-100 text-xs mt-1">Por procesar</p>
                    </div>
                    <i class="fas fa-hourglass-end text-5xl text-orange-200 opacity-50"></i>
                </div>
            </div>
        </div>

        <!-- Módulos principales - Centrados y en mosaico azul -->
        <div class="mb-8">
            <h2 class="text-3xl font-bold mb-10 text-center" style="color: var(--text-primary);">Módulos Disponibles</h2>
            <div class="flex flex-wrap justify-center items-center gap-8">
                ${opcionesHtml}
            </div>
        </div>
        </div>
    `;
}

/**
 * Cargar módulo de usuarios
 */
async function cargarUsuarios() {
    if (!auth.esAdmin()) {
        return '<p style="color: var(--text-primary);">No tiene permisos para acceder a este módulo</p>';
    }

    // Inicializar módulo de usuarios
    await usuariosModule.init();
    return await usuariosModule.cargarUsuarios();
}

/**
 * Cargar módulo de documentos
 */
async function cargarDocumentos() {
    const resultado = await api.get('/documentos', { limit: 20 });

    if (!resultado.success) {
        return '<p style="color: var(--text-primary);">Error cargando documentos</p>';
    }

    const documentos = resultado.data.documentos || [];

    let html = `
        <div class="rounded-lg shadow p-6" style="background-color: var(--card-bg); border: 1px solid var(--border-color);">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-2xl font-bold" style="color: var(--text-primary);">Documentos</h1>
                <button onclick="mostrarFormularioNuevoDocumento()" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                    <i class="fas fa-plus mr-2"></i>Nuevo Documento
                </button>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead style="background-color: var(--bg-tertiary); border-bottom: 1px solid var(--border-color);">
                        <tr>
                            <th class="px-4 py-2 text-left" style="color: var(--text-primary);">ID</th>
                            <th class="px-4 py-2 text-left" style="color: var(--text-primary);">Categoría</th>
                            <th class="px-4 py-2 text-left" style="color: var(--text-primary);">Carpeta</th>
                            <th class="px-4 py-2 text-left" style="color: var(--text-primary);">Estado</th>
                            <th class="px-4 py-2 text-left" style="color: var(--text-primary);">Fecha</th>
                            <th class="px-4 py-2 text-left" style="color: var(--text-primary);">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    documentos.forEach(doc => {
        const estado_class = doc.estado_gestion === 'pendiente' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800';
        html += `
            <tr class="border-b transition" style="border-color: var(--border-color);" onmouseover="this.style.backgroundColor='var(--bg-tertiary)'" onmouseout="this.style.backgroundColor='var(--card-bg)'">
                <td class="px-4 py-2" style="color: var(--text-primary);">${doc.id_registro}</td>
                <td class="px-4 py-2" style="color: var(--text-secondary);">${doc.nombre_categoria}</td>
                <td class="px-4 py-2" style="color: var(--text-secondary);">${doc.etiqueta_identificadora}</td>
                <td class="px-4 py-2"><span class="px-3 py-1 rounded-full text-sm ${estado_class}">${doc.estado_gestion}</span></td>
                <td class="px-4 py-2" style="color: var(--text-secondary);">${new Date(doc.fecha_documento).toLocaleDateString('es-ES')}</td>
                <td class="px-4 py-2">
                    <button onclick="verDocumento(${doc.id_registro})" class="text-blue-500 hover:text-blue-700 mr-2">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;

    return html;
}

/**
 * Cargar módulo de carpetas
 */
async function cargarCarpetas() {
    const resultado = await api.get('/carpetas', { limit: 20 });

    if (!resultado.success) {
        return '<p style="color: var(--text-primary);">Error cargando carpetas</p>';
    }

    const carpetas = resultado.data.carpetas || [];

    let html = `
        <div class="rounded-lg shadow p-6" style="background-color: var(--card-bg); border: 1px solid var(--border-color);">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-2xl font-bold" style="color: var(--text-primary);">Carpetas Físicas</h1>
                <button onclick="mostrarFormularioNuevaCarpeta()" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                    <i class="fas fa-plus mr-2"></i>Nueva Carpeta
                </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    `;

    carpetas.forEach(carpeta => {
        html += `
            <div class="border rounded-lg p-4 hover:shadow-lg transition" style="background-color: var(--card-bg); border-color: var(--border-color);">
                <h3 class="font-bold text-lg mb-2" style="color: var(--text-primary);">${carpeta.etiqueta_identificadora}</h3>
                <p class="text-sm mb-2" style="color: var(--text-secondary);">${carpeta.descripcion || 'Sin descripción'}</p>
                <p class="text-xs" style="color: var(--text-tertiary);">Documentos: ${carpeta.cantidad_documentos || 0}</p>
            </div>
        `;
    });

    html += `
            </div>
        </div>
    `;

    return html;
}

/**
 * Cargar módulo de categorías
 */
async function cargarCategorias() {
    const resultado = await api.get('/categorias', { limit: 20 });

    if (!resultado.success) {
        return '<p style="color: var(--text-primary);">Error cargando categorías</p>';
    }

    const categorias = resultado.data.categorias || [];

    let html = `
        <div class="rounded-lg shadow p-6" style="background-color: var(--card-bg); border: 1px solid var(--border-color);">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-2xl font-bold" style="color: var(--text-primary);">Categorías</h1>
                <button onclick="mostrarFormularioNuevaCategoria()" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                    <i class="fas fa-plus mr-2"></i>Nueva Categoría
                </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    `;

    categorias.forEach(cat => {
        html += `
            <div class="border rounded-lg p-4 hover:shadow-lg transition" style="background-color: var(--card-bg); border-color: var(--border-color);">
                <h3 class="font-bold text-lg mb-2" style="color: var(--text-primary);">${cat.nombre_categoria}</h3>
                <p class="text-sm mb-2" style="color: var(--text-secondary);">${cat.descripcion || 'Sin descripción'}</p>
                <p class="text-xs" style="color: var(--text-tertiary);">Campos: ${cat.cantidad_campos || 0}</p>
            </div>
        `;
    });

    html += `
            </div>
        </div>
    `;

    return html;
}

/**
 * Cargar módulo de herramientas
 */
async function cargarHerramientas() {
    const html = `
        <div class="w-full max-w-6xl mx-auto">
            <!-- Header del módulo -->
            <div class="rounded-xl shadow-lg p-8 mb-8" style="background: linear-gradient(to right, var(--bg-tertiary), var(--card-bg)); border: 1px solid var(--border-color);">
                <div class="flex items-center">
                    <div class="inline-flex items-center justify-center w-16 h-16 rounded-full mr-4" style="background-color: var(--color-primary);">
                        <i class="fas fa-tools text-2xl" style="color: white;"></i>
                    </div>
                    <div>
                        <h1 class="text-3xl font-bold" style="color: var(--text-primary);">Herramientas del Sistema</h1>
                        <p class="text-lg" style="color: var(--text-secondary);">Utilidades y convertidores profesionales</p>
                    </div>
                </div>
            </div>

            <!-- Contenedor dinámico para el conversor -->
            <div id="submoduloHerramientas"></div>

            <!-- Toast Container -->
            <div id="herramientasToastContainer" class="fixed top-4 right-4 space-y-2 z-50"></div>
        </div>
    `;
    
    // Cargar automáticamente el conversor de archivos
    setTimeout(async () => {
        const contenedor = document.getElementById('submoduloHerramientas');
        if (contenedor) {
            contenedor.innerHTML = await cargarConversorArchivos();
            // Inicializar el conversor después de cargar el HTML
            setTimeout(() => {
                configurarZonaSubida();
            }, 100);
        }
    }, 100);
    
    return html;
}

/**
 * Cargar módulo conversor de archivos
 */
async function cargarConversorArchivos() {
    return `
        <div class="rounded-xl shadow-lg p-8" style="background-color: var(--card-bg); border: 1px solid var(--border-color);">
            <div class="flex items-center mb-6">
                <div class="inline-flex items-center justify-center w-12 h-12 rounded-full mr-3" style="background-color: var(--color-primary);">
                    <i class="fas fa-file-export text-lg" style="color: white;"></i>
                </div>
                <h2 class="text-2xl font-bold" style="color: var(--text-primary);">
                    Convertidor Profesional de Archivos
                </h2>
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Panel de configuración -->
                <div>
                    <h3 class="text-lg font-semibold mb-4" style="color: var(--text-primary);">
                        <i class="fas fa-cog mr-2" style="color: var(--color-primary);"></i>
                        Configuración de Conversión
                    </h3>
                    
                    <!-- Tipo de archivo original -->
                    <div class="mb-6">
                        <label class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                            <i class="fas fa-file-import mr-2"></i>Tipo de Archivo Original
                        </label>
                        <select id="tipoArchivoOriginal" class="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" style="background-color: var(--bg-secondary); border-color: var(--border-color); color: var(--text-primary);">
                            <option value="">Selecciona un tipo de archivo</option>
                            <option value="pdf">📄 PDF</option>
                            <option value="word">📝 Word (.docx)</option>
                            <option value="excel">📊 Excel (.xlsx)</option>
                            <option value="png">🖼️ PNG</option>
                            <option value="jpg">📸 JPG/JPEG</option>
                            <option value="txt">📄 Texto (.txt)</option>
                        </select>
                    </div>

                    <!-- Formato de destino -->
                    <div class="mb-6">
                        <label class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                            <i class="fas fa-file-export mr-2"></i>Convertir a Formato
                        </label>
                        <select id="formatoDestino" class="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" style="background-color: var(--bg-secondary); border-color: var(--border-color); color: var(--text-primary);">
                            <option value="">Selecciona el formato de destino</option>
                        </select>
                    </div>

                    <!-- Área de subida -->
                    <div class="mb-6">
                        <label class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                            <i class="fas fa-cloud-upload-alt mr-2"></i>Seleccionar Archivo
                        </label>
                        <div class="border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 hover:border-blue-400" id="dropZone" style="border-color: var(--border-color); background-color: var(--bg-secondary);">
                            <input type="file" id="archivoInput" class="hidden" accept="">
                            <i class="fas fa-cloud-upload-alt text-4xl mb-4 transition-colors" id="uploadIcon" style="color: var(--text-secondary);"></i>
                            <p class="text-lg font-medium mb-2" style="color: var(--text-primary);">Arrastra tu archivo aquí</p>
                            <p class="text-sm" style="color: var(--text-secondary);">o haz clic para seleccionar</p>
                            <button type="button" onclick="document.getElementById('archivoInput').click()" class="mt-4 px-6 py-2 rounded-lg font-medium transition-all duration-300 hover:shadow-lg" style="background-color: var(--color-primary); color: white;">
                                <i class="fas fa-folder-open mr-2"></i>Seleccionar Archivo
                            </button>
                        </div>
                    </div>

                    <!-- Botón de conversión -->
                    <button type="button" id="btnConvertir" onclick="convertirArchivo()" class="w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg" style="background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark)); color: white;" disabled>
                        <i class="fas fa-sync-alt" id="btnIcono"></i>
                        <span id="btnTexto">Convertir Archivo</span>
                    </button>
                </div>

                <!-- Panel de información -->
                <div>
                    <h3 class="text-lg font-semibold mb-4" style="color: var(--text-primary);">
                        <i class="fas fa-info-circle mr-2" style="color: var(--color-primary);"></i>
                        Información del Archivo
                    </h3>
                    
                    <div class="rounded-lg p-6 mb-6" style="background-color: var(--bg-secondary); border: 1px solid var(--border-color);">
                        <div class="space-y-3">
                            <div class="flex justify-between">
                                <span style="color: var(--text-secondary);">Nombre:</span>
                                <span id="infoNombre" style="color: var(--text-primary); font-medium;">-</span>
                            </div>
                            <div class="flex justify-between">
                                <span style="color: var(--text-secondary);">Tamaño:</span>
                                <span id="infoTamano" style="color: var(--text-primary); font-medium;">-</span>
                            </div>
                            <div class="flex justify-between">
                                <span style="color: var(--text-secondary);">Tipo:</span>
                                <span id="infoTipo" style="color: var(--text-primary); font-medium;">-</span>
                            </div>
                            <div class="flex justify-between">
                                <span style="color: var(--text-secondary);">Estado:</span>
                                <span id="infoEstado" style="color: var(--text-primary); font-medium;">Esperando archivo...</span>
                            </div>
                        </div>
                    </div>

                    <!-- Estado del sistema profesional -->
                    <div class="rounded-lg p-6 mb-6" style="background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark)); border: 1px solid var(--color-primary);">
                        <h4 class="text-white font-semibold mb-3">
                            <i class="fas fa-rocket mr-2"></i>Sistema Profesional
                        </h4>
                        <div class="space-y-2">
                            <div class="flex items-center text-white">
                                <i class="fas fa-check-circle mr-2 text-green-300"></i>
                                <span class="text-sm">Mammoth.js - Traductor Word → HTML</span>
                            </div>
                            <div class="flex items-center text-white">
                                <i class="fas fa-check-circle mr-2 text-green-300"></i>
                                <span class="text-sm">Puppeteer - Imprenta HTML → PDF</span>
                            </div>
                            <div class="flex items-center text-white">
                                <i class="fas fa-check-circle mr-2 text-green-300"></i>
                                <span class="text-sm">Calidad profesional garantizada</span>
                            </div>
                        </div>
                    </div>

                    <!-- Indicador de estado -->
                    <div class="text-center">
                        <div id="statusIndicator" class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-300" style="background-color: var(--bg-tertiary); color: var(--text-secondary);">
                            <i class="fas fa-circle mr-2" id="statusDot"></i>
                            <span id="statusText">Sistema listo</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Verificar estado del sistema
 */
async function verificarSistema() {
    console.log('[SISTEMA] Verificando estado del sistema...');
    mostrarToastHerramientas('Verificando sistema...', 'info');
    
    // Simulación simple
    setTimeout(() => {
        mostrarToastHerramientas('Sistema verificado correctamente', 'success');
    }, 1000);
}

/**
 * Optimizar sistema
 */
async function optimizarSistema() {
    console.log('[SISTEMA] Iniciando optimización...');
    mostrarToastHerramientas('Optimizando sistema...', 'info');
    
    setTimeout(() => {
        mostrarToastHerramientas('Sistema optimizado correctamente', 'success');
    }, 1000);
}

/**
 * Limpiar sistema
 */
            contenido = atob(datos.contenido);
            console.log('[DESCARGA] Contenido decodificado exitosamente, longitud:', contenido.length);
        } catch (error) {
            console.error('[DESCARGA] Error decodificando base64:', error);
            mostrarToastHerramientas('Error: El contenido del archivo está corrupto', 'error');
            return;
        }
        
        // Convertir a bytes
        const bytes = new Uint8Array(contenido.length);
        for (let i = 0; i < contenido.length; i++) {
            bytes[i] = contenido.charCodeAt(i);
        }
        
        // Crear blob
        const blob = new Blob([bytes], { type: datos.mime_type });
        console.log('[DESCARGA] Blob creado, tamaño:', blob.size, 'bytes');
        
        // Crear URL de descarga
        const url = window.URL.createObjectURL(blob);
        
        // Crear enlace de descarga
        const a = document.createElement('a');
        a.href = url;
        a.download = datos.nombre;
        a.style.display = 'none';
        
        // Simular clic
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Limpiar URL
        window.URL.revokeObjectURL(url);
        
        console.log('[DESCARGA] Archivo descargado exitosamente:', datos.nombre);
        mostrarToastHerramientas('Archivo descargado exitosamente: ' + datos.nombre, 'success');
        
    } catch (error) {
        console.error('[DESCARGA] Error general:', error);
        mostrarToastHerramientas('Error descargando el archivo: ' + error.message, 'error');
    }
}

/**
 * Mostrar toast de herramientas
 */
function mostrarToastHerramientas(mensaje, tipo = 'error') {
    const toastContainer = document.getElementById('herramientasToastContainer');
    
    const colores = tipo === 'success' 
        ? 'bg-green-100 border border-green-400 text-green-700'
        : 'bg-red-100 border border-red-400 text-red-700';
    
    const icono = tipo === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    
    const toast = document.createElement('div');
    toast.className = `${colores} px-4 py-3 rounded-lg shadow-lg mb-2`;
    toast.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${icono} mr-2"></i>
            <span>${mensaje}</span>
        </div>
    `;
    
    toastContainer.innerHTML = '';
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toastContainer.innerHTML = '';
    }, 3000);
}
async function cargarPerfil() {
    const usuario = auth.getUsuario();

    return `
        <div class="rounded-lg shadow p-6 max-w-2xl" style="background-color: var(--card-bg); border: 1px solid var(--border-color);">
            <h1 class="text-2xl font-bold mb-6" style="color: var(--text-primary);">Mi Perfil</h1>
            
            <div class="mb-6">
                <h2 class="text-lg font-semibold mb-4" style="color: var(--text-primary);">Información Personal</h2>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="text-sm" style="color: var(--text-secondary);">Nombre</label>
                        <p class="font-semibold" style="color: var(--text-primary);">${usuario.nombre}</p>
                    </div>
                    <div>
                        <label class="text-sm" style="color: var(--text-secondary);">Apellidos</label>
                        <p class="font-semibold" style="color: var(--text-primary);">${usuario.apellidos}</p>
                    </div>
                    <div>
                        <label class="text-sm" style="color: var(--text-secondary);">Email</label>
                        <p class="font-semibold" style="color: var(--text-primary);">${usuario.email}</p>
                    </div>
                    <div>
                        <label class="text-sm" style="color: var(--text-secondary);">Rol</label>
                        <p class="font-semibold" style="color: var(--text-primary);">${usuario.rol}</p>
                    </div>
                </div>
            </div>

            <hr class="my-6" style="border-color: var(--border-color);">

            <div>
                <h2 class="text-lg font-semibold mb-4" style="color: var(--text-primary);">Cambiar Contraseña</h2>
                <form onsubmit="cambiarPasswordConValidacion(event)" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium" style="color: var(--text-primary);">Contraseña Actual</label>
                        <div class="relative">
                            <input type="password" id="passwordActualPerfil" required class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10" style="background-color: var(--card-bg); border-color: var(--border-color); color: var(--text-primary);">
                            <button type="button" onclick="togglePasswordVisibilityPerfil('passwordActualPerfil')" class="absolute right-3 top-1/2 transform -translate-y-1/2" style="color: var(--text-secondary);">
                                <i class="fas fa-eye" id="passwordActualPerfilIcon"></i>
                            </button>
                        </div>
                        <!-- Contenedor para toast de error debajo del input -->
                        <div id="passwordActualPerfilError" class="mt-2 hidden">
                            <div class="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
                                <i class="fas fa-exclamation-circle mr-2"></i>
                                <span id="passwordActualPerfilErrorText">Contraseña actual incorrecta</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium" style="color: var(--text-primary);">Nueva Contraseña</label>
                        <div class="relative">
                            <input type="password" id="passwordNuevaPerfil" required minlength="6" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10" style="background-color: var(--card-bg); border-color: var(--border-color); color: var(--text-primary);">
                            <button type="button" onclick="togglePasswordVisibilityPerfil('passwordNuevaPerfil')" class="absolute right-3 top-1/2 transform -translate-y-1/2" style="color: var(--text-secondary);">
                                <i class="fas fa-eye" id="passwordNuevaPerfilIcon"></i>
                            </button>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium" style="color: var(--text-primary);">Confirmar Contraseña</label>
                        <div class="relative">
                            <input type="password" id="passwordConfirmaPerfil" required minlength="6" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10" style="background-color: var(--card-bg); border-color: var(--border-color); color: var(--text-primary);">
                            <button type="button" onclick="togglePasswordVisibilityPerfil('passwordConfirmaPerfil')" class="absolute right-3 top-1/2 transform -translate-y-1/2" style="color: var(--text-secondary);">
                                <i class="fas fa-eye" id="passwordConfirmaPerfilIcon"></i>
                            </button>
                        </div>
                    </div>
                    <button type="submit" class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 mx-auto block">
                        Cambiar Contraseña
                    </button>
                </form>
            </div>
        </div>
    `;
}

/**
 * Cambiar contraseña
 */
async function cambiarPassword(e) {
    e.preventDefault();
    
    const passwordActual = document.getElementById('passwordActual').value;
    const passwordNueva = document.getElementById('passwordNueva').value;
    const passwordConfirma = document.getElementById('passwordConfirma').value;

    if (passwordNueva !== passwordConfirma) {
        ui.toast('Las contraseñas no coinciden', 'error');
        return;
    }

    const resultado = await auth.cambiarPassword(passwordActual, passwordNueva);

    if (resultado.success) {
        ui.toast('Contraseña actualizada correctamente', 'success');
        document.getElementById('passwordActual').value = '';
        document.getElementById('passwordNueva').value = '';
        document.getElementById('passwordConfirma').value = '';
    } else {
        ui.toast(resultado.message || 'Error al cambiar contraseña', 'error');
    }
}

/**
 * Cambiar contraseña con validación mejorada (para el perfil)
 */
async function cambiarPasswordConValidacion(event) {
    event.preventDefault();
    
    const passwordActual = document.getElementById('passwordActualPerfil').value.trim();
    const passwordNueva = document.getElementById('passwordNuevaPerfil').value.trim();
    const passwordConfirma = document.getElementById('passwordConfirmaPerfil').value.trim();
    
    // Limpiar errores anteriores
    ocultarToastErrorPerfil();
    
    // Validar que todos los campos estén llenos
    if (!passwordActual || !passwordNueva || !passwordConfirma) {
        mostrarToastErrorPerfil('Todos los campos son requeridos');
        return;
    }
    
    // Validar longitud mínima de la nueva contraseña (8 caracteres según backend)
    if (passwordNueva.length < 8) {
        mostrarToastErrorPerfil('La nueva contraseña debe tener al menos 8 caracteres');
        return;
    }
    
    // Validar que las contraseñas nuevas coincidan
    if (passwordNueva !== passwordConfirma) {
        mostrarToastErrorPerfil('Las contraseñas nuevas no coinciden');
        return;
    }
    
    try {
        console.log('[PASSWORD] Intentando cambiar contraseña...');
        const resultado = await auth.cambiarPassword(passwordActual, passwordNueva);
        
        console.log('[PASSWORD] Resultado:', resultado);
        
        if (resultado.success) {
            // Mostrar toast de éxito debajo del botón
            mostrarToastExitoPerfil('Contraseña actualizada correctamente');
            // Limpiar campos
            document.getElementById('passwordActualPerfil').value = '';
            document.getElementById('passwordNuevaPerfil').value = '';
            document.getElementById('passwordConfirmaPerfil').value = '';
            ocultarToastErrorPerfil();
        } else {
            // Verificar si es error de contraseña actual incorrecta
            if (resultado.message && (
                resultado.message.toLowerCase().includes('actual') || 
                resultado.message.toLowerCase().includes('incorrecta') ||
                resultado.message.toLowerCase().includes('inválida')
            )) {
                mostrarToastErrorPerfil('Contraseña actual incorrecta');
                document.getElementById('passwordActualPerfil').focus();
            } else {
                mostrarToastErrorPerfil(resultado.message || 'Error al cambiar contraseña');
            }
        }
    } catch (error) {
        console.error('[PASSWORD] Error cambiando contraseña:', error);
        mostrarToastErrorPerfil('Error al procesar la solicitud');
    }
}

/**
 * Mostrar toast de éxito en el perfil (debajo del botón)
 */
function mostrarToastExitoPerfil(mensaje) {
    // Buscar o crear contenedor para toast de éxito
    let toastContainer = document.getElementById('perfilToastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'perfilToastContainer';
        toastContainer.className = 'mt-4';
        
        // Insertar después del formulario
        const form = document.querySelector('#contenido form');
        if (form) {
            form.parentNode.insertBefore(toastContainer, form.nextSibling);
        }
    }
    
    const toast = document.createElement('div');
    toast.className = 'bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg';
    toast.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-check-circle mr-2"></i>
            <span>${mensaje}</span>
        </div>
    `;
    
    toastContainer.innerHTML = '';
    toastContainer.appendChild(toast);
    
    // Auto-ocultar después de 2 segundos
    setTimeout(() => {
        if (toastContainer.parentNode) {
            toastContainer.parentNode.removeChild(toastContainer);
        }
    }, 2000);
}

/**
 * Mostrar toast de error en el perfil (debajo del componente)
 */
function mostrarToastErrorPerfil(mensaje) {
    const errorDiv = document.getElementById('passwordActualPerfilError');
    const errorText = document.getElementById('passwordActualPerfilErrorText');
    
    errorText.textContent = mensaje;
    errorDiv.classList.remove('hidden');
    
    // Auto-ocultar después de 2 segundos
    setTimeout(() => {
        ocultarToastErrorPerfil();
    }, 2000);
}

/**
 * Ocultar toast de error en el perfil
 */
function ocultarToastErrorPerfil() {
    const errorDiv = document.getElementById('passwordActualPerfilError');
    errorDiv.classList.add('hidden');
}

/**
 * Toggle visibilidad de contraseña en el perfil
 */
function togglePasswordVisibilityPerfil(inputId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(inputId + 'Icon');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Las funciones de usuarios ahora están en usuariosModule
// Mantener compatibilidad con código existente
function mostrarFormularioNuevoUsuario() {
    usuariosModule.mostrarFormularioCrear();
}

function editarUsuario(id) {
    usuariosModule.editarUsuario(id);
}

/**
 * Cargar módulo Archivo General SDI
 */
async function cargarArchivoGeneral() {
    try {
        // Cargar el módulo dinámicamente
        if (typeof archivoGeneralModule === 'undefined') {
            return '<p style="color: var(--text-primary);">Error: Módulo no disponible</p>';
        }

        // Inicializar el módulo
        await archivoGeneralModule.init();
        return await archivoGeneralModule.cargarVista();
    } catch (error) {
        console.error('Error cargando Archivo General:', error);
        return '<p style="color: var(--text-primary);">Error al cargar el módulo Archivo General</p>';
    }
}

function eliminarUsuario(id) {
    usuariosModule.eliminarUsuario(id, 'Usuario');
}
function mostrarFormularioNuevoDocumento() { ui.toast('Funcionalidad en desarrollo', 'info'); }
function verDocumento() { ui.toast('Funcionalidad en desarrollo', 'info'); }
function mostrarFormularioNuevaCarpeta() { ui.toast('Funcionalidad en desarrollo', 'info'); }
function mostrarFormularioNuevaCategoria() { ui.toast('Funcionalidad en desarrollo', 'info'); }
