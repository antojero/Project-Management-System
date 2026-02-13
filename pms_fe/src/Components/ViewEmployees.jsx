// src/pages/ViewEmployees.jsx
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import DynamicTable from "../commons/DynamicTable";
import { FaPhoneAlt, FaVideo } from "react-icons/fa";
import { useCall } from "../contexts/CallProvider";
import IncomingCall from "./IncomingCall";
import CallModal from "./CallModal";

const ViewEmployees = () => {
  const [usersData, setUsersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const { startCall, remoteStream, localStream, activeCall } = useCall();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Assign streams to video elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [localStream, remoteStream]);

  const columns = [
    { field: "id", headerName: "ID" },
    {
      field: "username",
      headerName: "Username",
      isLink: true, // Custom flag for clickable field
    },
    { field: "email", headerName: "Email" },
    { field: "role_name", headerName: "Role" },
    { field: "department_name", headerName: "Department" },
    {
      field: "actions",
      headerName: "Actions",
      renderCell: (row) => (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <FaPhoneAlt
            size={18}
            style={{ cursor: "pointer" }}
            title="Audio call"
            onClick={(e) => {
              e.stopPropagation();
              startCall(row.username, "audio");
            }}
          />
          <FaVideo
            size={18}
            style={{ cursor: "pointer" }}
            title="Video call"
            onClick={(e) => {
              e.stopPropagation();
              startCall(row.username, "video");
            }}
          />
        </div>
      ),
    },
  ];

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get("/api/users/");
        const data = response.data.results || response.data;
        setUsersData(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleRowClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  if (loading) {
    return <p style={{ textAlign: "center", marginTop: "2rem" }}>Loading...</p>;
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h2 className="gradient-text" style={{ fontSize: "2rem" }}>Employee List</h2>
        <button className="btn-primary" onClick={() => navigate("/employee/add")}>+ Add New</button>
      </div>

      <div className="glass-card" style={{ padding: "1rem" }}>
        <DynamicTable
          data={usersData}
          columns={columns}
          title="Employees"
          onRowClick={handleRowClick}
        />
      </div>

      {/* Incoming call popup & active call modal */}
      <IncomingCall />
      <CallModal />

      {/* Video elements for active call */}
      {activeCall?.callType === "video" && (
        <div className="glass-card" style={{ display: "flex", gap: "20px", marginTop: "20px", justifyContent: "center" }}>
          <div>
            <p style={{ marginBottom: "10px", color: "var(--text-secondary)" }}>Local Video</p>
            <video
              ref={localVideoRef}
              autoPlay
              muted
              style={{ width: "300px", height: "200px", backgroundColor: "#000", borderRadius: "12px" }}
            />
          </div>
          <div>
            <p style={{ marginBottom: "10px", color: "var(--text-secondary)" }}>Remote Video</p>
            <video
              ref={remoteVideoRef}
              autoPlay
              style={{ width: "300px", height: "200px", backgroundColor: "#000", borderRadius: "12px" }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewEmployees;
