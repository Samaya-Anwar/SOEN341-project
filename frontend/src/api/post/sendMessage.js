import axios from "axios";

const apiUrl = process.env.REACT_APP_BACKEND_API_URL;

const sendMessage = async (messageData) => {
  try {
    const response = await axios.post(`${apiUrl}/api/messages/`, messageData);
    return response;
  } catch (error) {
    console.error(`Error sending message:`, error);
  }
};

export { sendMessage };
