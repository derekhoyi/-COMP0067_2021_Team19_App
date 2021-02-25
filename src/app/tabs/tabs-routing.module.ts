import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'add',
        loadChildren: () => import('../pages/add-reagent/add-reagent.module').then(m => m.AddReagentPageModule)
      },
      {
        path: 'run',
        loadChildren: () => import('../pages/run-test/run-test.module').then(m => m.RunTestPageModule)
      },
      {
        path: 'scan',
        loadChildren: () => import('../pages/scanner/scanner.module').then(m => m.ScannerPageModule)
      },
      {
        path: '',
        redirectTo: '/tabs/run',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: '/tabs/run',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class TabsPageRoutingModule {}
