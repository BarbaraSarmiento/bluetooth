import { Injectable } from '@angular/core';
import { BluetoothLe } from '@capacitor-community/bluetooth-le';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BluetoothService {
  private deviceId: string | null = null;
  private readonly SERVICE_UUID = "0000181c-0000-1000-8000-00805f9b34fb";
  private readonly CHARACTERISTIC_UUID = "00002a56-0000-1000-8000-00805f9b34fb";

  logMessages = new BehaviorSubject<string[]>([]); // Para almacenar logs

  constructor() {
    this.initializeBluetooth();
  }

  private addLog(message: string) {
    const logs = this.logMessages.getValue();
    logs.push(message);
    this.logMessages.next(logs);
  }

  async initializeBluetooth() {
    try {
      await BluetoothLe.initialize();
      this.addLog('Bluetooth inicializado');
    } catch (error) {
      this.addLog('Error inicializando Bluetooth: ' + error);
    }
  }

  async scanAndConnect() {
    try {
      const devices = await BluetoothLe.requestDevice({ services: [] });

      if (devices.deviceId) {
        this.deviceId = devices.deviceId;
        this.addLog(`Conectado a: ${JSON.stringify(devices)}`);
        await BluetoothLe.connect({ deviceId: this.deviceId });
      }
    } catch (error) {
      this.addLog('Error al conectar: ' + error);
    }
  }

  async sendData(value: string) {
    if (!this.deviceId) {
      this.addLog('No hay dispositivo conectado');
      return;
    }
  
    try {
      this.addLog('Enviando datos...');
      await BluetoothLe.write({
        deviceId: this.deviceId,
        service: this.SERVICE_UUID,
        characteristic: this.CHARACTERISTIC_UUID,
        value: value,
      });
      this.addLog('Enviado: ' + value);
    } catch (error) {
      this.addLog('Error al enviar datos: ' + error);
    }
  }
  
}
