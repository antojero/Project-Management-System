import React from "react";
import { List, ListItemButton, ListItemText, Typography, Paper, Avatar, Box } from "@mui/material";

const Sidebar = ({ users, activeUser, onSelectUser }) => {
  console.log("Sidebar Users Prop:", users);
  console.log("Sidebar Users Prop:", users);
  return (
    <div
      className="glass-card"
      style={{
        height: "100%",
        overflowY: "auto",
        padding: "1rem",
        display: "flex",
        flexDirection: "column"
      }}
    >
      <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold", px: 1 }} className="gradient-text">Chats</Typography>
      <List sx={{ flex: 1 }}>
        {users.map(user => (
          <div
            key={user.id}
            onClick={() => onSelectUser(user.id)}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "10px",
              marginBottom: "8px",
              borderRadius: "12px",
              cursor: "pointer",
              background: user.id === activeUser ? "var(--primary-color)" : "rgba(255,255,255,0.05)",
              color: user.id === activeUser ? "white" : "var(--text-primary)",
              transition: "all 0.2s ease"
            }}
          >
            <Avatar sx={{ width: 40, height: 40, mr: 2, bgcolor: user.id === activeUser ? "white" : "var(--primary-color)", color: user.id === activeUser ? "var(--primary-color)" : "white" }}>
              {user.username[0].toUpperCase()}
            </Avatar>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{user.username}</div>
            </div>
          </div>
        ))}
      </List>
    </div>
  );
};

export default Sidebar;
