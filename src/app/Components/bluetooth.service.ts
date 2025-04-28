import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Platform } from '@ionic/angular';
import { BluetoothSerial } from '@awesome-cordova-plugins/bluetooth-serial/ngx';

declare var bluetoothSerial: any;

@Injectable({ providedIn: 'root' })
export class BluetoothService {
  // Estados centralizados
  private _isConnected = new BehaviorSubject<boolean>(false);
  public isConnected$ = this._isConnected.asObservable();

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
  private dataSubscription: any = null;

  constructor(private platform: Platform, private ngZone: NgZone) {
    this.initializeBluetooth();
    this.checkInitialConnection();
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

  private checkInitialConnection(): void {
    bluetoothSerial.isConnected(
      () => {
        this._isConnected.next(true);
        this._connectionStatus.next('connected');
        this.setupBluetoothListeners();
      },
      () => {
        this._isConnected.next(false);
        this._connectionStatus.next('disconnected');
      }
    );
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

  async connectToDevice(deviceName = 'CHUAS-BOT'): Promise<boolean> {
    try {
      this._connectionStatus.next('connecting');
      this.addLog(`Conectando a ${deviceName}...`);

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
            this.ngZone.run(() => {
              // Elimina cualquier router.navigate() de aquí
              this.connectedDeviceAddress = device.address;
              this._connectionStatus.next('connected');
              this._isConnected.next(true);
              resolve(true); // Solo resuelve true/false
            });
          },
          (error: any) => {
            this.ngZone.run(() => {
              this._connectionStatus.next('error');
              this.addLog(`Error de conexión: ${error}`);
              resolve(false);
            });
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
    // Limpiar suscripción anterior si existe
    if (this.dataSubscription) {
      bluetoothSerial.unsubscribe();
      this.dataSubscription = null;
    }

    this.dataSubscription = bluetoothSerial.subscribe('\n', (data: string) => {
      this.ngZone.run(() => {
        const message = data.trim();
        console.log('[DEBUG] Mensaje RAW recibido:', message);

        if (message.includes('PESO')) {
          const weightValue = parseFloat(message.split(':')[1]);
          if (!isNaN(weightValue)) {
            console.log('[DEBUG] Peso parseado:', weightValue);
            this._weight.next(weightValue);
            this.updateWeightStatus(weightValue);
          } else {
            console.warn('[DEBUG] No se pudo parsear peso de:', message);
          }
          return;
        }

        if (this.isGpsData(message)) {
          this.processGpsData(message);
        } else {
          this.addLog(`Datos recibidos: ${message}`);
        }
      });
    }, (error: any) => {
      this.ngZone.run(() => {
        console.error('Error en listener Bluetooth:', error);
        this.addLog(`Error en conexión: ${error}`);
        this._connectionStatus.next('error');
        this._isConnected.next(false);
      });
    });
  }

  // Resto de los métodos permanecen igual...
  // ... (updateWeightStatus, isGpsData, processGpsData, listPairedDevices, etc.)


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