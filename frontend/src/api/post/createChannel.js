import axios from "axios";

const apiUrl = process.env.REACT_APP_BACKEND_API_URL;

const createChannel = async (channelName) => {
  try {
    const response = await axios.post(`${apiUrl}/api/channels`, channelName);
    return response;
  } catch (error) {
    console.error(`Error creating new channel:`, error);
  }
};

export { createChannel };
