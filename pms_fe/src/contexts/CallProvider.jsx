// ✅ src/contexts/CallProvider.jsx - FULL UPDATED WITH SCREEN SHARING SUPPORT
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { UserContext } from "../userContext";

const CallContext = createContext();
export const useCall = () => useContext(CallContext);

export const CallProvider = ({ children }) => {
  const wsRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);

  const [connected, setConnected] = useState(false);
  const [incoming, setIncoming] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [muted, setMuted] = useState(false);

  const userContext = useContext(UserContext);
  const user = userContext?.user || {};
  const username = user.username || "anonymous";

  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const wsUrl = `${protocol}://${process.env.REACT_APP_WS_HOST}/ws/call/${encodeURIComponent(username)}/`;

  // ✅ Screen Share Stream Tracking
  const screenStreamRef = useRef(null);

  // ✅ Helper to Replace Video Track (Used for Screen Sharing)
  const replaceVideoTrack = (newTrack) => {
    if (!pcRef.current) return;
    const sender = pcRef.current.getSenders().find((s) => s.track && s.track.kind === "video");
    if (sender) sender.replaceTrack(newTrack);
  };

  // Initialize WebSocket
  useEffect(() => {
    if (!username) return;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
      setConnected(true);
    };

    ws.onclose = () => setConnected(false);
    ws.onerror = (err) => console.error("WebSocket error", err);

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        handleSignalingMessage(data);
      } catch (e) {
        console.error("WS parse error", e);
      }
    };

    return () => {
      wsRef.current?.close();
      cleanupPeer();
    };
  }, [username]);

  const sendSignal = (payload) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  };

  const createPeerConnection = (isCaller = false, target = null) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    const remoteStream = new MediaStream();
    remoteStreamRef.current = remoteStream;

    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => remoteStream.addTrack(track));
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.play().catch((e) => console.error("Audio play error:", e));
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && target) {
        sendSignal({
          action: "ice_candidate",
          target,
          from: username,
          candidate: event.candidate,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (["failed", "disconnected", "closed"].includes(pc.connectionState)) endCall();
    };

    pcRef.current = pc;
    return pc;
  };

  const getLocalMedia = async (callType = "audio") => {
    try {
      const constraints = { audio: true, video: callType === "video" };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      return stream;
    } catch (err) {
      console.error("getUserMedia error", err);
      throw err;
    }
  };

  const handleSignalingMessage = async (data) => {
    const { action, from } = data;

    if (action === "call_request") {
      setIncoming({ from, callType: data.callType || "audio" });
      if (Notification.permission === "granted") {
        new Notification("Incoming call", { body: `${from} is calling` });
      }
    } else if (action === "offer") {
      setIncoming({ from, callType: data.callType || "audio", sdp: data.sdp });
    } else if (action === "answer") {
      if (pcRef.current) await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
    } else if (action === "ice_candidate") {
      if (pcRef.current && data.candidate) await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
    } else if (action === "call_end") {
      endCall(false);
    }
  };

  const startCall = async (targetUsername, callType = "audio") => {
    try {
      const localStream = await getLocalMedia(callType);
      const pc = createPeerConnection(true, targetUsername);
      localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      sendSignal({
        action: "offer",
        target: targetUsername,
        from: username,
        sdp: pc.localDescription,
        callType,
      });

      setActiveCall({ target: targetUsername, callType, caller: username });
      return true;
    } catch (err) {
      console.error("startCall error", err);
      endCall();
      return false;
    }
  };

  const acceptCall = async () => {
    if (!incoming) return;
    const { from: caller, sdp, callType } = incoming;

    try {
      const localStream = await getLocalMedia(callType);
      const pc = createPeerConnection(false, caller);
      localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));

      if (sdp) await pc.setRemoteDescription(new RTCSessionDescription(sdp));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      sendSignal({ action: "answer", target: caller, from: username, sdp: pc.localDescription });

      setActiveCall({ target: caller, callType, caller });
      setIncoming(null);
    } catch (err) {
      console.error("acceptCall error", err);
      endCall();
    }
  };

  const rejectCall = () => {
    if (!incoming) return;
    sendSignal({ action: "call_end", target: incoming.from, from: username });
    setIncoming(null);
  };

  const endCall = (notifyRemote = true) => {
    if (notifyRemote && activeCall?.target) {
      sendSignal({ action: "call_end", target: activeCall.target, from: username });
    }
    cleanupPeer();
    setActiveCall(null);
    setIncoming(null);
  };

  const cleanupPeer = () => {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;

    pcRef.current?.close();
    pcRef.current = null;

    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;

    remoteStreamRef.current?.getTracks().forEach((t) => t.stop());
    remoteStreamRef.current = null;
  };

  const toggleMute = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
    setMuted((m) => !m);
  };

  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  return (
    <CallContext.Provider
      value={{
        connected,
        incoming,
        activeCall,
        localStream: localStreamRef.current,
        remoteStream: remoteStreamRef.current,
        muted,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        remoteAudioRef,
        peerConnection: pcRef.current, // ✅ Expose for screen sharing
        replaceVideoTrack, // ✅ Allow track replacement
      }}
    >
      {children}
      <audio ref={remoteAudioRef} autoPlay />
    </CallContext.Provider>
  );
};
