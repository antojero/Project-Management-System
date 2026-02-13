import React, { useRef, useEffect, useState, useContext } from "react";
import { Box, IconButton, Typography } from "@mui/material";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaPhone,
  FaDesktop,
  FaStopCircle,
} from "react-icons/fa";
import { useCall } from "../contexts/CallProvider";
import { UserContext } from "../userContext";

const CallModal = () => {
  const { activeCall, localStream, remoteStream, endCall, peerConnection } = useCall();
  const { username } = useContext(UserContext);

  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [screenStream, setScreenStream] = useState(null);
  const [isSwapped, setIsSwapped] = useState(false);
  const [itsMobile, setItsMobile] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
 useEffect(()=>{
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if(isMobile)
    {
setItsMobile(true)
    }
  },[])
  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
  }, [localStream, remoteStream]);

  if (!activeCall) return null;

  const toggleMic = () => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
    setMicOn((prev) => !prev);
  };

  const toggleVideo = () => {
    if (!localStream) return;
    localStream.getVideoTracks().forEach((track) => (track.enabled = !track.enabled));
    setVideoOn((prev) => !prev);
  };

  const swapVideos = () => setIsSwapped((prev) => !prev);

 

  // ✅ Screen Share Function
const toggleScreenShare = async () => {
  if (!isSharingScreen) {
    try {
      // ✅ Detect mobile platforms that don't support screen share
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobile) {
        
        alert("⚠ Screen sharing is not supported on mobile browsers by WebRTC. Please use a desktop browser.");
        return;
      }

      if (window.location.protocol !== "https:") {
        alert("⚠ Screen sharing requires HTTPS. Please use a secure connection.");
        return;
      }

      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 }, // ✅ Helps Android devices
        audio: false,
      });

      const screenTrack = displayStream.getVideoTracks()[0];
      const sender = peerConnection.getSenders().find((s) => s.track.kind === "video");
      sender.replaceTrack(screenTrack);

      screenTrack.onended = () => stopScreenShare();
      setScreenStream(displayStream);
      setIsSharingScreen(true);
    } catch (err) {
      console.error("Screen share error: ", err);
      alert("⚠ Screen sharing failed. Your browser or device may not support it.");
    }
  } else {
    stopScreenShare();
  }
};


  // ✅ Stop Screen Share & Return Camera
  const stopScreenShare = () => {
    screenStream?.getTracks().forEach((track) => track.stop());

    // Restore camera video
    const cameraTrack = localStream.getVideoTracks()[0];
    const sender = peerConnection
      .getSenders()
      .find((s) => s.track.kind === "video");
    sender.replaceTrack(cameraTrack);

    setIsSharingScreen(false);
    setScreenStream(null);
  };

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        bgcolor: "rgba(0,0,0,0.85)",
        zIndex: 2000,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: "100%",
          borderRadius: 2,
          overflow: "hidden",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          bgcolor: "black",
        }}
      >
        <video
          ref={isSwapped ? localVideoRef : remoteVideoRef}
          autoPlay
          playsInline
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            cursor: "pointer",
          }}
          onClick={swapVideos}
        />

        <video
          ref={isSwapped ? remoteVideoRef : localVideoRef}
          autoPlay
          muted
          playsInline
          style={{
            position: "absolute",
            width: 200,
            height: 150,
            top: 20,
            right: 20,
            borderRadius: 12,
            objectFit: "cover",
            cursor: "pointer",
            border: "2px solid white",
          }}
          onClick={swapVideos}
        />

        {/* ✅ Controls */}
        <Box
          sx={{
            position: "absolute",
            bottom: 20,
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", gap: 3 }}>
            <IconButton sx={{ bgcolor: "white" }} onClick={toggleMic}>
              {micOn ? <FaMicrophone /> : <FaMicrophoneSlash color="red" />}
            </IconButton>
            <IconButton sx={{ bgcolor: "white" }} onClick={toggleVideo}>
              {videoOn ? <FaVideo /> : <FaVideoSlash color="red" />}
            </IconButton>

            {/* ✅ Screen Share Button */}
            {!itsMobile &&(
<IconButton
              sx={{ bgcolor: isSharingScreen ? "orange" : "white", color: "black" }}
              onClick={toggleScreenShare}
            >
              {isSharingScreen ? <FaStopCircle /> : <FaDesktop />}
            </IconButton>
            )
        }
            

            <IconButton
              sx={{ bgcolor: "red", color: "white", "&:hover": { bgcolor: "darkred" } }}
              onClick={endCall}
            >
              <FaPhone />
            </IconButton>
          </Box>

          <Typography sx={{ color: "white" }}>
            In Call with {activeCall.caller === username ? activeCall.target : activeCall.caller} ({activeCall.callType})
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default CallModal;
