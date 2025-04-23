import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial/ngx'; // 👈 Importa BluetoothSerial

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    BluetoothSerial // 👈 Añade aquí el proveedor
  ]
};
