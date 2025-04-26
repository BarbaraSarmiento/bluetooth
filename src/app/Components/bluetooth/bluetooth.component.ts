//src/app/Components/bluetooth/bluetooth.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { BluetoothService } from '../bluetooth.service';
import { NgClass } from '@angular/common';
import { NgIf,NgFor } from '@angular/common';


@Component({
  selector: 'app-bluetooth',
  standalone: true,
  imports: [NgIf,NgFor,NgClass,],
  templateUrl: './bluetooth.component.html',
  styleUrl: './bluetooth.component.css'
})
export class BluetoothComponent implements OnInit, OnDestroy {
  
  weight: number | null = null;
  intervalId: any;
  isConnected = false;
  errorMessage: string | null = null;
  isLoading = true;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';
  isDevicePaired = false;
  pairedDevices: any[] = [];

  constructor(private bluetoothService: BluetoothService) {}

  async ngOnInit() {
    await this.checkPairedDevices();
    await this.connectDevice();
    this.startReadingWeight();
    this.isLoading = false;
  }

  ngOnDestroy() {
    this.cleanUp();
  }

  private async checkPairedDevices() {
    try {
      // Verificar dispositivos emparejados
      const devices = await this.bluetoothService.listPairedDevices();
      this.pairedDevices = devices;
      this.isDevicePaired = devices.some(device => device.name === 'CHUAS-BOT');
      
      if (!this.isDevicePaired) {
        this.errorMessage = 'El dispositivo CHUAS-BOT no está emparejado con este teléfono.';
      }
    } catch (error) {
      console.error('Error al verificar dispositivos emparejados:', error);
    }
  }

  private async connectDevice() {
    if (!this.isDevicePaired) {
      this.connectionStatus = 'error';
      return;
    }

    this.connectionStatus = 'connecting';
    this.errorMessage = null;
    

      
      try {
        // Timeout de 10 segundos para la conexión
        const success = await Promise.race<boolean>([
          this.bluetoothService.connectToDevice(),
          new Promise<boolean>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout: La conexión tardó demasiado')), 10000)
          )
        ]);
        
        if (success) {
          this.connectionStatus = 'connected';
          this.isConnected = true;
        } else {
          throw new Error('No se pudo conectar al dispositivo');
        }
      } catch (error) {
        this.connectionStatus = 'error';
        this.isConnected = false;
        this.errorMessage = error instanceof Error ? error.message : 'Error al conectar con el dispositivo';
        console.error('Error en connectDevice:', error);
      }
    }

  async retryConnection() {
    this.isLoading = true;
    await this.connectDevice();
    
    if (this.isConnected) {
      this.startReadingWeight();
    }
    
    this.isLoading = false;
  }

  private startReadingWeight() {
    // Limpiar intervalo previo si existe
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(async () => {
      if (this.isConnected) {
        try {
          const weight = await this.bluetoothService.readWeight();
          if (weight !== null && weight !== undefined) {
            this.weight = weight;
            this.errorMessage = null;
          }
        } catch (error) {
          this.handleReadingError(error);
        }
      }
    }, 1000);
  }

  private handleReadingError(error: any) {
    console.error('Error al leer peso:', error);
    this.errorMessage = 'Error al leer datos del dispositivo';
    this.isConnected = false;
    this.connectionStatus = 'error';
  }

  private cleanUp() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  getStatusText(status: string): string {
    const statusMap: {[key: string]: string} = {
      'disconnected': 'Desconectado',
      'connecting': 'Conectando...',
      'connected': 'Conectado',
      'error': 'Error de conexión'
    };
    return statusMap[status] || status;
  }

}