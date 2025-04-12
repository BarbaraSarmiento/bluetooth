//src/app/Components/bluetooth/bluetooth.component.ts
import { Component, OnInit } from '@angular/core';
import { BluetoothService } from '../bluetooth.service';
import { NgFor, NgForOf, NgIf } from '@angular/common';

@Component({
  selector: 'app-bluetooth',
  imports: [NgFor,NgForOf,NgIf,],
  templateUrl: './bluetooth.component.html',
  styleUrl: './bluetooth.component.css'
})
export class BluetoothComponent {

  weight: number | null = null;

  constructor(private bluetoothService: BluetoothService) {}
  
  connectDevice() {
    this.bluetoothService.scanAndConnect().then(() => {
      console.log('Dispositivo conectado');
      this.getWeight();
    });
  }

  intervalId: any;

  getWeight() {
    this.intervalId = setInterval(async () => {
      const weight = await this.bluetoothService.readWeight();
      if (weight !== null) {
        this.weight = weight;
      }
    }, 1000);
  }
  
  disconnectDevice() {
    clearInterval(this.intervalId); // para evitar múltiples intervalos
    this.bluetoothService.disconnect();
  }
  

}
