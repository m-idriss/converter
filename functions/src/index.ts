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

      // Return json from API
      baseText += '. Return structured json with list of events. Be consistent with all events.';

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

      const rawContent = completion.choices[0].message?.content?.trim();
      
      // Parse and clean the OpenAI response to extract valid JSON
      let jsonContent = rawContent || '';
      
      // Remove markdown code block formatting if present
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/^```[^\n]*\n/, '').replace(/\n```$/, '');
      }
      
      try {
        // Try to parse as JSON to validate it
        const parsedJson = JSON.parse(jsonContent);
        res.status(200).set('Content-Type', 'application/json').send(parsedJson);
      } catch (parseError) {
        console.error('Failed to parse OpenAI response as JSON:', parseError);
        console.error('Raw content:', rawContent);
        
        // Fallback: return a default structure
        res.status(200).set('Content-Type', 'application/json').send({ 
          events: [],
          error: 'Failed to parse calendar data'
        });
      }
    } catch (err: any) {
      console.error(err);
      res.status(500).send({ error: err.message || 'Failed to convert images' });
    }


  });
});
