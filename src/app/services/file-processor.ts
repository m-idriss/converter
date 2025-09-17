import { Injectable, inject, signal  } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface ExtractedText {
  content: string;
  confidence?: number;
}

@Injectable({
  providedIn: 'root'
})
export class FileProcessor {
  /**
   * URL of the deployed Firebase function
   * (set in environment.ts for flexibility)
   */
  readonly functionUrl = "https://api.3dime.com";
  private http = inject(HttpClient);

  // Lazy loading properties
  private tesseractPromise: Promise<any> | null = null;
  private pdfjsPromise: Promise<any> | null = null;

  constructor() {
    // PDF.js worker will be configured when needed
  }

  /**
   * Lazy load Tesseract.js
   */
  private async loadTesseract(): Promise<any> {
    if (!this.tesseractPromise) {
      this.tesseractPromise = import('tesseract.js');
    }
    return this.tesseractPromise;
  }

  /**
   * Lazy load PDF.js
   */
  private async loadPdfjs(): Promise<any> {
    if (!this.pdfjsPromise) {
      this.pdfjsPromise = import('pdfjs-dist').then(pdfjsLib => {
        // Configure worker when library is loaded
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.149/build/pdf.worker.min.js`;
        return pdfjsLib;
      });
    }
    return this.pdfjsPromise;
  }

  /**
   * Process image using Tesseract.js OCR (lazy loaded)
   */
  private async processImageWithTesseract(file: File): Promise<ExtractedText> {
    try {
      const Tesseract = await this.loadTesseract();
      
      const { data } = await Tesseract.recognize(file, 'eng', {
        logger: (m: any) => console.log('Tesseract progress:', m)
      });

      return {
        content: data.text,
        confidence: data.confidence / 100 // Convert to 0-1 scale
      };
    } catch (error) {
      console.error('Error processing image with Tesseract:', error);
      throw new Error('Failed to process image with OCR');
    }
  }

  /**
   * Process PDF using PDF.js (lazy loaded)
   */
  private async processPdfWithPdfjs(file: File): Promise<ExtractedText> {
    try {
      const pdfjsLib = await this.loadPdfjs();
      
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({data: arrayBuffer});
      const pdf = await loadingTask.promise;
      
      let fullText = '';
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }

      return {
        content: fullText.trim(),
        confidence: 0.95 // PDF text extraction is highly reliable
      };
    } catch (error) {
      console.error('Error processing PDF:', error);
      throw new Error('Failed to process PDF file');
    }
  }

  /**
   * Convert a file into base64 string (without data URL prefix)
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Send an image file to the Firebase helloWorld function for OCR
   */
  async processFileWithFirebase(
    file: File,
    extraContext = 'OCR depuis Angular'
  ): Promise<ExtractedText> {
    try {
      const base64 = await this.fileToBase64(file);

      const body = {
        imageUrls: [base64],
        extraContext,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      const response = await firstValueFrom(
        this.http.post(this.functionUrl, body, { responseType: 'text' })
      );

      return {
        content: response ?? '',
        confidence: 0.85 // Mock confidence value since Firebase OCR doesn't return confidence
      };
    } catch (error) {
      console.error('Error calling Firebase helloWorld:', error);
      throw new Error('Failed to process image with Firebase OCR');
    }
  }

  async processFile(file: File, forceLocal: boolean = false): Promise<ExtractedText> {
    const fileType = file.type;

    if (fileType.startsWith('image/')) {
      // In anonymous mode or if forced, use local processing only
      if (forceLocal) {
        return await this.processImageWithTesseract(file);
      }
      
      // Try Firebase first (faster), fallback to local Tesseract
      try {
        return await this.processFileWithFirebase(file);
      } catch (error) {
        console.warn('Firebase processing failed, falling back to local OCR:', error);
        return await this.processImageWithTesseract(file);
      }
    } else if (fileType === 'application/pdf') {
      return await this.processPdfWithPdfjs(file);
    } else {
      throw new Error('Unsupported file type. Please upload an image (JPG, PNG) or PDF file.');
    }
  }
}
