import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.electro3d.simulator',
  appName: 'Electro3D',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
