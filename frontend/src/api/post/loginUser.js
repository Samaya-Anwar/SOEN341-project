import axios from "axios";

const apiUrl = process.env.REACT_APP_BACKEND_API_URL;

const loginUser = async (loginData) => {
  try {
    const response = await axios.post(`${apiUrl}/api/login`, loginData);
    return response;
  } catch (error) {
    console.error(`Error logging in:`, error);
  }
};

export { loginUser };
