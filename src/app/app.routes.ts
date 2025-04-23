import { Routes } from '@angular/router';
import { BluetoothService } from './Components/bluetooth.service';
import { HomeComponent } from './Components/home/home.component';
import { BluetoothComponent } from './Components/bluetooth/bluetooth.component';
import { UbicacionComponent } from './Components/ubicacion/ubicacion.component';

export const routes: Routes = [
  { path: '', component: HomeComponent }, // Ruta por defecto que cargará el HomeComponent
  { path: 'Bluetooth', component: BluetoothComponent, providers: [BluetoothService] }, // Añadido el proveedor para BluetoothService
  { path: 'Ubicacion', component: UbicacionComponent }
];
