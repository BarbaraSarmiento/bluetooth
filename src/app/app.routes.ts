//src/app/app.routes.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './Components/home/home.component';
import { BluetoothComponent } from './Components/bluetooth/bluetooth.component';
import { UbicacionComponent } from './Components/ubicacion/ubicacion.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'bluetooth', component: BluetoothComponent },
  { path: 'ubicacion', component: UbicacionComponent },
  { path: '**', redirectTo: '' }
];
