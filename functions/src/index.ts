import * as functions from "firebase-functions";
import { setGlobalOptions } from "firebase-functions";
import { defineString } from "firebase-functions/params";
import * as admin from "firebase-admin";
import OpenAI from "openai";
import corsLib from "cors";
import dotenv from "dotenv";

const cors = corsLib({ origin: true });

// Load .env.local in local development
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: ".env.local" });
}

// Define Firebase function parameters
const OPENAI_API_KEY = defineString("OPENAI_API_KEY");
const BASE_TEXT_MESSAGE = defineString("BASE_TEXT_MESSAGE");
const PROMPT = defineString("PROMPT");

// Set global options for all functions
setGlobalOptions({ maxInstances: 10 });

// Initialize Firebase Admin SDK
admin.initializeApp();

// Determine OpenAI API key: use local env or Firebase parameter
let openaiKey = process.env.OPENAI_API_KEY;
if (!openaiKey) {
  try {
    openaiKey = OPENAI_API_KEY.value();
  } catch (e) {
    openaiKey = undefined;
  }
}

if (!openaiKey) {
  throw new Error(
    "OpenAI API key is not set. Configure it via `.env.local` (local) or Firebase Functions Parameters (prod)."
  );
}

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: openaiKey });

// Main HTTPS function
export const helloWorld = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const { imageUrls, extraContext, timeZone } = req.body;

      // Validate input
      if (!imageUrls || !Array.isArray(imageUrls)) {
        res.status(400).send({ error: "No images provided" });
        return;
      }

      console.log("🚀 Function invoked at", new Date().toISOString());

      // Prepare the base text message, replacing placeholders
      let baseText = BASE_TEXT_MESSAGE.value().replace(
        /\$\{TIME_ZONE\}/g,
        timeZone || ""
      );

      const currentDate = new Date().toISOString().split("T")[0];
      baseText = baseText.replace(/\$\{CURRENT_DATE\}/g, currentDate);

      if (extraContext) {
        baseText += ` Additional context: ${extraContext}`;
      }

      const currentYear = new Date().getFullYear();
      baseText += `. If a year is explicitly written in the image, use it.
If no year is visible, assume all events happen in ${currentYear}.
Return structured json with list of events. Be consistent with all events.`;

      // Build content array including text and images
      const content: any[] = [{ type: "text", text: baseText }];

      for (const img of imageUrls) {
        if (typeof img === "string" && img.startsWith("http")) {
          content.push({ type: "image_url", image_url: { url: img } });
        } else {
          content.push({
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${img}` },
          });
        }
      }

      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: PROMPT.value() },
          { role: "user", content: content },
        ],
        temperature: 0.2,
        max_tokens: 4096,
      });

      const icsContent = completion.choices[0].message?.content?.trim();

      // Return JSON result
      res.status(200).set("Content-Type", "application/json").send(icsContent);
    } catch (err: any) {
      console.error(err);
      res.status(500).send({ error: err.message || "Failed to convert images" });
    }
  });
});
