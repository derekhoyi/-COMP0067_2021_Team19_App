import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScannerPage } from './scanner.page';
import { ExploreContainerComponentModule } from '../../explore-container/explore-container.module';

import { ScannerPageRoutingModule } from './scanner-routing.module';
import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ExploreContainerComponentModule,
    RouterModule.forChild([{ path: '', component: ScannerPage }]),
    ScannerPageRoutingModule
  ],
  declarations: [ScannerPage],
  providers:[
    BarcodeScanner
  ]
})
export class ScannerPageModule {}
