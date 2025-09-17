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

      const content: any[] = [];
      let baseText = baseTextMessage.value().replace(/\$\{TIME_ZONE\}/g, timeZone);

      const currentDate = new Date().toISOString().split('T')[0];
      baseText = baseText.replace(/\$\{CURRENT_DATE\}/g, currentDate);

      if (extraContext) {
        baseText += ` Additional context: ${extraContext}`;
      }

      const currentYear = new Date().getFullYear();
      baseText += `. If a year is explicitly written in the image, use it.
      If no year is visible, assume all events happen in ${currentYear}.
      Return structured json with list of events. Be consistent with all events.`;

      content.push({ type: 'text', text: baseText });

      for (const img of imageUrls) {
        if (typeof img === "string" && img.startsWith("http")) {
          content.push({
            type: "image_url",
            image_url: {url: img},
          });
        } else {
          content.push({
            type: "image_url",
            image_url: {url: `data:image/jpeg;base64,${img}`},
          });
        }
      }

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
      res.status(200).set('Content-Type', 'application/json').send(icsContent);
    } catch (err: any) {
      console.error(err);
      res.status(500).send({ error: err.message || 'Failed to convert images' });
    }

  });
});
