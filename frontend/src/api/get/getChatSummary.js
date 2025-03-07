import axios from "axios";

const apiUrl = process.env.REACT_APP_BACKEND_API_URL;

const getChatSummary = async (channel) => {
    try {
      const response = await axios.get(`${apiUrl}/api/summarization/${channel}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching summary for channel "${channel}":`, error);
      throw error;
    }
  };
  
  export { getChatSummary };