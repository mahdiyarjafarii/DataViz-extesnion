import { useState, useEffect, useRef } from "react";
import { ChartNetwork, ChevronDown, ChevronUp } from "lucide-react";
import useLocalStorage, {
  getStorageValue,
  setStorageValue,
} from "../hooks/useLocalStorage";
import { SETTINGS } from "../constants";

const Popup = () => {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [Password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useLocalStorage(SETTINGS.USERTOKEN, "");
  const [isEnabled, setIsEnabled] = useLocalStorage(SETTINGS.ENABLED, true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [toasts, setToasts] = useState<
    { id: number; message: string; type: string }[]
  >([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const toastIdCounter = useRef(0);
  const userMenuRef = useRef(null);
  const userMenuButtonRef = useRef(null);

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
        setIsLoggedIn(true);
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

  const handleLogout = async () => {
    setToken("");
    await setStorageValue(SETTINGS.ISLOGGEDIN, false);
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
  const showToast = (message: any, type = "info", duration = 3000) => {
    const id = toastIdCounter.current++;
    const newToast = { id, message, type };

    setToasts((prev) => [...prev, newToast]);

    // Remove toast after duration
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, duration);
  };
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  useEffect(() => {
    checkLoginStatus();
  }, []);

  return (
    <div
      className={`w-96 h-[600px] ${isDarkMode ? "dark bg-gray-900" : "bg-white"} transition-colors duration-200`}
    >
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-fade-in ${
              toast.type === "success"
                ? "bg-green-500 text-white"
                : toast.type === "error"
                  ? "bg-red-500 text-white"
                  : "bg-blue-500 text-white"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
      <div id="app" className="h-full flex flex-col">
        {/* <div className="space-y-2">
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
        </div> */}
        {isLoggedIn ? (
          <>
            <div className="flex flex-col h-full">
              <header className="border-b border-gray-200 ">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#0061F7] rounded-lg flex items-center justify-center shadow-sm">
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 23 23"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="plotSet271"
                      >
                        <g clip-path="url(#clip0_8250_41066)">
                          <path
                            className="main-path"
                            d="M0 11.2797C0 5.96239 0 3.30375 1.65187 1.65187C3.30375 0 5.96239 0 11.2797 0H11.7203C17.0376 0 19.6963 0 21.3481 1.65187C23 3.30375 23 5.96239 23 11.2797V11.7203C23 17.0376 23 19.6963 21.3481 21.3481C19.6963 23 17.0376 23 11.7203 23H0V11.2797Z"
                            fill="#0061F7"
                          ></path>
                          <path
                            d="M0 11.2797C0 5.96239 0 3.30375 1.65187 1.65187C3.30375 0 5.96239 0 11.2797 0H11.7203C17.0376 0 19.6963 0 21.3481 1.65187C23 3.30375 23 5.96239 23 11.2797V11.7203C23 17.0376 23 19.6963 21.3481 21.3481C19.6963 23 17.0376 23 11.7203 23H0V11.2797Z"
                            fill="url(#paint0_angular_8250_41066)"
                            fill-opacity="0.2"
                          ></path>
                          <path
                            className="sec-path"
                            d="M17.0186 26.781L19.8036 23.9961L14.1722 18.3647L17.08 15.4569C18.1176 14.4193 18.8479 13.3204 19.2711 12.16C19.6807 10.9859 19.749 9.81184 19.4759 8.63779C19.2165 7.45008 18.5817 6.35111 17.5715 5.34088C16.5339 4.30334 15.435 3.65488 14.2746 3.3955C13.1142 3.13611 11.9469 3.22485 10.7729 3.66171C9.59883 4.07126 8.49304 4.79481 7.4555 5.83234L4.56674 8.7211C3.01811 10.2697 3.01811 12.7806 4.56674 14.3292L17.0186 26.781ZM11.7149 15.9074L9.24822 13.4407C8.00932 12.2018 8.00932 10.1932 9.24823 8.95427L9.95378 8.24871C10.7046 7.49787 11.5169 7.10879 12.3906 7.08148C13.2643 7.05418 14.063 7.4023 14.7865 8.12585C15.4964 8.83574 15.8445 9.63437 15.8309 10.5217C15.8036 11.3955 15.4145 12.2077 14.6637 12.9586L11.7149 15.9074Z"
                            fill="#F6F8FB"
                          ></path>
                        </g>
                        <defs>
                          <radialGradient
                            id="paint0_angular_8250_41066"
                            cx="0"
                            cy="0"
                            r="1"
                            gradientUnits="userSpaceOnUse"
                            gradientTransform="translate(11.9406 10.6628) rotate(-45) scale(8.28751)"
                          >
                            <stop stop-color="white"></stop>
                            <stop
                              offset="1"
                              stop-color="#F5B7B7"
                              stop-opacity="0"
                            ></stop>
                          </radialGradient>
                          <clipPath id="clip0_8250_41066">
                            <path
                              d="M0 11.2797C0 5.96239 0 3.30375 1.65187 1.65187C3.30375 0 5.96239 0 11.2797 0H11.7203C17.0376 0 19.6963 0 21.3481 1.65187C23 3.30375 23 5.96239 23 11.2797V11.7203C23 17.0376 23 19.6963 21.3481 21.3481C19.6963 23 17.0376 23 11.7203 23H0V11.2797Z"
                              fill="white"
                            ></path>
                          </clipPath>
                        </defs>
                      </svg>
                    </div>
                    <h1 className="text-lg font-semibold text-gray-800 ">
                      Plotset
                    </h1>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <button
                        ref={userMenuButtonRef}
                        className="flex items-center space-x-2 focus:outline-none"
                        onClick={() => setShowUserMenu(!showUserMenu)}
                      >
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-medium text-sm">
                          {getInitials("mahdiyar")}
                        </div>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-gray-500 dark:text-gray-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>

                      <div
                        ref={userMenuRef}
                        className={`absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-10 transform origin-top-right transition-all duration-100 ${
                          showUserMenu
                            ? "scale-100 opacity-100"
                            : "scale-95 opacity-0 hidden"
                        }`}
                      >
                        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            mahdiyar
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            mahdiyar@gmail.com
                          </p>
                        </div>
                        <a
                          href="#"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <div className="flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            Profile
                          </div>
                        </a>
                        <a
                          href="#"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <div className="flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            Settings
                          </div>
                        </a>
                        <a
                          href="#"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <div className="flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Help
                          </div>
                        </a>
                        <div className="border-t border-gray-200 dark:border-gray-700"></div>
                        <a
                          href="#"
                          className="block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={handleLogout}
                        >
                          <div className="flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-2"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                              />
                            </svg>
                            Sign out
                          </div>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </header>
              <main className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Credits and Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 ">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 ">
                          Available Credits
                        </p>
                        <h3 className="text-2xl font-bold text-gray-900 ">
                          90
                        </h3>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-indigo-100  flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 text-indigo-600 "
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                    </div>
                    <button
                      className="mt-3 w-full py-1 px-2 text-xs font-medium text-indigo-600  bg-indigo-50  rounded-lg hover:bg-indigo-100  transition-colors"
                      // onClick={() => setShowCreditsModal(true)}
                    >
                      Buy More Credits
                    </button>
                  </div>

                  <div className="bg-white  rounded-xl shadow-sm p-4 border border-gray-200 ">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 ">
                          Processed Images
                        </p>
                        <h3 className="text-2xl font-bold text-gray-900 ">
                          10
                        </h3>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 text-green-600 dark:text-green-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="mt-3 w-full h-1.5 bg-gray-200  rounded-full overflow-hidden">
                      <div
                        className="bg-green-500 h-full rounded-full"
                        style={{ width: `${Math.min(10 * 10, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md p-5 text-white">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">Extract Data</h3>
                        <p className="text-indigo-100 text-sm mt-1">
                          Extract text, tables, and data from any image
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="mt-4 text-sm text-indigo-100">
                      <ul className="space-y-1">
                        <li className="flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          OCR for text recognition
                        </li>
                        <li className="flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Table extraction
                        </li>
                        <li className="flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Export to CSV, Excel, JSON
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-md p-5 text-white">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">Create Charts</h3>
                        <p className="text-cyan-100 text-sm mt-1">
                          Transform image data into beautiful charts
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="mt-4 text-sm text-cyan-100">
                      <ul className="space-y-1">
                        <li className="flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Bar, line, pie charts
                        </li>
                        <li className="flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Customizable styles
                        </li>
                        <li className="flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Download as PNG, SVG, PDF
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 ">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                      Recent Activity
                    </h2>
                    <button className="text-sm text-indigo-600  hover:text-indigo-800 ">
                      View All
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-12 w-12 mx-auto mb-3 text-gray-400 dark:text-gray-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        />
                      </svg>
                      <p className="text-sm">No recent activity</p>
                      <p className="text-xs mt-1">
                        Start processing images to see your activity here
                      </p>
                    </div>
                  </div>
                </div>
              </main>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col h-full">
              <div className="flex-1 flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-sm">
                  <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 bg-[#0061F7] rounded-xl flex items-center justify-center shadow-lg">
                        <svg
                          width="64"
                          height="64"
                          viewBox="0 0 23 23"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="plotSet271"
                        >
                          <g clip-path="url(#clip0_8250_41066)">
                            <path
                              className="main-path"
                              d="M0 11.2797C0 5.96239 0 3.30375 1.65187 1.65187C3.30375 0 5.96239 0 11.2797 0H11.7203C17.0376 0 19.6963 0 21.3481 1.65187C23 3.30375 23 5.96239 23 11.2797V11.7203C23 17.0376 23 19.6963 21.3481 21.3481C19.6963 23 17.0376 23 11.7203 23H0V11.2797Z"
                              fill="#0061F7"
                            ></path>
                            <path
                              d="M0 11.2797C0 5.96239 0 3.30375 1.65187 1.65187C3.30375 0 5.96239 0 11.2797 0H11.7203C17.0376 0 19.6963 0 21.3481 1.65187C23 3.30375 23 5.96239 23 11.2797V11.7203C23 17.0376 23 19.6963 21.3481 21.3481C19.6963 23 17.0376 23 11.7203 23H0V11.2797Z"
                              fill="url(#paint0_angular_8250_41066)"
                              fill-opacity="0.2"
                            ></path>
                            <path
                              className="sec-path"
                              d="M17.0186 26.781L19.8036 23.9961L14.1722 18.3647L17.08 15.4569C18.1176 14.4193 18.8479 13.3204 19.2711 12.16C19.6807 10.9859 19.749 9.81184 19.4759 8.63779C19.2165 7.45008 18.5817 6.35111 17.5715 5.34088C16.5339 4.30334 15.435 3.65488 14.2746 3.3955C13.1142 3.13611 11.9469 3.22485 10.7729 3.66171C9.59883 4.07126 8.49304 4.79481 7.4555 5.83234L4.56674 8.7211C3.01811 10.2697 3.01811 12.7806 4.56674 14.3292L17.0186 26.781ZM11.7149 15.9074L9.24822 13.4407C8.00932 12.2018 8.00932 10.1932 9.24823 8.95427L9.95378 8.24871C10.7046 7.49787 11.5169 7.10879 12.3906 7.08148C13.2643 7.05418 14.063 7.4023 14.7865 8.12585C15.4964 8.83574 15.8445 9.63437 15.8309 10.5217C15.8036 11.3955 15.4145 12.2077 14.6637 12.9586L11.7149 15.9074Z"
                              fill="#F6F8FB"
                            ></path>
                          </g>
                          <defs>
                            <radialGradient
                              id="paint0_angular_8250_41066"
                              cx="0"
                              cy="0"
                              r="1"
                              gradientUnits="userSpaceOnUse"
                              gradientTransform="translate(11.9406 10.6628) rotate(-45) scale(8.28751)"
                            >
                              <stop stop-color="white"></stop>
                              <stop
                                offset="1"
                                stop-color="#F5B7B7"
                                stop-opacity="0"
                              ></stop>
                            </radialGradient>
                            <clipPath id="clip0_8250_41066">
                              <path
                                d="M0 11.2797C0 5.96239 0 3.30375 1.65187 1.65187C3.30375 0 5.96239 0 11.2797 0H11.7203C17.0376 0 19.6963 0 21.3481 1.65187C23 3.30375 23 5.96239 23 11.2797V11.7203C23 17.0376 23 19.6963 21.3481 21.3481C19.6963 23 17.0376 23 11.7203 23H0V11.2797Z"
                                fill="white"
                              ></path>
                            </clipPath>
                          </defs>
                        </svg>
                      </div>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 ">
                      PlotSet
                    </h1>
                    <p className="text-gray-600  mt-2">
                      Sign in to access AI-Powered Data Visualization
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700 "
                      >
                        Email
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        </div>
                        <input
                          type="text"
                          id="email"
                          className="pl-10 w-full px-3 py-2 border border-gray-300  rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 "
                          placeholder="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                        {emailError && (
                          <div className="text-red-500 text-xs mt-1">
                            {emailError}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="password"
                          className="block text-sm font-medium text-gray-700 "
                        >
                          Password
                        </label>
                        <a
                          href="#"
                          className="text-xs text-indigo-600 hover:text-indigo-500 "
                        >
                          Forgot password?
                        </a>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                          </svg>
                        </div>
                        <input
                          type={showPassword ? "text" : "password"}
                          id="password"
                          className="pl-10 w-full px-3 py-2 border border-gray-300  rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 "
                          placeholder="••••••••"
                          value={Password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <button
                            type="button"
                            className="text-gray-400 hover:text-gray-500 focus:outline-none"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                />
                              </svg>
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            )}
                          </button>
                        </div>
                        {passwordError && (
                          <div className="text-red-500 text-xs mt-1">
                            {passwordError}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={handleLogin}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#0061F7] to-[#0043A7] hover:from-[#0050D1] hover:to-[#00368F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0050D1] transition-all duration-150 transform hover:scale-[1.02]"
                      >
                        {loading ? "Loading..." : "Sign in"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 text-center text-sm text-gray-600  border-t border-gray-200 ">
                Don't have an account?{" "}
                <a
                  href="https://plotset.com"
                  className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                >
                  Create in PlotSet
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Popup;
