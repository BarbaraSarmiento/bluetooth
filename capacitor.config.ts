//
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.uets.blutu',
  appName: 'ChuasBot',
  webDir: 'dist/myapp/browser',
  plugins: {
    BluetoothSerial: {
      neverForLocation: true
    }
  }
};

export default config;