const mongoose = require("mongoose");

const privateChatSchema = new mongoose.Schema(
  {
    participants: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
      ],
      validate: {
        validator: function (v) {
          return v.length === 2;
        },
        message: "Exactly two participants are required for a private chat",
      },
      required: [true, "Participants are required"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PrivateChat", privateChatSchema);
