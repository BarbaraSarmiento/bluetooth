import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Platform } from '@ionic/angular';

declare var bluetoothSerial: any;

@Injectable({
  providedIn: 'root'
})
export class BluetoothService {
  // Estados centralizados
  private _connectionStatus = new BehaviorSubject<'disconnected'|'connecting'|'connected'|'error'>('disconnected');
  private _logs = new BehaviorSubject<string[]>([]);
  private _weight = new BehaviorSubject<number>(0);
  private _weightStatus = new BehaviorSubject<string>('Desconocido');
  private _robotCoordinates = new BehaviorSubject<{lat: number, lng: number}|null>(null);
  private _pairedDevices = new BehaviorSubject<{name: string, address: string}[]>([]);
  private _alerts = new BehaviorSubject<string[]>([]);
  
  // Observables públicos
  public connectionStatus$ = this._connectionStatus.asObservable();
  public logs$ = this._logs.asObservable();
  public weight$ = this._weight.asObservable();
  public weightStatus$ = this._weightStatus.asObservable();
  public robotCoordinates$ = this._robotCoordinates.asObservable();
  public pairedDevices$ = this._pairedDevices.asObservable();
  public alerts$ = this._alerts.asObservable();

  private connectedDeviceAddress: string | null = null;

  constructor(private platform: Platform) {
    this.initializeBluetooth();
  }

  private initializeBluetooth(): void {
    this.platform.ready().then(() => {
      if (typeof bluetoothSerial === 'undefined') {
        this.addLog('Error: Plugin Bluetooth no disponible');
      } else {
        this.addLog('Bluetooth inicializado correctamente');
      }
    });
  }

  private addLog(message: string): void {
    const logs = this._logs.getValue();
    logs.push(`${new Date().toLocaleTimeString()}: ${message}`);
    this._logs.next(logs.slice(-100));
    console.log('[Bluetooth]', message);
  }

  private addAlert(message: string): void {
    const alerts = this._alerts.getValue();
    alerts.push(message);
    this._alerts.next(alerts.slice(-5));
  }

  //async checkPermissions(): Promise<boolean> {
    //if (!this.platform.is('android')) return true;
    
    //return new Promise((resolve) => {
      //bluetoothSerial.hasPermission(
        //(hasPermission: boolean) => {
          //if (hasPermission) {
            //resolve(true);
          //} else {
            //bluetoothSerial.requestPermission(
              //(granted: boolean) => resolve(granted),
              //() => resolve(false)
            //);
          //}
        //},
        //() => resolve(false)
      //);
    //});
  

  async connectToDevice(deviceName = 'CHUAS-BOT'): Promise<boolean> {
    try {
      // No verificamos permisos en esta versión simplificada
    this.addLog('Saltando verificación de permisos Bluetooth');


      this._connectionStatus.next('connecting');
      this.addLog(`Conectando a ${deviceName}...`);

      // Verificar si Bluetooth está activado
      const isEnabled = await new Promise<boolean>((resolve) => {
        bluetoothSerial.isEnabled(
          () => resolve(true),
          () => resolve(false)
        );
      });

      if (!isEnabled) {
        throw new Error('Bluetooth no está activado');
      }

      const devices = await this.listPairedDevices();
      const device = devices.find(d => d.name === deviceName);
      
      if (!device) {
        throw new Error(`Dispositivo ${deviceName} no encontrado`);
      }

      return new Promise<boolean>((resolve) => {
        bluetoothSerial.connect(
          device.address,
          () => {
            this.connectedDeviceAddress = device.address;
            this._connectionStatus.next('connected');
            this.addLog(`Conectado exitosamente a ${deviceName}`);
            this.setupBluetoothListeners();
            resolve(true);
          },
          (error: any) => {
            this._connectionStatus.next('error');
            this.addLog(`Error de conexión: ${error}`);
            resolve(false);
          }
        );
      });
    } catch (error) {
      this._connectionStatus.next('error');
      this.addLog(`Error en conexión: ${error}`);
      throw error;
    }
  }

  private setupBluetoothListeners(): void {
    bluetoothSerial.subscribe('\n', (data: string) => {
      try {
        const message = data.trim();
        this.addLog(`Dato recibido: ${message}`);

        if (message.startsWith('PESO:')) {
          const weightValue = parseFloat(message.split(':')[1]);
          if (!isNaN(weightValue)) {
            const weightKg = weightValue;
            this._weight.next(weightKg);
            this.updateWeightStatus(weightKg);
          }
        }
        else if (this.isGpsData(message)) {
          this.processGpsData(message);
        }
        else if (message.startsWith('ALERTA:')) {
          const alertMessage = message.substring(7);
          this.addAlert(alertMessage);
        }
      } catch (error) {
        this.addLog(`Error procesando datos: ${error}`);
      }
    }, (error: any) => {
      this.addLog(`Error en listener Bluetooth: ${error}`);
    });
  }

  private updateWeightStatus(weight: number): void {
    if (weight <= 0.5) {
      this._weightStatus.next('Almacenamiento medio vacío');
    } else if (weight > 0.5 && weight <= 0.7) {
      this._weightStatus.next('Robot casi lleno');
    } else if (weight > 0.7) {
      this._weightStatus.next('Robot lleno');
    } else {
      this._weightStatus.next('Desconocido');
    }
  }

  private isGpsData(message: string): boolean {
    const parts = message.split(',');
    if (parts.length === 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      return !isNaN(lat) && !isNaN(lng);
    }
    return false;
  }

  private processGpsData(message: string): void {
    const [latStr, lngStr] = message.split(',');
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (!isNaN(lat) && !isNaN(lng)) {
      this._robotCoordinates.next({ lat, lng });
      this.addLog(`Coordenadas recibidas: Lat ${lat}, Lng ${lng}`);
    }
  }

  async listPairedDevices(): Promise<{name: string, address: string}[]> {
    try {
      const devices = await new Promise<{name: string, address: string}[]>((resolve, reject) => {
        bluetoothSerial.list(
          (devices: any[]) => resolve(devices.map(d => ({ name: d.name, address: d.address }))),
          (error: any) => reject(error)
        );
      });
      this._pairedDevices.next(devices);
      return devices;
    } catch (error) {
      this.addLog(`Error listando dispositivos: ${error}`);
      throw error;
    }
  }

  disconnect(): void {
    if (this.connectedDeviceAddress) {
      bluetoothSerial.disconnect();
      this.connectedDeviceAddress = null;
      this._connectionStatus.next('disconnected');
      this.addLog('Desconectado del dispositivo Bluetooth');
    }
  }

  async sendCommand(command: string): Promise<void> {
    if (!this.connectedDeviceAddress) {
      throw new Error('No hay dispositivo conectado');
    }

    await new Promise<void>((resolve, reject) => {
      bluetoothSerial.write(command + '\n',
        () => {
          this.addLog(`Comando enviado: ${command}`);
          resolve();
        },
        (error: any) => {
          this.addLog(`Error enviando comando: ${error}`);
          reject(error);
        }
      );
    });
  }

  async requestWeight(): Promise<void> {
    return this.sendCommand('GET_WEIGHT');
  }

  async requestLocation(): Promise<void> {
    return this.sendCommand('GET_LOCATION');
  }

  async sendGoHomeCommand(lat: number, lng: number): Promise<void> {
    return this.sendCommand(`GO_HOME:${lat},${lng}`);
  }

  async enableBluetooth(): Promise<boolean> {
    return new Promise((resolve) => {
      bluetoothSerial.enable(
        () => resolve(true),
        () => resolve(false)
      );
    });
  }

  async showBluetoothSettings(): Promise<void> {
    if (this.platform.is('android')) {
      bluetoothSerial.showBluetoothSettings();
    }
  }
}