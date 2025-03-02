import axios from "axios";

const apiUrl = process.env.REACT_APP_BACKEND_API_URL;

const getMessages = async (selectedChat) => {
  try {
    const response = await axios.get(`${apiUrl}/api/messages/${selectedChat}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching messages for chat: ${selectedChat}:`, error);
  }
};

export { getMessages };
