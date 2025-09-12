import * as functions from "firebase-functions";
import { setGlobalOptions } from "firebase-functions";
const cors = require("cors")({ origin: true });
const { defineString } = require("firebase-functions/params");
import * as admin from "firebase-admin";
import OpenAI from "openai";

const baseTextMessage = defineString("BASE_TEXT_MESSAGE");
const prompt = defineString("PROMPT");

require("dotenv").config();

setGlobalOptions({ maxInstances: 10 });
admin.initializeApp();

if (!process.env.OPENAI_API_KEY) {
  throw new Error(
    "OpenAI API key is not set. Please set it using `firebase functions:config:set openai.key`"
  );
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const helloWorld = functions.https.onRequest(async (req, res) => {
  await cors(req, res, async () => {
    try {
      const { imageUrls, extraContext, timeZone } = req.body;

      if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
        res.status(400).send({ error: "No images provided" });
        return;
      }

      // Construire le message utilisateur pour OpenAI
      let baseText = baseTextMessage.value().replace(/\$\{timeZone\}/g, timeZone);
      if (extraContext) {
        baseText += ` Additional context: ${extraContext}`;
      }

      const imagesText = imageUrls
        .map((img: string, idx: number) =>
          img.startsWith("http") ? `Image ${idx + 1} URL: ${img}` : `Image ${idx + 1} base64: ${img}`
        )
        .join("\n");

      const userContent = `${baseText}\n\n${imagesText}`;

      // Appel à OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: prompt.value() },
          { role: "user", content: userContent },
        ],
        temperature: 0.2,
        max_tokens: 4096,
      });

      const icsContent = completion.choices[0].message?.content;

      if (!icsContent) {
        res.status(500).send({ error: "No ICS content returned" });
        return;
      }

      // Retourner en tant que fichier ICS
      res.setHeader("Content-Type", "text/calendar; charset=utf-8");
      res.setHeader("Content-Disposition", "attachment; filename=events.ics");
      res.status(200).send(icsContent);
    } catch (err: any) {
      console.error(err);
      res.status(500).send({ error: err.message || "Failed to generate ICS" });
    }
  });
});
