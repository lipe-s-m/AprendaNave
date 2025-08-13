import { HubComponent } from './pages/hub/hub.component';
import { StartComponent } from './pages/start/start.component';
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', component: StartComponent, pathMatch: 'full' },
  { path: 'hub', component: HubComponent },
  { path: '**', redirectTo: '' },
];
