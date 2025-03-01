import axios from "axios";
const baseURL = process.env.REACT_APP_BACKEND_API_URL;
export const apiClient = axios.create({
  baseURL: baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Function to fetch data by endpoint
export const fetchDataByEndpoint = async (endpoint) => {
  try {
    const response = await apiClient.get(endpoint);
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};

export const postDataToEndpoint = async (endpoint) => {
  try {
    const response = await apiClient.post(endpoint);
    return response.data;
  } catch (error) {
    console.error("Error posting data:", error);
    throw error;
  }
};
