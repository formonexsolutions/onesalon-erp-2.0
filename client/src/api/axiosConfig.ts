import axios from 'axios';

// Set the base URL for all API requests
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;

// ✅ Tell axios to always send cookies with every request
axios.defaults.withCredentials = true;

// ✅ Configure axios to automatically handle XSRF tokens
// It will look for a cookie named 'XSRF-TOKEN' and send it in a header named 'X-XSRF-TOKEN'
axios.defaults.xsrfCookieName = 'XSRF-TOKEN';
axios.defaults.xsrfHeaderName = 'X-XSRF-TOKEN';

export default axios;