import { Component, OnInit } from '@angular/core';
import { BluetoothService } from '../bluetooth.service';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AlertController } from '@ionic/angular/standalone';
import { Router } from '@angular/router';

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
  isLoading = false;

  constructor(
    private bluetoothService: BluetoothService,
    private alertCtrl: AlertController,
    private router: Router
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
    this.isLoading = true;
    try {
      const connected = await this.bluetoothService.connectToDevice();
      if (connected) {
        this.router.navigate(['/bluetooth']); // Solo navega si se conectó
      }
    } catch (error) {
      // Maneja errores
    } finally {
      this.isLoading = false;
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