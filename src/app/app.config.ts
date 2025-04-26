import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { AndroidPermissions } from '@awesome-cordova-plugins/android-permissions/ngx';

export const appConfig: ApplicationConfig = {
  providers: [
    provideIonicAngular({}),
    provideRouter(routes),
    AndroidPermissions // Añade esto como proveedor
  ]
};