import { Component } from '@angular/core';
import { BluetoothService } from '../bluetooth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  constructor(private bluetoothService: BluetoothService) {}

  connect() {
    this.bluetoothService.scanAndConnect();
  }

  turnOn() {
    this.bluetoothService.sendData('1');
  }

  turnOff() {
    this.bluetoothService.sendData('0');
  }
}
