import axios from "axios";

const apiUrl = process.env.REACT_APP_BACKEND_API_URL;

const createPrivateChat = async (participants) => {
  try {
    const response = await axios.post(`${apiUrl}/api/privateChats`, {
      participants,
    });
    return response;
  } catch (error) {
    console.error("Error creating private chat:", error);
  }
};

export { createPrivateChat };
