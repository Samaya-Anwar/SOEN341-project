import axios from "axios";

const apiUrl = process.env.REACT_APP_BACKEND_API_URL;

const deleteMessage = async (messageId) => {
  if (!messageId) {
    console.error("Cannot delete message, no messageId");
    return;
  }

  try {
    const response = await axios.delete(`${apiUrl}/api/messages/${messageId}`);
    return response;
  } catch (error) {
    console.error(`Error deleting message: ${messageId}:`, error);
  }
};

export { deleteMessage };
