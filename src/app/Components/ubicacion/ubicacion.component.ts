import { Component, OnInit, OnDestroy } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { GoogleMapsModule } from '@angular/google-maps';
import { BluetoothService } from '../bluetooth.service';
import { CommonModule } from '@angular/common';

interface Marker {
  tipo: 'robot' | 'usuario';
  position: google.maps.LatLngLiteral;
  label: string;
}

@Component({
  selector: 'app-ubicacion',
  standalone: true,
  imports: [CommonModule, GoogleMapsModule],
  templateUrl: './ubicacion.component.html',
  styleUrls: ['./ubicacion.component.css']
})
export class UbicacionComponent implements OnInit, OnDestroy {
  constructor(private bluetoothService: BluetoothService) {}

  // Centro inicial del mapa (fallback)
  center: google.maps.LatLngLiteral = { lat: -2.9001285, lng: -79.0058965 };
  zoom = 12;

  // Posiciones (null mientras no se obtienen)
  robotLocation: google.maps.LatLngLiteral | null = null;
  userLocation: google.maps.LatLngLiteral | null = null;

  // Marcadores
  markers: Marker[] = [];

  // Control de suscripción para robot GPS
  private robotSubscription: any;

  ngOnInit() {
    this.solicitarPermisosUbicacion();
    this.iniciarEscuchaRobot();
    this.obtenerUbicacionUsuario();
  }

  ngOnDestroy() {
    // Limpiar suscripción al salir del componente
    if (this.robotSubscription) {
      this.robotSubscription.unsubscribe();
    }
  }

  // Solicitar permisos de ubicación
  private async solicitarPermisosUbicacion() {
    try {
      const result = await Geolocation.requestPermissions();
      console.log('✅ Permisos de ubicación:', result);
    } catch (error) {
      console.error('❌ Error al solicitar permisos:', error);
    }
  }

  // Escuchar ubicación del robot vía Bluetooth (suscripción única)
  private iniciarEscuchaRobot() {
    this.robotSubscription = this.bluetoothService.listenForGpsCoordinates((lat, lng) => {
      const coords = { lat, lng };
      console.log('📡 Coordenadas del robot:', coords);
      this.robotLocation = coords;
      this.addOrUpdateMarker('robot', coords);
    });
  }

  // Obtener ubicación actual del usuario
  private async obtenerUbicacionUsuario() {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true
      });

      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      console.log('📍 Ubicación del usuario:', coords);
      this.userLocation = coords;
      this.addOrUpdateMarker('usuario', coords);
    } catch (error) {
      console.error('❌ Error al obtener la ubicación del usuario:', error);
    }
  }

  // Mostrar ubicación del usuario y centrar mapa
  async mostrarUbicacionUsuario() {
    await this.obtenerUbicacionUsuario();
    if (this.userLocation) {
      this.center = this.userLocation;
      this.zoom = 16;
    }
  }

  // Mostrar ubicación del robot y centrar mapa
  mostrarUbicacionRobot() {
    if (this.robotLocation) {
      this.center = this.robotLocation;
      this.zoom = 16;
    } else {
      alert('⚠️ Ubicación del robot no disponible aún.');
    }
  }

  // Enviar ubicación del usuario al robot
  enviarUbicacionAlRobot() {
    if (!this.userLocation) {
      alert('⚠️ Ubicación del usuario no disponible.');
      return;
    }

    const { lat, lng } = this.userLocation;
    const coordenadas = `${lat},${lng}`;
    this.bluetoothService.sendData(coordenadas);
    console.log('📤 Coordenadas enviadas al robot:', coordenadas);
  }

  // Añadir o actualizar marcador según tipo
  private addOrUpdateMarker(tipo: 'robot' | 'usuario', position: google.maps.LatLngLiteral) {
    const existingIndex = this.markers.findIndex(m => m.tipo === tipo);
    const markerData: Marker = {
      tipo,
      position,
      label: tipo === 'robot' ? '🤖' : '📍'
    };

    if (existingIndex >= 0) {
      const existingMarker = this.markers[existingIndex];
      // Solo actualiza si la posición cambió
      if (
        existingMarker.position.lat !== position.lat ||
        existingMarker.position.lng !== position.lng
      ) {
        this.markers[existingIndex] = markerData;
      }
    } else {
      this.markers.push(markerData);
    }
  }
}
