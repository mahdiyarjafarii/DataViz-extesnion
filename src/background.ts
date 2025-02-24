import browser from "webextension-polyfill";
import { getStorageValue, setStorageValue } from "./hooks/useLocalStorage";
import { SETTINGS } from "./constants";

const AUTH_CHECK_URL = "https://plotset.com/api/user/auth-check";

const validateUser = async () => {
  try {
    const token = await getStorageValue(SETTINGS.USERTOKEN, "");

    if (!token) {
      return false;
    }

    const response = await fetch(AUTH_CHECK_URL, {
      method: "GET",
      headers: {
        "Authorization": `${token}`,
      },
    });

    const data = await response.json();

    if (data.isAuthenticated) {
      await setStorageValue(SETTINGS.ISLOGGEDIN, true);
      return true;
    } else {
      await setStorageValue(SETTINGS.ISLOGGEDIN, false); 
      return false;
    }
  } catch (error) {
    console.error("Error validating user:", error);
    await setStorageValue(SETTINGS.ISLOGGEDIN, false); 
    return false;
  }
};

browser.runtime.onInstalled.addListener(async () => {
  console.log("Extension installed.");
  const isValidUser = await validateUser();
  console.log("User validated:", isValidUser);
});

browser.runtime.onStartup.addListener(async () => {
  console.log("Extension started.");
  const isValidUser = await validateUser();
  console.log("User validated on startup:", isValidUser);
});
