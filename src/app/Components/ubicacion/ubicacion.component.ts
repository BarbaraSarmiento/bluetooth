// src/app/Components/ubicacion/ubicacion.component.ts
import { Geolocation } from '@capacitor/geolocation';
import { Component } from '@angular/core';
import { GoogleMapsModule } from '@angular/google-maps';
import { BluetoothService } from '../bluetooth.service';
import { CommonModule } from '@angular/common'; // 👈 esto es clave

@Component({
  selector: 'app-ubicacion',
  standalone: true,
  imports: [CommonModule, GoogleMapsModule],
  templateUrl: './ubicacion.component.html',
  styleUrls: ['./ubicacion.component.css']
})
export class UbicacionComponent {
  // Centro del mapa
  center: google.maps.LatLngLiteral = { lat: -2.9001285, lng: -79.0058965 };
  zoom = 12;

  // Posiciones
  robotLocation: google.maps.LatLngLiteral = { lat: 0, lng: 0 };
  userLocation: google.maps.LatLngLiteral = { lat: 0, lng: 0 };
  intervaloRobot: any = null;

  // Arreglo de marcadores
  markers: any[] = [];

  constructor(private bluetoothService: BluetoothService) {}

  ngOnInit() {
    this.getRobotLocation();
    this.getUserLocation();
  }

  // Obtener ubicación del robot por Bluetooth
  async getRobotLocation() {
    const robotCoords = await this.bluetoothService.readGpsCoordinates();
    if (robotCoords) {
      this.robotLocation = robotCoords;
      this.addOrUpdateMarker('robot', robotCoords);
    }
  }

  // Obtener ubicación del usuario
  async getUserLocation() {
    try {
      const position = await Geolocation.getCurrentPosition();
      this.userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      this.addOrUpdateMarker('usuario', this.userLocation);
    } catch (error) {
      console.error('Error al obtener la ubicación del usuario:', error);
    }
  }

  // Mostrar ubicación del usuario al presionar el botón
  async mostrarUbicacion() {
    await this.getUserLocation();
    this.center = this.userLocation;
  }

  async mostrarUbicacionRobot() {
    await this.getRobotLocation();
    this.center = this.robotLocation;
  }

  // Enviar ubicación al robot por Bluetooth
  volverAlUsuario() {
    if (this.intervaloRobot) clearInterval(this.intervaloRobot);

    this.intervaloRobot = setInterval(async () => {
      await this.getRobotLocation();
      this.center = this.robotLocation;

      const distancia = this.calcularDistancia(
        this.robotLocation.lat, this.robotLocation.lng,
        this.userLocation.lat, this.userLocation.lng
      );

      if (distancia < 5) { // Si ya está a 5 metros
        clearInterval(this.intervaloRobot);
      }
    }, 2000); // Cada 2 segundos actualiza
  }

  // Añadir o actualizar marcador
  addOrUpdateMarker(tipo: 'robot' | 'usuario', position: google.maps.LatLngLiteral) {
    const existingIndex = this.markers.findIndex(m => m.tipo === tipo);
    const markerData = {
      tipo,
      position,
      label: tipo === 'robot' ? '🤖' : '📍'
    };

    if (existingIndex >= 0) {
      this.markers[existingIndex] = markerData;
    } else {
      this.markers.push(markerData);
    }
  }

  // Calcular distancia entre dos coordenadas
  calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // radio de la Tierra en metros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Resultado en metros
  }
}
