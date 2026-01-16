/**
 * Módulo de Autenticación - SDI Gestión Documental
 */

const auth = {
    usuario: null,

    /**
     * Logging de errores de autenticación
     */
    _logError(context, error) {
        console.error(`[AUTH] Error en ${context}:`, {
            message: error?.message || String(error),
            status: error?.status,
            data: error?.data,
            stack: error?.stack
        });
    },

    async verificar() {
        try {
            console.log('[AUTH] Verificando autenticación...');
            const resultado = await api.get('/auth/verificar');
            
            console.log('[AUTH] Resultado de verificación:', resultado);
            
            if (resultado && resultado.success) {
                this.usuario = resultado.data;
                console.log('[AUTH] Usuario autenticado:', this.usuario);
                return true;
            }
            
            console.log('[AUTH] Usuario no autenticado');
            return false;
            
        } catch (error) {
            this._logError('verificar', error);
            
            // Si es un 401, simplemente no está autenticado (no es un error)
            if (error?.status === 401) {
                console.log('[AUTH] Usuario no autenticado (401)');
                return false;
            }
            
            // Otros errores son problemas reales
            console.error('[AUTH] Error al verificar autenticación:', error);
            return false;
        }
    },

    async login(email, password) {
        try {
            console.log('[AUTH] Iniciando login para:', email);
            
            const resultado = await api.post('/auth/login', {
                email: email.trim().toLowerCase(),
                password
            });
            
            console.log('[AUTH] Resultado de login:', resultado);
            
            if (resultado && resultado.success) {
                console.log('[AUTH] Login exitoso');
                this.usuario = resultado.data;
            }
            
            return resultado;
            
        } catch (error) {
            this._logError('login', error);
            
            // Si el error tiene información del servidor, retornarla
            if (error?.data) {
                return error.data;
            }
            
            // Si no, crear una respuesta de error estándar
            return {
                success: false,
                message: error?.message || 'Error al iniciar sesión',
                data: null,
                status: error?.status || 500
            };
        }
    },

    async logout() {
        try {
            console.log('[AUTH] Cerrando sesión...');
            
            // Mostrar toast de cierre de sesión
            this.mostrarToastCierreSesion('Cerrando sesión...');
            
            const resultado = await api.get('/auth/logout');
            this.usuario = null;
            console.log('[AUTH] Sesión cerrada');
            
            // Redirigir después de un momento
            setTimeout(() => {
                window.location.href = '/Programa-Gestion-SDI/login.html';
            }, 1500);
            
            return resultado;
        } catch (error) {
            this._logError('logout', error);
            // Aún así, limpiar el usuario local
            this.usuario = null;
            // Redirigir de todas formas
            setTimeout(() => {
                window.location.href = '/Programa-Gestion-SDI/login.html';
            }, 1500);
            return {
                success: false,
                message: error?.message || 'Error al cerrar sesión',
                data: null
            };
        }
    },

    /**
     * Mostrar toast centrado para cierre de sesión
     */
    mostrarToastCierreSesion(mensaje) {
        // Crear overlay para toast centrado
        const toastOverlay = document.createElement('div');
        toastOverlay.className = 'fixed inset-0 flex items-center justify-center z-50';
        toastOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        
        // Crear contenedor del toast
        const toast = document.createElement('div');
        toast.className = 'bg-white rounded-lg shadow-2xl p-6 max-w-sm w-full mx-4 transform transition-all duration-300 scale-100';
        toast.innerHTML = `
            <div class="text-center">
                <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                    <i class="fas fa-sign-out-alt text-blue-600 text-xl animate-pulse"></i>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">Cerrando Sesión</h3>
                <p class="text-sm text-gray-600">${mensaje}</p>
                <div class="mt-4">
                    <div class="inline-flex items-center px-4 py-2 bg-blue-50 rounded-lg">
                        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        <span class="text-sm text-blue-700">Procesando...</span>
                    </div>
                </div>
            </div>
        `;
        
        toastOverlay.appendChild(toast);
        document.body.appendChild(toastOverlay);
        
        // Auto-eliminar después de 3 segundos
        setTimeout(() => {
            if (document.body.contains(toastOverlay)) {
                document.body.removeChild(toastOverlay);
            }
        }, 3000);
    },

    async cambiarPassword(passwordActual, passwordNueva) {
        try {
            console.log('[AUTH] Cambiando contraseña...');
            return await api.post('/auth/cambiarPassword', {
                password_actual: passwordActual,
                password_nueva: passwordNueva
            });
        } catch (error) {
            this._logError('cambiarPassword', error);
            
            if (error?.data) {
                return error.data;
            }
            
            return {
                success: false,
                message: error?.message || 'Error al cambiar contraseña',
                data: null
            };
        }
    },

    getUsuario() { return this.usuario; },
    getRol() { return this.usuario?.rol; },
    tieneRol(rol) { return this.usuario?.rol === rol; },
    esAdmin() { return this.tieneRol('Administrador'); },
    esAdministrativo() { return this.tieneRol('Personal Administrativo'); },
    esEstudiante() { return this.tieneRol('Estudiante SS'); }
};
