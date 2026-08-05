import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../environments/environment';
import { SubheaderComponent } from '../../shared/components/subheader/subheader.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    SubheaderComponent,
    LoaderComponent,
    ButtonComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    ConfirmModalComponent,
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit {
  apiUrl = environment.apiUrl;
  isLoading = signal(true);
  error = signal<string | null>(null);
  abaAtiva = signal('cursos');
  /** Identifica a ação em andamento: `${tipo}:${id}`. */
  processando = signal<string | null>(null);

  pendentes = signal<{ cursos: any[]; modulos: any[]; aulas: any[] }>({
    cursos: [], modulos: [], aulas: [],
  });
  quizzesPendentes = signal<any[]>([]);
  questoesPendentes = signal<any[]>([]);
  cursosGerenciaveis = signal<any[]>([]);

  modalRejeitar = signal<{ aberto: boolean; tipo: string; id: number; nome: string }>({
    aberto: false, tipo: '', id: 0, nome: '',
  });

  constructor(private http: HttpClient, public router: Router, private toastr: ToastrService) {}

  ngOnInit(): void {
    this.carregarPendentes();
  }

  carregarPendentes(): void {
    this.isLoading.set(true);
    this.http.get<any>(`${this.apiUrl}/admin/pendentes`).subscribe({
      next: (data) => {
        this.pendentes.set(data);
        this.error.set(null);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.status === 403 ? 'Acesso restrito a administradores.' : 'Erro ao carregar.');
        this.isLoading.set(false);
      },
    });
    this.http.get<any[]>(`${this.apiUrl}/admin/quizzes/pendentes`).subscribe({ next: (quizzes) => this.quizzesPendentes.set(quizzes), error: () => this.quizzesPendentes.set([]) });
    this.http.get<any[]>(`${this.apiUrl}/admin/questoes/pendentes`).subscribe({ next: (questoes) => this.questoesPendentes.set(questoes), error: () => this.questoesPendentes.set([]) });
    this.http.get<any[]>(`${this.apiUrl}/admin/cursos`).subscribe({ next: (cursos) => this.cursosGerenciaveis.set(cursos), error: () => this.cursosGerenciaveis.set([]) });
  }

  setAba(aba: string): void {
    this.abaAtiva.set(aba);
  }

  gerenciarCurso(cursoId: number): void {
    this.router.navigate(['/curso', cursoId, 'gerenciar']);
  }

  aprovar(tipo: string, id: number): void {
    this.processando.set(`${tipo}:${id}`);
    this.http.patch(`${this.apiUrl}/admin/${tipo}/${id}/aprovar`, {}).subscribe({
      next: () => {
        this.toastr.success('Aprovado!', 'Sucesso');
        this.processando.set(null);
        this.carregarPendentes();
      },
      error: (err) => {
        const mensagem = err.error?.error || 'Erro ao aprovar';
        this.toastr.error(mensagem, 'Erro');
        this.processando.set(null);
      },
    });
  }

  pedirRejeicao(tipo: string, item: any): void {
    const nome = item.nome || item.titulo || 'este item';
    this.modalRejeitar.set({ aberto: true, tipo, id: item.id, nome });
  }

  fecharModalRejeitar(): void {
    this.modalRejeitar.set({ aberto: false, tipo: '', id: 0, nome: '' });
  }

  confirmarRejeicao(): void {
    const { tipo, id } = this.modalRejeitar();
    this.fecharModalRejeitar();
    this.processando.set(`${tipo}:${id}`);
    this.http.patch(`${this.apiUrl}/admin/${tipo}/${id}/rejeitar`, {}).subscribe({
      next: () => {
        this.toastr.success('Rejeitado!', 'Sucesso');
        this.processando.set(null);
        this.carregarPendentes();
      },
      error: (err) => {
        this.toastr.error(err.error?.error || 'Erro ao rejeitar', 'Erro');
        this.processando.set(null);
      },
    });
  }
}
