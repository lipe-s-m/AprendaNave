import { TestBed } from '@angular/core/testing';

import { DesafioJccService } from './desafio-jcc.service';

describe('DesafioJccService', () => {
  let service: DesafioJccService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DesafioJccService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
