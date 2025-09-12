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

    // Regex without the 'g' flag to avoid duplicates
    const dateTimePatterns = [
      /(\w+\s+\d{1,2},?\s+\d{4})(?:\s+at\s+)?(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i, // ex: January 15, 2025 at 2:00 PM
      /(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d{1,2}:\d{2})/i,                        // ex: 01/15/2025 14:00
      /(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i,                 // ex: 2025-01-15 2:00 PM
      /(\d{8}T\d{6}Z?)/i                                                     // ex: 20231001T090000Z
    ];

    for (const line of lines) {
      let matched = false;

      for (const pattern of dateTimePatterns) {
        const match = pattern.exec(line);
        if (match) {
          matched = true;

          const dateStr = match[1];
          const timeStr = match[2] || '';

          let eventDate: moment.Moment;

          if (/^\d{8}T\d{6}Z?$/.test(dateStr)) {
            eventDate = moment.utc(dateStr, ['YYYYMMDDTHHmmss[Z]', 'YYYYMMDDTHHmmss']);
          } else {
            eventDate = moment(`${dateStr} ${timeStr}`, [
              'MMMM D, YYYY h:mm A',
              'MMMM D YYYY h:mm A',
              'MM/DD/YYYY H:mm',
              'YYYY-MM-DD h:mm A',
              'YYYY-MM-DD H:mm'
            ]);
          }

          if (eventDate.isValid()) {
            let title = line.replace(match[0], '').trim();
            title = title.replace(/^(meeting|appointment|event):?\s*/i, '') || 'Calendar Event';

            events.push({
              title,
              description: `Extracted from: ${line}`,
              startDate: eventDate.toDate(),
              endDate: eventDate.clone().add(1, 'hour').toDate(),
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
        if (!events || events.length === 0) {
          resolve({ success: false, message: 'No events to download' });
          return;
        }

        const icsContent = this.generateICS(events);

        if (!this.validateICSContent(icsContent)) {
          resolve({ success: false, message: 'Generated calendar content is invalid' });
          return;
        }

        const finalFilename = filename || this.generateSmartFilename(events);

        const blob = new Blob([icsContent], {
          type: 'text/calendar;charset=utf-8;component=vevent'
        });

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
    const timestamp = now.toISOString().split('T')[0];
    const eventCount = events.length;

    let baseName = 'calendar-events';
    if (events.length > 0) {
      const firstEvent = events[0];
      if (firstEvent.title && firstEvent.title !== 'Calendar Event' && firstEvent.title !== 'Extracted Text Event') {
        baseName = firstEvent.title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 20);
      }
    }

    return `${baseName}-${eventCount}events-${timestamp}.ics`;
  }

  private validateICSContent(icsContent: string): boolean {
    try {
      const lines = icsContent.split('\r\n');

      if (!lines.includes('BEGIN:VCALENDAR') || !lines.includes('END:VCALENDAR')) {
        return false;
      }

      const hasEvent = lines.some(line => line === 'BEGIN:VEVENT');
      if (!hasEvent) {
        return false;
      }

      const hasVersion = lines.some(line => line.startsWith('VERSION:'));
      const hasProdId = lines.some(line => line.startsWith('PRODID:'));

      return hasVersion && hasProdId;
    } catch (error) {
      console.error('ICS validation error:', error);
      return false;
    }
  }
}
