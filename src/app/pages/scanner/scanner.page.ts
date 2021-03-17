import { Component } from '@angular/core';
import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx';

@Component({
  selector: 'app-scanner',
  templateUrl: 'scanner.page.html',
  styleUrls: ['scanner.page.scss']
})
export class ScannerPage {
  scannedCode: any;
  scannedCodeText: string;

  constructor(private barcodeScanner: BarcodeScanner) {}
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
}

