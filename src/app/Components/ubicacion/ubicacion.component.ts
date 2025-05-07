import { Component, OnInit, OnDestroy } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { GoogleMap, GoogleMapsModule, MapMarker } from '@angular/google-maps';
import { BluetoothService } from '../bluetooth.service';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AlertController } from '@ionic/angular/standalone';

interface Marker {
  tipo: 'robot' | 'usuario';
  position: google.maps.LatLngLiteral;
  label: string;
  title: string;
}

@Component({
  selector: 'app-ubicacion',
  standalone: true,
  imports: [CommonModule, GoogleMapsModule],
  templateUrl: './ubicacion.component.html',
  styleUrls: ['./ubicacion.component.css']
})
export class UbicacionComponent implements OnInit, OnDestroy {
  center: google.maps.LatLngLiteral = { lat: -2.9001285, lng: -79.0058965 };
  zoom = 12;
  mapOptions: google.maps.MapOptions = {
    mapTypeId: 'hybrid',
    disableDefaultUI: true,
    zoomControl: true
  };

  markers: Marker[] = [];
  private subscriptions: Subscription[] = [];
  userLocation: google.maps.LatLngLiteral | null = null;
  robotLocation: google.maps.LatLngLiteral | null = null;

  constructor(
    private bluetoothService: BluetoothService,
    private alertCtrl: AlertController
  ) {}

  async ngOnInit() {
    await this.solicitarPermisosUbicacion();
    this.iniciarSuscripciones();
    await this.obtenerUbicacionUsuario();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private async solicitarPermisosUbicacion() {
    try {
      const result = await Geolocation.requestPermissions();
      if (result.location !== 'granted') {
        await this.mostrarAlerta('Permisos', 'Se necesitan permisos de ubicación para mostrar su posición en el mapa');
      }
    } catch (error) {
      console.error('Error al solicitar permisos:', error);
    }
  }

  private iniciarSuscripciones() {
    const subCoords = this.bluetoothService.robotCoordinates$.subscribe(coords => {
      if (coords) {
        this.robotLocation = coords;
        this.actualizarUbicacionRobot(coords);
      }
    });
    this.subscriptions.push(subCoords);
  }

  private actualizarUbicacionRobot(coords: {lat: number, lng: number}) {
    this.addOrUpdateMarker('robot', coords, '🤖 Robot');
    this.centerMap(coords);
  }

  private async obtenerUbicacionUsuario() {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      this.userLocation = coords;
      this.addOrUpdateMarker('usuario', coords, '📍 Usted');
      this.centerMap(coords);
      return true;
    } catch (error) {
      console.error('Error al obtener ubicación:', error);
      await this.mostrarAlerta('Error', 'No se pudo obtener su ubicación');
      return false;
    }
  }

  async actualizarUbicacionUsuario() {
    await this.obtenerUbicacionUsuario();
    if (this.userLocation) {
      this.centerMap(this.userLocation);
    }
  }

  async obtenerUbicacionRobot() {
    try {
      await this.bluetoothService.requestLocation();
      if (this.robotLocation) {
        this.centerMap(this.robotLocation);
      } else {
        await this.mostrarAlerta('GPS', 'Esperando datos de ubicación del robot');
      }
    } catch (error) {
      await this.mostrarAlerta('Ubicación Obtenida', 'Ya tienes la ubicación');
    }
  }

  async volverAUsuario() {
    if (!this.userLocation) {
      const ubicacionObtenida = await this.obtenerUbicacionUsuario();
      if (!ubicacionObtenida) return;
    }
    
    if (this.userLocation) {
      try {
        await this.bluetoothService.sendGoHomeCommand(
          this.userLocation.lat,
          this.userLocation.lng
        );
        await this.mostrarAlerta('Éxito', 'Comando de retorno enviado al robot');
      } catch (error) {
        await this.mostrarAlerta('Error', 'No se pudo enviar el comando de retorno');
      }
    } else {
      await this.mostrarAlerta('Cargando...', 'Espera la señal para mostrar tu ubiacion');
    }
  }

  private centerMap(position: google.maps.LatLngLiteral) {
    this.center = position;
    this.zoom = 18;
  }

  private addOrUpdateMarker(
    tipo: 'robot' | 'usuario', 
    position: google.maps.LatLngLiteral,
    title: string
  ) {
    const existingIndex = this.markers.findIndex(m => m.tipo === tipo);
    const markerData: Marker = {
      tipo,
      position,
      label: tipo === 'robot' ? '🤖' : '📍',
      title
    };

    if (existingIndex >= 0) {
      this.markers[existingIndex] = markerData;
    } else {
      this.markers.push(markerData);
    }
  }

  private async mostrarAlerta(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}