# Boreal Labs Wallet

Aplicación de billetera digital con marketplace y sistema de puntos, construída con React, Vite, Tailwind y Capacitor para ejecutarse como app web y móvil (Android/iOS).

> Estado: v1.0.0 (Primera versión estable)

## Tecnologías

- React 18 + Vite 7
- Tailwind CSS 3
- Capacitor 7 (Android e iOS)
- Firebase (Auth y Firestore)

## Requisitos

- Node.js 18+ y npm
- Android Studio (SDK 26+), JDK 17
- Xcode (opcional, para iOS)

## Inicio rápido (Web)

```bash
# 1) Instalar dependencias
npm install

# 2) Servir en desarrollo
npm run dev
# Abrir: http://localhost:5173

# 3) Build de producción (web)
npm run build

# 4) Previsualizar build
npm run preview
```

## Configuración de Firebase (.env)

Este proyecto lee las credenciales desde variables de entorno de Vite. Crea un archivo `.env` en la raíz:

```env
VITE_FIREBASE_API_KEY=TU_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=TU_DOMINIO
VITE_FIREBASE_PROJECT_ID=TU_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=TU_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID=TU_SENDER_ID
VITE_FIREBASE_APP_ID=TU_APP_ID
```

Si alguna variable falta, Firebase no se inicializará (ver `src/lib/firebase.js`). Para Android/iOS, además coloca los archivos nativos:

- Android: `android/app/google-services.json` (ya incluido de ejemplo)
- iOS: `ios/App/App/GoogleService-Info.plist`

## Desarrollo y ejecución en Android (Capacitor)

```bash
# 1) Build web para que Capacitor copie a /public dist
npm run build

# 2) Sincronizar con Android
npm run cap:sync:android

# 3) Abrir Android Studio
npm run cap:open:android

# (Opcional) Live reload en dispositivo/emulador
npm run dev:android     # sirve en 0.0.0.0
npm run cap:run:android:lr

# (Atajo) Instalar debug directo con Gradle
npm run android:install
```

Salida de APKs/AABs:

- Debug APK: `android/app/build/outputs/apk/debug/`
- Release APK: `android/app/build/outputs/apk/release/`
- Release AAB: `android/app/build/outputs/bundle/release/`

Build de release (sin firma automática):

```bash
npm run build
npm run cap:sync:android
npm run android:assemble     # APK
npm run android:bundle       # AAB
```

Firma y alineado: configura tu keystore en Gradle o firma el AAB desde Play Console.

## Desarrollo en iOS (Capacitor)

```bash
npm run build
npm run cap:sync
npm run cap:open:ios
```

Luego compila y ejecuta desde Xcode en un simulador o dispositivo.

## Scripts disponibles

```json
{
	"dev": "vite",
	"dev:android": "vite --host 0.0.0.0",
	"build": "vite build",
	"preview": "vite preview",
	"cap:add:ios": "cap add ios",
	"cap:add:android": "cap add android",
	"cap:sync": "cap sync",
	"cap:open:ios": "cap open ios",
	"cap:open:android": "cap open android",
	"cap:sync:android": "cap sync android",
	"cap:run:android:lr": "cap run android -l --external",
	"android:install": "cd android && ./gradlew installDebug",
	"android:assemble": "cd android && ./gradlew assembleRelease",
	"android:bundle": "cd android && ./gradlew bundleRelease"
}
```

## Releases y notas de versión

- HTML de release: `public/release-1.0.0.html` (página estática para publicar/compartir)
- Markdown para GitHub Releases: `RELEASE_NOTES_v1.0.0.md`

Cuando publiques el Release v1.0.0 en GitHub:

- Sube el APK/AAB a los Assets.
- Actualiza los placeholders en las notas: URL del APK, SHA-256 y tamaño.

## Estructura básica

```
src/
	assets/
	components/
		ui/
	contexts/
	hooks/
	lib/               # firebase.js, utils, etc.
	App.jsx
	main.jsx
public/
	release-1.0.0.html
android/
ios/
```

## Problemas comunes

- Gradle/Android Studio: usa JDK 17 y SDK mínimo API 26.
- Conexión para live reload: asegúrate de que el dispositivo/emulador alcance la IP del host (usa `--host 0.0.0.0`).
- Firebase: si no carga, revisa `.env` y las credenciales nativas.

## Licencia

Este proyecto se distribuye bajo la licencia del archivo `LICENSE`.

