# Portafolio Digital Cósmico

Portafolio académico estático para publicar en **GitHub Pages**. Incluye:
- Inicio, Unidades y Mi perfil.
- 4 unidades con 4 semanas correlativas cada una (Semanas 1–16).
- Visibilidad pública para visitantes.
- Panel de administración para subir y eliminar archivos directamente en el repositorio.
- Asistente visual Xal'tor.

## 1. Configurar el repositorio

Abre `config.js` y reemplaza:
- `TU_USUARIO_GITHUB` por tu usuario de GitHub.
- `TU_REPOSITORIO` por el nombre exacto del repositorio.
- `main` por la rama principal si tu repositorio usa otra.

No coloques tokens ni contraseñas en `config.js`.

## 2. Publicar en GitHub Pages

1. Crea un repositorio en GitHub.
2. Sube todos los archivos y carpetas de este proyecto a la raíz del repositorio.
3. En GitHub entra a **Settings → Pages**.
4. En **Build and deployment**, selecciona **Deploy from a branch**.
5. Elige la rama `main` y la carpeta `/ (root)`, y guarda.
6. Espera a que GitHub Pages publique el sitio.

## 3. Habilitar la administración

Para subir y eliminar archivos desde la página, crea un **Fine-grained personal access token** en GitHub:
1. GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens.
2. Limita el token al repositorio de este portafolio.
3. Otorga permiso **Contents: Read and write**.
4. Copia el token y guárdalo en un lugar seguro.

En el portafolio pulsa **Administración** e introduce el token. El token se guarda solo en `sessionStorage` de esa pestaña y se elimina al cerrar la sesión o la pestaña. Nunca lo publiques ni lo compartas. Para mayor seguridad, usa un token con vencimiento y acceso únicamente a este repositorio.

## 4. Cómo funciona

- Cualquier visitante puede navegar por las unidades y abrir los archivos publicados.
- El administrador inicia sesión con su token y puede subir archivos desde la semana correspondiente o eliminar evidencias existentes.
- Los archivos se guardan en `contenido/unidad-N/semana-N/` dentro del repositorio. GitHub Pages actualiza el sitio después del commit.
- El tamaño máximo recomendado por archivo desde esta interfaz es 25 MB. La API de GitHub tiene límites propios.

## Importante sobre seguridad

Esta versión no incluye un usuario/contraseña inventados ni guarda secretos en el código. La autorización real la realiza GitHub mediante un token introducido por el administrador. No uses un token clásico con permisos amplios. Si necesitas que varios administradores trabajen, o que el token nunca pase por el navegador, conviene implementar un backend con autenticación.

## Personalización

Edita los textos del perfil en `index.html`, y los nombres/descripciones de las unidades en `app.js`. Las cuatro unidades y las semanas 1–16 ya están creadas.
