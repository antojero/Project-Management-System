import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import React from "react";

import Sidebar from "./Sidebar";
import UserProvider from "./userContext";
import Dashboard from "./Dashboard/dashboard";
import Addemployee from "./Components/Addemployee";
import Department from "./Department/department";
import ViewEmployees from "./Components/ViewEmployees";
import Profile from "./Components/Profile";
import AdminPage from "./Components/AdminPage/AdminPage";
import UserRoleAdd from "./Components/AdminPage/UserRoleAdd";
import UserRoleEdit from "./Components/AdminPage/UserRoleEdit";
import ProjectManagement from "./PMS/ProjectManagement";
import AIChatBox from "./Components/ChatBot/AIChatBox";
import { CallProvider } from "./contexts/CallProvider";
import Login from "./login/login";
import Chats from "./Components/Chats/Chats";
import IncomingCall from "./Components/IncomingCall";
import CallModal from "./Components/CallModal";
import VoiceAssistant from "./VoiceAssistant";
import ProtectedRoute from "./Components/ProtectedRoute";

// Wrapper to access location
const AppLayout = ({ sidebarWidth, setSidebarWidth, children }) => {
  const location = useLocation();

  // Don't show sidebar on login page
  const hideSidebar = location.pathname === "/Login";

  return (
    <div className="flex" style={{ position: "relative", zIndex: 1 }}>
      {!hideSidebar && <Sidebar onWidthChange={setSidebarWidth} />}

      <div
        className="flex-1 p-6"
        style={{
          marginLeft: !hideSidebar ? sidebarWidth : 0,
          transition: "margin-left 0.3s",
          overflowY: "auto",
          height: "100vh",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto", paddingTop: "2rem" }}>
          {children}
        </div>
      </div>
    </div>
  );
};

function App() {
  const [sidebarWidth, setSidebarWidth] = React.useState(240);


  return (
    <BrowserRouter>
      <UserProvider>
        <CallProvider>
          <IncomingCall />
          <CallModal />
          <AppLayout sidebarWidth={sidebarWidth} setSidebarWidth={setSidebarWidth}>
            <Routes>
              {/* Public Routes */}
              <Route path="/Login" element={<Login />} />

              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/employee/add" element={<Addemployee />} />
                      <Route path="/employee/view" element={<ViewEmployees />} />
                      <Route path="/profile/:userid" element={<Profile />} />
                      <Route path="/project/:depId" element={<ProjectManagement />} />
                      <Route path="/AIChatBox" element={<AIChatBox />} />
                      <Route path="/admin" element={<AdminPage />} />
                      <Route path="/chat" element={<Chats />} />
                      <Route path="/department" element={<Department />} />
                      <Route path="/UserRoleAdd" element={<UserRoleAdd />} />
                      <Route path="/UserRoleEdit/:roleId" element={<UserRoleEdit />} />
                    </Routes>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AppLayout>
          <VoiceAssistant />
        </CallProvider>
      </UserProvider>
    </BrowserRouter>
  );
}

export default App;
