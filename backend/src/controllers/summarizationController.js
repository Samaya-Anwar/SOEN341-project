const Message = require("../models/Message");
const { generateSummary } = require("../services/summarizationService");

exports.getSummary = async (req, res) => {
  try {
    const { channel } = req.params;
    
    let messagesData = await Message.find({ channel })
      .sort({ timestamp: -1 })
      .limit(20);
    messagesData = messagesData.reverse();

    const messages = messagesData.map(msg => `${msg.sender}: ${msg.content}`);

    const summary = await generateSummary(messages);
    
    res.json({ summary });
  } catch (err) {
    console.error("Summary generation error:", err);
    res.status(500).json({ error: "Could not generate summary" });
  }
};
