import { Routes } from '@angular/router';
import { HomeComponent } from './Components/home/home.component';
import { BluetoothComponent } from './Components/bluetooth/bluetooth.component';
import { UbicacionComponent } from './Components/ubicacion/ubicacion.component';

export const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'bluetooth', component: BluetoothComponent }, // Cambia esto si prefieres 'almacenamiento'
  { path: 'ubicacion', component: UbicacionComponent },
  { path: '**', redirectTo: 'home' } // Redirige rutas no encontradas a home
];