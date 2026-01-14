<?php
/**
 * Header/Navbar Reutilizable - SDI Gestión Documental
 * Incluye soporte para avatar multimedia (video/GIF/imagen)
 */

// Prevenir acceso directo
if (!defined('APP_ROOT')) {
    require_once __DIR__ . '/../../config/autoload.php';
}

// Obtener datos del usuario de la sesión
$nombreUsuario = isset($_SESSION['usuario_nombre']) ? escapeOutput($_SESSION['usuario_nombre']) : '';
$rolUsuario = isset($_SESSION['usuario_rol']) ? escapeOutput($_SESSION['usuario_rol']) : '';
$emailUsuario = isset($_SESSION['usuario_email']) ? escapeOutput($_SESSION['usuario_email']) : '';
$usuarioId = isset($_SESSION['usuario_id']) ? (int)$_SESSION['usuario_id'] : 0;

// Avatar multimedia (puede ser URL de imagen, video o GIF)
// En el futuro, esto puede venir de la base de datos
$avatarUrl = isset($_SESSION['usuario_avatar']) ? escapeOutput($_SESSION['usuario_avatar']) : '';
$avatarTipo = isset($_SESSION['usuario_avatar_tipo']) ? escapeOutput($_SESSION['usuario_avatar_tipo']) : 'imagen'; // 'imagen', 'video', 'gif'
$inicialNombre = strtoupper(substr($nombreUsuario, 0, 1));
?>
<nav class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
            <div class="flex items-center">
                <a href="/dashboard.php" class="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    SDI Gestión Documental
                </a>
            </div>
            
            <div class="flex items-center space-x-4">
                <!-- Información del Usuario -->
                <div class="hidden md:flex items-center space-x-3">
                    <div class="text-right">
                        <p class="text-sm font-medium text-gray-900 dark:text-white">
                            <?php echo $nombreUsuario; ?>
                        </p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                            <?php echo $rolUsuario; ?>
                        </p>
                    </div>
                    
                    <!-- Avatar Multimedia -->
                    <div class="relative">
                        <div class="w-10 h-10 rounded-full overflow-hidden bg-blue-500 flex items-center justify-center text-white font-semibold shadow-md ring-2 ring-blue-300 dark:ring-blue-600">
                            <?php if (!empty($avatarUrl)): ?>
                                <?php if ($avatarTipo === 'video'): ?>
                                    <!-- Video Loop -->
                                    <video 
                                        class="w-full h-full object-cover" 
                                        autoplay 
                                        loop 
                                        muted 
                                        playsinline
                                        aria-label="Avatar de <?php echo $nombreUsuario; ?>"
                                    >
                                        <source src="<?php echo $avatarUrl; ?>" type="video/mp4">
                                        <source src="<?php echo $avatarUrl; ?>" type="video/webm">
                                        <!-- Fallback a inicial si el video no carga -->
                                        <span class="text-lg"><?php echo $inicialNombre; ?></span>
                                    </video>
                                <?php elseif ($avatarTipo === 'gif'): ?>
                                    <!-- GIF Animado -->
                                    <img 
                                        src="<?php echo $avatarUrl; ?>" 
                                        alt="Avatar de <?php echo $nombreUsuario; ?>"
                                        class="w-full h-full object-cover"
                                        loading="lazy"
                                    >
                                <?php else: ?>
                                    <!-- Imagen Estática -->
                                    <img 
                                        src="<?php echo $avatarUrl; ?>" 
                                        alt="Avatar de <?php echo $nombreUsuario; ?>"
                                        class="w-full h-full object-cover"
                                        loading="lazy"
                                        onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                                    >
                                    <span class="text-lg" style="display: none;"><?php echo $inicialNombre; ?></span>
                                <?php endif; ?>
                            <?php else: ?>
                                <!-- Fallback: Inicial del nombre -->
                                <span class="text-lg"><?php echo $inicialNombre; ?></span>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>
                
                <!-- Botón Cerrar Sesión -->
                <a href="/login.php?accion=logout" 
                   class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors">
                    Cerrar Sesión
                </a>
                
                <!-- Toggle Modo Oscuro -->
                <button 
                    id="themeToggle" 
                    class="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Cambiar tema"
                >
                    <svg id="sunIcon" class="w-6 h-6 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
                    </svg>
                    <svg id="moonIcon" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                    </svg>
                </button>
            </div>
        </div>
    </div>
</nav>

<script>
    // Tema Oscuro/Claro (si no está ya cargado)
    if (typeof themeToggleHandler === 'undefined') {
        (function() {
            const themeToggle = document.getElementById('themeToggle');
            if (!themeToggle) return;
            
            const sunIcon = document.getElementById('sunIcon');
            const moonIcon = document.getElementById('moonIcon');
            const html = document.documentElement;
            
            // Cargar tema guardado
            const savedTheme = localStorage.getItem('theme') || 'light';
            if (savedTheme === 'dark') {
                html.setAttribute('data-theme', 'dark');
                if (sunIcon) sunIcon.classList.remove('hidden');
                if (moonIcon) moonIcon.classList.add('hidden');
            }
            
            // Toggle tema
            themeToggle.addEventListener('click', () => {
                const currentTheme = html.getAttribute('data-theme');
                if (currentTheme === 'dark') {
                    html.removeAttribute('data-theme');
                    localStorage.setItem('theme', 'light');
                    if (sunIcon) sunIcon.classList.add('hidden');
                    if (moonIcon) moonIcon.classList.remove('hidden');
                } else {
                    html.setAttribute('data-theme', 'dark');
                    localStorage.setItem('theme', 'dark');
                    if (sunIcon) sunIcon.classList.remove('hidden');
                    if (moonIcon) moonIcon.classList.add('hidden');
                }
            });
            
            window.themeToggleHandler = true;
        })();
    }
</script>

