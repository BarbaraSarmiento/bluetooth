//src/app/Components/home/home.component.ts
import { Component, OnInit } from '@angular/core';
import { BluetoothService } from '../bluetooth.service';
import { NgFor, NgForOf } from '@angular/common';
import { BluetoothComponent } from '../bluetooth/bluetooth.component';
import { UbicacionComponent } from '../ubicacion/ubicacion.component';
import { RouterOutlet } from '@angular/router';
@Component({
  selector: 'app-home',
  imports: [NgFor,NgForOf,BluetoothComponent, UbicacionComponent,RouterOutlet,],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
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
    this.bluetoothService.scanAndConnect();
  }
  constructor(private bluetoothService: BluetoothService) {
    
  }
}
