import React, { createContext, useState, useEffect } from "react";

// Create the context
export const UserContext = createContext();

const UserProvider = ({ children }) => {
  // Main user state
  const [user, setUser] = useState({
    access: localStorage.getItem("access") || null,
    refresh: localStorage.getItem("refresh") || null,
    role: localStorage.getItem("role") || null,
    user_id: localStorage.getItem("user_id") || null,
    username: localStorage.getItem("username") || null,
  });
console.log("UserToken",user.access)
  // Optional individual state variables if needed
  const [role, setRole] = useState(user.role || "");
  console.log("role",role)
  const [username, setUsername] = useState(user.username || "");
  const [user_id, setUser_id] = useState(user.user_id || "");
  console.log("cuser_id",user_id)
  const [userToken, setUserToken] = useState(user.userToken || "");

  // Keep localStorage and local states in sync with user
  useEffect(() => {
    if (user.access) {
      localStorage.setItem("access", user.access);
      localStorage.setItem("refresh", user.refresh);
      localStorage.setItem("role", user.role);
      localStorage.setItem("user_id", user.user_id);
      localStorage.setItem("username", user.username);

      setRole(user.role);
      setUsername(user.username);
      setUser_id(user.user_id);
      setUserToken(user.access);
    } else {
      localStorage.clear();
      setRole("");
      setUsername("");
      setUserToken("");
      setUser_id("");
    }
  }, [user]);

  // Logout function
  const logout = () => {
    setUser({
      access: null,
      refresh: null,
      role: null,
      user_id: null,
      username: null,
    });
    localStorage.clear();
    setRole("");
    setUsername("");
    setUser_id("");
  };

  return (
    <UserContext.Provider value={{ user, setUser,setUserToken,userToken, role, setRole, username, setUsername, user_id, setUser_id, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
