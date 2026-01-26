/**
 * Módulo de Gestión de Usuarios - SDI Gestión Documental
 * 
 * Gestiona todas las operaciones relacionadas con usuarios:
 * - Listar usuarios
 * - Crear nuevo usuario
 * - Editar usuario
 * - Eliminar usuario
 * - Cambiar estado de usuario
 * 
 * @author SDI Development Team
 * @version 2.0
 */

const usuariosModule = {
    usuarios: [],
    roles: [],
    paginaActual: 1,
    limite: 20,
    modalAbierto: null,
    busquedaActual: '',
    campoActual: 'nombre',

    /**
     * Inicializar módulo de usuarios
     */
    async init() {
        await this.cargarRoles();
        await this.cargarUsuarios();
    },

    /**
     * Cargar roles disponibles
     */
    async cargarRoles() {
        try {
            const resultado = await api.get('/usuarios/roles');
            if (resultado.success) {
                this.roles = resultado.data || [];
            }
        } catch (error) {
            console.error('[USUARIOS] Error cargando roles:', error);
            ui.toast('Error al cargar roles. Por favor, inténtelo de nuevo.', 'error');
        }
    },

    /**
     * Cargar lista de usuarios
     */
    async cargarUsuarios(busqueda = null, campo = null) {
        try {
            // Asegurar que los roles estén cargados
            if (this.roles.length === 0) {
                await this.cargarRoles();
            }

            const params = {
                page: this.paginaActual,
                limit: this.limite
            };
            
            // Agregar parámetros de búsqueda si existen
            if (busqueda) {
                params.busqueda = busqueda;
                params.campo = campo;
            }

            const resultado = await api.get('/usuarios', params);

            if (resultado.success) {
                this.usuarios = resultado.data.usuarios || [];
                
                // Verificar si hay resultados en búsquedas
                if (busqueda && this.usuarios.length === 0) {
                    this.mostrarToastSinResultados(campo, busqueda);
                } else if (busqueda && this.usuarios.length > 0) {
                    this.mostrarToastConResultados(campo, busqueda, this.usuarios.length);
                }
                
                return this.renderizarLista();
            } else {
                ui.toast('Error al cargar usuarios. Por favor, inténtelo de nuevo.', 'error');
                return '<p style="color: var(--text-primary);">Error cargando usuarios</p>';
            }
        } catch (error) {
            console.error('[USUARIOS] Error cargando usuarios:', error);
            ui.toast('Error al cargar usuarios. Por favor, inténtelo de nuevo.', 'error');
            return '<p style="color: var(--text-primary);">Error cargando usuarios</p>';
        }
    },

    /**
     * Renderizar lista de usuarios
     */
    renderizarLista() {
        if (this.usuarios.length === 0) {
            return `
                <div class="w-full flex flex-col items-center" style="min-height: 100vh; padding: 20px;">
                    <div class="w-full max-w-6xl rounded-lg shadow p-6 md:p-8" style="background-color: var(--card-bg); border: 1px solid var(--border-color);">
                        <!-- Encabezado centrado -->
                        <div class="text-center mb-8">
                            <h1 class="text-3xl md:text-4xl font-bold mb-2" style="color: var(--text-primary);">
                                <i class="fas fa-users mr-3" style="color: #3b82f6;"></i>Gestión de Usuarios
                            </h1>
                            <p class="text-base md:text-lg" style="color: var(--text-secondary);">Administra los usuarios del sistema</p>
                        </div>

                        <!-- Sección de Búsqueda y Filtros -->
                        <div class="mb-8 flex justify-center">
                            <div class="w-full max-w-4xl bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%);">
                                <div class="flex items-center justify-center mb-4">
                                    <i class="fas fa-search text-2xl mr-3" style="color: #3b82f6;"></i>
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
                                            onchange="usuariosModule.cambiarTipoFiltro()"
                                        >
                                            <option value="nombre">Nombre</option>
                                            <option value="email">Email</option>
                                            <option value="rol">Rol</option>
                                        </select>
                                    </div>
                                    
                                    <!-- Contenedor para valor de búsqueda (dinámico) -->
                                    <div class="md:col-span-5" id="contenedorValor"></div>
                                    
                                    <!-- Botones -->
                                    <div class="md:col-span-3 flex gap-2">
                                        <button 
                                            onclick="usuariosModule.buscarUsuarios()" 
                                            class="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition font-medium shadow-md hover:shadow-lg"
                                        >
                                            <i class="fas fa-search mr-2"></i>Buscar
                                        </button>
                                        <button 
                                            onclick="usuariosModule.limpiarFiltro()" 
                                            class="flex-1 px-4 py-2 border-2 rounded-lg transition font-medium"
                                            style="color: var(--text-primary); border-color: var(--border-color); background-color: var(--bg-secondary);"
                                        >
                                            <i class="fas fa-times mr-2"></i>Limpiar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Contenedor para toast de búsqueda -->
                        <div id="toastBusquedaContainer" style="min-height: 20px; display: flex; justify-content: center; align-items: center; margin: 10px 0;"></div>

                        <!-- Mensaje de no usuarios -->
                        <div class="rounded-lg shadow p-8 text-center" style="background-color: var(--card-bg); border: 1px solid var(--border-color);">
                            <i class="fas fa-users text-6xl mb-4" style="color: var(--text-tertiary);"></i>
                            <h2 class="text-xl font-bold mb-2" style="color: var(--text-primary);">No hay usuarios registrados</h2>
                            <p class="mb-6" style="color: var(--text-secondary);">Comienza agregando un nuevo usuario</p>
                            <button onclick="usuariosModule.mostrarFormularioCrear()" 
                                    class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                                <i class="fas fa-plus mr-2"></i>Agregar Primer Usuario
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        let html = `
            <div class="w-full flex flex-col items-center" style="min-height: 100vh; padding: 20px;">
                <div class="w-full max-w-6xl rounded-lg shadow p-6 md:p-8" style="background-color: var(--card-bg); border: 1px solid var(--border-color);">
                    <!-- Encabezado centrado -->
                    <div class="text-center mb-8">
                        <h1 class="text-3xl md:text-4xl font-bold mb-2" style="color: var(--text-primary);">
                            <i class="fas fa-users mr-3" style="color: #3b82f6;"></i>Gestión de Usuarios
                        </h1>
                        <p class="text-base md:text-lg" style="color: var(--text-secondary);">Administra los usuarios del sistema</p>
                    </div>

                    <!-- Sección de Búsqueda y Filtros -->
                    <div class="mb-8 flex justify-center">
                        <div class="w-full max-w-4xl bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%);">
                            <div class="flex items-center justify-center mb-4">
                                <i class="fas fa-search text-2xl mr-3" style="color: #3b82f6;"></i>
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
                                        onchange="usuariosModule.cambiarTipoFiltro()"
                                    >
                                        <option value="nombre">Nombre</option>
                                        <option value="email">Email</option>
                                        <option value="rol">Rol</option>
                                    </select>
                                </div>
                                
                                <!-- Contenedor para valor de búsqueda (dinámico) -->
                                <div class="md:col-span-5" id="contenedorValor"></div>
                                
                                <!-- Botones -->
                                <div class="md:col-span-3 flex gap-2">
                                    <button 
                                        onclick="usuariosModule.buscarUsuarios()" 
                                        class="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition font-medium shadow-md hover:shadow-lg"
                                    >
                                        <i class="fas fa-search mr-2"></i>Buscar
                                    </button>
                                    <button 
                                        onclick="usuariosModule.limpiarFiltro()" 
                                        class="flex-1 px-4 py-2 border-2 rounded-lg transition font-medium"
                                        style="color: var(--text-primary); border-color: var(--border-color); background-color: var(--bg-secondary);"
                                    >
                                        <i class="fas fa-times mr-2"></i>Limpiar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Contenedor para toast de búsqueda -->
                    <div id="toastBusquedaContainer" style="min-height: 20px; display: flex; justify-content: center; align-items: center; margin: 10px 0;"></div>

                    <!-- Botón de agregar usuario -->
                    <div class="flex justify-center mb-6">
                        <button onclick="usuariosModule.mostrarFormularioCrear()" 
                                class="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition font-semibold shadow-lg hover:shadow-xl transform hover:scale-105">
                            <i class="fas fa-plus mr-2"></i>Nuevo Usuario
                        </button>
                    </div>

                    <!-- Tabla de usuarios -->
                    <div class="overflow-x-auto rounded-lg border shadow-md" style="border-color: var(--border-color);">
                        ${this.renderizarTablaUsuarios()}
                    </div>
                </div>
            </div>
        `;

        // Inicializar el filtro después de renderizar
        setTimeout(() => {
            this.cambiarTipoFiltro();
        }, 100);

        return html;
    },

    /**
     * Renderizar tabla de usuarios
     */
    renderizarTablaUsuarios() {
        let html = `
            <table class="w-full">
                <thead style="background-color: var(--bg-tertiary); border-bottom: 1px solid var(--border-color);">
                    <tr>
                        <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style="color: var(--text-primary);">Nombre Completo</th>
                        <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style="color: var(--text-primary);">Email</th>
                        <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style="color: var(--text-primary);">Rol</th>
                        <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style="color: var(--text-primary);">Estado</th>
                        <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style="color: var(--text-primary);">Acciones</th>
                    </tr>
                </thead>
                <tbody style="background-color: var(--card-bg);" class="divide-y">
        `;

        this.usuarios.forEach(usuario => {
            const nombreCompleto = `${usuario.nombre || ''} ${usuario.apellido_paterno || ''} ${usuario.apellido_materno || ''}`.trim();
            const estadoClass = usuario.estado === 'activo' 
                ? 'bg-green-100 text-green-800' 
                : usuario.estado === 'suspendido'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800';
            
            html += `
                <tr class="transition" style="border-color: var(--border-color);" onmouseover="this.style.backgroundColor='var(--bg-tertiary)'" onmouseout="this.style.backgroundColor='var(--card-bg)'">
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium" style="color: var(--text-primary);">${nombreCompleto || 'Sin nombre'}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm" style="color: var(--text-secondary);">${usuario.email || ''}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm" style="color: var(--text-secondary);">${usuario.nombre_rol || ''}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${estadoClass}">
                            ${usuario.estado || 'desconocido'}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button onclick="usuariosModule.editarUsuario(${usuario.id_usuario})" 
                                class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-4" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="usuariosModule.eliminarUsuario(${usuario.id_usuario}, '${nombreCompleto}')" 
                                class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;

        return html;
    },

    /**
     * Mostrar formulario para crear nuevo usuario
     */
    mostrarFormularioCrear() {
        const rolesOptions = this.roles.map(rol => 
            `<option value="${rol.id_rol}">${rol.nombre_rol}</option>`
        ).join('');

        const html = `
            <form id="formNuevoUsuario" onsubmit="usuariosModule.crearUsuario(event)" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Nombre -->
                    <div>
                        <label class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                            <i class="fas fa-user mr-2 text-blue-500"></i>Nombre <span class="text-red-500">*</span>
                        </label>
                        <input type="text" 
                               id="nombre" 
                               name="nombre" 
                               required 
                               class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                               style="background-color: var(--card-bg); border-color: var(--border-color); color: var(--text-primary);"
                               placeholder="Ej: Juan">
                    </div>

                    <!-- Apellido Paterno -->
                    <div>
                        <label class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                            <i class="fas fa-user mr-2 text-blue-500"></i>Apellido Paterno <span class="text-red-500">*</span>
                        </label>
                        <input type="text" 
                               id="apellido_paterno" 
                               name="apellido_paterno" 
                               required 
                               class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                               style="background-color: var(--card-bg); border-color: var(--border-color); color: var(--text-primary);"
                               placeholder="Ej: Pérez">
                    </div>

                    <!-- Apellido Materno -->
                    <div>
                        <label class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                            <i class="fas fa-user mr-2 text-blue-500"></i>Apellido Materno
                        </label>
                        <input type="text" 
                               id="apellido_materno" 
                               name="apellido_materno" 
                               class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                               style="background-color: var(--card-bg); border-color: var(--border-color); color: var(--text-primary);"
                               placeholder="Ej: López">
                    </div>

                    <!-- Email -->
                    <div>
                        <label class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                            <i class="fas fa-envelope mr-2 text-blue-500"></i>Correo Electrónico <span class="text-red-500">*</span>
                        </label>
                        <input type="email" 
                               id="email" 
                               name="email" 
                               required 
                               class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                               style="background-color: var(--card-bg); border-color: var(--border-color); color: var(--text-primary);"
                               placeholder="usuario@ejemplo.com">
                    </div>

                    <!-- Contraseña -->
                    <div>
                        <label class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                            <i class="fas fa-lock mr-2 text-blue-500"></i>Contraseña <span class="text-red-500">*</span>
                        </label>
                        <input type="password" 
                               id="password" 
                               name="password" 
                               required 
                               minlength="8"
                               class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                               style="background-color: var(--card-bg); border-color: var(--border-color); color: var(--text-primary);"
                               placeholder="Mínimo 8 caracteres">
                        <p class="text-xs mt-1" style="color: var(--text-secondary);">Mínimo 8 caracteres</p>
                    </div>

                    <!-- Rol -->
                    <div>
                        <label class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                            <i class="fas fa-user-tag mr-2 text-blue-500"></i>Rol <span class="text-red-500">*</span>
                        </label>
                        <select id="id_rol" 
                                name="id_rol" 
                                required 
                                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                               style="background-color: var(--card-bg); border-color: var(--border-color); color: var(--text-primary);">
                            <option value="">Seleccione un rol</option>
                            ${rolesOptions}
                        </select>
                    </div>
                </div>

                <div class="flex gap-3 justify-end pt-4 border-t border-gray-200">
                    <button type="button" 
                            onclick="usuariosModule.cerrarModal()" 
                            class="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition">
                        Cancelar
                    </button>
                    <button type="submit" 
                            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold">
                        <i class="fas fa-save mr-2"></i>Crear Usuario
                    </button>
                </div>
            </form>
        `;

        this.abrirModal('Nuevo Usuario', html);
    },

    /**
     * Crear nuevo usuario
     */
    async crearUsuario(event) {
        event.preventDefault();

        const form = event.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        // Deshabilitar botón y mostrar carga
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creando...';

        try {
            const data = {
                nombre: document.getElementById('nombre').value.trim(),
                apellido_paterno: document.getElementById('apellido_paterno').value.trim(),
                apellido_materno: document.getElementById('apellido_materno').value.trim() || '',
                email: document.getElementById('email').value.trim().toLowerCase(),
                password: document.getElementById('password').value,
                id_rol: parseInt(document.getElementById('id_rol').value)
            };

            console.log('[USUARIOS] Creando usuario:', data);

            const resultado = await api.post('/usuarios', data);

            if (resultado.success) {
                // Mostrar alerta de éxito
                ui.toast('✓ Usuario registrado correctamente', 'success', 3000);
                
                // Limpiar formulario
                form.reset();
                
                // Cerrar modal después de un breve delay
                setTimeout(async () => {
                    this.cerrarModal();
                    // Recargar lista de usuarios
                    const html = await this.cargarUsuarios();
                    const contenidoWrapper = document.querySelector('#contenido');
                    if (contenidoWrapper) {
                        contenidoWrapper.innerHTML = html;
                    }
                    // Scroll al inicio
                    const contenidoSection = document.querySelector('section.flex-1');
                    if (contenidoSection) {
                        contenidoSection.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                }, 500);
            } else {
                ui.toast(resultado.message || 'Error al crear usuario', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        } catch (error) {
            console.error('[USUARIOS] Error creando usuario:', error);
            ui.toast(error.message || 'Error al crear usuario', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    },

    /**
     * Editar usuario
     */
    async editarUsuario(id) {
        try {
            const resultado = await api.get(`/usuarios/${id}`);
            if (resultado.success) {
                const usuario = resultado.data;
                this.mostrarFormularioEditar(usuario);
            } else {
                ui.toast('Error al cargar datos del usuario', 'error');
            }
        } catch (error) {
            console.error('[USUARIOS] Error obteniendo usuario:', error);
            ui.toast('Error al cargar datos del usuario', 'error');
        }
    },

    /**
     * Mostrar formulario para editar usuario
     */
    mostrarFormularioEditar(usuario) {
        const rolesOptions = this.roles.map(rol => 
            `<option value="${rol.id_rol}" ${rol.id_rol == usuario.id_rol ? 'selected' : ''}>${rol.nombre_rol}</option>`
        ).join('');

        const estadosOptions = [
            { valor: 'activo', texto: 'Activo' },
            { valor: 'inactivo', texto: 'Inactivo' },
            { valor: 'suspendido', texto: 'Suspendido' }
        ].map(estado => 
            `<option value="${estado.valor}" ${usuario.estado === estado.valor ? 'selected' : ''}>${estado.texto}</option>`
        ).join('');

        const html = `
            <form id="formEditarUsuario" onsubmit="usuariosModule.actualizarUsuario(event, ${usuario.id_usuario})" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Nombre -->
                    <div>
                        <label class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                            <i class="fas fa-user mr-2 text-blue-500"></i>Nombre <span class="text-red-500">*</span>
                        </label>
                        <input type="text" 
                               id="edit_nombre" 
                               name="nombre" 
                               required 
                               value="${usuario.nombre || ''}"
                               class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                               style="background-color: var(--card-bg); border-color: var(--border-color); color: var(--text-primary);"
                               placeholder="Ej: Juan">
                    </div>

                    <!-- Apellido Paterno -->
                    <div>
                        <label class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                            <i class="fas fa-user mr-2 text-blue-500"></i>Apellido Paterno <span class="text-red-500">*</span>
                        </label>
                        <input type="text" 
                               id="edit_apellido_paterno" 
                               name="apellido_paterno" 
                               required 
                               value="${usuario.apellido_paterno || ''}"
                               class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                               style="background-color: var(--card-bg); border-color: var(--border-color); color: var(--text-primary);"
                               placeholder="Ej: Pérez">
                    </div>

                    <!-- Apellido Materno -->
                    <div>
                        <label class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                            <i class="fas fa-user mr-2 text-blue-500"></i>Apellido Materno
                        </label>
                        <input type="text" 
                               id="edit_apellido_materno" 
                               name="apellido_materno" 
                               value="${usuario.apellido_materno || ''}"
                               class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                               style="background-color: var(--card-bg); border-color: var(--border-color); color: var(--text-primary);"
                               placeholder="Ej: López">
                    </div>

                    <!-- Email -->
                    <div>
                        <label class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                            <i class="fas fa-envelope mr-2 text-blue-500"></i>Correo Electrónico <span class="text-red-500">*</span>
                        </label>
                        <input type="email" 
                               id="edit_email" 
                               name="email" 
                               required 
                               value="${usuario.email || ''}"
                               class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                               style="background-color: var(--card-bg); border-color: var(--border-color); color: var(--text-primary);"
                               placeholder="usuario@ejemplo.com">
                    </div>

                    <!-- Rol -->
                    <div>
                        <label class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                            <i class="fas fa-user-tag mr-2 text-blue-500"></i>Rol <span class="text-red-500">*</span>
                        </label>
                        <select id="edit_id_rol" 
                                name="id_rol" 
                                required 
                                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                               style="background-color: var(--card-bg); border-color: var(--border-color); color: var(--text-primary);">
                            <option value="">Seleccione un rol</option>
                            ${rolesOptions}
                        </select>
                    </div>

                    <!-- Estado -->
                    <div>
                        <label class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                            <i class="fas fa-toggle-on mr-2 text-blue-500"></i>Estado <span class="text-red-500">*</span>
                        </label>
                        <select id="edit_estado" 
                                name="estado" 
                                required 
                                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                               style="background-color: var(--card-bg); border-color: var(--border-color); color: var(--text-primary);">
                            ${estadosOptions}
                        </select>
                    </div>
                </div>

                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                    <p class="text-sm text-yellow-800">
                        <i class="fas fa-info-circle mr-2"></i>
                        <strong>Nota:</strong> Para cambiar la contraseña del usuario, use la opción de cambio de contraseña desde el perfil del usuario.
                    </p>
                </div>

                <div class="flex gap-3 justify-end pt-4 border-t border-gray-200">
                    <button type="button" 
                            onclick="usuariosModule.cerrarModal()" 
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

        this.abrirModal('Editar Usuario', html);
    },

    /**
     * Actualizar usuario
     */
    async actualizarUsuario(event, id) {
        event.preventDefault();

        const form = event.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        // Deshabilitar botón y mostrar carga
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Guardando...';

        try {
            const data = {
                nombre: document.getElementById('edit_nombre').value.trim(),
                apellido_paterno: document.getElementById('edit_apellido_paterno').value.trim(),
                apellido_materno: document.getElementById('edit_apellido_materno').value.trim() || '',
                email: document.getElementById('edit_email').value.trim().toLowerCase(),
                id_rol: parseInt(document.getElementById('edit_id_rol').value),
                estado: document.getElementById('edit_estado').value
            };

            console.log('[USUARIOS] Actualizando usuario:', id, data);

            const resultado = await api.put(`/usuarios/${id}`, data);

            if (resultado.success) {
                // Mostrar alerta de éxito
                ui.toast('✓ Usuario actualizado correctamente', 'success', 3000);
                
                // Cerrar modal después de un breve delay
                setTimeout(async () => {
                    this.cerrarModal();
                    // Recargar lista de usuarios
                    const html = await this.cargarUsuarios();
                    const contenidoWrapper = document.querySelector('#contenido');
                    if (contenidoWrapper) {
                        contenidoWrapper.innerHTML = html;
                    }
                    // Scroll al inicio
                    const contenidoSection = document.querySelector('section.flex-1');
                    if (contenidoSection) {
                        contenidoSection.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                }, 500);
            } else {
                ui.toast(resultado.message || 'Error al actualizar usuario', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        } catch (error) {
            console.error('[USUARIOS] Error actualizando usuario:', error);
            ui.toast(error.message || 'Error al actualizar usuario', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    },

    /**
     * Eliminar usuario
     */
    async eliminarUsuario(id, nombre) {
        if (!confirm(`¿Está seguro de eliminar al usuario "${nombre}"?\n\nEsta acción marcará al usuario como inactivo.`)) {
            return;
        }

        try {
            const resultado = await api.delete(`/usuarios/${id}`);
            if (resultado.success) {
                ui.toast('Usuario eliminado correctamente', 'success');
                const html = await this.cargarUsuarios();
                const contenidoWrapper = document.querySelector('#contenido');
                if (contenidoWrapper) {
                    contenidoWrapper.innerHTML = html;
                }
                // Scroll al inicio
                const contenidoSection = document.querySelector('section.flex-1');
                if (contenidoSection) {
                    contenidoSection.scrollTo({ top: 0, behavior: 'smooth' });
                }
            } else {
                ui.toast(resultado.message || 'Error al eliminar usuario', 'error');
            }
        } catch (error) {
            console.error('[USUARIOS] Error eliminando usuario:', error);
            ui.toast('Error al eliminar usuario', 'error');
        }
    },

    /**
     * Abrir modal
     */
    abrirModal(titulo, contenido) {
        const modal = document.createElement('div');
        modal.id = 'modalUsuarios';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <h2 class="text-2xl font-bold" style="color: var(--text-primary);">${titulo}</h2>
                    <button onclick="usuariosModule.cerrarModal()" 
                            class="transition"
                            style="color: var(--text-secondary);"
                            onmouseover="this.style.color='var(--text-primary)'"
                            onmouseout="this.style.color='var(--text-secondary)'">
                        <i class="fas fa-times text-xl"></i>
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
    },

    /**
     * Cambiar tipo de filtro
     */
    cambiarTipoFiltro() {
        const campo = document.getElementById('filtroCampo').value;
        const contenedor = document.getElementById('contenedorValor');
        
        if (!contenedor) return;
        
        // Limpiar contenedor
        contenedor.innerHTML = '';
        
        switch(campo) {
            case 'nombre':
                contenedor.innerHTML = `
                    <label for="filtroValor" class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                        <i class="fas fa-user mr-2"></i>Nombre
                    </label>
                    <input 
                        type="text" 
                        id="filtroValor" 
                        class="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        style="background-color: var(--card-bg); color: var(--text-primary); border-color: var(--border-color);"
                        placeholder="Buscar por nombre..."
                        onkeypress="if(event.key === 'Enter') usuariosModule.buscarUsuarios()"
                    >
                `;
                break;
                
            case 'email':
                contenedor.innerHTML = `
                    <label for="filtroValor" class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                        <i class="fas fa-envelope mr-2"></i>Email
                    </label>
                    <input 
                        type="email" 
                        id="filtroValor" 
                        class="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        style="background-color: var(--card-bg); color: var(--text-primary); border-color: var(--border-color);"
                        placeholder="Buscar por email..."
                        onkeypress="if(event.key === 'Enter') usuariosModule.buscarUsuarios()"
                    >
                `;
                break;
                
            case 'rol':
                contenedor.innerHTML = `
                    <label for="filtroValor" class="block text-sm font-medium mb-2" style="color: var(--text-primary);">
                        <i class="fas fa-user-tag mr-2"></i>Rol
                    </label>
                    <select 
                        id="filtroValor" 
                        class="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        style="background-color: var(--card-bg); color: var(--text-primary); border-color: var(--border-color);"
                    >
                        <option value="">Todos los roles</option>
                        ${this.roles.map(rol => `<option value="${rol.nombre_rol}">${rol.nombre_rol}</option>`).join('')}
                    </select>
                `;
                break;
        }
        
        // Enfocar el campo de entrada
        setTimeout(() => {
            const input = document.getElementById('filtroValor');
            if (input && input.tagName === 'INPUT') {
                input.focus();
            }
        }, 100);
    },

    /**
     * Buscar usuarios
     */
    async buscarUsuarios() {
        const campo = document.getElementById('filtroCampo').value;
        const valor = document.getElementById('filtroValor').value.trim();
        
        if (!valor) {
            this.mostrarToastError('Por favor ingrese un valor para buscar');
            return;
        }
        
        this.busquedaActual = valor;
        this.campoActual = campo;
        
        try {
            const html = await this.cargarUsuarios(valor, campo);
            const contenidoWrapper = document.querySelector('#contenido');
            if (contenidoWrapper) {
                contenidoWrapper.innerHTML = html;
            }
        } catch (error) {
            console.error('[USUARIOS] Error en búsqueda:', error);
            this.mostrarToastError('Error al realizar búsqueda. Por favor, inténtelo de nuevo.');
        }
    },

    /**
     * Limpiar filtro
     */
    async limpiarFiltro() {
        this.busquedaActual = '';
        this.campoActual = 'nombre';
        
        try {
            const html = await this.cargarUsuarios();
            const contenidoWrapper = document.querySelector('#contenido');
            if (contenidoWrapper) {
                contenidoWrapper.innerHTML = html;
            }
            
            this.mostrarToastExito('Filtros limpiados correctamente');
        } catch (error) {
            console.error('[USUARIOS] Error limpiando filtros:', error);
            this.mostrarToastError('Error al limpiar filtros. Por favor, inténtelo de nuevo.');
        }
    },

    /**
     * Mostrar toast de éxito centrado debajo de botones de búsqueda
     */
    mostrarToastExito(mensaje) {
        const toastContainer = document.getElementById('toastBusquedaContainer');
        if (toastContainer) {
            toastContainer.innerHTML = `
                <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg text-sm font-medium animate-pulse">
                    <i class="fas fa-check-circle mr-2"></i>${mensaje}
                </div>
            `;
            
            // Auto-ocultar después de 2 segundos
            setTimeout(() => {
                toastContainer.innerHTML = '';
            }, 2000);
        }
    },

    /**
     * Mostrar toast cuando se encuentran resultados
     */
    mostrarToastConResultados(campo, busqueda, cantidad) {
        const toastContainer = document.getElementById('toastBusquedaContainer');
        if (toastContainer) {
            let campoTexto = '';
            switch(campo) {
                case 'nombre': campoTexto = 'nombre'; break;
                case 'email': campoTexto = 'email'; break;
                case 'rol': campoTexto = 'rol'; break;
            }
            
            const mensaje = cantidad === 1 
                ? `Se encontró ${cantidad} usuario con "${busqueda}" en ${campoTexto}`
                : `Se encontraron ${cantidad} usuarios con "${busqueda}" en ${campoTexto}`;
                
            toastContainer.innerHTML = `
                <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg text-sm font-medium animate-pulse">
                    <i class="fas fa-search mr-2"></i>${mensaje}
                </div>
            `;
            
            // Auto-ocultar después de 2 segundos
            setTimeout(() => {
                toastContainer.innerHTML = '';
            }, 2000);
        }
    },

    /**
     * Mostrar toast cuando no se encuentran resultados
     */
    mostrarToastSinResultados(campo, busqueda) {
        const toastContainer = document.getElementById('toastBusquedaContainer');
        if (toastContainer) {
            let campoTexto = '';
            switch(campo) {
                case 'nombre': campoTexto = 'nombre'; break;
                case 'email': campoTexto = 'email'; break;
                case 'rol': campoTexto = 'rol'; break;
            }
            
            toastContainer.innerHTML = `
                <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm font-medium animate-pulse">
                    <i class="fas fa-exclamation-circle mr-2"></i>No se encontraron usuarios con "${busqueda}" en ${campoTexto}
                </div>
            `;
            
            // Auto-ocultar después de 2 segundos
            setTimeout(() => {
                toastContainer.innerHTML = '';
            }, 2000);
        }
    },

    /**
     * Mostrar toast de error centrado debajo de botones de búsqueda
     */
    mostrarToastError(mensaje) {
        const toastContainer = document.getElementById('toastBusquedaContainer');
        if (toastContainer) {
            toastContainer.innerHTML = `
                <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm font-medium animate-pulse">
                    <i class="fas fa-exclamation-triangle mr-2"></i>${mensaje}
                </div>
            `;
            
            // Auto-ocultar después de 2 segundos
            setTimeout(() => {
                toastContainer.innerHTML = '';
            }, 2000);
        }
    }
};

// Hacer funciones disponibles globalmente para onclick
window.usuariosModule = usuariosModule;