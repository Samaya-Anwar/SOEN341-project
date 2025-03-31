import axios from "axios";

const apiUrl = process.env.REACT_APP_BACKEND_API_URL;

const getPrivateChat = async () => {
  try {
    const response = await axios.get(`${apiUrl}/api/privateChats/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching private chats:`, error);
  }
};

export { getPrivateChat };
