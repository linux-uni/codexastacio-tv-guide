# AulaTrader — CodeXaStacio

Academia de trading desde cero (versión de demostración). Web app estática en español, lista para alojarse en **GitHub Pages**, sin dependencias ni compilación.

## Funciones

- Inicio de sesión de **demostración**, sin servidor ni cuentas reales.
- Menú adaptable para PC y teléfono.
- 7 lecciones introductorias, glosario y evaluación.
- Simulador educativo con capital ficticio de USD 10,000 y precios generados aleatoriamente.
- Tutor Lía con respuestas programadas (todavía **no** usa IA generativa).
- Progreso y cartera ficticia guardados en `localStorage` del navegador.

**Credenciales demo**: `demo@aula.local` / `Demo1234`.

⚠️ La contraseña está escrita en el código fuente. No utilizar contraseñas reales ni introducir datos personales en este prototipo. **No existe autenticación segura ni almacenamiento en la nube**, por lo que el estado no se sincroniza entre dispositivos. No utiliza dinero real, operaciones reales ni cotizaciones reales.

## Publicar en GitHub Pages

1. Entra a <https://github.com/new> con tu cuenta **linux-uni**.
2. Crea un repositorio **Public** llamado `codexastacio-aulatrader` (sin afectar a ningún otro repositorio existente). Puede inicializarse con un README.
3. Usa **Add file → Upload files** y sube los archivos **descomprimidos** de esta carpeta en la **raíz del repositorio** (`index.html`, `favicon.svg`, `.nojekyll` y este `README.md`). Confirma el commit en la rama `main`.
4. Visita **Settings → Pages → Build and deployment**. En **Source**, elige **Deploy from a branch**; en **Branch**, `main` y `/(root)`. Haz clic en **Save**.
5. Consulta el estado en **Actions** y después en **Settings → Pages → Visit site**. La dirección de proyecto esperada, una vez que GitHub Pages confirme el despliegue, es `https://linux-uni.github.io/codexastacio-aulatrader/`.

La dirección indicada es el formato de URL esperado; **no confirma que la web ya esté publicada**.

## Próximas etapas para usuarios reales

- Autenticación y recuperación de contraseña con backend, verificación de email y gestión segura de sesiones.
- Almacenamiento de progreso por usuario con reglas de acceso (p. ej. RLS).
- Tutor de IA a través de un servidor/función segura, nunca con claves de servicio embebidas en HTML.
- Contenido curricular revisado, métricas de aprendizaje, analítica y accesibilidad.

## Advertencia

Contenido solo educativo: no es asesoramiento financiero ni promesa de ganancias. El trading con dinero real conlleva riesgo de pérdidas.

## Vista previa pública en la rama de pruebas

La rama `codexastacio-aulatrader-preview` contiene una copia aislada de AulaTrader bajo `aulatrader/`. No forma parte de `main` de TV Guide, ni representa una implementación de GitHub Pages. Para compartir temporalmente el HTML se puede usar un visor de código público como raw.githack.com. Antes del lanzamiento definitivo, crear repositorio `codexastacio-aulatrader` y activar GitHub Pages.
