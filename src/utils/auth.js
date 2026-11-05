//Jake S - Auth helpers
const TOKEN_KEY = 'authToken';
const USER_KEY = 'authUser';

export const setToken = (token) => sessionStorage.setItem(TOKEN_KEY, token);
export const getToken = () => sessionStorage.getItem(TOKEN_KEY);
export const setUser = (username) => sessionStorage.setItem(USER_KEY, username);
export const getUser = () => sessionStorage.getItem(USER_KEY);
export const isLoggedIn = () => Boolean(getToken());

export const clearToken = () => {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
};