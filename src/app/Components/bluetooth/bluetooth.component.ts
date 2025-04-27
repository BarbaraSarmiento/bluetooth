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
  currentWeight: number = 0;
  weightStatus: string = 'Desconocido';
  alerts: string[] = [];

  constructor(public bluetoothService: BluetoothService) {
    // Solicitar el peso actual al cargar el componente
    this.bluetoothService.requestWeight();
    
    this.subs.push(
      this.bluetoothService.weight$.subscribe(weight => {
        this.currentWeight = weight;
      }),
      this.bluetoothService.weightStatus$.subscribe(status => {
        this.weightStatus = status;
      }),
      this.bluetoothService.alerts$.subscribe(alerts => {
        this.alerts = alerts;
      })
    );
  }

  ngOnDestroy() {
    this.subs.forEach(sub => sub.unsubscribe());
  }

  // Método para obtener clase CSS según estado del peso
  getWeightStatusClass(): string {
    if (this.weightStatus.includes('medio vacío')) return 'medium';
    if (this.weightStatus.includes('casi lleno')) return 'almost-full';
    if (this.weightStatus.includes('lleno')) return 'full';
    return 'unknown';
  }

  requestWeight() {
    this.bluetoothService.requestWeight();
  }
}