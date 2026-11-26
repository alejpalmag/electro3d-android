# Electro3D — Android

Proyecto integrado de las versiones V0.1 + V0.2 + V0.3, preparado para Android mediante Capacitor.

## Incluye

- Diseño de circuito de control y fuerza.
- Biblioteca de interruptor QF, contactor KM, relé térmico FR, pulsadores S0/S1, piloto H1, motor M1, relé K1 y bornera X1.
- Componentes seleccionables y movibles con mouse o toque.
- Terminales visibles.
- Cableado terminal-a-terminal tocando un terminal y después otro.
- Guardado automático en `localStorage`.
- Botón Guardar y exportación JSON.
- Simulación básica de marcha/parada.
- Estado de QF1, KM1, FR1 y M1.
- Disparo/reset del térmico.
- Diagnóstico básico.
- Vista 3D con Three.js.
- Interfaz responsive para teléfonos y tablets.

## Requisitos Android actuales

Esta versión usa Capacitor 8. La documentación oficial indica Android 8+ (API 26+) para Capacitor 8 y requiere Android Studio; también se requiere Node.js 22 o superior para el entorno actual de Capacitor.

## Instalar

```bash
npm install
npm run build
npx cap add android
npx cap sync
npx cap open android
```

En Android Studio selecciona un teléfono o emulador y pulsa Run.

Para ejecución directa:

```bash
npm run cap:run
```

Para volver a sincronizar cambios:

```bash
npm run cap:sync
```

## APK

Desde Android Studio:
Build > Generate App Bundles or APKs > Generate APKs.

El APK de debug suele quedar dentro de:

`android/app/build/outputs/apk/debug/`

## Próxima etapa

- Motor eléctrico por nodos real.
- Interbloqueos y contactos auxiliares 13-14 / 21-22.
- Cortocircuito, sobrecarga y pérdida de fase.
- PLC y lógica ladder.
- Más modelos 3D.
- Escalado, zoom y navegación 3D táctil.
- Generación de planos, numeración y lista de materiales.
