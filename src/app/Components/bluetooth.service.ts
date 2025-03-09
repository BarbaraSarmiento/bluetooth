//bluetooth.service
import { Injectable } from '@angular/core';
import { BluetoothLe } from '@capacitor-community/bluetooth-le';

@Injectable({
  providedIn: 'root'
})
export class BluetoothService {
  private deviceId: string | null = null;
  private readonly SERVICE_UUID = "0000181c-0000-1000-8000-00805f9b34fb";
  private readonly CHARACTERISTIC_UUID = "00002a56-0000-1000-8000-00805f9b34fb";

  constructor() {
    this.initializeBluetooth();
  }

  async initializeBluetooth() {
    try {
      await BluetoothLe.initialize();
      console.log('Bluetooth inicializado');
    } catch (error) {
      console.error('Error inicializando Bluetooth:', error);
    }
  }

  async scanAndConnect() {
    try {
      const devices = await BluetoothLe.requestDevice({ 
        services: [], // Puedes poner un UUID específico si lo necesitas
      });

      if (devices.deviceId) {
        this.deviceId = devices.deviceId;
        console.log('Conectado a:', devices);
        await BluetoothLe.connect({ deviceId: this.deviceId });
      }
    } catch (error) {
      console.error('Error al conectar:', error);
    }
  }

  async sendData(value: string) {
    if (!this.deviceId) {
      console.error('No hay dispositivo conectado');
      return;
    }

    try {
      await BluetoothLe.write({
        deviceId: this.deviceId,
        service: '0000181c-0000-1000-8000-00805f9b34fb', // Reemplázalo con el UUID correcto de tu ESP32
        characteristic: '00002a56-0000-1000-8000-00805f9b34fb', // UUID del TX
        value: btoa(value), // `btoa` convierte string a Base64
      });
      console.log('Enviado:', value);
    } catch (error) {
      console.error('Error al enviar datos:', error);
    }
  }
}
