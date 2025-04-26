import { Component, OnDestroy } from '@angular/core';
import { BluetoothService } from '../bluetooth.service';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-bluetooth',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bluetooth.component.html',
  styleUrls: ['./bluetooth.component.css']
})
export class BluetoothComponent implements OnDestroy {
  private subs: Subscription[] = [];
  currentConnectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';
  currentWeight: number = 0;
  weightStatus: string = 'Desconocido';
  pairedDevices: any[] = [];
  alerts: string[] = [];

  constructor(public bluetoothService: BluetoothService) {
    this.subs.push(
      this.bluetoothService.connectionStatus$.subscribe(status => {
        this.currentConnectionStatus = status;
      }),
      this.bluetoothService.weight$.subscribe(weight => {
        this.currentWeight = weight;
      }),
      this.bluetoothService.weightStatus$.subscribe(status => {
        this.weightStatus = status;
      }),
      this.bluetoothService.pairedDevices$.subscribe(devices => {
        this.pairedDevices = devices;
      }),
      this.bluetoothService.alerts$.subscribe(alerts => {
        this.alerts = alerts;
      })
    );
  }

  ngOnDestroy() {
    this.subs.forEach(sub => sub.unsubscribe());
  }

  // Método para obtener texto del estado
  getStatusText(): string {
    switch(this.currentConnectionStatus) {
      case 'disconnected': return 'Desconectado';
      case 'connecting': return 'Conectando...';
      case 'connected': return 'Conectado';
      case 'error': return 'Error';
      default: return this.currentConnectionStatus;
    }
  }

  // Método para obtener clase CSS según estado
  getStatusClass(): string {
    switch(this.currentConnectionStatus) {
      case 'connected': return 'connected';
      case 'disconnected': return 'disconnected';
      case 'connecting': return 'connecting';
      case 'error': return 'error';
      default: return '';
    }
  }

  // Método para obtener clase CSS según estado del peso
  getWeightStatusClass(): string {
    if (this.weightStatus.includes('medio vacío')) return 'medium';
    if (this.weightStatus.includes('casi lleno')) return 'almost-full';
    if (this.weightStatus.includes('lleno')) return 'full';
    return 'unknown';
  }

  toggleConnection() {
    if (this.currentConnectionStatus === 'connected') {
      this.bluetoothService.disconnect();
    } else {
      this.bluetoothService.connectToDevice();
    }
  }

  requestWeight() {
    this.bluetoothService.requestWeight();
  }
}