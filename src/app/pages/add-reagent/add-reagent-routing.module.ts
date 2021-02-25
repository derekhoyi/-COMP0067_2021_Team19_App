import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddReagentPage } from './add-reagent.page';

const routes: Routes = [
  {
    path: '',
    component: AddReagentPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AddReagentPageRoutingModule {}
