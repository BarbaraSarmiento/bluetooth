//src/app/Components/ubicacion/ubicacion.component.ts
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
    console.log('📡 Coordenadas del robot recibidas:', robotCoords); // Agrega este log
    if (robotCoords && robotCoords.lat !== 0 && robotCoords.lng !== 0) {
      this.robotLocation = robotCoords;
      this.addOrUpdateMarker('robot', robotCoords);
    } else {
      console.warn('⚠️ Coordenadas del robot inválidas:', robotCoords);
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
    if (this.robotLocation.lat !== 0 && this.robotLocation.lng !== 0) {
      this.center = this.robotLocation;
    } else {
      alert("Ubicación del robot no disponible aún.");
    }
  }
  
  // Enviar ubicación al robot por Bluetooth
  volverAlUsuario() {
    const lat = this.userLocation.lat;
    const lng = this.userLocation.lng;
    const coordenadas = `${lat},${lng}`;
    this.bluetoothService.sendData(coordenadas);
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
  
  
  
}
