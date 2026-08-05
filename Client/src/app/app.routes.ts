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
import { AprendabotComponent } from './pages/aprendabot/aprendabot.component';
import { DesafioJccComponent } from './pages/desafio-jcc/desafio-jcc.component';
import { PerfilComponent } from './pages/perfil/perfil.component';
import { DesafioMatematicaComponent } from './pages/desafio-matematica/desafio-matematica.component';
import { CriarCursoComponent } from './pages/criar-curso/criar-curso.component';
import { MeusCursosComponent } from './pages/meus-cursos/meus-cursos.component';
import { GerenciarCursoComponent } from './pages/gerenciar-curso/gerenciar-curso.component';
import { AdminComponent } from './pages/admin/admin.component';
import { RankingComponent } from './pages/ranking/ranking.component';
import { GerenciarQuizComponent } from './pages/gerenciar-quiz/gerenciar-quiz.component';

export const routes: Routes = [
  { path: '', component: StartComponent, pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'hub', component: HubComponent, canActivate: [authGuard] },
  { path: 'perfil', component: PerfilComponent, canActivate: [authGuard] },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [authGuard],
  },
  {
    path: 'curso/criar',
    component: CriarCursoComponent,
    canActivate: [authGuard],
  },
  {
    path: 'curso/:id/gerenciar',
    component: GerenciarCursoComponent,
    canActivate: [authGuard],
  },
  { path: 'curso/:cursoId/modulo/:moduloId/quiz/gerenciar', component: GerenciarQuizComponent, canActivate: [authGuard] },
  {
    path: 'meus-cursos',
    component: MeusCursosComponent,
    canActivate: [authGuard],
  },
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
    path: 'aula/:cursoId/:moduloId/:aulaId',
    component: AulaComponent,
    canActivate: [authGuard],
  },
  {
    path: 'teste-final/:trilhaId/:moduloId',
    component: QuizComponent,
    canActivate: [authGuard],
  },
  {
    path: 'desafiojcc',
    component: DesafioJccComponent,
  },
  {
    path: 'desafio-matematica',
    component: DesafioMatematicaComponent,
  },
  {
    path: 'ranking',
    component: RankingComponent,
  },
  {
    path: 'aprendabot',
    component: AprendabotComponent,
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: '' },
];
