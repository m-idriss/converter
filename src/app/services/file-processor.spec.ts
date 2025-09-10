import { TestBed } from '@angular/core/testing';

import { FileProcessor } from './file-processor';

describe('FileProcessor', () => {
  let service: FileProcessor;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileProcessor);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
