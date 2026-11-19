# Luxury360 — prototipo frontend

## Archivos
- index.html: página principal, navegación lateral, filtros y footer.
- login.html: inicio de sesión de demostración.
- registro.html: alta de cuenta con validación de campos y datos  
 fiscales condicionales.
- agregar-propiedad.html: formulario de publicación.
- styles.css: identidad visual responsive.
- script.js: interacciones y almacenamiento local.

## Cómo probar
1. Extrae la carpeta.
2. Abre `index.html` en tu navegador (o usa Live Server en VS Code).
3. Crea una cuenta desde "Crear cuenta".
4. Inicia sesión con la cuenta creada.
5. Publica una propiedad y regresa a la página principal.

## Importante
Es un prototipo académico frontend. `localStorage` y `sessionStorage` 
no son una base de datos ni autenticación segura. La contraseña de 
demostración se almacena localmente sin protección. No ingreses datos 
personales, fiscales o contraseñas reales. Para producción se requiere 
backend, almacenamiento seguro de contraseñas (hash con algoritmo 
adecuado), validación del lado del servidor, HTTPS, controles de 
acceso y aviso de privacidad. Los campos fiscales son opcionales; 
no solicitar e.firma, contraseña del SAT ni archivos privados.

El logotipo aún es un marcador tipográfico. Sustituye el bloque 
`.brand` por una imagen cuando tengas el archivo del logo, por ejemplo 
`assets/logo.png`. Actualiza teléfono, correo y redes sociales con los 
datos oficiales.
