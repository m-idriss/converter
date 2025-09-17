import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface ExtractedText {
  content: string;
  confidence?: number;
}

@Injectable({
  providedIn: 'root',
})
export class FileProcessor {
  /**
   * URL of the deployed Firebase function
   * (set in environment.ts for flexibility)
   */
  readonly functionUrl = 'https://api.3dime.com';
  private http = inject(HttpClient);

  constructor() {
    // Simplified constructor - no more OCR libraries needed
  }

  /**
   * Convert file to image format for server processing
   */
  private async convertFileToImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (file.type === 'application/pdf') {
        // For PDFs, we'll render the first page to canvas
        this.renderPdfToCanvas(file, canvas, ctx!)
          .then(() => {
            const base64 = canvas.toDataURL('image/png').split(',')[1];
            resolve(base64);
          })
          .catch(reject);
      } else if (file.type.startsWith('image/')) {
        // For images, load and convert to standard format
        const img = new Image();
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx!.drawImage(img, 0, 0);
          const base64 = canvas.toDataURL('image/png').split(',')[1];
          resolve(base64);
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      } else {
        reject(new Error('Unsupported file type'));
      }
    });
  }

  /**
   * Render PDF to canvas (simplified version)
   */
  private async renderPdfToCanvas(
    file: File,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
  ): Promise<void> {
    // Load PDF.js dynamically only for rendering to canvas
    const pdfjsLib = await import('pdfjs-dist');
    // Use the correct worker URL - the file is actually called pdf.worker.mjs in newer versions
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.149/build/pdf.worker.mjs`;

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    // Render only the first page
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.5 });

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: ctx,
      viewport: viewport,
      canvas: canvas,
    }).promise;
  }

  /**
   * Send file (converted to image) to server for processing
   */
  async processFile(file: File): Promise<ExtractedText> {
    try {
      console.log('Converting file to image for server processing:', file.name);
      const imageBase64 = await this.convertFileToImage(file);

      const body = {
        imageUrls: [imageBase64],
        extraContext: `File processing: ${file.name} (${file.type})`,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      console.log('Sending image to server for text extraction');
      const response = await firstValueFrom(
        this.http.post(this.functionUrl, body, { responseType: 'text' }),
      );

      return {
        content: response ?? '',
        confidence: 0.9, // Server-side processing confidence
      };
    } catch (error) {
      console.error('Error processing file:', error);

      if (error instanceof Error) {
        if (error.message.includes('Unsupported file type')) {
          throw new Error('Unsupported file type. Please upload an image (JPG, PNG) or PDF file.');
        }
      }

      throw new Error('Failed to process file. Please try again or contact support.');
    }
  }
}
