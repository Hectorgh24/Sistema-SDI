/**
 * Módulo de UI - Notificaciones y componentes visuales
 */

const ui = {
    /**
     * Mostrar notificación toast
     */
    toast(mensaje, tipo = 'info', duracion = 3000, posicion = null) {
        const toast = document.createElement('div');
        const colores = {
            'success': 'bg-green-500',
            'error': 'bg-red-500',
            'warning': 'bg-yellow-500',
            'info': 'bg-blue-500'
        };

        toast.className = `${colores[tipo]} text-white px-6 py-3 rounded-lg shadow-lg fade-in text-center`;
        toast.textContent = mensaje;
        
        // Estilos adicionales para mejor presentación
        toast.style.maxWidth = '600px';
        toast.style.minWidth = '200px';

        // Si se especifica una posición personalizada, usarla
        if (posicion) {
            // Posicionar debajo del elemento especificado
            posicion.appendChild(toast);
            setTimeout(() => toast.remove(), duracion);
        } else {
            // Usar el contenedor por defecto (esquina superior derecha)
            const container = document.getElementById('toastContainer');
            if (container) {
                container.appendChild(toast);
                setTimeout(() => toast.remove(), duracion);
            }
        }
    },

    /**
     * Mostrar modal
     */
    modal(titulo, contenido, botones = []) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
                <h2 class="text-xl font-bold mb-4">${titulo}</h2>
                <div class="mb-6">${contenido}</div>
                <div class="flex gap-2 justify-end">
                    ${botones.map(b => `<button class="px-4 py-2 ${b.class}" onclick="${b.onclick}">${b.text}</button>`).join('')}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        return modal;
    },

    /**
     * Mostrar confirmación centrada tipo toast
     */
    confirmToast(mensaje, onConfirm, onCancel = null, tipo = 'eliminar') {
        // Crear overlay oscuro
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 fade-in';
        
        // Configuración según tipo
        const configuracion = tipo === 'logout' ? {
            icono: 'fa-sign-out-alt',
            colorIcono: 'text-blue-600',
            colorFondo: 'bg-blue-100',
            titulo: 'Cerrar Sesión',
            textoBoton: 'Cerrar Sesión',
            claseBoton: 'bg-blue-600 hover:bg-blue-700'
        } : {
            icono: 'fa-exclamation-triangle',
            colorIcono: 'text-red-600',
            colorFondo: 'bg-red-100',
            titulo: 'Confirmar Eliminación',
            textoBoton: 'Eliminar',
            claseBoton: 'bg-red-600 hover:bg-red-700'
        };
        
        // Crear contenedor de confirmación
        const confirmContainer = document.createElement('div');
        confirmContainer.className = 'bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 transform transition-all';
        confirmContainer.innerHTML = `
            <div class="text-center">
                <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full ${configuracion.colorFondo} mb-4">
                    <i class="fas ${configuracion.icono} ${configuracion.colorIcono} text-xl"></i>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">${configuracion.titulo}</h3>
                <p class="text-sm text-gray-500 mb-6">${mensaje}</p>
                <div class="flex gap-3 justify-center">
                    <button id="btnConfirmar" class="px-4 py-2 ${configuracion.claseBoton} text-white rounded-lg transition font-medium">
                        <i class="fas ${configuracion.icono} mr-2"></i>${configuracion.textoBoton}
                    </button>
                    <button id="btnCancelar" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium">
                        <i class="fas fa-times mr-2"></i>Cancelar
                    </button>
                </div>
            </div>
        `;
        
        overlay.appendChild(confirmContainer);
        document.body.appendChild(overlay);
        
        // Event listeners
        document.getElementById('btnConfirmar').addEventListener('click', () => {
            document.body.removeChild(overlay);
            if (onConfirm) onConfirm();
        });
        
        document.getElementById('btnCancelar').addEventListener('click', () => {
            document.body.removeChild(overlay);
            if (onCancel) onCancel();
        });
        
        // Cerrar al hacer clic fuera
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
                if (onCancel) onCancel();
            }
        });
        
        return overlay;
    },

    /**
     * Mostrar spinner de carga
     */
    mostrarCarga(mensaje = 'Cargando...') {
        const carga = document.createElement('div');
        carga.className = 'flex items-center justify-center gap-2';
        carga.innerHTML = `<i class="fas fa-spinner fa-spin text-blue-500"></i><span>${mensaje}</span>`;
        return carga;
    }
};
