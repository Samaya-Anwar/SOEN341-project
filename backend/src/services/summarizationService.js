const axios = require("axios");
const { openaiApiKey } = require("../config/config");

async function generateSummary(messages) {
  const conversation = messages.join("\n");
  const prompt = `Summarize the following conversation:\n${conversation}`;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo", 
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that summarizes chat conversations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
      }
    );
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error generating summary:", error.response?.data || error.message);
    throw error;
  }
}

module.exports = { generateSummary };
