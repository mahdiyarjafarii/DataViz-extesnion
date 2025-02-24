import { useState, useEffect, useRef } from "react";
import { ChartNetwork, ChevronDown, ChevronUp } from "lucide-react";
import useLocalStorage, { getStorageValue, setStorageValue } from "../hooks/useLocalStorage";
import { SETTINGS } from "../constants";

const Popup = () => {
  const [email, setEmail] = useState("");
  const [Password, setPassword] = useState("");
  const [token , setToken] = useLocalStorage(SETTINGS.USERTOKEN, "");
  const [isEnabled, setIsEnabled] = useLocalStorage(SETTINGS.ENABLED, true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false); 

  const handleLogin = async () => {
    setLoading(true);
    setLoginError(null);

    try {
      const response = await fetch("https://plotset.com/api/user/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: Password,
          remember: false,
        }),
      });

      const data = await response.json();

      if (data.results) {
        setToken(data.user.token);
        setSuccess(true);
        setIsLoggedIn(true)
        await setStorageValue(SETTINGS.ISLOGGEDIN, true);
      } else {
        setLoginError("Login failed: " + data.message);
        setSuccess(false);
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginError("Error occurred during login");
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(""); 
    setIsLoggedIn(false);
  };
 

    const checkLoginStatus = async () => {
      try {
        const status = await getStorageValue(SETTINGS.ISLOGGEDIN, false);
        setIsLoggedIn(status); 
      } catch (error) {
        console.error("Error checking login status:", error);
        setIsLoggedIn(false); 
      }
    };
  
    useEffect(() => {
      checkLoginStatus();
    }, []);


  return (
    <div className="flex flex-col gap-6 bg-[#0771ed] p-6 min-w-[320px] text-white">
      <div className="space-y-2">
        <h1 className="font-semibold text-2xl tracking-tight">Plotset</h1>
        <p className="text-gray-200  text-sm">
        AI-Powered Data Visualization
        </p>
        <div className="flex justify-between items-center">
            <label className="text-gray-200 text-sm">Enable Extension</label>
            <div
              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${
                isEnabled ? "bg-teal-600" : "bg-gray-700"
              }`}
              onClick={() => setIsEnabled(!isEnabled)}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${
                  isEnabled ? "translate-x-6" : ""
                }`}
              />
            </div>
          </div>
      </div>
      {isLoggedIn ? (
        <>
          <p>You are logged in</p>
          <button
            className="bg-red-500 hover:bg-teal-700 text-white px-4 py-2 rounded-md w-full font-medium text-sm transition-colors"
            onClick={handleLogout}
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <div className="flex gap-4 border-white border-b">
            <button
              className={`pb-2 text-sm ${
                activeTab === "login" ? "text-teal-400 border-b-2 border-teal-400" : "text-gray-100"
              }`}
              onClick={() => setActiveTab("login")}
            >
              Login
            </button>
            <button
              className={`pb-2 text-sm ${
                activeTab === "info" ? "text-teal-400 border-b-2 border-teal-400" : "text-gray-100"
              }`}
              onClick={() => setActiveTab("info")}
            >
              How to use?
            </button>
          </div>

          {activeTab === "login" ? (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Email"
                className="bg-gray-900 px-3 py-2 border border-gray-800 focus:border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 w-full text-sm placeholder-gray-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                className="bg-gray-900 px-3 py-2 border border-gray-800 focus:border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 w-full text-sm placeholder-gray-500"
                value={Password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 px-4 py-2 rounded-md w-full font-medium text-sm transition-colors disabled:cursor-not-allowed"
                disabled={loading}
                onClick={handleLogin}
              >
                {loading ? "Loading ..." : "Login"}
              </button>
              {success && <div className="text-teal-400 text-sm text-center">Success!</div>}
              {loginError && <div className="text-red-400 text-sm text-center">{loginError}</div>}
            </div>
          ) : (
            <div className="space-y-4 text-gray-300 text-sm">
              <h3 className="font-medium text-gray-200">How to Configure Settings</h3>
              <div className="space-y-2">
                <p>
                  <strong>Endpoint:</strong> Enter the base URL for your OpenAI or compatible API (e.g., https://api.openai.com/v1 or your custom endpoint).
                </p>
                <p>
                  <strong>API Key:</strong> Obtain your API key from the OpenAI platform or your API provider and paste it here.
                </p>
                <p>
                  <strong>Model:</strong> Select a model from the dropdown. Available models will load once a valid endpoint and API key are provided.
                </p>
                <p>
                  <strong>Style:</strong> Optional custom text style instructions for the AI output.
                </p>
                <p>
                  <strong>Minimum Words:</strong> Set the minimum number of words required to trigger the popup (default is 5).
                </p>
              </div>
            </div>
          )}
        </>
      )}

      <footer className="mt-auto text-gray-100 text-xs text-center">
        Created by{" "}
        <a
          href="https://plotset.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-teal-800 hover:text-teal-300 transition-colors"
        >
          Plotset Teams
        </a>
      </footer>
    </div>
  );
};

export default Popup;
