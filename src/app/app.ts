import { Component, signal, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Auth } from './components/auth/auth';
import { FileUpload } from './components/file-upload/file-upload';
import { Auth as AuthService } from './services/auth';
import { Calendar, CalendarEvent } from './services/calendar';
import { ExtractedText } from './services/file-processor';
import { PerformanceService } from './services/performance';
import { Observable, Subject } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, Auth, FileUpload],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('converter-app');
  user$: Observable<any | null>;
  extractedText: ExtractedText | null = null;
  parsedEvents: CalendarEvent[] = [];
  showResults = false;
  downloadStatus: { message: string; type: 'success' | 'error' | 'info' } | null = null;
  isDownloading = false;
  viewMode: 'grid' | 'list' = 'grid';
  isMobile = false;
  isAnonymousMode = false;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private calendarService: Calendar,
    private performanceService: PerformanceService,
  ) {
    this.user$ = this.authService.user$;
  }

  ngOnInit(): void {
    this.checkScreenSize();
    
    // Log performance metrics after app initialization (development mode only)
    if (!this.isProduction()) {
      // Delay to allow initial rendering to complete
      setTimeout(() => {
        this.performanceService.logPerformanceReport();
      }, 2000);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 768;
    if (this.isMobile) {
      this.viewMode = 'list'; // Force list view on mobile
    }
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
          type: result.success ? 'success' : 'error',
        };

        // Clear status after 5 seconds
        setTimeout(() => {
          this.downloadStatus = null;
        }, 5000);
      } catch (error) {
        this.downloadStatus = {
          message: 'Unexpected error occurred while downloading',
          type: 'error',
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

  getEventDuration(event: CalendarEvent): string {
    const diffMs = event.endDate.getTime() - event.startDate.getTime();
    const diffHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;

    if (diffHours < 1) {
      const diffMinutes = Math.round(diffMs / (1000 * 60));
      return `${diffMinutes}min`;
    } else if (diffHours >= 24) {
      const diffDays = Math.round((diffHours / 24) * 10) / 10;
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

  getDayAbbreviation(date: Date): string {
    const days = ['DIM.', 'LUN.', 'MAR.', 'MER.', 'JEU.', 'VEN.', 'SAM.'];
    return days[date.getDay()];
  }

  getEventColor(index: number): string {
    const colors = ['blue', 'green', 'orange'];
    return colors[index % colors.length];
  }

  /**
   * Check if app is running in production mode
   */
  private isProduction(): boolean {
    // Simple check for production - can be enhanced with environment import if needed
    return !window.location.hostname.includes('localhost');
  }

  /**
   * Enable anonymous mode for users who want to try without signing in
   */
  enableAnonymousMode(): void {
    this.isAnonymousMode = true;
    this.downloadStatus = {
      message: 'Anonymous mode enabled. Limited to single file processing.',
      type: 'info'
    };
    
    // Clear status after 3 seconds
    setTimeout(() => {
      this.downloadStatus = null;
    }, 3000);
  }

  /**
   * Trigger sign in from anonymous mode
   */
  signIn(): void {
    // Reset anonymous mode and let the auth component handle sign in
    this.isAnonymousMode = false;
  }

  /**
   * Get ARIA label for event items
   */
  getEventAriaLabel(event: CalendarEvent, index: number): string {
    const startTime = event.startDate.toLocaleString();
    const endTime = event.endDate.toLocaleString();
    const confidence = event.confidence ? `${(event.confidence * 100).toFixed(0)}% confidence` : '';
    const location = event.location ? `, location: ${event.location}` : '';
    
    return `Event ${index}: ${event.title} from ${startTime} to ${endTime}${location}. ${confidence}`;
  }

  /**
   * Get ARIA label for date cards
   */
  getDateAriaLabel(date: Date): string {
    return `Date: ${date.toLocaleDateString()}`;
  }

  /**
   * Get ARIA label for status icons
   */
  getStatusIconLabel(type: string): string {
    switch (type) {
      case 'success': return 'Success';
      case 'error': return 'Error';
      default: return 'Information';
    }
  }
}
