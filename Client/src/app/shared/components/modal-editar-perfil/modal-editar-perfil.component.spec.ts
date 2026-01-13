import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalEditarPerfilComponent } from './modal-editar-perfil.component';

describe('ModalEditarPerfilComponent', () => {
  let component: ModalEditarPerfilComponent;
  let fixture: ComponentFixture<ModalEditarPerfilComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalEditarPerfilComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalEditarPerfilComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
