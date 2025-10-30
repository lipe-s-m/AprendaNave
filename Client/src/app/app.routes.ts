import { HubComponent } from './pages/hub/hub.component';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { ModuloComponent } from './pages/modulo/modulo.component';
import { StartComponent } from './pages/start/start.component';
import { TrilhaComponent } from './pages/trilha/trilha.component';
import { AulaComponent } from './pages/aula/aula.component';
import { Router, Routes } from '@angular/router';
import { authGuard } from './guards/auth/auth.guard';
import { AuthService } from './services/auth/auth.service';
import { QuizComponent } from './pages/quiz/quiz/quiz.component';
import { PerfilComponent } from './pages/perfil/perfil.component';

export const routes: Routes = [
  { path: '', component: StartComponent, pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'hub', component: HubComponent, canActivate: [authGuard] },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: 'perfil', component: PerfilComponent, canActivate: [authGuard] },
  {
    path: 'trilha/:id',
    component: TrilhaComponent,
    canActivate: [authGuard],
  },
  {
    path: 'modulo/:trilhaId/:moduloId',
    component: ModuloComponent,
    canActivate: [authGuard],
  },
  {
    path: 'aula/:trilhaId/:moduloId/:aulaId',
    component: AulaComponent,
    canActivate: [authGuard],
  },
  {
    path: 'teste-final/:trilhaId/:moduloId',
    component: QuizComponent,
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: '' },
];
