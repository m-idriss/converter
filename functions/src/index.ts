import {onRequest} from "firebase-functions/v2/https";
import {logger} from "firebase-functions";
import * as admin from "firebase-admin";
import Tesseract from "tesseract.js";

admin.initializeApp();

export const processImageText = onRequest(async (req, res) => {
  // Set CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  try {
    const {imageData} = req.body;
    
    if (!imageData) {
      res.status(400).send("Missing image data");
      return;
    }

    logger.info("Processing image with Tesseract");
    
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imageData, "base64");
    
    // Process image with Tesseract
    const result = await Tesseract.recognize(imageBuffer, "eng");
    
    const response = {
      text: result.data.text,
      confidence: result.data.confidence,
    };

    logger.info("Text extraction completed", {confidence: response.confidence});
    res.json(response);
  } catch (error) {
    logger.error("Error processing image:", error);
    res.status(500).send("Internal Server Error");
  }
});

export const parseCalendarEvents = onRequest(async (req, res) => {
  // Set CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  try {
    const {text} = req.body;
    
    if (!text) {
      res.status(400).send("Missing text data");
      return;
    }

    logger.info("Parsing calendar events from text");
    
    // Simple event parsing logic (can be enhanced with AI/ML)
    const events = parseTextForEvents(text);
    
    logger.info(`Found ${events.length} events`);
    res.json({events});
  } catch (error) {
    logger.error("Error parsing events:", error);
    res.status(500).send("Internal Server Error");
  }
});

function parseTextForEvents(text: string) {
  const events: Array<{
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    location?: string;
  }> = [];
  
  const lines = text.split("\n").filter((line) => line.trim().length > 0);
  
  // Enhanced date/time patterns
  const dateTimePatterns = [
    /(\w+\s+\w+\s+\d{1,2},?\s+\d{4})\s+(?:at\s+)?(\d{1,2}:\d{2}\s*(?:AM|PM)?)/gi,
    /(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d{1,2}:\d{2})/gi,
    /(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2}\s*(?:AM|PM)?)/gi,
  ];

  for (const line of lines) {
    for (const pattern of dateTimePatterns) {
      const matches = [...line.matchAll(pattern)];
      
      for (const match of matches) {
        try {
          const dateStr = match[1];
          const timeStr = match[2];
          
          // Create a simple date parsing
          const startDate = new Date(`${dateStr} ${timeStr}`);
          
          if (!isNaN(startDate.getTime())) {
            const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // +1 hour
            
            let title = line.replace(match[0], "").trim();
            title = title.replace(/^(meeting|appointment|event):?\s*/i, "");
            title = title || "Calendar Event";

            events.push({
              title,
              description: `Extracted from: ${line}`,
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
            });
          }
        } catch (error) {
          logger.warn("Error parsing date from line:", line, error);
        }
      }
    }
  }

  // If no events found, create a generic one
  if (events.length === 0) {
    const now = new Date();
    const endTime = new Date(now.getTime() + 60 * 60 * 1000);
    
    events.push({
      title: "Extracted Text Event",
      description: text,
      startDate: now.toISOString(),
      endDate: endTime.toISOString(),
    });
  }

  return events;
}