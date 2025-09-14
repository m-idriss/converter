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
  viewMode: 'grid' | 'list' = 'grid';

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

  getUpcomingEventsCount(): number {
    const now = new Date();
    return this.parsedEvents.filter(event => event.startDate > now).length;
  }

  getEventStatus(event: CalendarEvent): string {
    const now = new Date();
    if (event.startDate > now) {
      return 'upcoming';
    } else if (event.endDate > now) {
      return 'ongoing';
    } else {
      return 'past';
    }
  }

  getEventStatusText(event: CalendarEvent): string {
    const status = this.getEventStatus(event);
    switch (status) {
      case 'upcoming': return 'Upcoming';
      case 'ongoing': return 'Now';
      case 'past': return 'Past';
      default: return '';
    }
  }

  getEventDuration(event: CalendarEvent): string {
    const diffMs = event.endDate.getTime() - event.startDate.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60) * 10) / 10;
    
    if (diffHours < 1) {
      const diffMinutes = Math.round(diffMs / (1000 * 60));
      return `${diffMinutes}min`;
    } else if (diffHours >= 24) {
      const diffDays = Math.round(diffHours / 24 * 10) / 10;
      return `${diffDays}d`;
    } else {
      return `${diffHours}h`;
    }
  }

  getConfidenceClass(confidence: number): string {
    if (confidence >= 0.8) return 'high-confidence';
    if (confidence >= 0.6) return 'medium-confidence';
    return 'low-confidence';
  }

  trackEvent(index: number, event: CalendarEvent): string {
    return `${event.title}-${event.startDate.getTime()}`;
  }

  async copyEventToClipboard(event: CalendarEvent): Promise<void> {
    const eventText = `${event.title}\nDate: ${event.startDate.toLocaleDateString()} at ${event.startDate.toLocaleTimeString()}\n${event.description ? 'Description: ' + event.description + '\n' : ''}${event.location ? 'Location: ' + event.location : ''}`;
    
    try {
      await navigator.clipboard.writeText(eventText);
      this.downloadStatus = { message: 'Event copied to clipboard!', type: 'success' };
      setTimeout(() => {
        this.downloadStatus = null;
      }, 3000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }

  shareEvent(event: CalendarEvent): void {
    const eventText = `${event.title} - ${event.startDate.toLocaleDateString()} at ${event.startDate.toLocaleTimeString()}`;
    
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: eventText,
        url: window.location.href
      }).catch(console.error);
    } else {
      // Fallback: copy to clipboard
      this.copyEventToClipboard(event);
    }
  }
}
