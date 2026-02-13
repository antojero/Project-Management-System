// src/Components/Chats/ChatWindow.jsx
import React, { useEffect, useRef, useState, useCallback, useContext } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  InputAdornment,
  Dialog,
  DialogContent,
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import SearchIcon from "@mui/icons-material/Search";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import MicIcon from "@mui/icons-material/Mic";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import EmojiPicker from "emoji-picker-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { FaPhoneAlt, FaVideo } from "react-icons/fa";

import { useCall } from "../../contexts/CallProvider";
import { UserContext } from "../../userContext";

dayjs.extend(relativeTime);

const REACTIONS = ["👍", "❤️", "😂", "🔥", "😢", "😮"];

const ChatWindow = ({
  messages,
  onSend,
  currentUser,
  onReact,
  typingUsers,
  sendTyping,
  activeUserData,
  socket,
  onMarkRead,
}) => {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [playingAudio, setPlayingAudio] = useState(null);

  const [language, setLanguage] = useState("en");
  const [translatedMessages, setTranslatedMessages] = useState({});
  const [loadingTranslate, setLoadingTranslate] = useState(false);

  const scrollRef = useRef(null);
  const audioRefs = useRef({});
  const messageNodeRefs = useRef({});
  const observerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordIntervalRef = useRef(null);
  const reactionPickerRef = useRef(null);
  const visibleToMarkRef = useRef(new Set());
  const markedRequestedRef = useRef(new Set());
  const markTimeoutRef = useRef(null);

  const { startCall, activeCall, acceptCall, rejectCall, localStream, remoteStream, remoteAudioRef } = useCall();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const userContext = useContext(UserContext);

  // Assign streams to video elements
  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
    if (remoteAudioRef.current && remoteStream) remoteAudioRef.current.srcObject = remoteStream;
  }, [localStream, remoteStream, remoteAudioRef]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length]);

  // Typing indicator
  useEffect(() => {
    if (!text.trim()) return;
    const timeout = setTimeout(() => sendTyping(), 300);
    return () => clearTimeout(timeout);
  }, [text, sendTyping]);

  // Format helpers
  const formatDateGroup = (timestamp) => {
    const date = dayjs(timestamp);
    const today = dayjs().startOf("day");
    const yesterday = dayjs().subtract(1, "day").startOf("day");
    if (date.isSame(today, "day")) return "Today";
    if (date.isSame(yesterday, "day")) return "Yesterday";
    return date.format("DD MMM YYYY");
  };
  const formatTime = (timestamp) => dayjs(timestamp).format("hh:mm A");
  const formatRecordTime = (sec) =>
    `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
  const isImageFile = (msg) =>
    msg.type === "file" &&
    (msg.content_data?.type?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/i.test(msg.content_data?.name));

  // Mark messages read when visible
  const scheduleMarkVisibleMessages = useCallback(() => {
    if (markTimeoutRef.current) clearTimeout(markTimeoutRef.current);
    markTimeoutRef.current = setTimeout(() => {
      const ids = Array.from(visibleToMarkRef.current).filter((id) => !markedRequestedRef.current.has(id));
      if (!ids.length) return;

      ids.forEach((id) => markedRequestedRef.current.add(id));
      visibleToMarkRef.current.clear();

      if (socket && socket.readyState === WebSocket.OPEN) {
        try {
          socket.send(JSON.stringify({ event: "mark_read", receiver: activeUserData?.id, message_ids: ids }));
        } catch (err) {
          if (onMarkRead) onMarkRead(ids);
        }
      } else if (onMarkRead) onMarkRead(ids);
    }, 250);
  }, [socket, onMarkRead, activeUserData?.id]);

  // IntersectionObserver for message visibility
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute("data-msg-id");
          if (!id) return;
          const msgId = Number(id);
          const msg = messages.find((m) => Number(m.id) === msgId);
          if (!msg) return;

          if (Number(msg.sender) !== Number(currentUser) && !msg.read) {
            if (entry.isIntersecting && entry.intersectionRatio > 0.5) visibleToMarkRef.current.add(msgId);
            else visibleToMarkRef.current.delete(msgId);
          }
        });
        scheduleMarkVisibleMessages();
      },
      { root: scrollRef.current || null, threshold: [0, 0.5, 1], rootMargin: "0px" }
    );
    Object.values(messageNodeRefs.current).forEach((node) => node && observerRef.current.observe(node));
    return () => observerRef.current.disconnect();
  }, [messages, currentUser, scheduleMarkVisibleMessages]);

  // File send
  const handleSend = async () => {
    if (!text.trim() && !file) return;

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const type = file.type.startsWith("audio/") ? "audio" : "file";
        onSend("", file.name, reader.result, type);
        setFile(null);
        setFilePreview(null);
      };
      reader.readAsDataURL(file);
    } else {
      // Translate text if not English
      let translatedText = text.trim();
      if (language !== "en" && translatedText) {
        try {
          const res = await fetch("/api/translate/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: translatedText, target_lang: language }),
          });
          const data = await res.json();
          translatedText = data.translated || translatedText;
        } catch (err) {
          console.error("Translation failed:", err);
        }
      }
      onSend(translatedText, null, null, "text");
    }
    setText("");
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    if (selectedFile?.type.startsWith("image/")) setFilePreview(URL.createObjectURL(selectedFile));
    else setFilePreview(null);
  };

  // Translate messages when language changes
  useEffect(() => {
    if (language === "en") {
      setTranslatedMessages({});
      return;
    }

    const translateMessages = async () => {
      setLoadingTranslate(true);
      const translations = {};

      for (const msg of messages) {
        let textContent =
          typeof msg.content === "string"
            ? msg.content
            : msg.content_data?.data && typeof msg.content_data.data === "string"
              ? msg.content_data.data
              : null;

        if (!textContent) continue; // skip non-string messages

        try {
          const response = await fetch("/api/translate/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: textContent, target_lang: language }),
          });
          const data = await response.json();
          translations[msg.id] = data.translated || textContent;
        } catch (err) {
          console.error("Translation failed:", err);
          translations[msg.id] = textContent;
        }
      }

      setTranslatedMessages(translations);
      setLoadingTranslate(false);
    };

    translateMessages();
  }, [language, messages]);


  // Recording
  const handleStartRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    audioChunksRef.current = [];
    mediaRecorderRef.current.ondataavailable = (e) => audioChunksRef.current.push(e.data);
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const reader = new FileReader();
      reader.onloadend = () => onSend("", "voice_message.webm", reader.result, "audio");
      reader.readAsDataURL(blob);
    };
    mediaRecorderRef.current.start();
    setRecording(true);
    setRecordTime(0);
    recordIntervalRef.current = setInterval(() => setRecordTime((prev) => prev + 1), 1000);
  };
  const handleStopRecording = () => {
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
    setRecording(false);
    clearInterval(recordIntervalRef.current);
  };

  const togglePlayAudio = (msgId) => {
    const audioEl = audioRefs.current[msgId];
    if (!audioEl) return;
    if (playingAudio === msgId) {
      audioEl.pause();
      setPlayingAudio(null);
    } else {
      if (playingAudio && audioRefs.current[playingAudio]) audioRefs.current[playingAudio].pause();
      audioEl.play();
      setPlayingAudio(msgId);
      audioEl.onended = () => setPlayingAudio(null);
    }
  };

  // Reactions
  const handleReactionClick = (msg) => {
    setSelectedMessage(msg);
    setReactionPickerOpen(!reactionPickerOpen);
  };
  const handleReactionSelect = (emoji) => {
    if (selectedMessage) {
      onReact(selectedMessage.id, emoji);
      setReactionPickerOpen(false);
      setSelectedMessage(null);
    }
  };
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (reactionPickerRef.current && !reactionPickerRef.current.contains(event.target))
        setReactionPickerOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Emoji Picker
  const onEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const openModal = (content) => {
    setModalContent(content);
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setModalContent(null);
  };

  return (
    <div className="glass-card" style={{ height: "100%", display: "flex", flexDirection: "column", padding: "0.5rem", borderRadius: "16px", overflow: "hidden" }}>
      {/* Top Bar */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2, borderBottom: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)", borderRadius: "12px 12px 0 0" }}>
        <Box display="flex" alignItems="center" gap={2}>
          {/* Back button for mobile can be added here if needed */}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "var(--text-primary)" }}>
              {activeUserData?.username || "User"}
            </Typography>
            <Typography variant="caption" sx={{ color: "var(--text-secondary)" }}>
              {activeUserData?.last_seen ? dayjs(activeUserData.last_seen).format("DD MMM, hh:mm A") : "Offline"}
            </Typography>
          </Box>
        </Box>

        <Box display="flex" alignItems="center" gap={2}>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <Select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              sx={{ color: "var(--text-primary)", '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' } }}
            >
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="ta">Tamil</MenuItem>
              <MenuItem value="hi">Hindi</MenuItem>
              <MenuItem value="fr">French</MenuItem>
              <MenuItem value="es">Spanish</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ display: "flex", gap: 2 }}>
            <FaPhoneAlt size={18} style={{ cursor: "pointer", color: "var(--primary-light)" }} title="Audio call" onClick={() => startCall(activeUserData.username, "audio")} />
            <FaVideo size={18} style={{ cursor: "pointer", color: "var(--primary-light)" }} title="Video call" onClick={() => startCall(activeUserData.username, "video")} />
          </Box>
        </Box>
      </Box>

      {/* Messages */}
      <Box ref={scrollRef} sx={{ flex: 1, overflowY: "auto", mb: 1, p: 1 }}>
        {(() => {
          let lastDateGroup = null; // Track last date group for the entire message list
          return messages
            .filter((msg) => {
              let content = msg.content_data || msg.content || "";
              if (typeof content === "object") content = JSON.stringify(content);
              return content.toLowerCase().includes(searchTerm.toLowerCase());
            })
            .map((msg) => {
              const isMine = Number(msg.sender) === Number(currentUser);

              // Determine date group
              const dateGroup = formatDateGroup(msg.timestamp);
              const showDateHeader = dateGroup !== lastDateGroup;
              lastDateGroup = dateGroup;

              // Message content
              let content;
              if (isImageFile(msg)) {
                content = (
                  <img
                    src={msg.content_data.data}
                    alt={msg.content_data.name}
                    style={{ maxWidth: 200, borderRadius: 8, cursor: "pointer" }}
                    onClick={() => openModal(msg.content_data.data)}
                  />
                );
              } else if (msg.type === "audio") {
                content = (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <audio ref={(el) => (audioRefs.current[msg.id] = el)} src={msg.content_data.data} />
                    <IconButton onClick={() => togglePlayAudio(msg.id)}>
                      {playingAudio === msg.id ? <PauseIcon /> : <PlayArrowIcon />}
                    </IconButton>
                    <Typography>{msg.content_data.name}</Typography>
                  </Box>
                );
              } else {
                // Ensure we only send strings
                const textContent =
                  typeof msg.content === "string"
                    ? msg.content
                    : msg.content_data?.data
                      ? msg.content_data.data
                      : "";
                content = translatedMessages[msg.id] || textContent;
              }

              return (
                <React.Fragment key={msg.id}>
                  {/* Date header */}
                  {showDateHeader && (
                    <Box textAlign="center" my={2}>
                      <Typography variant="caption" sx={{ opacity: 0.7 }}>
                        {dateGroup}
                      </Typography>
                    </Box>
                  )}

                  {/* Message bubble */}
                  <Box sx={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start", mb: 1 }}>
                    <Box
                      sx={{ maxWidth: "70%", position: "relative" }}
                      ref={(el) => {
                        if (el) {
                          el.setAttribute("data-msg-id", msg.id);
                          messageNodeRefs.current[msg.id] = el;
                          if (observerRef.current) observerRef.current.observe(el);
                        } else {
                          if (observerRef.current && messageNodeRefs.current[msg.id])
                            observerRef.current.unobserve(messageNodeRefs.current[msg.id]);
                          delete messageNodeRefs.current[msg.id];
                        }
                      }}
                    >
                      <Typography
                        sx={{
                          bgcolor: isMine ? "primary.main" : "grey.200",
                          color: isMine ? "white" : "black",
                          px: 2,
                          py: 1,
                          borderRadius: 2,
                          wordBreak: "break-word",
                          cursor: "pointer",
                        }}
                        onClick={() => handleReactionClick(msg)}
                      >
                        {content}
                        <span
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 4,
                            fontSize: 10,
                            marginTop: 2,
                          }}
                        >
                          {isMine && <span style={{ color: msg.read ? "#4fc3f7" : "grey" }}>✓✓</span>}
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </span>
                      </Typography>

                      {msg.reaction_counts && Object.keys(msg.reaction_counts).length > 0 && (
                        <Box sx={{ display: "flex", gap: 0.5, mt: 0.5 }}>
                          {Object.entries(msg.reaction_counts).map(([emoji, count]) => (
                            <Typography key={emoji} sx={{ fontSize: 16 }}>
                              {emoji} {count}
                            </Typography>
                          ))}
                        </Box>
                      )}
                    </Box>
                  </Box>
                </React.Fragment>
              );
            });
        })()}
      </Box>

      {/* Typing indicator */}
      {Object.keys(typingUsers).length > 0 && (
        <Typography sx={{ fontStyle: "italic", color: "grey.600", ml: 1 }}>Typing...</Typography>
      )}

      {/* Reaction Picker */}
      {reactionPickerOpen && selectedMessage && (
        <Box ref={reactionPickerRef} sx={{ position: "absolute", bottom: 72, left: "50%", transform: "translateX(-50%)", bgcolor: "white", p: 1, borderRadius: "12px", boxShadow: "0 6px 20px rgba(0,0,0,0.12)", display: "flex", gap: 1, zIndex: 50 }}>
          {REACTIONS.map((emoji) => <Typography key={emoji} sx={{ fontSize: 20, cursor: "pointer", userSelect: "none" }} onClick={() => handleReactionSelect(emoji)}>{emoji}</Typography>)}
        </Box>
      )}

      {/* File preview */}
      {filePreview && (
        <Box sx={{ p: 1, display: "flex", justifyContent: "flex-start", position: "relative", width: 150 }}>
          <img src={filePreview} alt="preview" style={{ maxWidth: 150, maxHeight: 150, borderRadius: 8 }} />
          <IconButton size="small" sx={{ position: "absolute", top: -8, right: -8, bgcolor: "rgba(0,0,0,0.6)", color: "white", "&:hover": { bgcolor: "rgba(0,0,0,0.8)" }, padding: 0.5 }} onClick={() => { setFile(null); setFilePreview(null); }}>×</IconButton>
        </Box>
      )}

      {/* Input Area */}
      <Box sx={{ display: "flex", gap: 1, p: 2, borderTop: "1px solid rgba(255,255,255,0.1)", alignItems: "center", position: "relative", background: "rgba(0,0,0,0.2)" }}>
        <input type="file" id="file-input" style={{ display: "none" }} onChange={handleFileChange} />
        <label htmlFor="file-input">
          <IconButton color="primary" component="span"><AttachFileIcon /></IconButton>
        </label>

        <div style={{ flex: 1, position: "relative" }}>
          <input
            className="input-glass"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            style={{ paddingRight: "80px", width: "100%", marginBottom: 0 }}
          />
          <div style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", display: "flex", gap: "5px" }}>
            <IconButton size="small" onClick={() => setShowEmojiPicker(!showEmojiPicker)} sx={{ color: "var(--text-secondary)" }}><EmojiEmotionsIcon /></IconButton>
            <IconButton size="small" onClick={recording ? handleStopRecording : handleStartRecording}><MicIcon color={recording ? "error" : "inherit"} sx={{ color: recording ? "red" : "var(--text-secondary)" }} /></IconButton>
          </div>
        </div>

        <IconButton onClick={handleSend} sx={{ bgcolor: "var(--primary-color)", color: "white", "&:hover": { bgcolor: "var(--primary-hover)" }, width: 45, height: 45 }}><SendIcon /></IconButton>

        {recording && <Typography sx={{ position: "absolute", bottom: 70, right: 20, color: "red", background: "rgba(0,0,0,0.8)", padding: "5px 10px", borderRadius: "20px" }}>Recording {formatRecordTime(recordTime)}</Typography>}
        {showEmojiPicker && <Box sx={{ position: "absolute", bottom: 80, right: 20, zIndex: 1000 }}><EmojiPicker theme="dark" onEmojiClick={onEmojiClick} height={350} width={300} /></Box>}
      </Box>

      {/* Modal for image preview */}
      <Dialog open={modalOpen} onClose={closeModal} maxWidth="lg" PaperProps={{ style: { backgroundColor: "transparent", boxShadow: "none" } }}>
        <DialogContent sx={{ p: 0, overflow: "hidden" }}>{modalContent && <img src={modalContent} alt="preview" style={{ width: "100%", height: "auto", borderRadius: "12px", boxShadow: "0 0 20px rgba(0,0,0,0.5)" }} />}</DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatWindow;
