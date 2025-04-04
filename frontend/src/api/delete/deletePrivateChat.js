import axios from "axios";

const apiUrl = process.env.REACT_APP_BACKEND_API_URL;

const deletePrivateChat = async (chatId) => {
  if (!chatId) {
    console.error("Cannot delete private chat, no chatId provided");
    return;
  }

  try {
    const response = await axios.delete(`${apiUrl}/api/privateChats/${chatId}`);
    return response;
  } catch (error) {
    console.error(`Error deleting private chat: ${chatId}:`, error);
  }
};

export { deletePrivateChat };
