const Channel = require("../models/Channel");

exports.createChannel = async (req, res) => {
  try {
    const { channel } = req.body;
    if (!channel)
      return res.status(400).json({ error: "Channel name is required" });

    const newChannel = new Channel({ name: channel });
    await newChannel.save();

    const io = req.app.get("io");
    io.emit("channelUpdated"); // Notify clients
    res.status(201).json(newChannel);
  } catch (err) {
    res.status(500).json({ error: "Could not create channel" });
  }
};

exports.deleteChannel = async (req, res) => {
  try {
    const { channel } = req.params;
    await Channel.deleteOne({ name: channel });

    const io = req.app.get("io");
    io.emit("channelUpdated"); // Notify clients
    res.json({ message: "Channel deleted" });
  } catch (err) {
    res.status(500).json({ error: "Could not delete channel" });
  }
};

exports.getChannels = async (req, res) => {
  try {
    const channels = await Channel.find();
    res.json(channels);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch channels" });
  }
};
