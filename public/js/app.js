/**
 * Aplicación Principal - SDI Gestión Documental
 * 
 * Gestiona la navegación, autenticación y carga de módulos.
 * 
 * @author SDI Development Team
 * @version 2.0
 */

let moduloActual = 'dashboard';

/**
 * Inicializar aplicación
 */
async function initApp() {
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
    const opciones = [
        {
            titulo: 'Dashboard',
            icono: 'fa-chart-line',
            descripcion: 'Panel de control principal',
            modulo: 'dashboard',
            visible: true
        },
        {
            titulo: 'Usuarios',
            icono: 'fa-users',
            descripcion: 'Gestionar usuarios del sistema',
            modulo: 'usuarios',
            visible: auth.esAdmin()
        },
        {
            titulo: 'Archivo General SDI',
            icono: 'fa-archive',
            descripcion: 'Categoría archivo general SDI',
            modulo: 'archivo-general',
            visible: true
        },
        {
            titulo: 'Categorías',
            icono: 'fa-tags',
            descripcion: 'Gestionar categorías',
            modulo: 'categorias',
            visible: auth.esAdmin() || auth.esAdministrativo()
        }
    ];

    return opciones.filter(op => op.visible);
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
        <!-- Tarjetas de estadísticas -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" style="color: var(--text-primary);">
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

        <!-- Mensaje de bienvenida -->
        <div class="rounded-xl shadow-lg p-8 text-center mb-12" style="background: linear-gradient(to right, var(--bg-tertiary), var(--card-bg)); color: var(--text-primary); border: 1px solid var(--border-color);">
            <h2 class="text-4xl font-bold mb-2" style="color: var(--text-primary);">Bienvenido, ${auth.usuario?.nombre || 'Usuario'}</h2>
            <p class="text-lg" style="color: var(--text-secondary);">Panel de control - ${auth.usuario?.rol || ''}</p>
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
 * Cargar perfil de usuario
 */
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
                <form onsubmit="cambiarPassword(event)" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium" style="color: var(--text-primary);">Contraseña Actual</label>
                        <input type="password" id="passwordActual" required class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" style="background-color: var(--card-bg); border-color: var(--border-color); color: var(--text-primary);">
                    </div>
                    <div>
                        <label class="block text-sm font-medium" style="color: var(--text-primary);">Nueva Contraseña</label>
                        <input type="password" id="passwordNueva" required class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" style="background-color: var(--card-bg); border-color: var(--border-color); color: var(--text-primary);">
                    </div>
                    <div>
                        <label class="block text-sm font-medium" style="color: var(--text-primary);">Confirmar Contraseña</label>
                        <input type="password" id="passwordConfirma" required class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" style="background-color: var(--card-bg); border-color: var(--border-color); color: var(--text-primary);">
                    </div>
                    <button type="submit" class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
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
