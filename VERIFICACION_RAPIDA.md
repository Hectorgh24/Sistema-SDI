# 🚀 VERIFICACIÓN RÁPIDA - Archivo General SDI

## ⏱️ 2 MINUTOS para verificar que todo funciona

### Paso 1: Abrir Test Automático
```
URL: http://localhost/Programa-Gestion-SDI/test_completo.html
```

### Paso 2: Ejecutar Tests
1. **Click en "Paso 1: Autenticarse"**
   - Debe mostrar: `✓ Autenticación exitosa` (verde)

2. **Click en "Paso 2: Verificar Autenticación"**
   - Debe mostrar: `"success": true` (verde)

3. **Click en "Paso 3: Listar Carpetas"**
   - Debe mostrar: `✓ Carpetas obtenidas: X` (verde)
   - Verifica que hay carpetas en el array

4. **Click en "Paso 4: Crear Carpeta"**
   - Debe mostrar: `✓ Carpeta creada exitosamente` (verde)
   - NEW: Nueva carpeta debe tener campo `titulo` con un título

### Paso 3: Verificar en la App Real
```
1. Ve a: http://localhost/Programa-Gestion-SDI/index.html
2. Inicia sesión con:
   Email: hectorggh24@gmail.com
   Contraseña: password
3. Haz clic en "Archivo General SDI" en el menú left
4. Rellena:
   - Título: Mi primera carpeta
   - Etiqueta: MFC-001
   - Descripción: Opcional
5. Click "Crear Carpeta"
6. Verifica que:
   ✓ Aparece en la tabla abajo
   ✓ Tiene el título que escribiste
   ✓ El número de carpeta se incrementó
```

## 🐛 Si algo NO funciona

### Error: "Articulación inválido"
- El número de carpeta debe ser el siguiente secuencial
- Solución: Ver en consola `Máximo número actual`, y el siguiente debe ser ese + 1

### Error: "El título ya existe"
- Cada carpeta debe tener un título único
- Solución: Usa un título diferente

### Error: "La etiqueta ya existe"
- Cada carpeta debe tener una etiqueta única
- Solución: Usa una etiqueta diferente (ej: ABC-001, ABC-002, etc)

### La tabla no se actualiza
- Presiona F5 para recargar la página
- Abre la consola (F12) y busca errores rojos

### No puedo crear carpetas pero listar funciona
- Verifica en `diagnostico_completo.php` que:
  - ✓ Hay una sesión activa
  - ✓ Usuario autenticado es: hectorggh24@gmail.com
  - ✓ Puede crear carpeta: debe decir "✓ SÍ"

## 📋 CHECKLIST FINAL

- [ ] Test Paso 1: Autenticación ✓
- [ ] Test Paso 2: Verificar Auth ✓
- [ ] Test Paso 3: Listar Carpetas ✓
- [ ] Test Paso 4: Crear Carpeta ✓
- [ ] Ver nueva carpeta en tabla en la App
- [ ] Editar una carpeta (cambiar título o estado)
- [ ] Eliminar una carpeta

## 📞 SOPORTE

Si necesitas ayuda, ejecuta:
- `http://localhost/Programa-Gestion-SDI/diagnostico_completo.php` - Ver todos los detalles técnicos
- Abre F12 (Dev Tools) y busca mensajes en la consola
- Busca los logs que empiezan con ✓ (éxito) o ✗ (error)

---

**Última actualización**: 2024  
**Versión**: 2.0  
**Estado**: ✅ Listo para probar
