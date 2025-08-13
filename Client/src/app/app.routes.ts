import { Routes } from '@angular/router';
import { StartComponent } from './modules/start/start.component';

export const routes: Routes = [
  { path: '', component: StartComponent, pathMatch: 'full' },
  { path: '**', redirectTo: '' },
];
