//src/app/app.component.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UbicacionComponent } from './Components/ubicacion/ubicacion.component';
import { HomeComponent } from './Components/home/home.component';
import { BluetoothComponent } from "./Components/bluetooth/bluetooth.component";
import { NavbarComponent } from './Components/navbar/navbar.component';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'myapp';
}
