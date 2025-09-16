import { Injectable, inject, signal  } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';
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

  constructor() {
    // Configure PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
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
        this.http.post<{ events: any[] }>(this.functionUrl, body)
      );

      // Convert JSON events back to text format for calendar parsing
      const eventText = JSON.stringify(response);

      return {
        content: eventText,
        confidence: 0.85 // Mock confidence value since Firebase OCR doesn't return confidence
      };
    } catch (error) {
      console.error('Error calling Firebase helloWorld:', error);
      throw new Error('Failed to process image with Firebase OCR');
    }
  }

  async processFile(file: File): Promise<ExtractedText> {
    const fileType = file.type;

    if (fileType.startsWith('image/')) {
      return this.processFileWithFirebase(file);
    } else {
      throw new Error('Unsupported file type. Please upload an image or PDF file.');
    }
  }
}
