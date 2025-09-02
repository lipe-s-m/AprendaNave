import { HubComponent } from './pages/hub/hub.component';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { ModuloComponent } from './pages/modulo/modulo.component';
import { StartComponent } from './pages/start/start.component';
import { TrilhaComponent } from './pages/trilha/trilha.component';
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', component: StartComponent, pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'hub', component: HubComponent },
  { path: 'home', component: HomeComponent },
  { path: 'trilha/:id', component: TrilhaComponent },
  { path: 'modulo/:trilhaId/:moduloId', component: ModuloComponent },
  { path: '**', redirectTo: '' },
];
