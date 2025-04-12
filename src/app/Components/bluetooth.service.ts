//src/app/Components/bluetooth.service.ts
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
  }
  // Leer datos de la característica Bluetooth (como el peso)
  async readWeight() {
    if (!this.deviceId) {
      this.addLog('No hay dispositivo conectado');
      return null;
    }
  
    try {
      // Leer el valor de la característica
      const result = await BluetoothLe.read({
        deviceId: this.deviceId,
        service: this.SERVICE_UUID,
        characteristic: this.CHARACTERISTIC_UUID
      });
  
      if (!result.value) {
        this.addLog('No se pudo leer el valor de la característica.');
        return null;
      }
  
      // Verificar si result.value es un ArrayBuffer o un string Base64
      let byteArray: Uint8Array;
  
      if (typeof result.value === 'string') {
        // Si es un string Base64, lo decodificamos
        const decodedValue = atob(result.value);  // Decodifica de Base64 a string
        byteArray = new Uint8Array(decodedValue.length);
  
        // Convertir la cadena a un array de bytes
        for (let i = 0; i < decodedValue.length; i++) {
          byteArray[i] = decodedValue.charCodeAt(i);
        }
      } else {
        // Si result.value es un ArrayBuffer (no DataView), lo convertimos directamente a un Uint8Array
        byteArray = new Uint8Array(result.value.buffer); // Obtener el buffer del DataView y convertirlo a Uint8Array
      }
  
      // Ahora, se puede usar el DataView para interpretar el ArrayBuffer
      const dataView = new DataView(byteArray.buffer);
      const weight = dataView.getInt32(0, true);  // Leer el valor como un entero de 32 bits (little-endian)
  
      this.addLog(`Peso leído: ${weight}`);
      return weight;
  
    } catch (error) {
      this.addLog('Error al leer el peso: ' + error);
      return null;
    }
  }
  
  
  // Desconectar del dispositivo Bluetooth
  async disconnect() {
    if (!this.deviceId) {
      this.addLog('No hay dispositivo conectado');
      return;
    }

    try {
      await BluetoothLe.disconnect({ deviceId: this.deviceId });
      this.addLog('Desconectado del dispositivo Bluetooth');
      this.deviceId = null;  // Limpiar el dispositivo conectado
    } catch (error) {
      this.addLog('Error al desconectar: ' + error);
    }
  }
}
