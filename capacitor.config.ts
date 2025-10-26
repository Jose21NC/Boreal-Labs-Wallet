import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.boreal.wallet',
  appName: 'Boreal Wallet',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
  },
};

export default config;
