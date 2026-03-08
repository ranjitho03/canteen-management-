import axios from "axios";

const apiBaseUrl =
    import.meta.env.VITE_API_URL || (
        import.meta.env.DEV ? "/api" : `http://${window.location.hostname}:8000`);

const api = axios.create({
    baseURL: apiBaseUrl,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;