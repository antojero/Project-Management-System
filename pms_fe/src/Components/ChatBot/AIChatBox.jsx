import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  TextField,
  IconButton,
  Paper,
  Typography,
  CircularProgress,
  Avatar,
  Tooltip,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ContentCopyIcon from "@mui/icons-material/ContentCopy"; // ✅ import copy icon
import axios from "axios";
const bubbleStyle = (isUser) => ({
  padding: "12px 16px",
  borderRadius: 8,
  maxWidth: "70%",
  backgroundColor: isUser ? "#1976d2" : "#f1f3f4",
  color: isUser ? "#fff" : "#000",
  position: "relative",
  paddingRight: isUser ? "16px" : "36px", // ✅ extra space on right for bot messages
});

const AIChatBox = () => {
  const [messages, setMessages] = useState([
    {
      id: "bot-welcome",
      sender: "bot",
      text: 'Hi — ask me Anything',
    },
  ]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef();

  useEffect(() => {
    // scroll to bottom on new message
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg = { id: Date.now(), sender: "user", text: trimmed };
    setMessages((m) => [...m, userMsg]);
    setText("");
    setLoading(true);

    try {
      const res = await axios.post("/api/ai-chat/", { message: trimmed,user_id:"1" });
      const botText = res.data.reply || "No response";
      const botMsg = { id: "bot-" + Date.now(), sender: "bot", text: botText, meta: res.data.created || null };
      setMessages((m) => [...m, botMsg]);
    } catch (err) {
      console.error(err);
      setMessages((m) => [...m, { id: "bot-err", sender: "bot", text: "Error contacting server." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleCopy = (textToCopy) => {
    navigator.clipboard.writeText(textToCopy)
      .then(() => alert("Copied to clipboard!"))
      .catch((err) => alert("Failed to copy!"));
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "98vh", p: 2 }}>
     <Paper
  ref={listRef}
  sx={{
    flex: 1,
    p: 2,
    overflowY: "auto",
    mb: 2,
    maxHeight: "100vh",
    "&::-webkit-scrollbar": {
      display: "none", // hide scroll bar for Chrome, Safari, Edge
    },
    scrollbarWidth: "none", // hide scroll bar for Firefox
    msOverflowStyle: "none", // hide scroll bar for IE/Edge
  }}
>

        {messages.map((m) => (
          <Box key={m.id} sx={{ display: "flex", justifyContent: m.sender === "user" ? "flex-end" : "flex-start", mb: 1 }}>
            {m.sender === "bot" && (
              <Avatar sx={{ mr: 1, bgcolor: "#6a1b9a" }}>AI</Avatar>
            )}
            <Box sx={bubbleStyle(m.sender === "user")}>
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{m.text}</Typography>

              {/* ✅ Copy Icon */}
            {m.sender === "bot" && (
  <Tooltip title="Copy">
    <IconButton
      size="small"
      sx={{ position: "absolute", top: 4, right: 4 }}
      onClick={() => handleCopy(m.text)}
    >
      <ContentCopyIcon fontSize="small" />
    </IconButton>
  </Tooltip>
)}


              {m.meta && (
                <Paper variant="outlined" sx={{ mt: 1, p: 1, backgroundColor: "#f7fff7" }}>
                  <Typography variant="caption" color="green">Created:</Typography>
                  <Typography variant="body2">ID: {m.meta.id}</Typography>
                  <Typography variant="body2">Name: {m.meta.name || m.meta.project_name || m.meta.title}</Typography>
                </Paper>
              )}
            </Box>
          </Box>
        ))}
      </Paper>

      <Box sx={{ display: "flex", gap: 1 }}>
        <TextField
          multiline
          minRows={1}
          maxRows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a command"
          fullWidth
        />
        <IconButton color="primary" onClick={sendMessage} disabled={loading} sx={{marginLeft:"5px"}}>
          {loading ? <CircularProgress size={20} /> : <SendIcon />}
        </IconButton>
      </Box>
    </Box>
  );
};

export default AIChatBox;
