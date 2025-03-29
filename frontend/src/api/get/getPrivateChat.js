// api/get/getPrivateChat.js
import axios from "axios";

const apiUrl = process.env.REACT_APP_BACKEND_API_URL;

const getPrivateChat = async () => {
  try {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      console.error("No user ID found in localStorage");
      return [];
    }

    console.log(`Fetching private chats for user ID: ${userId}`);
    const response = await axios.get(
      `${apiUrl}/api/privateChats?userId=${userId}`
    );
    console.log("Private chat API response:", response.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching private chats:`, error);
    if (error.response) {
      console.error("Server error response:", error.response.data);
    }
    return [];
  }
};

export { getPrivateChat };
