import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

const VoiceAssistant = () => {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Your browser does not support Speech Recognition");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Continuous listening
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => console.log("Voice assistant started listening...");
    recognition.onresult = (event) => {
      const spokenText =
        event.results[event.results.length - 1][0].transcript;
      console.log("User said:", spokenText);
      sendToLLM(spokenText);
    };

    recognition.onerror = (event) => {
      console.error("SpeechRecognition error:", event.error);
    };

    recognition.onend = () => {
      console.log("Recognition ended");
      if (listening) recognition.start(); // restart if still listening
    };

    recognitionRef.current = recognition;
  }, [listening]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (!listening) {
      recognitionRef.current.start();
      setListening(true);
    } else {
      recognitionRef.current.stop();
      setListening(false);
    }
  };

  const sendToLLM = async (text) => {
    try {
      console.log("Sending to LLM:", text);
      const response = await axios.post("/api/ai-voicechat/", { message: text});
console.log("response",response)
      const reply =
        response.data.reply||
        "Sorry, I didn't get a response.";
      console.log("LLM replied:", reply);
      speak(reply);
    } catch (err) {
      console.error("LLM error:", err);
      speak("Sorry, I could not get a response.");
    }
  };

const speak = (text) => {
  if (!text) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";

  // Get all voices
  const voices = window.speechSynthesis.getVoices();

  // Pick a female voice
  const femaleVoice = voices.find(
    (voice) =>
      voice.lang.startsWith("en") &&
      (voice.name.toLowerCase().includes("female") ||
       voice.name.toLowerCase().includes("zira") ||
       voice.name.toLowerCase().includes("susan") ||
       voice.name.toLowerCase().includes("victoria"))
  ) || voices[0]; // fallback to first voice if none found

  utterance.voice = femaleVoice;

  // Optional: adjust pitch and rate for a natural tone
  utterance.pitch = 1.2; // slightly higher pitch for female
  utterance.rate = 1;    // normal speed

  window.speechSynthesis.speak(utterance);
};

// Ensure voices are loaded
if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        background: listening ? "green" : "gray",
        color: "white",
        padding: "15px",
        borderRadius: "50%",
        cursor: "pointer",
        zIndex: 9999,
        fontSize: "24px",
        textAlign: "center",
      }}
      onClick={toggleListening}
      title={listening ? "Click to stop listening" : "Click to start listening"}
    >
      🎤
    </div>
  );
};

export default VoiceAssistant;
