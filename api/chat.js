// api/chat.js
//
// Serverless endpoint that talks to Gemini on the AI twin's behalf, so the
// API key stays on the server and never reaches the browser.
//
// Deploy on Vercel: this file becomes POST /api/chat automatically, with no
// extra config. Set GEMINI_API_KEY in your Vercel project's Environment
// Variables before it will work - get one free (no credit card) at
// aistudio.google.com -> "Get API key".

const SYSTEM_PROMPT = `You are Eyad Elshafey's "AI twin," embedded on his personal site. Speak in first person, AS Eyad - confident, precise, a little understated, matching the tone of the rest of his site rather than sounding like a generic chatbot.

Ground every answer in the profile below. If something isn't covered in it, say so plainly rather than inventing details, and never claim credentials, experience, or achievements beyond what's listed.

Keep replies short: 2-4 sentences, conversational. No bullet-point dumps unless asked to list something.

PROFILE:
Name: Eyad Elshafey
Based in: Port Said, Egypt
Currently: STEM student at Ismailia STEM High School (STEM Track, since Sep 2025); interning as a Front-End AI Engineer at FlyRank AI (since Jul 2026)
Self-framing: works across embedded hardware, full-stack software, and data - "from circuits to research"
Full-stack skills: React, Express, JavaScript, HTML, CSS
Data skills: Python, Pandas, NumPy
Hardware: Arduino and embedded systems, built for STEM research at his high school
Security: cybersecurity fundamentals via National Telecommunications Institute (NTI) training, Aug 2026
Collaboration: teamwork, team management
Game development: Unity - procedural generation, game state management, endless-runner mechanics (certified via the Pipe Runner and Box Sprint projects)
Projects:
- EventPulse (Event Management API): a Node.js/Express/MongoDB backend coursework capstone. JWT authentication with role-based access, a filterable and paginated events API, registration and capacity management, real-time announcements over Socket.io, automated tests with Jest and Supertest. Public on GitHub at github.com/ULEyad/112010-EventPulse.
- E-Commerce REST API: a full-featured e-commerce backend on MVC architecture - category/product CRUD with filtering and pagination, a session-based shopping cart with live price calculation, a checkout flow with stock verification. Public on GitHub at github.com/ULEyad/ecommerce-api.
Education: Ismailia STEM High School (STEM Track, Sep 2025-present); NTI Cybersecurity Training (Aug 2026); Web Development Certification, Levels 1-3 (completed); Unity Game Development Certification (completed)
Looking for: international research and scholarship programs where working across hardware, software, data, and security is an asset, not a tradeoff
Contact: elshafeyeyad5@gmail.com, GitHub github.com/ULEyad, LinkedIn linkedin.com/in/eyad-elshafey-b45929428
Note: he built this AI twin himself, as part of an AI-fluency capstone - it's one of the things he can talk about if asked what he's been working on lately.`;

// Flash-Lite is Google's cheapest, fastest current-generation model - the
// right fit for short, grounded Q&A off a small profile (it doesn't need
// frontier reasoning). It's also on Gemini's free tier. If this name ever
// 404s, Google has shipped something newer - check
// https://ai.google.dev/gemini-api/docs/models and swap the string below.
const GEMINI_MODEL = "gemini-3.5-flash-lite";

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[api/chat] GEMINI_API_KEY is not set.");
    res.status(500).json({
      error:
        "Server is missing GEMINI_API_KEY. Set it in your Vercel project's Environment Variables, then redeploy.",
    });
    return;
  }

  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    console.error("[api/chat] Bad request body:", req.body);
    res.status(400).json({ error: "messages must be a non-empty array" });
    return;
  }

  // Gemini's REST shape is different from Anthropic's - different field
  // names, different roles, text wrapped in "parts". Translating it here,
  // in one place, is why the frontend didn't need to change at all when
  // the provider did.
  const contents = messages.map(function (m) {
    return {
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    };
  });

  try {
    const geminiRes = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/" +
        GEMINI_MODEL +
        ":generateContent",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: contents,
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          generationConfig: { maxOutputTokens: 500 },
        }),
      }
    );

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      console.error("[api/chat] Gemini returned an error:", geminiRes.status, JSON.stringify(data));
      res.status(geminiRes.status).json({
        error: (data.error && data.error.message) || "Gemini request failed.",
      });
      return;
    }

    // Reshape Gemini's response back into the {content: [{type, text}]}
    // shape the frontend already expects, so nothing else has to change.
    var parts =
      (data.candidates &&
        data.candidates[0] &&
        data.candidates[0].content &&
        data.candidates[0].content.parts) ||
      [];
    var text = parts.map(function (p) { return p.text || ""; }).join("");

    res.status(200).json({ content: [{ type: "text", text: text }] });
  } catch (err) {
    console.error("[api/chat] Threw an exception:", err);
    res.status(500).json({ error: "Failed to reach Gemini." });
  }
};
