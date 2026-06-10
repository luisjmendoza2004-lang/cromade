# CROMADE: Más allá del último día

Aplicación interactiva de la novela de ciencia ficción filosófica.

## 🚀 Despliegue en GitHub Pages

1. Ve a **Settings → Pages** en tu repositorio
2. En **Source**, selecciona **GitHub Actions**
3. La app se despliega automáticamente en cada push

## 🔧 Configuración Firebase (Opcional pero recomendado)

Para que el registro/login funcione:

1. Ve a [firebase.google.com](https://firebase.google.com)
2. Crea un proyecto nuevo
3. Activa **Authentication** (Email/Password + Google)
4. Activa **Firestore Database**
5. En **Configuración del proyecto → General**, copia las credenciales
6. Reemplaza en `landing.js` y `app.js`:
   - `TU_API_KEY`
   - `TU_PROYECTO`
   - `TU_SENDER_ID`
   - `TU_APP_ID`

## 📁 Estructura

| Archivo | Propósito |
|---------|-----------|
| `index.html` | App interactiva (lectura, audio, quiz) |
| `app.js` | Lógica de la app |
| `styles.css` | Estilos de la app |
| `data.js` | Contenido de los 10 capítulos |
| `landing.html` | Página de ventas |
| `landing.css` | Estilos de la landing |
| `landing.js` | Lógica de la landing |
| `manifest.json` | PWA (instalable en celular) |
| `sw.js` | Service Worker (funciona offline) |

## 🎮 Funcionalidades

- **Capítulo 1**: Gratis, sin registro
- **Capítulo 2**: Gratis tras registro
- **Capítulos 3-10**: Requieren suscripción
- **Audio TTS**: Lectura en voz alta
- **Quiz**: Preguntas por capítulo
- **Visuales**: Modo historia interactiva (caps 3, 7, 9, 10)
- **Progreso**: Guardado automáticamente
- **Offline**: Funciona sin internet una vez cargada

## 💰 Monetización

- Suscripción mensual: $4.99
- Suscripción anual: $49.99
- Donaciones mecenas: Monto libre

Integrar MercadoPago/Stripe en `landing.js` → función `processPayment()`.

## 📱 Instalar en celular

1. Abre la URL en Chrome/Safari
2. Toca **"Agregar a pantalla de inicio"**
3. La app funciona como nativa, incluso offline

---

Hecho con ❤️ y mucho silencio consciente.
