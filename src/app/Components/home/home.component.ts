import { Component, OnInit } from '@angular/core';
import { BluetoothService } from '../services/bluetooth.service';
import { CommonModule } from '@angular/common';
import { BluetoothComponent } from '../bluetooth/bluetooth.component';
import { UbicacionComponent } from '../ubicacion/ubicacion.component';
import { RouterOutlet } from '@angular/router';
import { AlertController } from '@ionic/angular'; // Añade esto

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, BluetoothComponent, UbicacionComponent, RouterOutlet],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  connectionStatus = 'Desconectado'; // Añade esta línea

  constructor(
    private bluetoothService: BluetoothService,
    private alertCtrl: AlertController // Añade esto
  ) {}
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

  
  async connect() {
    try {
      this.connectionStatus = 'Conectando...';
      const connected = await this.bluetoothService.connectToDevice();
      
      if (connected) {
        this.connectionStatus = 'Conectado';
        await this.showAlert('Éxito', 'Conexión Bluetooth establecida');
      } else {
        this.connectionStatus = 'Error de conexión';
        await this.showAlert('Error', 'No se pudo conectar al dispositivo');
      }
    } catch (error) {
      this.connectionStatus = 'Error';
      await this.showAlert('Error', error instanceof Error ? error.message : 'Error desconocido');
      console.error('Error en conexión:', error);
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
