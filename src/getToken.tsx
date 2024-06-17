import axios from 'axios';


export const getToken = async (): Promise<string | null> => {
  try {
    const response = await axios.post('https://api.heygen.com/v1/streaming.create_token', {}, {
      headers: {
        'x-api-key': 'YTJlYTAzZmNiZjJmNGZlNGFhM2JhMjI1Yjc3MzhiMzktMTY4NTM4NjAyMw=='
      }
    });
    console.log("\n--------------\nToken:"+response.data.data.token+"\n\n")
    return response.data.data.token;
  } catch (error) {
    console.error('Error fetching token:', error);
    return null;
  }
};  