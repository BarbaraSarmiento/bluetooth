import { Component, OnInit } from '@angular/core';
import { BluetoothService } from '../bluetooth.service';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [RouterOutlet,],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  logs: string[] = [];
  isMenuActive = false;

  constructor() {}

  toggleMenu(): void {
    this.isMenuActive = !this.isMenuActive;
  }

  ngOnInit() {}
}
