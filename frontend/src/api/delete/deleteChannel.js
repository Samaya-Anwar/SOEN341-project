import axios from "axios";

const apiUrl = process.env.REACT_APP_BACKEND_API_URL;

const deleteChannel = async (channel) => {
  try {
    const response = await axios.delete(`${apiUrl}/api/channels/${channel}`);
    return response;
  } catch (error) {
    console.error(`Error deleting channel: ${channel}:`, error);
  }
};

export { deleteChannel };
