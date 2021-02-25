import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AddReagentPage } from './add-reagent.page';
import { ExploreContainerComponentModule } from '../../explore-container/explore-container.module';

import { AddReagentPageRoutingModule } from './add-reagent-routing.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ExploreContainerComponentModule,
    AddReagentPageRoutingModule
  ],
  declarations: [AddReagentPage]
})
export class AddReagentPageModule {}
