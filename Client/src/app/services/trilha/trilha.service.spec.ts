import { TestBed } from '@angular/core/testing';

import { TrilhaService } from './trilha.service';

describe('TrilhaService', () => {
  let service: TrilhaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TrilhaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
