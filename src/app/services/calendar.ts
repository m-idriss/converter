import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';
import { parse, parseISO, isValid, addHours } from 'date-fns';

export interface CalendarEvent {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  allDay?: boolean;
  timezone?: string;
}

@Injectable({
  providedIn: 'root'
})
export class Calendar {

  constructor() { }

  parseTextForEvents(text: string): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    const lines = text.split('\n').filter(line => line.trim().length > 0);

    // Check if text contains iCalendar format data
    const hasICalendarData = lines.some(line => 
      line.match(/^(DTSTART|DTEND|DTSTAMP|SUMMARY|DESCRIPTION)[:;]/i)
    );

    if (hasICalendarData) {
      return this.parseICalendarFormat(lines);
    }

    // Regex patterns for natural text with dates
    const dateTimePatterns = [
      {
        regex: /^(.+?)\s+(?:on\s+)?(\w+\s+\d{1,2},?\s+\d{4})(?:\s+at\s+)?(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i,
        titleGroup: 1, dateGroup: 2, timeGroup: 3
      }, // ex: "Meeting on January 15, 2025 at 2:00 PM"
      {
        regex: /^(.+?)[:,]\s*(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d{1,2}:\d{2})/i,
        titleGroup: 1, dateGroup: 2, timeGroup: 3
      }, // ex: "Appointment: 01/15/2025 14:00"
      {
        regex: /^(.+?)\s+(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i,
        titleGroup: 1, dateGroup: 2, timeGroup: 3
      }, // ex: "Team Meeting 2025-01-15 2:00 PM"
      {
        regex: /(\d{8}T\d{6}Z?)/i,
        titleGroup: null, dateGroup: 1, timeGroup: null
      } // ex: 20231001T090000Z (standalone timestamp)
    ];

    for (const line of lines) {
      let matched = false;

      for (const pattern of dateTimePatterns) {
        const match = pattern.regex.exec(line);
        if (match) {
          matched = true;

          const titleText = pattern.titleGroup ? match[pattern.titleGroup] : '';
          const dateStr = match[pattern.dateGroup];
          const timeStr = pattern.timeGroup ? match[pattern.timeGroup] || '' : '';

          let eventDate: Date | null = null;

          if (/^\d{8}T\d{6}Z?$/.test(dateStr)) {
            // Parse ISO-like format: 20231001T090000Z
            const isoString = dateStr.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/, '$1-$2-$3T$4:$5:$6Z');
            eventDate = parseISO(isoString);
          } else {
            // Try various date formats with native parsing and date-fns
            const dateTimeCombined = `${dateStr} ${timeStr}`.trim();
            
            // Use a single reference date for all format attempts
            const referenceDate = new Date();
            // Try parsing with different formats
            const formatAttempts = [
              () => parse(dateTimeCombined, 'MMMM d, yyyy h:mm a', referenceDate),
              () => parse(dateTimeCombined, 'MM/dd/yyyy H:mm', referenceDate),
              () => parse(dateTimeCombined, 'yyyy-MM-dd h:mm a', referenceDate),
              () => parse(dateTimeCombined, 'yyyy-MM-dd H:mm', referenceDate),
              () => new Date(dateTimeCombined) // Native parsing as fallback
            ];
            for (const formatAttempt of formatAttempts) {
              try {
                const parsedDate = formatAttempt();
                if (isValid(parsedDate)) {
                  eventDate = parsedDate;
                  break;
                }
              } catch (e) {
                // Continue to next format
              }
            }
          }

          if (eventDate && isValid(eventDate)) {
            let title = titleText ? titleText.trim() : '';
            
            // Clean up common prefixes
            title = title.replace(/^(meeting|appointment|event)[:]\s*/i, '');
            
            // If no meaningful title found, generate one
            if (!title || title.length < 2) {
              title = 'Calendar Event';
            }

            events.push({
              title,
              description: `Extracted from: ${line}`,
              startDate: eventDate,
              endDate: addHours(eventDate, 1),
              allDay: false,
              timezone: 'Europe/Paris'
            });
          }

          break; // Stop as soon as a pattern matches a line
        }
      }
    }

    // Remove exact duplicates (same title + same date)
    const uniqueEvents = events.filter((event, index, self) =>
      index === self.findIndex(e =>
        e.title === event.title &&
        e.startDate.getTime() === event.startDate.getTime()
      )
    );

    if (uniqueEvents.length === 0) {
      const now = new Date();
      return [{
        title: 'Extracted Text Event',
        description: text,
        startDate: now,
        endDate: new Date(now.getTime() + 60 * 60 * 1000),
        allDay: false,
        timezone: 'Europe/Paris'
      }];
    }

    return uniqueEvents;
  }

  private parseICalendarFormat(lines: string[]): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    let currentEvent: Partial<CalendarEvent> = {};
    let inEvent = false;

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine === 'BEGIN:VEVENT') {
        inEvent = true;
        currentEvent = {};
        continue;
      }

      if (trimmedLine === 'END:VEVENT' && inEvent) {
        if (currentEvent.startDate) {
          // Generate a meaningful title if none found
          if (!currentEvent.title || currentEvent.title.trim().length === 0) {
            currentEvent.title = 'Calendar Event';
          }

          events.push({
            title: currentEvent.title || 'Calendar Event',
            description: currentEvent.description || '',
            startDate: currentEvent.startDate,
            endDate: currentEvent.endDate || new Date(currentEvent.startDate.getTime() + 60 * 60 * 1000),
            allDay: currentEvent.allDay || false,
            timezone: currentEvent.timezone || 'Europe/Paris'
          });
        }
        inEvent = false;
        currentEvent = {};
        continue;
      }

      if (inEvent || !inEvent) { // Process iCalendar properties even outside VEVENT blocks
        // Parse iCalendar properties
        if (trimmedLine.startsWith('SUMMARY:')) {
          currentEvent.title = trimmedLine.substring(8).trim();
        } else if (trimmedLine.startsWith('DESCRIPTION:')) {
          currentEvent.description = trimmedLine.substring(12).trim();
        } else if (trimmedLine.match(/^DTSTART[:;]/)) {
          const dateValue = this.extractICalendarDate(trimmedLine);
          if (dateValue) {
            currentEvent.startDate = dateValue;
          }
        } else if (trimmedLine.match(/^DTEND[:;]/)) {
          const dateValue = this.extractICalendarDate(trimmedLine);
          if (dateValue) {
            currentEvent.endDate = dateValue;
          }
        } else if (trimmedLine.match(/^DTSTAMP[:;]/)) {
          // Extract date from DTSTAMP as fallback if no other dates found
          if (!currentEvent.startDate) {
            const dateValue = this.extractICalendarDate(trimmedLine);
            if (dateValue) {
              currentEvent.startDate = dateValue;
            }
          }
        }
      }
    }

    // Handle any remaining event data that wasn't properly closed
    if (currentEvent.startDate && !inEvent) {
      events.push({
        title: currentEvent.title || 'Calendar Event',
        description: currentEvent.description || '',
        startDate: currentEvent.startDate,
        endDate: currentEvent.endDate || new Date(currentEvent.startDate.getTime() + 60 * 60 * 1000),
        allDay: currentEvent.allDay || false,
        timezone: currentEvent.timezone || 'Europe/Paris'
      });
    }

    return events.length > 0 ? events : [{
      title: 'Calendar Event',
      description: 'Extracted from iCalendar format',
      startDate: new Date(),
      endDate: new Date(Date.now() + 60 * 60 * 1000),
      allDay: false,
      timezone: 'Europe/Paris'
    }];
  }

  private extractICalendarDate(line: string): Date | null {
    // Extract datetime value from iCalendar property line
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) return null;

    const dateStr = line.substring(colonIndex + 1).trim();
    
    // Handle different iCalendar date formats
    if (/^\d{8}T\d{6}Z?$/.test(dateStr)) {
      // 20231003T120000Z format
      const isoString = dateStr.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/, '$1-$2-$3T$4:$5:$6Z');
      const parsedDate = parseISO(isoString);
      return isValid(parsedDate) ? parsedDate : null;
    } else if (/^\d{8}$/.test(dateStr)) {
      // 20231003 format (date only)
      try {
        const parsedDate = parse(dateStr, 'yyyyMMdd', new Date());
        return isValid(parsedDate) ? parsedDate : null;
      } catch (e) {
        return null;
      }
    }

    return null;
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
      if (firstEvent.title && firstEvent.title !== 'Calendar Event' && firstEvent.title !== 'Extracted Text Event') {

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
