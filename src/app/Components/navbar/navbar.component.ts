//src/app/Components/navbar/navbar.component.ts
import { Component, OnInit } from '@angular/core';
import { BluetoothService } from '../services/bluetooth.service';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [RouterOutlet, ],  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent  implements OnInit {
  
  constructor() {}



  logs: string[] = [];
  isMenuActive = false;

  toggleMenu(): void {
    this.isMenuActive = !this.isMenuActive;
    console.log(this.isMenuActive);
  }
  ngOnInit() {
    /*this.bluetoothService.logMessages.subscribe(logs => {
      this.logs = logs;
    });*/
  }
  connect() {
   // this.bluetoothService.connectToDevice();
  }
}
