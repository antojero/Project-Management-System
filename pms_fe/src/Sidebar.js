import React from "react";
import { Link } from "react-router-dom";
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Collapse,
  IconButton,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ListAltIcon from "@mui/icons-material/ListAlt";
import WorkIcon from "@mui/icons-material/Work";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import ApartmentIcon from "@mui/icons-material/Apartment";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";

const Sidebar = ({ onWidthChange }) => {
  const [openEmployees, setOpenEmployees] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const drawerWidth = isCollapsed ? 60 : 240;

  React.useEffect(() => {
    if (onWidthChange) onWidthChange(drawerWidth);
  }, [isCollapsed, drawerWidth, onWidthChange]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleEmployeesClick = () => setOpenEmployees(!openEmployees);

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, link: "/dashboard" },
    {
      text: "Employee Management",
      icon: <PeopleIcon />,
      submenu: [
        { text: "Add Employee", icon: <AddCircleOutlineIcon />, link: "/employee/add" },
        { text: "View Employees", icon: <ListAltIcon />, link: "/employee/view" },
      ],
    },
    { text: "Project Management", icon: <WorkIcon />, link: "/project" },
    { text: "Admin Page", icon: <AdminPanelSettingsIcon />, link: "/admin" },
    { text: "Department", icon: <ApartmentIcon />, link: "/department" },
    { text: "Chat", icon: <ApartmentIcon />, link: "/chat" },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: "border-box",
          backgroundColor: "rgba(30, 41, 59, 0.7)", // Glass background
          backdropFilter: "blur(12px)",
          borderRight: "1px solid rgba(255, 255, 255, 0.1)",
          color: "var(--text-primary)",
          overflowX: "hidden",
          transition: "width 0.3s",
        },
      }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: isCollapsed ? "center" : "space-between" }}>
        {!isCollapsed && <Typography variant="h6">My App</Typography>}
        <IconButton onClick={toggleSidebar} sx={{ color: "#fff" }}>
          <MenuIcon />
        </IconButton>
      </Toolbar>

      <List>
        {menuItems.map((item, index) => (
          <React.Fragment key={index}>
            {item.submenu ? (
              <>
                <ListItemButton
                  onClick={handleEmployeesClick}
                  sx={{
                    justifyContent: isCollapsed ? "center" : "flex-start",
                    "&:hover": { backgroundColor: "rgba(139, 92, 246, 0.1)" }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 0, justifyContent: "center", color: "var(--primary-light)" }}>{item.icon}</ListItemIcon>
                  {!isCollapsed && <ListItemText primary={item.text} sx={{ color: "var(--text-primary)" }} />}
                  {!isCollapsed && (openEmployees ? <ExpandLess sx={{ color: "var(--text-secondary)" }} /> : <ExpandMore sx={{ color: "var(--text-secondary)" }} />)}
                </ListItemButton>

                <Collapse in={openEmployees && !isCollapsed} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.submenu.map((sub, i) => (
                      <ListItemButton
                        key={i}
                        sx={{
                          pl: 4,
                          justifyContent: isCollapsed ? "center" : "flex-start",
                          "&:hover": { backgroundColor: "rgba(139, 92, 246, 0.1)" }
                        }}
                        component={Link}
                        to={sub.link}
                      >
                        <ListItemIcon sx={{ minWidth: 0, justifyContent: "center", color: "var(--primary-light)" }}>{sub.icon}</ListItemIcon>
                        {!isCollapsed && <ListItemText primary={sub.text} sx={{ color: "var(--text-secondary)" }} />}
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              </>
            ) : (
              <ListItemButton
                sx={{
                  justifyContent: isCollapsed ? "center" : "flex-start",
                  "&:hover": { backgroundColor: "rgba(139, 92, 246, 0.1)" }
                }}
                component={Link}
                to={item.link}
              >
                <ListItemIcon sx={{ minWidth: 0, justifyContent: "center", color: "var(--primary-light)" }}>{item.icon}</ListItemIcon>
                {!isCollapsed && <ListItemText primary={item.text} sx={{ color: "var(--text-primary)" }} />}
              </ListItemButton>
            )}
          </React.Fragment>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;
