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

    // Simple pattern matching for common date/time formats and event indicators
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
              title = title || 'Calendar Event';

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

  downloadICS(events: CalendarEvent[], filename: string = 'calendar-events.ics'): void {
    const icsContent = this.generateICS(events);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    saveAs(blob, filename);
  }
}
