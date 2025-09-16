import * as functions from "firebase-functions";
import {setGlobalOptions} from "firebase-functions";
const cors = require("cors")({origin: true});
const { defineString } = require('firebase-functions/params');

const admin = require('firebase-admin');
const OpenAI = require('openai');
const baseTextMessage = defineString('BASE_TEXT_MESSAGE');
const prompt = defineString('PROMPT');

require('dotenv').config();

setGlobalOptions({ maxInstances: 10 });

admin.initializeApp();

if (!process.env.OPENAI_API_KEY) {
  throw new Error(
    "OpenAI API key is not set. Please set it using `firebase functions:config:set openai.key"
  );
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Helper function to parse ICS content and extract events as JSON objects
function parseICSToJSON(icsContent: string): any[] {
  if (!icsContent || typeof icsContent !== 'string') {
    return [];
  }

  const events: any[] = [];
  const lines = icsContent.split(/\r?\n/);
  let currentEvent: any = {};
  let inEvent = false;

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = {};
      continue;
    }

    if (trimmedLine === 'END:VEVENT' && inEvent) {
      if (currentEvent.DTSTART) {
        // Generate UID if not present
        if (!currentEvent.UID) {
          currentEvent.UID = `event-${events.length + 1}`;
        }
        // Set default timezone if not present
        if (!currentEvent.TZID) {
          currentEvent.TZID = 'Europe/Paris';
        }
        events.push(currentEvent);
      }
      inEvent = false;
      currentEvent = {};
      continue;
    }

    if (inEvent) {
      // Parse iCalendar properties
      if (trimmedLine.startsWith('UID:')) {
        currentEvent.UID = trimmedLine.substring(4).trim();
      } else if (trimmedLine.startsWith('DTSTAMP:')) {
        currentEvent.DTSTAMP = trimmedLine.substring(8).trim();
      } else if (trimmedLine.match(/^DTSTART[:;]/)) {
        const colonIndex = trimmedLine.indexOf(':');
        const semicolonIndex = trimmedLine.indexOf(';');
        const separatorIndex = colonIndex !== -1 ? colonIndex : semicolonIndex;
        if (separatorIndex !== -1) {
          currentEvent.DTSTART = trimmedLine.substring(separatorIndex + 1).trim();
        }
      } else if (trimmedLine.match(/^DTEND[:;]/)) {
        const colonIndex = trimmedLine.indexOf(':');
        const semicolonIndex = trimmedLine.indexOf(';');
        const separatorIndex = colonIndex !== -1 ? colonIndex : semicolonIndex;
        if (separatorIndex !== -1) {
          currentEvent.DTEND = trimmedLine.substring(separatorIndex + 1).trim();
        }
      } else if (trimmedLine.startsWith('SUMMARY:')) {
        currentEvent.SUMMARY = trimmedLine.substring(8).trim();
      } else if (trimmedLine.startsWith('DESCRIPTION:')) {
        currentEvent.DESCRIPTION = trimmedLine.substring(12).trim();
      } else if (trimmedLine.startsWith('LOCATION:')) {
        currentEvent.LOCATION = trimmedLine.substring(9).trim();
      }
    }
  }

  return events;
}

export const helloWorld = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const { imageUrls, extraContext, timeZone } = req.body;

      if (!imageUrls || !Array.isArray(imageUrls)) {
        res.status(400).send({ error: 'No images provided' });
        return;
      }

      console.log("🚀 Function updated at", new Date().toISOString());

      // Préparer le contenu pour OpenAI
      const content: any[] = [];
      let baseText = baseTextMessage.value().replace(/\$\{TIME_ZONE\}/g, timeZone);

      const currentDate = new Date().toISOString().split('T')[0];
      baseText = baseText.replace(/\$\{CURRENT_DATE\}/g, currentDate);

      if (extraContext) {
        baseText += ` Additional context: ${extraContext}`;
      }
      content.push({ type: 'text', text: baseText });

     // ✅ Ajout: support URL ou base64
      for (const img of imageUrls) {
        if (typeof img === "string" && img.startsWith("http")) {
          // Si c’est une URL
          content.push({
            type: "image_url",
            image_url: {url: img},
          });
        } else {
          // Sinon, on suppose du base64
          content.push({
            type: "image_url",
            image_url: {url: `data:image/jpeg;base64,${img}`},
          });
        }
      }

      // Appel OpenAI
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: prompt,
          },
          {
            role: 'user',
            content: content,
          },
        ],
        temperature: 0.2,
        max_tokens: 4096,
      });

      const icsContent = completion.choices[0].message?.content?.trim();
      
      // Parse ICS content to extract events as JSON objects
      const events = parseICSToJSON(icsContent || '');
      
      // Return JSON response instead of ICS
      res.status(200).set('Content-Type', 'application/json').send({ events });
    } catch (err: any) {
      console.error(err);
      res.status(500).send({ error: err.message || 'Failed to convert images' });
    }


  });
});
