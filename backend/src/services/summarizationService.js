const axios = require("axios");
const { openaiApiKey } = require("../config/config");

async function generateSummary(messages) {
  const validMessages = Array.isArray(messages)
    ? messages.filter(msg => msg && msg.trim() !== "")
    : [];

  if (validMessages.length === 0) {
    return "No messages to summarize.";
  }

  const conversation = validMessages.join("\n");
  const sys_prompt = `You are a professional chat summarizer. Your task is to generate a concise, 
                  clear summary of a conversation in bullet points. In your summary, focus on the main topics 
                  discussed, decisions made, and any action items. The summary should not include verbatim quotes from the conversation.
                  
                  Example input: Alice: Hi everyone, are we still on for the meeting at 3 PM today?
                  Bob: Yes, the meeting is confirmed.
                  Charlie: I might be a few minutes late due to traffic.
                  Alice: Great, please review the quarterly report before joining.
                  Bob: I'll send out the report via email right away.
                  Alice: Thanks Bob. Let's also discuss the upcoming project deadlines.
                  Charlie: Agreed. I'll prepare a draft timeline.
                  
                  Example output: • The 3pm meeting is confirmed. 
                                  • Charlie might be late due to traffic.
                                  • Bob will send out the quarterly report via email and it must be reviewed before joining the meeting.
                                  • Charlie will prepare a draft timeline for the project deadlines that will be dicussed.
                  
                  Summarize the conversation below delimited by triple quotes:`;
  
  const prompt = `"""${conversation}"""`;
  
  
  
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo", 
        messages: [
          {
            role: "system",
            content: sys_prompt
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 300,
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
