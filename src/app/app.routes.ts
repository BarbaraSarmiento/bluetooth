// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './Components/home/home.component';

export const routes: Routes = [
  { path: 'Home', component: HomeComponent } // Ruta por defecto que cargará el HomeComponent
];
