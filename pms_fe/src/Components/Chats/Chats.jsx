// Chats.jsx
import React, { useEffect, useState, useContext, useRef } from "react";
import { Box, Grid } from "@mui/material";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import { UserContext } from "../../userContext";

const Chats = () => {
  const { user_id, userToken } = useContext(UserContext);
  console.log("user_id", user_id)
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [activeUserData, setActiveUserData] = useState(null);
  const socketRef = useRef(null);

  // Fetch all users
  useEffect(() => {
    if (!user_id) return;
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users/", {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        const data = await res.json();
        const userList = data.results || data || [];
        const others = Array.isArray(userList) ? userList.filter(u => u.id !== user_id) : [];
        setUsers(others);
        if (!activeUser && others.length > 0) setActiveUser(others[0].id);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUsers();
  }, [user_id, userToken]);

  // Fetch active user info
  useEffect(() => {
    if (!activeUser) return;
    const fetchActiveUserData = async () => {
      try {
        const res = await fetch(`/api/users/?user_id=${activeUser}`, {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        const data = await res.json();
        setActiveUserData(data);
      } catch (err) {
        console.error(err);
        setActiveUserData(null);
      }
    };
    fetchActiveUserData();
  }, [activeUser, userToken]);

  // Fetch messages
  useEffect(() => {
    if (!activeUser) return;
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/messages/?with=${activeUser}`, {
          headers: { Authorization: `Bearer ${userToken}` },
        });
        const data = await res.json();
        setMessages(data || []);
      } catch (err) {
        console.error(err);
        setMessages([]);
      }
    };
    fetchMessages();
  }, [activeUser, userToken]);

  // Setup WebSocket
  useEffect(() => {
    if (!user_id || !activeUser) return;

    const wsScheme = window.location.protocol === "https:" ? "wss" : "ws";
    const sortedUsers = [user_id, activeUser].sort((a, b) => a - b);
    const ws = new WebSocket(
      `${wsScheme}://${process.env.REACT_APP_WS_HOST}/ws/chat/${sortedUsers[0]}/${sortedUsers[1]}/`
    );

    ws.onopen = () => console.log("WS connected");
    ws.onclose = () => console.log("WS closed");
    ws.onerror = (err) => console.error("WS error", err);

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);

        if (data.event === "message" && data.message) {
          setMessages(prev =>
            prev.find(m => m.id === data.message.id) ? prev : [...prev, data.message]
          );
        }

        if (data.event === "reaction" && data.message) {
          setMessages(prev => prev.map(m => (m.id === data.message.id ? data.message : m)));
        }

        if (data.event === "typing" && data.user_id && data.user_id !== user_id) {
          setTypingUsers(prev => ({ ...prev, [data.user_id]: true }));
          setTimeout(() => {
            setTypingUsers(prev => {
              const copy = { ...prev };
              delete copy[data.user_id];
              return copy;
            });
          }, 2000);
        }

        // When read updates arrive (list of message IDs), update local messages
        if (data.event === "messages_read" && data.message_ids) {
          setMessages(prev =>
            prev.map(m => (data.message_ids.includes(m.id) ? { ...m, read: true } : m))
          );
        }
      } catch (err) {
        console.error("Invalid WS message", err);
      }
    };

    socketRef.current = ws;

    return () => {
      try { ws.close(); } catch { }
    };
  }, [user_id, activeUser]);

  // Send message
  const sendMessage = async (text, fileName = null, fileData = null, type = "text") => {
    if (!text.trim() && !fileData) return;

    let payload = { receiver: activeUser, type };

    if (fileData && fileName) {
      payload.file_name = fileName;
      payload.file_data = fileData;
    } else {
      payload.content = text.trim();
    }

    try {
      const res = await fetch("/api/messages/", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${userToken}` },
        body: JSON.stringify(payload),
      });
      const savedMessage = await res.json();
      setMessages(prev =>
        prev.find(m => m.id === savedMessage.id) ? prev : [...prev, savedMessage]
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Send reaction (unchanged)
  const sendReaction = async (messageId, emoji) => {
    if (!messageId) return;
    try {
      const res = await fetch("/api/messages/react/", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${userToken}` },
        body: JSON.stringify({ message_id: messageId, reaction: emoji }),
      });
      const updated = await res.json();
      setMessages(prev => prev.map(m => (m.id === updated.id ? updated : m)));
    } catch (err) {
      console.error(err);
    }
  };

  // Called when `ChatWindow` wants to mark messages as read locally (fallback)
  const handleLocalMarkRead = (messageIds) => {
    if (!messageIds || messageIds.length === 0) return;
    setMessages(prev => prev.map(m => (messageIds.includes(m.id) ? { ...m, read: true } : m)));
  };

  return (
    <Box sx={{ height: "calc(100vh - 100px)", display: "flex", width: "100%", gap: 2 }}>
      <Grid item xs={12} md={3} sx={{ height: "100%", overflowY: "hidden", display: { xs: activeUser ? "none" : "block", md: "block" } }}>
        <Sidebar users={users} activeUser={activeUser} onSelectUser={setActiveUser} />
      </Grid>
      <Grid item xs={12} md={9} sx={{ height: "100%", overflowY: "hidden", display: { xs: activeUser ? "block" : "none", md: "block" } }}>
        {activeUser ? (
          <ChatWindow
            messages={messages}
            onSend={sendMessage}
            currentUser={user_id}
            onReact={sendReaction}
            typingUsers={typingUsers}
            sendTyping={(...args) => {
              if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({ event: "typing", user_id }));
              }
              return;
            }}
            activeUserData={activeUserData}
            socket={socketRef.current}
            onMarkRead={handleLocalMarkRead}
            onBack={() => setActiveUser(null)}
          />
        ) : (
          <div className="glass-card" style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", color: "var(--text-secondary)" }}>
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>💬</div>
            <h3>Select a user to start chatting</h3>
          </div>
        )}
      </Grid>
    </Box>
  );
};

export default Chats;
