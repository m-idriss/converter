import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Auth } from './components/auth/auth';
import { FileUpload } from './components/file-upload/file-upload';
import { Auth as AuthService } from './services/auth';
import { Calendar, CalendarEvent } from './services/calendar';
import { ExtractedText } from './services/file-processor';
import { Observable } from 'rxjs';
import { User } from 'firebase/auth';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, Auth, FileUpload],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('converter-app');
  user$: Observable<User | null>;
  extractedText: ExtractedText | null = null;
  parsedEvents: CalendarEvent[] = [];
  showResults = false;
  downloadStatus: { message: string; type: 'success' | 'error' | 'info' } | null = null;
  isDownloading = false;

  constructor(
    private authService: AuthService,
    private calendarService: Calendar
  ) {
    this.user$ = this.authService.user$;
  }

  onTextExtracted(extractedText: ExtractedText): void {
    this.extractedText = extractedText;
    this.parsedEvents = this.calendarService.parseTextForEvents(extractedText.content);
    this.showResults = true;
  }

  async downloadCalendar(): Promise<void> {
    if (this.parsedEvents.length > 0) {
      this.isDownloading = true;
      this.downloadStatus = { message: 'Preparing download...', type: 'info' };
      
      try {
        const result = await this.calendarService.downloadICS(this.parsedEvents);
        this.downloadStatus = { 
          message: result.message, 
          type: result.success ? 'success' : 'error' 
        };
        
        // Clear status after 5 seconds
        setTimeout(() => {
          this.downloadStatus = null;
        }, 5000);
      } catch (error) {
        this.downloadStatus = { 
          message: 'Unexpected error occurred while downloading', 
          type: 'error' 
        };
        setTimeout(() => {
          this.downloadStatus = null;
        }, 5000);
      } finally {
        this.isDownloading = false;
      }
    }
  }

  resetConverter(): void {
    this.extractedText = null;
    this.parsedEvents = [];
    this.showResults = false;
    this.downloadStatus = null;
    this.isDownloading = false;
  }
}
