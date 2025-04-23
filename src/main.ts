import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial';
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
