// api/post/sendMessage.js
import axios from "axios";

const apiUrl = process.env.REACT_APP_BACKEND_API_URL;

const sendMessage = async (messageData) => {
  try {
    console.log("Sending message via API:", messageData);

    // Check message type to route to correct endpoint
    if (messageData.senderId && messageData.receiverId) {
      // This is a direct message
      const response = await axios.post(
        `${apiUrl}/api/privateChats/`,
        messageData
      );
      console.log("Direct message API response:", response.data);
      return response.data;
    } else {
      // This is a channel message
      const response = await axios.post(`${apiUrl}/api/messages/`, messageData);
      console.log("Channel message API response:", response.data);
      return response.data;
    }
  } catch (error) {
    console.error(`Error sending message:`, error);
    if (error.response) {
      console.error("Server error response:", error.response.data);
    }
    throw error;
  }
};

export { sendMessage };
