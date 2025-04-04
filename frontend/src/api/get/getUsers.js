import axios from "axios";

const apiUrl = process.env.REACT_APP_BACKEND_API_URL;
const getAllUsers = async () => {
  try {
    const response = await axios.get(`${apiUrl}/api/users/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching channels:`, error);
  }
};

export { getAllUsers };
