import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileProcessor, ExtractedText } from '../../services/file-processor';

@Component({
  selector: 'app-file-upload',
  imports: [CommonModule],
  templateUrl: './file-upload.html',
  styleUrl: './file-upload.scss'
})
export class FileUpload {
  @Output() textExtracted = new EventEmitter<ExtractedText>();
  
  isProcessing = false;
  errorMessage = '';
  dragOver = false;

  constructor(private fileProcessor: FileProcessor) {}

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.processFile(file);
    }
  }

  async processFile(file: File): Promise<void> {
    this.isProcessing = true;
    this.errorMessage = '';

    try {
      const extractedText = await this.fileProcessor.processFile(file);
      this.textExtracted.emit(extractedText);
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'An error occurred while processing the file.';
    } finally {
      this.isProcessing = false;
    }
  }
}
