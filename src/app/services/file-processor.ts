import { Injectable } from '@angular/core';
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface ExtractedText {
  content: string;
  confidence: number;
}

@Injectable({
  providedIn: 'root'
})
export class FileProcessor {
  /**
   * URL of the deployed Firebase function
   * (set in environment.ts for flexibility)
   */
  private functionUrl = "https://api.3dime.com";

  constructor(private http: HttpClient) {
    // Configure PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
  }

  async extractTextFromImage(file: File): Promise<ExtractedText> {
    try {
      const result = await Tesseract.recognize(file, 'eng', {
        logger: m => console.log(m)
      });

      return {
        content: result.data.text,
        confidence: result.data.confidence
      };
    } catch (error) {
      console.error('Error extracting text from image:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  async extractTextFromPDF(file: File): Promise<ExtractedText> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }

      return {
        content: fullText.trim(),
        confidence: 100 // PDF text extraction is generally reliable
      };
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error('Failed to extract text from PDF');
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
        confidence: 100
      };
    } catch (error) {
      console.error('Error calling Firebase helloWorld:', error);
      throw new Error('Failed to process image with Firebase OCR');
    }
  }

  /**
   * Generic entrypoint for file processing
   */
  async processFile(file: File): Promise<ExtractedText> {
    const fileType = file.type;

    if (fileType.startsWith('image/')) {
      return this.extractTextFromImage(file);
    } else if (fileType === 'application/pdf') {
      return this.extractTextFromPDF(file);
    } else {
      throw new Error('Unsupported file type. Please upload an image or PDF file.');
    }
  }
}
