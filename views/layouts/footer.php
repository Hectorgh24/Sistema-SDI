<?php
/**
 * Footer Reutilizable - SDI Gestión Documental
 * Incluye botón flotante de accesibilidad
 */

// Prevenir acceso directo
if (!defined('APP_ROOT')) {
    require_once __DIR__ . '/../../config/autoload.php';
}
?>
<!-- Botón Flotante de Accesibilidad -->
<button 
    id="accessibilityBtn" 
    class="accessibility-btn"
    aria-label="Opciones de accesibilidad"
    title="Opciones de accesibilidad"
>
    <svg class="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
    </svg>
</button>

<!-- Panel de Accesibilidad -->
<div id="accessibilityPanel" class="accessibility-panel">
    <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        Opciones de Accesibilidad
    </h3>
    <div class="space-y-4">
        <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tamaño de Fuente
            </label>
            <div class="flex space-x-2">
                <button onclick="changeFontSize(-2)" class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">
                    A-
                </button>
                <button onclick="changeFontSize(0)" class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">
                    A
                </button>
                <button onclick="changeFontSize(2)" class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">
                    A+
                </button>
            </div>
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contraste
            </label>
            <button onclick="toggleHighContrast()" class="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                Activar Alto Contraste
            </button>
        </div>
    </div>
</div>

<style>
    /* Botón flotante de accesibilidad */
    .accessibility-btn {
        position: fixed;
        bottom: 20px;
        left: 20px;
        z-index: 1000;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        transition: transform 0.3s, box-shadow 0.3s;
    }
    
    .accessibility-btn:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
    }
    
    /* Panel de accesibilidad */
    .accessibility-panel {
        position: fixed;
        bottom: 90px;
        left: 20px;
        z-index: 999;
        background-color: var(--bg-card, #ffffff);
        border: 1px solid var(--border-color, #e5e7eb);
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        min-width: 250px;
        display: none;
    }
    
    [data-theme="dark"] .accessibility-panel {
        background-color: var(--bg-card, #374151);
        border-color: var(--border-color, #4b5563);
    }
    
    .accessibility-panel.show {
        display: block;
    }
    
    /* Modo de alto contraste */
    body.high-contrast {
        background-color: #000000;
        color: #ffffff;
    }
    
    body.high-contrast .card {
        background-color: #000000;
        border: 2px solid #ffffff;
        color: #ffffff;
    }
    
    body.high-contrast a {
        color: #ffff00;
    }
    
    body.high-contrast button {
        border: 2px solid #ffffff;
    }
</style>

<script>
    // Panel de Accesibilidad (si no está ya cargado)
    if (typeof accessibilityHandler === 'undefined') {
        (function() {
            const btn = document.getElementById('accessibilityBtn');
            const panel = document.getElementById('accessibilityPanel');
            
            if (btn && panel) {
                btn.addEventListener('click', () => {
                    panel.classList.toggle('show');
                });
                
                // Cerrar al hacer clic fuera
                document.addEventListener('click', (e) => {
                    if (!btn.contains(e.target) && !panel.contains(e.target)) {
                        panel.classList.remove('show');
                    }
                });
            }
            
            window.accessibilityHandler = true;
        })();
    }
    
    // Funciones de accesibilidad
    function changeFontSize(size) {
        const html = document.documentElement;
        const currentSize = parseFloat(getComputedStyle(html).fontSize) || 16;
        const newSize = size === 0 ? 16 : currentSize + size;
        html.style.fontSize = newSize + 'px';
        localStorage.setItem('fontSize', newSize);
    }
    
    function toggleHighContrast() {
        document.body.classList.toggle('high-contrast');
        const isActive = document.body.classList.contains('high-contrast');
        localStorage.setItem('highContrast', isActive);
    }
    
    // Cargar preferencias guardadas
    (function() {
        const savedFontSize = localStorage.getItem('fontSize');
        if (savedFontSize) {
            document.documentElement.style.fontSize = savedFontSize + 'px';
        }
        
        const savedHighContrast = localStorage.getItem('highContrast');
        if (savedHighContrast === 'true') {
            document.body.classList.add('high-contrast');
        }
    })();
</script>

