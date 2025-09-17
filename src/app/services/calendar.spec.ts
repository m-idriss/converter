import { TestBed } from '@angular/core/testing';
import { Calendar, CalendarEvent } from './calendar';

describe('Calendar', () => {
  let service: Calendar;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Calendar);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('parseTextForEvents', () => {
    it('should parse common date formats', () => {
      const text = 'Meeting on January 15, 2025 at 2:00 PM\nAppointment: 01/15/2025 14:00';
      const events = service.parseTextForEvents(text);
      
      // Should parse both events correctly
      expect(events.length).toBe(2);
      expect(events[0].title).toContain('Meeting');
      expect(events[1].title).toContain('Appointment');
    });

    it('should parse date formats correctly with date-fns', () => {
      const text = 'Team Meeting 2025-01-15 2:00 PM\nProject Review on December 25, 2024 at 10:30 AM';
      const events = service.parseTextForEvents(text);
      
      expect(events.length).toBe(2);
      
      // Check that dates were parsed correctly
      const firstEvent = events[0];
      expect(firstEvent.title).toBe('Team Meeting');
      expect(firstEvent.startDate.getFullYear()).toBe(2025);
      expect(firstEvent.startDate.getMonth()).toBe(0); // January = 0
      expect(firstEvent.startDate.getDate()).toBe(15);
      
      const secondEvent = events[1];
      expect(secondEvent.title).toBe('Project Review');
      expect(secondEvent.startDate.getFullYear()).toBe(2024);
      expect(secondEvent.startDate.getMonth()).toBe(11); // December = 11
      expect(secondEvent.startDate.getDate()).toBe(25);
    });

    it('should handle iCalendar format text', () => {
      const text = 'DTSTAMP:20231003T120000Z\nDTSTART;TZID=Europe/Paris:20231003T120000\nDTEND;TZID=Europe/Paris:20231003T130000';
      const events = service.parseTextForEvents(text);
      
      expect(events.length).toBeGreaterThanOrEqual(1);
      // Should not use iCalendar property names as titles
      expect(events[0].title).not.toBe('DTSTAMP:');
      expect(events[0].title).not.toBe('DTSTART;TZID=Europe/Paris:');
      expect(events[0].title).not.toBe('DTEND;TZID=Europe/Paris:');
    });

    it('should create default event when no dates found', () => {
      const text = 'Some random text without dates';
      const events = service.parseTextForEvents(text);
      
      expect(events.length).toBe(1);
      expect(events[0].title).toBe('Extracted Text Event');
      expect(events[0].description).toBe(text);
    });

    describe('JSON format parsing', () => {
      it('should parse JSON events with complete data', () => {
        const jsonText = JSON.stringify({
          events: [
            {
              "UID": "event-1",
              "DTSTAMP": "20250916T000000Z",
              "DTSTART": "20250915T080000Z",
              "DTEND": "20250915T090000Z",
              "SUMMARY": "PHYSIQUE-CHIMIE",
              "DESCRIPTION": "Test description",
              "LOCATION": "BASSE M.",
              "TZID": "Europe/Paris"
            },
            {
              "UID": "event-2",
              "DTSTAMP": "20250916T000000Z",
              "DTSTART": "20250915T090000Z",
              "DTEND": "20250915T100000Z",
              "SUMMARY": "SC.NUMERO.TECNOL.",
              "DESCRIPTION": "",
              "LOCATION": "BASSE M.",
              "TZID": "Europe/Paris"
            }
          ]
        });

        const events = service.parseTextForEvents(jsonText);
        
        expect(events.length).toBe(2);
        
        // Check first event
        expect(events[0].title).toBe('PHYSIQUE-CHIMIE');
        expect(events[0].description).toBe('Test description');
        expect(events[0].location).toBe('BASSE M.');
        expect(events[0].timezone).toBe('Europe/Paris');
        expect(events[0].startDate.getUTCHours()).toBe(8);
        expect(events[0].endDate.getUTCHours()).toBe(9);
        
        // Check second event
        expect(events[1].title).toBe('SC.NUMERO.TECNOL.');
        expect(events[1].description).toBe('');
        expect(events[1].location).toBe('BASSE M.');
      });

      it('should handle JSON events with minimal data', () => {
        const jsonText = JSON.stringify({
          events: [
            {
              "DTSTART": "20250915T140000Z",
              "SUMMARY": "Minimal Event"
            }
          ]
        });

        const events = service.parseTextForEvents(jsonText);
        
        expect(events.length).toBe(1);
        expect(events[0].title).toBe('Minimal Event');
        expect(events[0].description).toBe('');
        expect(events[0].location).toBe('');
        expect(events[0].timezone).toBe('Europe/Paris'); // default
        expect(events[0].startDate.getUTCHours()).toBe(14);
        // End date should default to 1 hour after start
        expect(events[0].endDate.getUTCHours()).toBe(15);
      });

      it('should handle empty events array', () => {
        const jsonText = JSON.stringify({
          events: []
        });

        const events = service.parseTextForEvents(jsonText);
        
        expect(events.length).toBe(1);
        expect(events[0].title).toBe('Calendar Event');
        expect(events[0].description).toBe('Extracted from JSON format');
      });

      it('should handle invalid JSON gracefully', () => {
        const invalidJson = '{"events": [{"invalid": }]}';
        
        const events = service.parseTextForEvents(invalidJson);
        
        // Should fall back to text parsing and create default event
        expect(events.length).toBe(1);
        expect(events[0].title).toBe('Extracted Text Event');
      });

      it('should handle JSON without events property', () => {
        const jsonText = JSON.stringify({
          data: "some other data"
        });

        const events = service.parseTextForEvents(jsonText);
        
        // Should fall back to text parsing and create default event
        expect(events.length).toBe(1);
        expect(events[0].title).toBe('Extracted Text Event');
      });

      it('should extract JSON from text with additional content', () => {
        const textWithJson = `Here's the structured JSON for your calendar events:

{
    "events": [
        {
            "UID": "event-1",
            "DTSTAMP": "20250916T000000Z",
            "DTSTART": "20250915T080000Z",
            "DTEND": "20250915T090000Z",
            "SUMMARY": "PHYSIQUE-CHIMIE",
            "DESCRIPTION": "Test description",
            "LOCATION": "BASSE M.",
            "TZID": "Europe/Paris"
        }
    ]
}

This includes all the events found in the image.`;

        const events = service.parseTextForEvents(textWithJson);
        
        expect(events.length).toBe(1);
        expect(events[0].title).toBe('PHYSIQUE-CHIMIE');
        expect(events[0].description).toBe('Test description');
        expect(events[0].location).toBe('BASSE M.');
        expect(events[0].timezone).toBe('Europe/Paris');
      });

      it('should handle malformed dates in JSON events', () => {
        const jsonText = JSON.stringify({
          events: [
            {
              "DTSTART": "invalid-date",
              "SUMMARY": "Event with bad date"
            }
          ]
        });

        const events = service.parseTextForEvents(jsonText);
        
        // Should create default event when no valid events can be parsed
        expect(events.length).toBe(1);
        expect(events[0].title).toBe('Calendar Event');
        expect(events[0].description).toBe('Extracted from JSON format');
      });
    });
  });

  describe('generateICS', () => {
    it('should generate valid ICS content', () => {
      const events: CalendarEvent[] = [{
        title: 'Test Event',
        description: 'Test Description',
        startDate: new Date('2025-01-15T14:00:00'),
        endDate: new Date('2025-01-15T15:00:00'),
        allDay: false
      }];

      const ics = service.generateICS(events);
      
      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('END:VCALENDAR');
      expect(ics).toContain('BEGIN:VEVENT');
      expect(ics).toContain('END:VEVENT');
      expect(ics).toContain('SUMMARY:Test Event');
      expect(ics).toContain('DESCRIPTION:Test Description');
    });

    it('should escape special characters in ICS content', () => {
      const events: CalendarEvent[] = [{
        title: 'Test; Event, with\n special chars',
        description: 'Description with; comma, and\n newline',
        startDate: new Date('2025-01-15T14:00:00'),
        endDate: new Date('2025-01-15T15:00:00'),
        allDay: false
      }];

      const ics = service.generateICS(events);
      
      expect(ics).toContain('SUMMARY:Test\\; Event\\, with\\n special chars');
      expect(ics).toContain('DESCRIPTION:Description with\\; comma\\, and\\n newline');
    });
  });

  describe('downloadICS', () => {
    it('should fail when no events provided', async () => {
      const result = await service.downloadICS([]);
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('No events to download');
    });

    it('should generate smart filename from event title', async () => {
      const events: CalendarEvent[] = [{
        title: 'Important Business Meeting!!!',
        description: 'Test Description',
        startDate: new Date('2025-01-15T14:00:00'),
        endDate: new Date('2025-01-15T15:00:00'),
        allDay: false
      }];

      const result = await service.downloadICS(events);
      
      expect(result.success).toBe(true);
      expect(result.filename).toMatch(/important-business-m-1events-\d{4}-\d{2}-\d{2}\.ics/);
    });

    it('should handle multiple events correctly', async () => {
      const events: CalendarEvent[] = [
        {
          title: 'Event 1',
          startDate: new Date('2025-01-15T14:00:00'),
          endDate: new Date('2025-01-15T15:00:00'),
          allDay: false
        },
        {
          title: 'Event 2',
          startDate: new Date('2025-01-16T14:00:00'),
          endDate: new Date('2025-01-16T15:00:00'),
          allDay: false
        }
      ];

      const result = await service.downloadICS(events);
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Downloaded 2 events successfully');
      expect(result.filename).toMatch(/event-1-2events-\d{4}-\d{2}-\d{2}\.ics/);
    });

    it('should use custom filename when provided', async () => {
      const events: CalendarEvent[] = [{
        title: 'Test Event',
        startDate: new Date('2025-01-15T14:00:00'),
        endDate: new Date('2025-01-15T15:00:00'),
        allDay: false
      }];

      const customFilename = 'my-custom-calendar.ics';
      const result = await service.downloadICS(events, customFilename);
      
      expect(result.success).toBe(true);
      expect(result.filename).toBe(customFilename);
    });
  });

  describe('private methods', () => {
    it('should validate correct ICS content', () => {
      const validICS = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:test\r\nBEGIN:VEVENT\r\nEND:VEVENT\r\nEND:VCALENDAR`;
      
      // Access private method through bracket notation for testing
      const isValid = (service as any).validateICSContent(validICS);
      expect(isValid).toBe(true);
    });

    it('should reject invalid ICS content', () => {
      const invalidICS = 'This is not valid ICS content';
      
      const isValid = (service as any).validateICSContent(invalidICS);
      expect(isValid).toBe(false);
    });

    it('should generate filename with event title', () => {
      const events: CalendarEvent[] = [{
        title: 'Team Meeting',
        startDate: new Date(),
        endDate: new Date(),
        allDay: false
      }];

      const filename = (service as any).generateSmartFilename(events);
      
      expect(filename).toMatch(/team-meeting-1events-\d{4}-\d{2}-\d{2}\.ics/);
    });

    it('should use default name for generic titles', () => {
      const events: CalendarEvent[] = [{
        title: 'Calendar Event',
        startDate: new Date(),
        endDate: new Date(),
        allDay: false
      }];

      const filename = (service as any).generateSmartFilename(events);
      
      expect(filename).toMatch(/calendar-events-1events-\d{4}-\d{2}-\d{2}\.ics/);
    });
  });
});