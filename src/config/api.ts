export const API_BASE = import.meta.env.VITE_API_URL;
export const CLIENT_BASE = import.meta.env.VITE_CLIENT_URL;
export const CLIENT_NAME = import.meta.env.VITE_CLIENT_NAME;
export const ACCOUNT_BASE = import.meta.env.VITE_ACCOUNT_URL;
// Nhexa's home (the desktop dock's): production's unless the environment says otherwise.
export const NHEXA_BASE = (import.meta.env.VITE_NHEXA_URL as string | undefined) || 'https://nhexa.cl';
export const REDIRECT_LOGIN = import.meta.env.VITE_REDIRECT_LOGIN_URL;
export const REDIRECT_SIGNUP = import.meta.env.VITE_REDIRECT_SIGNUP_URL;
export const APP_SWITCHER_URL = import.meta.env.VITE_APP_SWITCHER_URL as string | undefined;
