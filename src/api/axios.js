import axios from "axios";
import useAuthStore from "../store/useAuthStore";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

api.interceptors.request.use(
  (config) => {
    const stateChangingMethods = ["post", "put", "patch", "delete"];

    if (stateChangingMethods.includes(config.method)) {
      const csrfToken = getCookie("csrfToken");
      if (csrfToken) {
        config.headers["x-csrf-token"] = csrfToken;
      }
    }
    return config;
  },
  (error) => {
    throw error;
  },
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Handling 401 directly as the backend does not have a /refresh route yet
    if (error.response?.status === 401) {
      const currentRole = useAuthStore.getState().role;

      useAuthStore.getState().logout();

      const currentPath = globalThis.location.pathname;

      if (!currentPath.includes("/login")) {
        if (currentRole === "ADMIN") {
          globalThis.location.href = "/admin/login";
        } else if (currentRole === "CLERK") {
          globalThis.location.href = "/clerk/login";
        } else {
          globalThis.location.href = "/user/login";
        }
      }
    }

    throw error;
  },
);

export default api;
