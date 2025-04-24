import { Component, OnInit } from '@angular/core';
import { BluetoothService } from '../bluetooth.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-bluetooth',
  standalone: true,
  imports: [NgIf],
  templateUrl: './bluetooth.component.html',
  styleUrl: './bluetooth.component.css'
})
export class BluetoothComponent implements OnInit {

  weight: number | null = null;
  intervalId: any;

  constructor(private bluetoothService: BluetoothService) {}

  async ngOnInit() {
    await this.bluetoothService.connectToDevice();
    console.log('Dispositivo conectado automáticamente');
    this.startReadingWeight();
  }

  startReadingWeight() {
    this.intervalId = setInterval(async () => {
      const weight = await this.bluetoothService.readWeight?.();
      if (weight !== null && weight !== undefined) {
        this.weight = weight;
      }
    }, 1000);
  }

  // No necesitamos desconexión manual
}
