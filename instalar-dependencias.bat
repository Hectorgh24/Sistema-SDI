@echo off
echo ========================================
echo SDI - Instalador Final Funcional
echo ========================================
echo.

:: Cambiar al directorio del script
cd /d "%~dp0"

:: Verificar Node.js
echo [PASO 1] Verificando Node.js...
node --version
if %errorLevel% neq 0 (
    echo [ERROR] Node.js no esta funcionando.
    echo [INFO] Por favor reinicia tu computadora.
    pause
    exit /b 1
) else (
    echo [OK] Node.js funcionando correctamente.
)

:: Verificar npm
echo.
echo [PASO 2] Verificando npm...
npm --version
if %errorLevel% neq 0 (
    echo [ERROR] npm no esta funcionando.
    pause
    exit /b 1
) else (
    echo [OK] npm funcionando correctamente.
)

:: Verificar Puppeteer
echo.
echo [PASO 3] Verificando Puppeteer...
npm list puppeteer
if %errorLevel% neq 0 (
    echo [ERROR] Puppeteer no esta instalado.
    echo [INFO] Instalando Puppeteer...
    npm install puppeteer --save
    
    if %errorLevel% neq 0 (
        echo [ERROR] No se pudo instalar Puppeteer.
        pause
        exit /b 1
    )
) else (
    echo [OK] Puppeteer ya esta instalado.
)

:: Verificar XAMPP
echo.
echo [PASO 4] Verificando XAMPP...
if exist "C:\xampp" (
    echo [OK] XAMPP detectado en C:\xampp
) else if exist "D:\xampp" (
    echo [OK] XAMPP detectado en D:\xampp
) else (
    echo [ADVERTENCIA] XAMPP no detectado.
)

:: Crear configuracion
echo.
echo [PASO 5] Creando configuracion...
echo {"sdi_professional": {"version": "3.0", "installed": true, "puppeteer": "installed", "status": "ready"}} > sdi-config.json
echo [OK] Configuracion creada.

:: Resumen final
echo.
echo ========================================
echo [EXITO] Sistema listo para usar
echo ========================================
echo.
echo [RESUMEN]
echo - Node.js: Instalado y funcionando
echo - npm: Funcionando correctamente
echo - Puppeteer: Instalado y listo
echo - Sistema SDI: Configurado
echo.
echo [SIGUIENTES PASOS]
echo 1. Inicia XAMPP (Apache)
echo 2. Accede a http://localhost/Programa-Gestion-SDI
echo 3. Ve a Herramientas - Convertidor Profesional
echo 4. Selecciona un archivo Word .docx
echo 5. Convierte a PDF
echo.
echo [¡SISTEMA LISTO PARA USAR!]
echo.
pause
