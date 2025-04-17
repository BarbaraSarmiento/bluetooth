//src/app/Components/ubicacion/ubicacion.component.ts
import { Component } from '@angular/core';
import { GoogleMapsModule } from '@angular/google-maps';
import { BluetoothService } from '../bluetooth.service';
@Component({
  selector: 'app-ubicacion',
  imports: [GoogleMapsModule,],
  templateUrl: './ubicacion.component.html',
  styleUrl: './ubicacion.component.css'
})
export class UbicacionComponent {
  center: google.maps.LatLngLiteral = { lat: -2.9001285, lng: -79.0058965 };
  zoom = 12;
  robotLocation: google.maps.LatLngLiteral = { lat: 0, lng: 0 };
  userLocation: google.maps.LatLngLiteral = { lat: 0, lng: 0 };

  constructor(private bluetoothService: BluetoothService) {}

  ngOnInit() {
    // Obtener coordenadas del robot
    this.getRobotLocation();

    // Obtener coordenadas del usuario
    this.getUserLocation();
  }

  // Obtener las coordenadas del robot desde Bluetooth
  async getRobotLocation() {
    const robotCoords = await this.bluetoothService.readGpsCoordinates();
    if (robotCoords) {
      this.robotLocation = robotCoords;
      this.updateMap();
    }
  }

  // Obtener las coordenadas del usuario
  getUserLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          this.userLocation = { lat, lng };
          this.center = this.userLocation; // Actualiza el mapa con la ubicación del usuario
        },
        (error) => {
          console.error('Error obteniendo ubicación del usuario:', error);
        }
      );
    } else {
      console.error('Geolocalización no soportada');
    }
  }

  // Actualizar el mapa con las ubicaciones
  updateMap() {
    this.center = this.robotLocation; // Actualiza el centro del mapa con la ubicación del robot
    // Aquí también puedes actualizar la posición de un marcador para el robot y otro para el usuario
  }

  // Cuando se presiona "Volver", el robot se mueve hacia el usuario
  volverAlUsuario() {
    const lat = this.userLocation.lat;
    const lng = this.userLocation.lng;
    const coordenadas = `${lat},${lng}`;

    this.bluetoothService.sendData(coordenadas); // Enviar las coordenadas del usuario al robot
  }
}

