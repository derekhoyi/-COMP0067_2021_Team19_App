import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule,ReactiveFormsModule } from '@angular/forms';
import { RunTestPage } from './run-test.page';
import { ExploreContainerComponentModule } from '../../explore-container/explore-container.module';

import { RunTestPageRoutingModule } from './run-test-routing.module';
import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ExploreContainerComponentModule,
    RunTestPageRoutingModule,
    ReactiveFormsModule
  ],
  declarations: [RunTestPage],
  providers:[
    BarcodeScanner
  ]
})
export class RunTestPageModule {}
