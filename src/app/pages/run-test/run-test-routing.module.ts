import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RunTestPage } from './run-test.page';

const routes: Routes = [
  {
    path: '',
    component: RunTestPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RunTestPageRoutingModule {}
