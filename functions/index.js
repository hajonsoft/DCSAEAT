const functions = require("firebase-functions");
const cors = require("cors")({
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
  ],
});

exports.chat = functions
    .runWith({secrets: ["OPENAI_API_KEY"]})
    .https.onRequest((req, res) => {
      cors(req, res, async () => {
        const OpenAI = require("openai");
        const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});
        try {
          const {instruction, input, model} = req.body;
          const completion = await openai.chat.completions.create({
            model: model || "gpt-4o",
            messages: [
              {role: "system", content: instruction},
              {role: "user", content: input},
            ],
            max_tokens: 512,
          });
          res.json({answer: completion.choices[0].message.content});
        } catch (err) {
          res.status(500).send(err.message || "OpenAI request failed");
        }
      });
    });
