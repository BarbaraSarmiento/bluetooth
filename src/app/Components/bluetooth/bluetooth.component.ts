import { Component, OnDestroy, OnInit } from '@angular/core';
import { BluetoothService } from '../bluetooth.service';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AlertController } from '@ionic/angular/standalone';

@Component({
  selector: 'app-bluetooth',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bluetooth.component.html',
  styleUrls: ['./bluetooth.component.css']
})
export class BluetoothComponent implements OnInit, OnDestroy {

  private subs: Subscription[] = [];
  currentWeight: number = 0;
  weightStatus: string = 'Desconocido';
  alerts: string[] = [];
  connectionStatus: string = 'Desconectado';
  isLoading: boolean = false;

  constructor(
    private bluetoothService: BluetoothService,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    console.log('Inicializando componente Bluetooth');
    
    this.subs.push(
      this.bluetoothService.weight$.subscribe({
        next: (weight) => {
          console.log('Nuevo peso recibido:', weight);
          this.currentWeight = weight;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error en weight$:', err);
          this.isLoading = false;
        }
      }),
      
      this.bluetoothService.weightStatus$.subscribe(status => {
        this.weightStatus = status;
      }),
      
      this.bluetoothService.alerts$.subscribe(alerts => {
        this.alerts = alerts.slice(-3); // Mostrar solo las 3 últimas alertas
      }),
      
      this.bluetoothService.connectionStatus$.subscribe(status => {
        this.connectionStatus = status;
      })
    );

    // Solicitar peso inicial
    this.requestWeight();
  }

  ngOnDestroy() {
    this.subs.forEach(sub => sub.unsubscribe());
  }

  private async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
  
  async connect() {
    try {
      const connected = await this.bluetoothService.connectToDevice();
      if (connected) {
        await this.showAlert('Éxito', 'Conexión Bluetooth establecida');
      } else {
        await this.showAlert('Error', 'No se pudo conectar al dispositivo');
      }
    } catch (error) {
      await this.showAlert('Error', error instanceof Error ? error.message : 'Error desconocido');
    }
  }
  getWeightStatusClass(): string {
    if (!this.currentWeight) return 'unknown';
    if (this.currentWeight <= 0.5) return 'medium';
    if (this.currentWeight <= 0.7) return 'almost-full';
    return 'full';
  }

  requestWeight() {
    this.isLoading = true;
    this.bluetoothService.requestWeight().catch(err => {
      console.error('Error al solicitar peso:', err);
      this.isLoading = false;
    });
  }
}