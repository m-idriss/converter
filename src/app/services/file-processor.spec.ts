import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { FileProcessor } from './file-processor';

describe('FileProcessor', () => {
  let service: FileProcessor;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()]
    });
    service = TestBed.inject(FileProcessor);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
