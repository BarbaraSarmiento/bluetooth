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
  private readonly GPS_CHARACTERISTIC_UUID = "b90f9037-f834-47e1-8037-8908de9ff07f"; // Cambia esto por la UUID de las coordenadas GPS de tu dispositivo

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
      const encodedValue = btoa(value); // Codificar a base64
      await BluetoothLe.write({
        deviceId: this.deviceId,
        service: this.SERVICE_UUID,
        characteristic: this.CHARACTERISTIC_UUID,
        value: encodedValue
      });
      this.addLog(`Datos enviados: ${value}`);
    } catch (error) {
      this.addLog('Error al enviar datos: ' + error);
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

  // Método para leer los datos desde el ESP32
 // Método para leer los datos desde el ESP32


  

  // Método para leer las coordenadas del GPS del robot
  async readGpsCoordinates() {
    if (!this.deviceId) {
      this.addLog('No hay dispositivo conectado');
      return null;
    }
  
    try {
      const result = await BluetoothLe.read({
        deviceId: this.deviceId,
        service: this.SERVICE_UUID,
        characteristic: this.GPS_CHARACTERISTIC_UUID, // Aquí debes tener la UUID para las coordenadas GPS
      });
  
      if (!result.value) {
        this.addLog('No se pudo leer las coordenadas GPS.');
        return null;
      }
  
      let decodedValue: string;
  
      // Verificamos si result.value es un DataView
      if (result.value instanceof DataView) {
        // Convertimos el DataView a un Uint8Array
        const byteArray = new Uint8Array(result.value.buffer);
        // Convertimos el Uint8Array a una cadena Base64
        decodedValue = btoa(String.fromCharCode(...byteArray));
      } else {
        // Si result.value ya es un string Base64
        decodedValue = result.value;
      }
  
      // Decodificamos las coordenadas (asumiendo que están en el formato 'lat,lng')
      const coords = atob(decodedValue).split(','); // Decodificamos de Base64 a cadena y separamos las coordenadas
      const lat = parseFloat(coords[0]);
      const lng = parseFloat(coords[1]);
  
      this.addLog(`Coordenadas GPS leídas: ${lat}, ${lng}`);
      return { lat, lng };
    } catch (error) {
      this.addLog('Error al leer las coordenadas GPS: ' + error);
      return null;
    }
  }
  

}
