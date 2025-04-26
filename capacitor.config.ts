//
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.uets.blutu',
  appName: 'Bluetooth',
  webDir: 'dist/myapp/browser',
  plugins: {
    BluetoothSerial: {
      neverForLocation: true
    }
  }
};

export default config;