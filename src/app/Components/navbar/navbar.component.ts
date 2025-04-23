//src/app/Components/navbar/navbar.component.ts
import { Component, OnInit } from '@angular/core';
import { BluetoothService } from '../bluetooth.service';
import { NgFor, NgForOf } from '@angular/common';
import { BluetoothComponent } from '../bluetooth/bluetooth.component';
import { UbicacionComponent } from '../ubicacion/ubicacion.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [RouterOutlet, ],  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent  implements OnInit {
  logs: string[] = [];
  isMenuActive = false;

  toggleMenu(): void {
    this.isMenuActive = !this.isMenuActive;
    console.log(this.isMenuActive);
  }
  ngOnInit() {
    this.bluetoothService.logMessages.subscribe(logs => {
      this.logs = logs;
    });
  }
  connect() {
    this.bluetoothService.connectToDevice();
  }
  constructor(private bluetoothService: BluetoothService) {
    
  }
}
