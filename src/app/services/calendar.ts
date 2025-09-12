import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';
import moment from 'moment';

export interface CalendarEvent {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  allDay?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class Calendar {

  constructor() { }

  parseTextForEvents(text: string): CalendarEvent[] {
    const events: CalendarEvent[] = [];

    // First try to parse as a schedule/timetable
    const scheduleEvents = this.parseScheduleFormat(text);
    if (scheduleEvents.length > 0) {
      events.push(...scheduleEvents);
    } else {
      // Fall back to simple date/time pattern matching
      const dateTimeEvents = this.parseDateTimeFormat(text);
      events.push(...dateTimeEvents);
    }

    // If no events found, create a generic event
    if (events.length === 0) {
      const now = new Date();
      events.push({
        title: 'Extracted Text Event',
        description: text,
        startDate: now,
        endDate: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour later
        allDay: false
      });
    }

    return events;
  }

  private parseScheduleFormat(text: string): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    const lines = text.split('\n').filter(line => line.trim().length > 0);

    // Look for time patterns (8H00, 9H00, etc.) that indicate schedule format
    const timePattern = /(\d{1,2}H\d{2})/g;
    const hasScheduleFormat = lines.some(line => timePattern.test(line));

    if (!hasScheduleFormat) {
      return events;
    }

    // Get the current Monday to create recurring weekly events
    const today = moment();
    const startOfWeek = today.clone().startOf('isoWeek'); // Monday

    // Parse schedule by looking for time slots and associated subjects
    let currentTime = '';
    const subjects = new Set<string>(); // Track unique subjects

    for (const line of lines) {
      // Reset regex
      timePattern.lastIndex = 0;
      const timeMatch = timePattern.exec(line);
      
      if (timeMatch) {
        currentTime = timeMatch[0]; // e.g., "8H00"
        
        // Extract subjects from the line after the time
        const afterTime = line.substring(line.indexOf(currentTime) + currentTime.length).trim();
        const subjectsInLine = this.extractSubjectsFromLine(afterTime);
        
        for (const subject of subjectsInLine) {
          subjects.add(subject);
        }
      } else {
        // This might be a continuation line with subjects
        const subjectsInLine = this.extractSubjectsFromLine(line);
        for (const subject of subjectsInLine) {
          subjects.add(subject);
        }
      }
    }

    // Create events for each unique subject found
    let eventIndex = 0;
    for (const subject of subjects) {
      if (subject && subject.length > 0) {
        // Create events throughout the week for this subject
        const dayOfWeek = eventIndex % 5; // Monday to Friday
        const timeSlot = Math.floor(eventIndex / 5) % 8; // 8AM to 3PM
        
        const eventDate = startOfWeek.clone().add(dayOfWeek, 'days');
        eventDate.set({ 
          hour: 8 + timeSlot, 
          minute: 0, 
          second: 0, 
          millisecond: 0 
        });
        
        const event: CalendarEvent = {
          title: subject,
          description: `Course: ${subject}\nExtracted from schedule`,
          startDate: eventDate.toDate(),
          endDate: eventDate.clone().add(1, 'hour').toDate(),
          allDay: false
        };

        events.push(event);
        eventIndex++;
      }
    }

    return events;
  }

  private extractSubjectsFromLine(line: string): string[] {
    const subjects: string[] = [];
    
    // Known subject patterns - be more specific
    const knownSubjects = [
      'PHYSIQUE-CHIMIE',
      'MATHEMATIQUES',
      'FRANCAIS',
      'ANGLAIS LV1',
      'ANGLAIS',
      'ESPAGNOL LV2', 
      'ESPAGNOL',
      'HISTOIRE-GEOGRAPHIE',
      'SCIENCES VIE & TERRE',
      'SCIENCES VIE ET TERRE',
      'SC. ECONO & SOCIALES',
      'SC NUMERIQ TECHNOL',
      'EPS',
      'ACCOMP CHOIX ORIENT',
      'ANGL AS LV1'
    ];

    // Check for exact matches first
    for (const subject of knownSubjects) {
      const regex = new RegExp(`\\b${subject.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      if (regex.test(line)) {
        subjects.push(subject);
      }
    }
    
    // If no known subjects found, try more general patterns but filter carefully
    if (subjects.length === 0) {
      const words = line.split(/\s+/).filter(word => word.length > 0);
      const potentialSubjects = [];
      
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        
        // Skip common non-subject patterns
        if (this.isNonSubjectWord(word)) {
          continue;
        }
        
        // Look for subject-like patterns
        if (word.match(/^[A-Z]+$/)) {
          // Single all-caps word might be subject abbreviation
          if (word.length >= 3 && word.length <= 15) {
            potentialSubjects.push(word);
          }
        } else if (word.match(/^[A-Z][A-Z\s&.-]+$/)) {
          // Multi-word all-caps phrase
          let phrase = word;
          let j = i + 1;
          
          // Collect connected words
          while (j < words.length && 
                 (words[j].match(/^[A-Z&.-]+$/) || words[j] === '&')) {
            phrase += ' ' + words[j];
            j++;
          }
          
          if (phrase.length >= 3 && phrase.length <= 30 && 
              !this.isNonSubjectPhrase(phrase)) {
            potentialSubjects.push(phrase);
            i = j - 1; // Skip processed words
          }
        }
      }
      
      subjects.push(...potentialSubjects);
    }
    
    return [...new Set(subjects)]; // Remove duplicates
  }

  private isNonSubjectWord(word: string): boolean {
    // Room codes, time patterns, common names, etc.
    const nonSubjectPatterns = [
      /^[A-Z]\d+$/, // Room codes like B714
      /^\d{1,2}H\d{2}$/, // Time like 8H00
      /^\[.+\]$/, // Bracketed codes
      /^(YOAN|BASSE|RUPPERT|DELANSAY|ARTICOLLE|MOLIN|GINDEL|MAMACHUBEY|LIEPRIEBE|LANGLADE)$/,
      /^(MOHAMADY|SARIFO|LGT|PARC|IMPERIAL|LYCEE|DU)$/,
      /^(M\.|C\.|H\.|E\.|L\.|N\.|J\.)$/,
      /^(SGT|ANG1|ESP2|G\d+|DAL)$/
    ];
    
    return nonSubjectPatterns.some(pattern => pattern.test(word));
  }

  private isNonSubjectPhrase(phrase: string): boolean {
    const nonSubjectPhrases = [
      /MOHAMADY SARIFO/,
      /LGT PARC IMPERIAL/,
      /LYCEE DU PARC/,
      /BASSE M\./,
      /RUPPERT H\./,
      /DELANSAY E\./,
      /ARTICOLLE L\./,
      /DAL MOLIN C\./,
      /GINDEL C\./,
      /MAMACHUBEY N\./,
      /LIEPRIEBE J\./,
      /LANGLADE M\./
    ];
    
    return nonSubjectPhrases.some(pattern => pattern.test(phrase));
  }

  private parseDateTimeFormat(text: string): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    const lines = text.split('\n').filter(line => line.trim().length > 0);

    // Look for patterns like:
    // - "Meeting on January 15, 2025 at 2:00 PM"
    // - "Appointment: 01/15/2025 14:00"
    // - "Event scheduled for 2025-01-15 2:00 PM"

    const dateTimePatterns = [
      /(\w+\s+\w+\s+\d{1,2},?\s+\d{4})\s+(?:at\s+)?(\d{1,2}:\d{2}\s*(?:AM|PM)?)/gi,
      /(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d{1,2}:\d{2})/gi,
      /(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2}\s*(?:AM|PM)?)/gi
    ];

    for (const line of lines) {
      for (const pattern of dateTimePatterns) {
        const matches = [...line.matchAll(pattern)];

        for (const match of matches) {
          try {
            const dateStr = match[1];
            const timeStr = match[2];

            // Parse the date and time
            const eventDate = moment(`${dateStr} ${timeStr}`, [
              'MMMM D, YYYY h:mm A',
              'MMMM D YYYY h:mm A',
              'MM/DD/YYYY H:mm',
              'YYYY-MM-DD h:mm A',
              'YYYY-MM-DD H:mm'
            ]);

            if (eventDate.isValid()) {
              // Extract title from the line
              let title = line.replace(match[0], '').trim();
              title = title.replace(/^(meeting|appointment|event):?\s*/i, '');
              title = title || 'Extracted Text Event';

              const event: CalendarEvent = {
                title: title,
                description: `Extracted from: ${line}`,
                startDate: eventDate.toDate(),
                endDate: eventDate.add(1, 'hour').toDate(), // Default to 1 hour duration
                allDay: false
              };

              events.push(event);
            }
          } catch (error) {
            console.warn('Error parsing date from line:', line, error);
          }
        }
      }
    }

    return events;
  }

  generateICS(events: CalendarEvent[]): string {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Converter App//Calendar//EN',
      'CALSCALE:GREGORIAN'
    ];

    events.forEach((event, index) => {
      const uid = `event-${Date.now()}-${index}@converter-app.com`;
      const dtstart = this.formatDate(event.startDate, event.allDay || false);
      const dtend = this.formatDate(event.endDate, event.allDay || false);
      const dtstamp = this.formatDate(new Date(), false);

      lines.push(
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART:${dtstart}`,
        `DTEND:${dtend}`,
        `SUMMARY:${this.escapeText(event.title)}`,
        event.description ? `DESCRIPTION:${this.escapeText(event.description)}` : '',
        event.location ? `LOCATION:${this.escapeText(event.location)}` : '',
        'END:VEVENT'
      );
    });

    lines.push('END:VCALENDAR');
    return lines.filter(line => line).join('\r\n');
  }

  private formatDate(date: Date, allDay: boolean): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    if (allDay) {
      return `${year}${month}${day}`;
    } else {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}${month}${day}T${hours}${minutes}${seconds}`;
    }
  }

  private escapeText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  }

  downloadICS(events: CalendarEvent[], filename?: string): Promise<{ success: boolean; message: string; filename?: string }> {
    return new Promise((resolve) => {
      try {
        // Validate events
        if (!events || events.length === 0) {
          resolve({ success: false, message: 'No events to download' });
          return;
        }

        // Generate ICS content
        const icsContent = this.generateICS(events);
        
        // Validate ICS content
        if (!this.validateICSContent(icsContent)) {
          resolve({ success: false, message: 'Generated calendar content is invalid' });
          return;
        }

        // Generate smart filename if not provided
        const finalFilename = filename || this.generateSmartFilename(events);

        // Create blob with proper MIME type
        const blob = new Blob([icsContent], { 
          type: 'text/calendar;charset=utf-8;component=vevent' 
        });

        // Download file
        saveAs(blob, finalFilename);
        
        resolve({ 
          success: true, 
          message: `Downloaded ${events.length} event${events.length > 1 ? 's' : ''} successfully`, 
          filename: finalFilename 
        });
      } catch (error) {
        console.error('Error downloading ICS file:', error);
        resolve({ 
          success: false, 
          message: 'Failed to download calendar file. Please try again.' 
        });
      }
    });
  }

  private generateSmartFilename(events: CalendarEvent[]): string {
    const now = new Date();
    const timestamp = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    const eventCount = events.length;
    
    // Try to get a meaningful name from the first event
    let baseName = 'calendar-events';
    if (events.length > 0) {
      const firstEvent = events[0];
      if (firstEvent.title && firstEvent.title !== 'Extracted Text Event' && firstEvent.title !== 'Extracted Text Event') {
        // Clean the title for filename use
        baseName = firstEvent.title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .substring(0, 20); // Limit length
      }
    }

    return `${baseName}-${eventCount}events-${timestamp}.ics`;
  }

  private validateICSContent(icsContent: string): boolean {
    try {
      // Basic ICS validation
      const lines = icsContent.split('\r\n');
      
      // Check required headers
      if (!lines.includes('BEGIN:VCALENDAR') || !lines.includes('END:VCALENDAR')) {
        return false;
      }
      
      // Check for at least one event
      const hasEvent = lines.some(line => line === 'BEGIN:VEVENT');
      if (!hasEvent) {
        return false;
      }
      
      // Check for required properties
      const hasVersion = lines.some(line => line.startsWith('VERSION:'));
      const hasProdId = lines.some(line => line.startsWith('PRODID:'));
      
      return hasVersion && hasProdId;
    } catch (error) {
      console.error('ICS validation error:', error);
      return false;
    }
  }
}
