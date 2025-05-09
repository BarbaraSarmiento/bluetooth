//
import { Injectable } from '@angular/core';
import { BehaviorSubject,Subject } from 'rxjs';
import { Platform } from '@ionic/angular';

declare var bluetoothSerial: any;

@Injectable({
  providedIn: 'root'
})
export class BluetoothService {
  private connectedDeviceAddress: string | null = null;
  private logMessages = new BehaviorSubject<string[]>([]);
  public weightSubject = new Subject<number>(); // Nuevo Subject para pesos
  public logs$ = this.logMessages.asObservable();

  constructor(private platform: Platform) {
    this.platform.ready().then(() => {
      if (typeof bluetoothSerial === 'undefined') {
        console.warn('Bluetooth plugin not available');
      }
    });
  }

  private addLog(message: string): void {
    const logs = this.logMessages.getValue();
    logs.push(message);
    this.logMessages.next(logs);
    console.log('[Bluetooth]', message);
  }

  async listPairedDevices(): Promise<{name: string, address: string}[]> {
    return new Promise((resolve, reject) => {
      bluetoothSerial.list(
        (devices: any[]) => resolve(devices.map(d => ({ name: d.name, address: d.address }))),
        (error: any) => {
          this.addLog('Error al listar dispositivos: ' + error);
          reject(error);
        }
      );
    });
  }
  private setupBluetoothListeners(): void {
    bluetoothSerial.subscribe('\n', (data: string) => {
      const message = data.trim();
      this.addLog(`Dato recibido: ${message}`);
      
      // Procesar mensaje de peso
      if (message.startsWith('PESO:')) {
        const weightValue = message.split(':')[1];
        const weight = parseFloat(weightValue);
        
        if (!isNaN(weight)) {
          this.weightSubject.next(weight / 1000); // Convertir gramos a kg
        }
      }
    }, (error: any) => {
      this.addLog(`Error en recepción: ${error}`);
    });
  }

  async connectToDevice(name = 'CHUAS-BOT'): Promise<boolean> {
    try {
      const devices = await this.listPairedDevices();
      const device = devices.find(d => d.name === name);
      
      if (!device) {
        throw new Error('Dispositivo no encontrado');
      }

      return new Promise((resolve) => {
        bluetoothSerial.connect(
          device.address,
          () => {
            this.connectedDeviceAddress = device.address;
            this.addLog(`Conectado a ${name}`);
            resolve(true);
          },
          (error: any) => {
            this.addLog('Error de conexión: ' + error);
            resolve(false);
          }
        );
      });
    } catch (error) {
      this.addLog('Error en connectToDevice: ' + error);
      throw error;
    }
  }

  listenForGpsCoordinates(callback: (lat: number, lng: number) => void) {
    bluetoothSerial.subscribe('\n', 
      (data: string) => {
        const parts = data.trim().split(',');
        if (parts.length === 2) {
          const lat = parseFloat(parts[0]);
          const lng = parseFloat(parts[1]);
          if (!isNaN(lat) && !isNaN(lng)) {
            callback(lat, lng);
          }
        }
      },
      (error: any) => console.error(error)
    );
  }

  disconnect() {
    if (this.connectedDeviceAddress) {
      bluetoothSerial.disconnect();
      this.connectedDeviceAddress = null;
    }
  }
}