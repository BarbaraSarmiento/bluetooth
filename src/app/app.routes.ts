// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './Components/home/home.component';
import { BluetoothComponent } from './Components/bluetooth/bluetooth.component';
import { UbicacionComponent } from './Components/ubicacion/ubicacion.component';
import { NavbarComponent } from './Components/navbar/navbar.component';
export const routes: Routes = [
 
  { path: '', component: HomeComponent }, // Ruta por defecto que cargará el HomeComponent
  { path: 'Bluetooth', component: BluetoothComponent },
  { path: 'Ubicacion', component: UbicacionComponent }
];
