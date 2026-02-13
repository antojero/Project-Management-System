import React, { useState, useContext, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../userContext";
import Webcam from "react-webcam";
import { GoogleLogin } from "@react-oauth/google";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [useFace, setUseFace] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { setUser } = useContext(UserContext);
  const webcamRef = useRef(null);

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const res = await axios.post("/api/google-login/", {
        token: credentialResponse.credential
      });
      setUser({
        access: res.data.access,
        refresh: res.data.refresh,
        role: res.data.role,
        user_id: res.data.user_id,
        username: res.data.username,
      });
      navigate("/Dashboard");
    } catch (err) {
      console.error(err);
      alert("Google Sign-In failed on backend");
    }
    setLoading(false);
  };

  // Username/Password login
  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await axios.post("/api/login/", { username, password });
      setUser({
        access: response.data.access,
        refresh: response.data.refresh,
        role: response.data.role,
        user_id: response.data.user_id,
        username: response.data.username,
      });
      navigate("/Dashboard");
    } catch (error) {
      alert("Invalid username or password ❌");
    }
    setLoading(false);
  };

  // Face enrollment (first-time registration)
  const handleFaceEnroll = async (imageSrc) => {
    try {
      const formData = new FormData();
      formData.append("face_image", imageSrc);
      formData.append("username", username);

      await axios.post("/api/enroll-face/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Face enrolled successfully! ✅ You can now login with face.");
    } catch (error) {
      alert(
        error.response?.data?.detail ||
        "Face enrollment failed. Ensure your face is visible."
      );
    }
  };

  // Face login (subsequent logins)
  const handleFaceLogin = async () => {
    setLoading(true);
    try {
      const imageSrc = webcamRef.current.getScreenshot();
      const formData = new FormData();
      formData.append("face_image", imageSrc);
      formData.append("username", username);

      const response = await axios.post("/api/login-face/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setUser({
        access: response.data.access,
        refresh: response.data.refresh,
        role: response.data.role,
        user_id: response.data.user_id,
        username: response.data.username,
      });
      navigate("/Dashboard");
    } catch (error) {
      const detail = error.response?.data?.detail || "Face login failed ❌";

      // If no registered face, prompt enrollment
      if (detail === "User has no registered face") {
        const enroll = window.confirm(
          "No face registered. Do you want to enroll your face now?"
        );
        if (enroll) {
          const imageSrc = webcamRef.current.getScreenshot();
          await handleFaceEnroll(imageSrc);
        }
      } else {
        alert(detail);
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="glass-card animate-fade-in" style={{ maxWidth: 400, width: "100%", margin: "0 auto", textAlign: "center" }}>
        <h2 className="gradient-text" style={{ fontSize: "2rem", marginBottom: "1.5rem" }}>Login</h2>

        <input
          className="input-glass"
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={{ marginBottom: "1rem" }}
        />

        {!useFace && (
          <>
            <input
              className="input-glass"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ marginBottom: "1.5rem" }}
            />
            <button
              className="btn-primary"
              onClick={handleLogin}
              disabled={loading}
              style={{ width: "100%" }}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </>
        )}

        <div style={{ margin: "20px 0", height: "1px", background: "rgba(255,255,255,0.1)" }} />

        <label style={{ display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-secondary)" }}>
          <input
            type="checkbox"
            checked={useFace}
            onChange={(e) => setUseFace(e.target.checked)}
            style={{ marginRight: 8, accentColor: "var(--primary-color)" }}
          />
          Use Face Authentication
        </label>

        {useFace && (
          <div style={{ marginTop: 20 }}>
            <div style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.2)" }}>
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                width="100%"
                videoConstraints={{ facingMode: "user" }}
              />
            </div>
            <br />
            <button
              className="btn-primary"
              onClick={handleFaceLogin}
              disabled={loading}
              style={{ marginTop: 10, width: "100%" }}
            >
              {loading ? "Authenticating..." : "Login with Face"}
            </button>
          </div>
        )}

        <div style={{ margin: "20px 0", height: "1px", background: "rgba(255,255,255,0.1)" }} />

        <div style={{ display: "flex", justifyContent: "center" }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => alert("Google Login Failed")}
            theme="filled_black"
            shape="pill"
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
