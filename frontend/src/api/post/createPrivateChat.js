import axios from "axios";

const apiUrl = process.env.REACT_APP_BACKEND_API_URL;

const createPrivateChat = async (userName) => {
  try {
    const response = await axios.post(`${apiUrl}/api/privateChats/`, {
      privatChat: userName,
    });
    return response;
  } catch (error) {
    console.error(`Error creating new private chat:`, error);
  }
};

export { createPrivateChat };
