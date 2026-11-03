# Brújula Personal

Dashboard de productividad y metas personales en un solo archivo (HTML + Tailwind + JS).
Todo se guarda en el dispositivo (localStorage) y se puede exportar/importar en JSON.

- `index.html` — la app completa (tablero kanban, metas anuales, estadísticas).
- `manifest.json`, `sw.js`, `icons/` — la hacen instalable como app (PWA) y usable sin conexión.
- `tools/make-icons.js` — regenera los iconos. `tools/serve.js` — servidor local de prueba.

## Publicar en GitHub Pages (versión iPhone/iPad y web)
1. Crea un repositorio vacío en GitHub llamado `brujula` (público).
2. Desde esta carpeta:
   ```
   git remote add origin https://github.com/TU_USUARIO/brujula.git
   git push -u origin main
   ```
3. En el repositorio: Settings → Pages → Source: "Deploy from a branch", Branch: `main` / `(root)` → Save.
4. En un par de minutos la app estará en `https://TU_USUARIO.github.io/brujula/`.

### Instalar en iPhone / iPad
Abre esa URL en Safari → botón Compartir → "Añadir a pantalla de inicio". Se abre a pantalla
completa, con su icono, y funciona sin conexión.

### Instalar en Android (sin APK)
Abre la URL en Chrome → menú ⋮ → "Instalar aplicación" (o "Añadir a pantalla de inicio").

### Actualizar
Edita `index.html`, sube el número de `CACHE` en `sw.js` (v1 → v2…) y haz `git push`.
Los teléfonos reciben la nueva versión la siguiente vez que abren la app con conexión.

## APK de Android
Ver `../brujula-apk/README.md`.
