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

  it('should handle PDF files in processFile method', async () => {
    // Create a mock PDF file
    const pdfFile = new File(['%PDF-1.4 mock content'], 'test.pdf', { type: 'application/pdf' });
    
    // Mock the processPDF method since we can't test actual PDF processing easily
    spyOn(service, 'processPDF').and.returnValue(Promise.resolve({
      content: 'Mock PDF text content',
      confidence: 1.0
    }));

    const result = await service.processFile(pdfFile);
    
    expect(service.processPDF).toHaveBeenCalledWith(pdfFile);
    expect(result.content).toBe('Mock PDF text content');
    expect(result.confidence).toBe(1.0);
  });

  it('should handle image files in processFile method', async () => {
    // Create a mock image file
    const imageFile = new File(['mock image data'], 'test.jpg', { type: 'image/jpeg' });
    
    // Mock the processFileWithFirebase method
    spyOn(service, 'processFileWithFirebase').and.returnValue(Promise.resolve({
      content: 'Mock image OCR text',
      confidence: 0.85
    }));

    const result = await service.processFile(imageFile);
    
    expect(service.processFileWithFirebase).toHaveBeenCalledWith(imageFile);
    expect(result.content).toBe('Mock image OCR text');
    expect(result.confidence).toBe(0.85);
  });

  it('should throw error for unsupported file types', async () => {
    // Create a mock unsupported file
    const unsupportedFile = new File(['mock content'], 'test.txt', { type: 'text/plain' });

    await expectAsync(service.processFile(unsupportedFile))
      .toBeRejectedWithError('Unsupported file type. Please upload an image or PDF file.');
  });
});
