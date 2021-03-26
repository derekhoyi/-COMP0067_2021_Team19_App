import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AddReagentPage } from './add-reagent.page';
import { ExploreContainerComponentModule } from '../../explore-container/explore-container.module';

import { AddReagentPageRoutingModule } from './add-reagent-routing.module';
import { FormBuilder, FormControl, ReactiveFormsModule, FormArray} from '@angular/forms';
import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ExploreContainerComponentModule,
    AddReagentPageRoutingModule,

    ReactiveFormsModule
  ],
  declarations: [AddReagentPage],
  providers:[
    BarcodeScanner
  ]
})
export class AddReagentPageModule {}
