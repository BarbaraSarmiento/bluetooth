// src/app/app.config.ts
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial/ngx';
import { IonicModule } from '@ionic/angular';

export const appConfig: ApplicationConfig = {
  providers: [
    // Configuración básica de Ionic (usa solo UNA de estas opciones)
    provideIonicAngular({}),  // <-- Recomendado para aplicaciones standalone
    // O bien:
    // importProvidersFrom(IonicModule.forRoot({})),  // <-- Alternativa para módulos tradicionales
    
    // Router
    provideRouter(routes),
    
    // Proveedor de BluetoothSerial
    BluetoothSerial,  // <-- Forma simplificada
    
    // O si necesitas configuración especial:
    // {
    //   provide: BluetoothSerial,
    //   useValue: BluetoothSerial
    // },
    
    // Otros providers globales
    // provideZoneChangeDetection({ eventCoalescing: true })
  ]
};