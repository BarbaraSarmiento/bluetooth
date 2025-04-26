import { Component, OnInit } from '@angular/core';
import { BluetoothService } from '../bluetooth.service';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AlertController } from '@ionic/angular/standalone';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  connectionStatus = 'Desconectado';
  isMenuActive = false;

  constructor(
    private bluetoothService: BluetoothService,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    this.bluetoothService.connectionStatus$.subscribe(status => {
      this.connectionStatus = this.getStatusText(status);
    });
  }

  toggleMenu(): void {
    this.isMenuActive = !this.isMenuActive;
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

  private getStatusText(status: string): string {
    switch(status) {
      case 'disconnected': return 'Desconectado';
      case 'connecting': return 'Conectando...';
      case 'connected': return 'Conectado';
      case 'error': return 'Error';
      default: return status;
    }
  }

  private async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}