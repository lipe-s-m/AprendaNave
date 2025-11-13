import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DesafioJccComponent } from './desafio-jcc.component';

describe('DesafioJccComponent', () => {
  let component: DesafioJccComponent;
  let fixture: ComponentFixture<DesafioJccComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DesafioJccComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DesafioJccComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
