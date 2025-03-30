import { Component, OnInit } from '@angular/core';
import { BluetoothService } from '../bluetooth.service';
import { NgFor, NgForOf } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [NgFor,NgForOf],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  logs: string[] = [];

  constructor(private bluetoothService: BluetoothService) {}

  ngOnInit() {
    this.bluetoothService.logMessages.subscribe(logs => {
      this.logs = logs;
    });
  }
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
