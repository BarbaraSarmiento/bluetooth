import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Platform } from '@ionic/angular';
import { BluetoothSerial } from '@awesome-cordova-plugins/bluetooth-serial/ngx';
import { AlertController, LoadingController } from '@ionic/angular';

declare var bluetoothSerial: any;

@Injectable({ providedIn: 'root' })
export class BluetoothService {
  private _isConnected = new BehaviorSubject<boolean>(false);
  private _connectionStatus = new BehaviorSubject<'disconnected'|'connecting'|'connected'|'error'>('disconnected');
  private _logs = new BehaviorSubject<string[]>([]);
  private _weight = new BehaviorSubject<number>(0);
  private _weightStatus = new BehaviorSubject<string>('Desconocido');
  private _robotCoordinates = new BehaviorSubject<{lat: number, lng: number}|null>(null);
  private _pairedDevices = new BehaviorSubject<{name: string, address: string}[]>([]);
  private _alerts = new BehaviorSubject<string[]>([]);
  private _navigationData = new BehaviorSubject<{distance: number, courseDiff: number}|null>(null);
  
  public isConnected$ = this._isConnected.asObservable();
  public connectionStatus$ = this._connectionStatus.asObservable();
  public logs$ = this._logs.asObservable();
  public weight$ = this._weight.asObservable();
  public weightStatus$ = this._weightStatus.asObservable();
  public robotCoordinates$ = this._robotCoordinates.asObservable();
  public pairedDevices$ = this._pairedDevices.asObservable();
  public alerts$ = this._alerts.asObservable();
  public navigationData$ = this._navigationData.asObservable();

  private connectedDeviceAddress: string | null = null;
  private dataSubscription: any = null;

  constructor(
    private platform: Platform,
    private ngZone: NgZone,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController
  ) {
    this.initializeBluetooth();
    this.checkInitialConnection();
  }

  private initializeBluetooth(): void {
    this.platform.ready().then(() => {
      if (typeof bluetoothSerial === 'undefined') {
        this.addLog('Error: Plugin Bluetooth no disponible');
      } else {
        this.addLog('Bluetooth inicializado correctamente');
        this.setupBluetoothListeners();
      }
    });
  }

  private checkInitialConnection(): void {
    bluetoothSerial.isConnected(
      () => {
        this.ngZone.run(() => {
          this._isConnected.next(true);
          this._connectionStatus.next('connected');
          this.addLog('Reconectado al dispositivo Bluetooth');
        });
      },
      () => {
        this.ngZone.run(() => {
          this._isConnected.next(false);
          this._connectionStatus.next('disconnected');
        });
      }
    );
  }

  private addLog(message: string): void {
    this.ngZone.run(() => {
      const logs = this._logs.getValue();
      logs.push(`${new Date().toLocaleTimeString()}: ${message}`);
      this._logs.next(logs.slice(-100));
      console.log('[Bluetooth]', message);
    });
  }

  private addAlert(message: string): void {
    this.ngZone.run(() => {
      const alerts = this._alerts.getValue();
      alerts.push(message);
      this._alerts.next(alerts.slice(-5));
    });
  }

  async connectToDevice(deviceName = 'CHUAS-BOT'): Promise<boolean> {
    try {
      this._connectionStatus.next('connecting');
      this.addLog(`Conectando a ${deviceName}...`);

      const isEnabled = await this.enableBluetooth();
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
              this.connectedDeviceAddress = device.address;
              this._connectionStatus.next('connected');
              this._isConnected.next(true);
              this.addLog(`Conectado a ${deviceName} (${device.address})`);
              resolve(true);
            });
          },
          (error: any) => {
            this.ngZone.run(() => {
              this._connectionStatus.next('error');
              this.addLog(`Error de conexión: ${JSON.stringify(error)}`);
              resolve(false);
            });
          }
        );
      });
    } catch (error) {
      this.ngZone.run(() => {
        this._connectionStatus.next('error');
        this.addLog(`Error en conexión: ${error}`);
      });
      throw error;
    }
  }

  private setupBluetoothListeners(): void {
    if (this.dataSubscription) {
      bluetoothSerial.unsubscribe();
      this.dataSubscription = null;
    }

    this.dataSubscription = bluetoothSerial.subscribe('\n', (data: string) => {
      this.ngZone.run(() => {
        const message = data.trim();
        console.log('[DATA]', message);

        // Procesar peso
        if (message.startsWith('PESO:')) {
          const weightValue = parseFloat(message.split(':')[1]);
          if (!isNaN(weightValue)) {
            this._weight.next(weightValue);
            this.updateWeightStatus(weightValue);
          }
          return;
        }

        // Procesar coordenadas GPS
        if (this.isGpsData(message)) {
          this.processGpsData(message);
          return;
        }

        // Procesar alertas
        if (message.startsWith('ALERTA:')) {
          this.addAlert(message.substring(7));
          return;
        }

        // Procesar confirmación de HOME
        if (message.startsWith('HOME_SET:')) {
          const coords = message.substring(9).split(',');
          const lat = parseFloat(coords[0]);
          const lng = parseFloat(coords[1]);
          if (!isNaN(lat) && !isNaN(lng)) {
            this.addAlert(`Ruta establecida a: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          }
          return;
        }

        // Procesar datos de navegación
        if (message.startsWith('NAVIGATION:')) {
          const parts = message.substring(11).split(',');
          const distance = parseFloat(parts[0]);
          const courseDiff = parseFloat(parts[1]);
          if (!isNaN(distance) && !isNaN(courseDiff)) {
            this._navigationData.next({ distance, courseDiff });
          }
          return;
        }

        // Otros mensajes
        this.addLog(`Datos recibidos: ${message}`);
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

  private updateWeightStatus(weight: number): void {
    let status = 'Desconocido';
    if (weight <= 0.5) status = 'Almacenamiento medio vacío';
    else if (weight > 0.5 && weight <= 0.7) status = 'Robot casi lleno';
    else if (weight > 0.7) status = 'Robot lleno';
    this._weightStatus.next(status);
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
      this.addLog(`Coordenadas recibidas: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
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
      this._isConnected.next(false);
      this.addLog('Desconectado del dispositivo Bluetooth');
    }
  }

  async sendCommand(command: string): Promise<void> {
    if (!this.connectedDeviceAddress) {
      throw new Error('No hay dispositivo conectado');
    }

    return new Promise<void>((resolve, reject) => {
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

  async sendGoHomeCommand(lat: number, lng: number): Promise<boolean> {
    const loading = await this.loadingCtrl.create({
      message: 'Enviando coordenadas...',
      duration: 5000
    });
    await loading.present();

    try {
      const command = `GO_HOME:${lat.toFixed(6)},${lng.toFixed(6)}`;
      await this.sendCommand(command);
      
      return new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
          loading.dismiss();
          resolve(false);
        }, 5000);

        const sub = this.alerts$.subscribe(alerts => {
          const lastAlert = alerts[alerts.length - 1];
          if (lastAlert.includes('HOME_SET') || lastAlert.includes('Ruta establecida')) {
            clearTimeout(timeout);
            loading.dismiss();
            resolve(true);
          } else if (lastAlert.includes('GPS_NO_FIX')) {
            clearTimeout(timeout);
            loading.dismiss();
            resolve(false);
          }
        });

        setTimeout(() => sub.unsubscribe(), 5000);
      });
    } catch (error) {
      loading.dismiss();
      throw error;
    }
  }

  async enableBluetooth(): Promise<boolean> {
    return new Promise((resolve) => {
      bluetoothSerial.isEnabled(
        () => resolve(true),
        () => {
          bluetoothSerial.enable(
            () => resolve(true),
            () => resolve(false)
          );
        }
      );
    });
  }

  async showBluetoothSettings(): Promise<void> {
    if (this.platform.is('android')) {
      bluetoothSerial.showBluetoothSettings();
    }
  }

  clearAlerts(): void {
    this._alerts.next([]);
  }
}