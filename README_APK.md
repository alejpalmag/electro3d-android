# Electro3D Android — paquete listo para generar APK

Este paquete contiene la aplicación web móvil y la configuración de Capacitor.

## Compatibilidad

La APK debe compilarse para Android. No existe una única APK que garantice funcionar en absolutamente todos los Android: la compatibilidad depende de la versión de Android, arquitectura y fabricante.

Para máxima compatibilidad se recomienda generar una APK universal (cuando sea posible) y mantener el mínimo de Android soportado por la versión de Capacitor usada.

## Generación de APK

1. Instalar Node.js y Android Studio.
2. Abrir una terminal dentro de esta carpeta.
3. Ejecutar:

```bash
npm install
npm run build
npx cap add android
npx cap sync
npx cap open android
```

4. En Android Studio:
   Build > Generate App Bundles or APKs > Generate APKs.

5. Para una APK de prueba:
   Build > Build APK(s).

La APK de debug aparecerá normalmente en:

android/app/build/outputs/apk/debug/

## Importante

La aplicación ya está preparada para teléfono/tablet, pero la generación del binario APK requiere el SDK de Android y Gradle. Este paquete no incluye esos componentes del sistema.
