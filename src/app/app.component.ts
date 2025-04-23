//src/app/app.component.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './Components/navbar/navbar.component';
import { BluetoothService } from './Components/bluetooth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [BluetoothService]  // Agregar BluetoothService en providers
})
export class AppComponent {
  title = 'myapp';
}
