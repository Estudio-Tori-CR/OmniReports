import Cookies from "js-cookie";

const JWT_NAME = "session";

const getToken = async () => {
  return Cookies.get(JWT_NAME);
};

const removeToken = async () => {
  try {
    await fetch("/api/authenticator/logout", {
      method: "POST",
    });
  } catch {
    // ignore network/logout endpoint errors
  }

  return Cookies.remove(JWT_NAME);
};

export { getToken, removeToken };
