import axios from "axios";

const apiUrl = process.env.REACT_APP_BACKEND_API_URL;

const getChannels = async () => {
  try {
    const response = await axios.get(`${apiUrl}/api/channels`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching channels:`, error);
  }
};

export { getChannels };
