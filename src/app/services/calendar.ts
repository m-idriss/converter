import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';
import { parse, parseISO, isValid, addHours, addDays, startOfDay } from 'date-fns';

export interface CalendarEvent {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  allDay?: boolean;
  timezone?: string;
  confidence?: number; // 0-1 scale for parsing confidence
}

@Injectable({
  providedIn: 'root',
})
export class Calendar {
  constructor() {}

  /**
   * Simple relative date parsing for common expressions
   */
  private parseSimpleRelativeDate(text: string): Date | null {
    const lowerText = text.toLowerCase().trim();
    const now = new Date();

    if (/\b(today|tonight)\b/.test(lowerText)) {
      return startOfDay(now);
    }
    if (/\btomorrow\b/.test(lowerText)) {
      return startOfDay(addDays(now, 1));
    }
    if (/\bnext\s+friday\b/.test(lowerText)) {
      return startOfDay(addDays(now, (5 - now.getDay() + 7) % 7 || 7));
    }

    return null;
  }

  parseTextForEvents(text: string): CalendarEvent[] {
    const events: CalendarEvent[] = [];

    // Check if text is JSON format with events array
    try {
      const jsonData = JSON.parse(text.trim());
      if (jsonData && jsonData.events && Array.isArray(jsonData.events)) {
        return this.parseJsonEvents(jsonData.events);
      }
    } catch (error) {
      // Try to extract JSON from text that might contain additional content
      const jsonMatch = text.match(/\{[\s\S]*"events"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const jsonData = JSON.parse(jsonMatch[0]);
          if (jsonData && jsonData.events && Array.isArray(jsonData.events)) {
            return this.parseJsonEvents(jsonData.events);
          }
        } catch (innerError) {
          // Still not valid JSON, continue with other parsing methods
        }
      }
    }

    const lines = text.split('\n').filter((line) => line.trim().length > 0);

    // Check if text contains iCalendar format data
    const hasICalendarData = lines.some((line) =>
      line.match(/^(DTSTART|DTEND|DTSTAMP|SUMMARY|DESCRIPTION)[:;]/i),
    );

    if (hasICalendarData) {
      return this.parseICalendarFormat(lines);
    }

    // Enhanced regex patterns for natural text with dates
    const dateTimePatterns = [
      {
        regex:
          /^(.+?)\s+(?:on\s+)?(\w+\s+\d{1,2},?\s+\d{4})(?:\s+at\s+)?(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i,
        titleGroup: 1,
        dateGroup: 2,
        timeGroup: 3,
        confidence: 0.9,
      }, // ex: "Meeting on January 15, 2025 at 2:00 PM"
      {
        regex: /^(.+?)[:,]\s*(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d{1,2}:\d{2})/i,
        titleGroup: 1,
        dateGroup: 2,
        timeGroup: 3,
        confidence: 0.85,
      }, // ex: "Appointment: 01/15/2025 14:00"
      {
        regex: /^(.+?)\s+(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i,
        titleGroup: 1,
        dateGroup: 2,
        timeGroup: 3,
        confidence: 0.9,
      }, // ex: "Team Meeting 2025-01-15 2:00 PM"
      {
        regex:
          /^(.+?)\s+(tomorrow|today|tonight|next\s+friday)(?:\s+at\s+(\d{1,2}:\d{2}\s*(?:AM|PM)?))?/i,
        titleGroup: 1,
        dateGroup: 2,
        timeGroup: 3,
        confidence: 0.8,
      }, // ex: "Meeting tomorrow at 2 PM"
      {
        regex: /(\d{8}T\d{6}Z?)/i,
        titleGroup: null,
        dateGroup: 1,
        timeGroup: null,
        confidence: 0.95,
      }, // ex: 20231001T090000Z (standalone timestamp)
    ];

    for (const line of lines) {
      let matched = false;

      for (const pattern of dateTimePatterns) {
        const match = pattern.regex.exec(line);
        if (match) {
          matched = true;

          const titleText = pattern.titleGroup ? match[pattern.titleGroup] : '';
          const dateStr = match[pattern.dateGroup] || '';
          const timeStr = pattern.timeGroup ? match[pattern.timeGroup] || '' : '';
          let confidence = pattern.confidence || 0.7;

          let eventDate: Date | null = null;

          // Handle relative dates first
          if (dateStr && /\b(tomorrow|today|tonight|next\s+friday)\b/i.test(dateStr)) {
            eventDate = this.parseSimpleRelativeDate(dateStr);
            if (eventDate && timeStr) {
              // Apply time if provided for relative dates
              const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
              if (timeMatch) {
                let hours = parseInt(timeMatch[1]);
                const minutes = parseInt(timeMatch[2]);
                const ampm = timeMatch[3]?.toUpperCase();

                if (ampm === 'PM' && hours !== 12) hours += 12;
                if (ampm === 'AM' && hours === 12) hours = 0;

                eventDate.setHours(hours, minutes, 0, 0);
              } else {
                eventDate.setHours(9, 0, 0, 0); // Default 9 AM
                confidence *= 0.8;
              }
            } else if (eventDate) {
              eventDate.setHours(9, 0, 0, 0); // Default 9 AM
              confidence *= 0.8;
            }
          } else if (/^\d{8}T\d{6}Z?$/.test(dateStr)) {
            // Parse ISO-like format: 20231001T090000Z
            const isoString = dateStr.replace(
              /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/,
              '$1-$2-$3T$4:$5:$6Z',
            );
            eventDate = parseISO(isoString);
            confidence = 0.95;
          } else if (dateStr) {
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
              () => new Date(dateTimeCombined), // Native parsing as fallback
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
              timezone: 'Europe/Paris',
              confidence,
            });
          }

          break; // Stop as soon as a pattern matches a line
        }
      }
    }

    // Remove exact duplicates (same title + same date)
    const uniqueEvents = events.filter(
      (event, index, self) =>
        index ===
        self.findIndex(
          (e) => e.title === event.title && e.startDate.getTime() === event.startDate.getTime(),
        ),
    );

    if (uniqueEvents.length === 0) {
      const now = new Date();
      return [
        {
          title: 'Extracted Text Event',
          description: text,
          startDate: now,
          endDate: new Date(now.getTime() + 60 * 60 * 1000),
          allDay: false,
          timezone: 'Europe/Paris',
          confidence: 0.3, // Low confidence for fallback events
        },
      ];
    }

    return uniqueEvents;
  }

  private parseJsonEvents(jsonEvents: any[]): CalendarEvent[] {
    const events: CalendarEvent[] = [];

    for (const jsonEvent of jsonEvents) {
      try {
        // Parse start date from DTSTART field
        const startDate = this.parseJsonDate(jsonEvent.DTSTART, jsonEvent.TZID);
        const endDate = this.parseJsonDate(jsonEvent.DTEND, jsonEvent.TZID);

        if (startDate) {
          events.push({
            title: jsonEvent.SUMMARY || 'Calendar Event',
            description: jsonEvent.DESCRIPTION || '',
            startDate: startDate,
            endDate: endDate || new Date(startDate.getTime() + 60 * 60 * 1000), // Default 1 hour duration
            location: jsonEvent.LOCATION || '',
            allDay: false,
            timezone: jsonEvent.TZID || 'Europe/Paris',
          });
        }
      } catch (error) {
        console.warn('Failed to parse JSON event:', jsonEvent, error);
        // Continue processing other events
      }
    }

    return events.length > 0
      ? events
      : [
          {
            title: 'Calendar Event',
            description: 'Extracted from JSON format',
            startDate: new Date(),
            endDate: new Date(Date.now() + 60 * 60 * 1000),
            allDay: false,
            timezone: 'Europe/Paris',
          },
        ];
  }

  private parseJsonDate(dateString: string, timeZone?: string): Date | null {
    if (!dateString) return null;

    try {
      // Handle ISO-like format: 20250915T080000Z
      if (/^\d{8}T\d{6}Z?$/.test(dateString)) {
        const isoString = dateString.replace(
          /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/,
          '$1-$2-$3T$4:$5:$6Z',
        );
        const date = parseISO(isoString);

        // If timezone is specified and different from UTC, we may need to adjust
        // For now, we'll treat the parsed date as is since it should be in the correct timezone
        return isValid(date) ? date : null;
      }

      // Try direct ISO parsing
      const date = parseISO(dateString);
      return isValid(date) ? date : null;
    } catch (error) {
      console.warn('Failed to parse date:', dateString, error);
      return null;
    }
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
            endDate:
              currentEvent.endDate || new Date(currentEvent.startDate.getTime() + 60 * 60 * 1000),
            allDay: currentEvent.allDay || false,
            timezone: currentEvent.timezone || 'Europe/Paris',
          });
        }
        inEvent = false;
        currentEvent = {};
        continue;
      }

      if (inEvent || !inEvent) {
        // Process iCalendar properties even outside VEVENT blocks
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
        endDate:
          currentEvent.endDate || new Date(currentEvent.startDate.getTime() + 60 * 60 * 1000),
        allDay: currentEvent.allDay || false,
        timezone: currentEvent.timezone || 'Europe/Paris',
      });
    }

    return events.length > 0
      ? events
      : [
          {
            title: 'Calendar Event',
            description: 'Extracted from iCalendar format',
            startDate: new Date(),
            endDate: new Date(Date.now() + 60 * 60 * 1000),
            allDay: false,
            timezone: 'Europe/Paris',
          },
        ];
  }

  private extractICalendarDate(line: string): Date | null {
    // Extract datetime value from iCalendar property line
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) return null;

    const dateStr = line.substring(colonIndex + 1).trim();

    // Handle different iCalendar date formats
    if (/^\d{8}T\d{6}Z?$/.test(dateStr)) {
      // 20231003T120000Z format
      const isoString = dateStr.replace(
        /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/,
        '$1-$2-$3T$4:$5:$6Z',
      );
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
      'CALSCALE:GREGORIAN',
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
        'END:VEVENT',
      );
    });

    lines.push('END:VCALENDAR');
    return lines.filter((line) => line).join('\r\n');
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

  downloadICS(
    events: CalendarEvent[],
    filename?: string,
  ): Promise<{ success: boolean; message: string; filename?: string }> {
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
          type: 'text/calendar;charset=utf-8;component=vevent',
        });

        // Download file
        saveAs(blob, finalFilename);

        resolve({
          success: true,
          message: `Downloaded ${events.length} event${events.length > 1 ? 's' : ''} successfully`,
          filename: finalFilename,
        });
      } catch (error) {
        console.error('Error downloading ICS file:', error);
        resolve({
          success: false,
          message: 'Failed to download calendar file. Please try again.',
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
      if (
        firstEvent.title &&
        firstEvent.title !== 'Calendar Event' &&
        firstEvent.title !== 'Extracted Text Event'
      ) {
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
      const hasEvent = lines.some((line) => line === 'BEGIN:VEVENT');
      if (!hasEvent) {
        return false;
      }

      // Check for required properties
      const hasVersion = lines.some((line) => line.startsWith('VERSION:'));
      const hasProdId = lines.some((line) => line.startsWith('PRODID:'));

      return hasVersion && hasProdId;
    } catch (error) {
      console.error('ICS validation error:', error);
      return false;
    }
  }
}
