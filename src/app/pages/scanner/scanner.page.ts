import { Component } from '@angular/core';
import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx';
import { AuthService } from './../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-scanner',
  templateUrl: 'scanner.page.html',
  styleUrls: ['scanner.page.scss']
})
export class ScannerPage {
  scannedCode: any;
  scannedCodeText: string;
  baseURI: string = environment.url;

  constructor(
    private barcodeScanner: BarcodeScanner,
    private authService: AuthService, 
  ) {}

  scan() {
    this.scannedCode = null;
    this.barcodeScanner.scan().then(barcodeData => {
      console.log('Barcode data', barcodeData);
      this.scannedCode = barcodeData;
      this.scannedCodeText = this.scannedCode.text;
    }).catch(err => {
      console.log('Error', err);
    });
  }

  ngOnInit() {
    this.scan();
  }
  
  // log out
  logout() {
    this.authService.logout();
  }
}

