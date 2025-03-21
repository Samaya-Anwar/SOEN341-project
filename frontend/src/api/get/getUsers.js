import axios from "axios";

const apiUrl = process.env.REACT_APP_BACKEND_API_URL;

const getUsers = async () => {
  try {
    const response = await axios.get(`${apiUrl}/api/users/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching users:`, error);
  }
};

export { getUsers };
