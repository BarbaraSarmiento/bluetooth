import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { BluetoothSerial } from '@awesome-cordova-plugins/bluetooth-serial/ngx';
export const appConfig: ApplicationConfig = {
  providers: [
    provideIonicAngular({}),
    provideRouter(routes),
    BluetoothSerial
  ]
};