// src/app/Components/bluetooth.service.ts
import { Injectable } from '@angular/core';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial/ngx';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BluetoothService {
  private connectedDeviceAddress: string | null = null;
  logMessages = new BehaviorSubject<string[]>([]);

  constructor(private bluetoothSerial: BluetoothSerial) {}

  private addLog(message: string) {
    const logs = this.logMessages.getValue();
    logs.push(message);
    this.logMessages.next(logs);
    console.log('[Bluetooth]', message);
  }

  async connectToDevice(name = 'CHUAS-BOT') {
  try {
    console.log('Intentando conectar...');
    type BluetoothDevice = { id: string; name: string };
    const devices: BluetoothDevice[] = await this.bluetoothSerial.list();
    console.log('Dispositivos encontrados:', devices);

    const device = devices.find(d => d.name === name);
    if (!device) {
      this.addLog(`No se encontró el dispositivo ${name}`);
      return;
    }

    await this.bluetoothSerial.connect(device.id).toPromise();
    this.connectedDeviceAddress = device.id;
    this.addLog(`Conectado a ${name}`);
  } catch (error) {
    this.addLog('Error al conectar: ' + error);
    console.error(error); // Esto ayudará a ver si hay algún error específico
  }
}

  

  listenForGpsCoordinates(callback: (lat: number, lng: number) => void) {
    this.bluetoothSerial.subscribe('\n').subscribe(data => {
      const parts = data.trim().split(',');
      if (parts.length === 2) {
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        if (!isNaN(lat) && !isNaN(lng)) {
          this.addLog(`Coordenadas recibidas: ${lat}, ${lng}`);
          callback(lat, lng);
        }
      }
    });
  }

  sendData(data: string) {
    if (!this.connectedDeviceAddress) {
      this.addLog('No hay dispositivo conectado');
      return;
    }

    this.bluetoothSerial.write(data + '\n')
      .then(() => this.addLog('Datos enviados: ' + data))
      .catch(err => this.addLog('Error al enviar datos: ' + err));
  }

  disconnect() {
    if (this.connectedDeviceAddress) {
      this.bluetoothSerial.disconnect();
      this.connectedDeviceAddress = null;
      this.addLog('Desconectado del dispositivo');
    }
  }

  async readGpsCoordinates(): Promise<{ lat: number; lng: number } | null> {
    return new Promise((resolve) => {
      this.bluetoothSerial.subscribe('\n').subscribe(data => {
        const parts = data.trim().split(',');
        if (parts.length === 2) {
          const lat = parseFloat(parts[0]);
          const lng = parseFloat(parts[1]);
          if (!isNaN(lat) && !isNaN(lng)) {
            this.addLog(`GPS por lectura directa: ${lat}, ${lng}`);
            resolve({ lat, lng });
          } else {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
    });
  }

  async readWeight(): Promise<number | null> {
    if (!this.connectedDeviceAddress) {
      this.addLog('No hay dispositivo conectado');
      return null;
    }
  
    return new Promise((resolve) => {
      this.bluetoothSerial.subscribe('\n').subscribe(data => {
        const parsedWeight = parseFloat(data.trim());
        if (!isNaN(parsedWeight)) {
          this.addLog(`Peso recibido: ${parsedWeight}`);
          resolve(parsedWeight);
        } else {
          this.addLog(`Dato recibido no es un número válido: ${data}`);
          resolve(null);
        }
      });
    });
  }
}
