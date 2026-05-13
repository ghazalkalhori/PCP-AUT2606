const AUTH_TOKEN_KEY = "reporta_token";
const AUTH_USER_KEY = "reporta_user";

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function isAuthenticated() {
  return Boolean(getAuthToken());
}

export function storeAuthSession(token, email, rememberUser) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);

  if (rememberUser) {
    localStorage.setItem(AUTH_USER_KEY, email);
    return;
  }

  localStorage.removeItem(AUTH_USER_KEY);
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

export function getStoredUserName() {
  const rememberedUser = localStorage.getItem(AUTH_USER_KEY);

  if (!rememberedUser) {
    return "Admin";
  }

  const [name] = rememberedUser.split("@");

  if (!name) {
    return "Admin";
  }

  return name.charAt(0).toUpperCase() + name.slice(1);
}
