import { Component, OnInit } from '@angular/core';
import { BluetoothService } from '../bluetooth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  buttons = [
    { text: 'Home', icon: 'assets/images/home-icon.png', path: '/home' },
    { text: 'Ubicación', icon: 'assets/images/ubicacion-icon.png', path: '/ubicacion' },
    { text: 'Almacenamiento', icon: 'assets/images/bluetooth-icon.png', path: '/bluetooth' }
  ];

  logs: string[] = [];

  constructor(private router: Router, private bluetoothService: BluetoothService) {}

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  ngOnInit() {
    // Puedes mantener la lógica de inicialización del BluetoothService si es necesaria
  }
}