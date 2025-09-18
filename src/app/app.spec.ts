import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('File to Calendar Converter');
  });

  it('should not display extracted text card in template', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    // Verify that the extracted text card is not present in the DOM
    expect(compiled.querySelector('.extracted-text-card')).toBeNull();
    // Verify that the text content div is not present in the DOM
    expect(compiled.querySelector('.text-content')).toBeNull();
  });

  it('should enable anonymous mode when enableAnonymousMode is called', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    
    expect(app.isAnonymousMode).toBe(false);
    
    app.enableAnonymousMode();
    
    expect(app.isAnonymousMode).toBe(true);
    expect(app.downloadStatus?.type).toBe('info');
    expect(app.downloadStatus?.message).toContain('Anonymous mode enabled');
  });

  it('should reset anonymous mode when signIn is called', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    
    app.enableAnonymousMode();
    expect(app.isAnonymousMode).toBe(true);
    
    app.signIn();
    
    expect(app.isAnonymousMode).toBe(false);
  });

  it('should have accessibility helper methods', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    
    const mockEvent = {
      title: 'Test Meeting',
      startDate: new Date('2025-01-15T14:00:00'),
      endDate: new Date('2025-01-15T15:00:00'),
      location: 'Conference Room A',
      confidence: 0.9
    };
    
    const ariaLabel = app.getEventAriaLabel(mockEvent, 1);
    expect(ariaLabel).toContain('Event 1');
    expect(ariaLabel).toContain('Test Meeting');
    expect(ariaLabel).toContain('Conference Room A');
    expect(ariaLabel).toContain('90% confidence');
    
    const dateLabel = app.getDateAriaLabel(new Date('2025-01-15'));
    expect(dateLabel).toContain('Date:');
    
    const statusLabel = app.getStatusIconLabel('success');
    expect(statusLabel).toBe('Success');
  });
});
