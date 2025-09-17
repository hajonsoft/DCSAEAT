const functions = require("firebase-functions");
const cors = require("cors")({
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://dcsaeat.web.app",
  ],
  methods: ["POST", "OPTIONS"],
  credentials: true,
});

exports.chat = functions
    .runWith({secrets: ["OPENAI_API_KEY"]})
    .https.onRequest((req, res) => {
      cors(req, res, () => {
        if (req.method === "OPTIONS") {
          res.status(204).send("");
          return;
        }
        const OpenAI = require("openai");
        const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});
        (async () => {
          try {
            const {instruction, input, model, images} = req.body;
            let messages;
            if (images && Array.isArray(images) && images.length > 0) {
              messages = [
                {role: "system", content: instruction},
                {
                  role: "user",
                  content: [
                    {type: "text", text: input},
                    ...images.slice(0, 3).map((b64) => ({
                      type: "image_url",
                      image_url: {url: `data:image/jpeg;base64,${b64}`},
                    })),
                  ],
                },
              ];
            } else {
              messages = [
                {role: "system", content: instruction},
                {role: "user", content: input},
              ];
            }
            const completion = await openai.chat.completions.create({
              model:
              images && images.length > 0 ?
                "gpt-4-vision-preview" :
                model || "gpt-4o",
              messages,
              max_tokens: 512,
            });
            res.json({answer: completion.choices[0].message.content});
          } catch (err) {
            res.status(500).send(err.message || "OpenAI request failed");
          }
        })();
      });
    });
