import "dotenv/config";
import axios from "axios";
// import { GoogleGenAI } from "@google/genai";

import schedule from "node-schedule";

// const ai = new GoogleGenAI({ apiKey: process.env.OPENAI_API_KEY });

const ai_image_link = process.env.IMAGE_CREATION_API_LINK;



// Facebook credentials
const FB_PAGE_ID = process.env.FB_PAGE_ID;
const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;

async function generateImage() {

  const response = await fetch(ai_image_link + "api/free/generate", 
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: "A beautiful sunset over mountains",
        model: "turbo"
      })
    });

    // Create event source for streaming updates
const stream = response.body
  .pipeThrough(new TextDecoderStream());

const reader = stream.getReader();

let imageUrl = null;

while (true) {
  const { value, done } = await reader.read();
  if (done) break;

  const lines = value.split('\n');

  for (const line of lines) {
    if (!line.startsWith('data: ')) continue;

    const data = JSON.parse(line.slice(6));

    if (data.status === "processing") {
      console.log("Progress:", data.message);
    }

    if (data.status === "complete") {
      console.log("Image URL:", data.imageUrl);
      imageUrl = data.imageUrl;
    }

    if (data.status === "error") {
      throw new Error(data.message);
    }
  }
}

return imageUrl;


    
}


// // For mobile legends 
// async function generateCaption() {

//     const response = await ai.models.generateContent({
//     model: "gemini-2.5-flash",
//     contents: `
//     Generate a short Mobile Legends hero output in this structure:

//   "**Who is {Mobile Legends hero name} ?**
//   {Short description of that hero}"

//   Requirements:
//   - Random Mobile Legends hero name
//   - Description must be 1–5 sentences only
//   - Description must be motivational/inspirational
//   - Use emojis
//   - Add hashtag that connects in mobile legends
//     `,
//   });
// //   console.log(response.text);
//   return response.text;
// }




// async function postToFacebook(caption) {
//   if (!caption) return;

//   const url = `https://graph.facebook.com/v24.0/${FB_PAGE_ID}/feed`;

//   try {
//     const res = await axios.post(
//       url,
//       {
//         message: caption,
//         access_token: FB_PAGE_ACCESS_TOKEN,
//       },
//       {
//         headers: {
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     console.log("Posted successfully! Post ID:", res.data.id);
//   } catch (err) {
//     console.error("Error posting to Facebook:", err.response?.data || err.message);
//   }
// }


// https://graph.facebook.com/v24.0/page_id/photos

async function postToFacebookImage(imageUrl) {
  if (!imageUrl) {
    console.error("No image URL received");
    return;
  }

  const url = `https://graph.facebook.com/v24.0/${FB_PAGE_ID}/photos`;

  try {
    const res = await axios.post(
      url,
      {
        url: imageUrl, // ✅ REQUIRED
        caption: "🌄 AI Generated Image", // optional
        access_token: FB_PAGE_ACCESS_TOKEN,
      }
    );

    console.log("Posted successfully! Post ID:", res.data.id);
  } catch (err) {
    console.error(
      "Error posting to Facebook:",
      err.response?.data || err.message
    );
  }
}



async function run() {
  
  // const caption = await generateCaption();

  const generateimage = await generateImage();

  // console.log("Caption:\n", caption);
  console.log("Image URL:\n", generateimage);

  console.log("Posting to Facebook...");

  await postToFacebookImage(generateimage);

  // await postToFacebook(caption);
}

run();

schedule.scheduleJob('0 * * * *', () => {
  console.log("Scheduled job triggered at", new Date().toLocaleString());
  run(); // your function that generates caption and posts to FB
});