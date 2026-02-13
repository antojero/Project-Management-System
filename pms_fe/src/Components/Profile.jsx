import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  CircularProgress,
  Avatar,
  Divider,
  Stack,
  IconButton,
  Tooltip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import axios from "axios";
import { useParams } from "react-router-dom";

const Profile = () => {
  const { userid } = useParams();

  const [userData, setUserData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    role: "",
    department: "",
  });

  // Fetch user + dropdown data
  const fetchUser = async () => {
    try {
      const response = await axios.get(`/api/users/?user_id=${userid}`);
      const data = response.data;
      setUserData(data);
      setFormData({
        username: data.username,
        email: data.email,
        role: data.role,
        department: data.department,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRolesAndDepartments = async () => {
    try {
      const [rolesRes, deptRes] = await Promise.all([
        axios.get("/api/roles/"),
        axios.get("/api/department/"),
      ]);
      setRoles(rolesRes.data.results || rolesRes.data);
      setDepartments(deptRes.data.results || deptRes.data);
    } catch (error) {
      console.error("Error fetching roles/departments:", error);
    }
  };
  useEffect(() => {


    fetchRolesAndDepartments();
    fetchUser();
  }, [userid]);

  // Handle input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Save update
  const handleSave = async () => {
    try {
      const payload = {
        username: formData.username,
        email: formData.email,
        role: formData.role,
        department: formData.department,
      };
      await axios.put(`/api/users/?id=${userid}`, payload);
      alert("✅ Profile updated successfully!");
      setEditMode(false);
    } catch (error) {
      console.error("Error updating user:", error);
      alert("❌ Failed to update user details");
    }
  };

  if (loading)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress sx={{ color: "var(--primary-color)" }} />
      </Box>
    );

  if (!userData)
    return (
      <Typography textAlign="center" mt={5} color="var(--text-muted)">
        User not found
      </Typography>
    );

  return (
    <div className="animate-fade-in" style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
      <div className="glass-card" style={{ width: "100%", maxWidth: "600px", padding: "0", overflow: "hidden" }}>

        {/* HEADER */}
        <div style={{
          background: "linear-gradient(135deg, rgba(139, 92, 246, 0.8) 0%, rgba(6, 182, 212, 0.8) 100%)",
          padding: "3rem 2rem",
          textAlign: "center",
          position: "relative"
        }}>
          <div style={{
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.2)",
            backdropFilter: "blur(10px)",
            border: "4px solid rgba(255,255,255,0.3)",
            margin: "0 auto 1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2.5rem",
            fontWeight: 700,
            color: "white"
          }}>
            {formData.username ? formData.username[0].toUpperCase() : "U"}
          </div>
          <h2 style={{ color: "white", marginBottom: "0.25rem" }}>{formData.username}</h2>
          <p style={{ color: "rgba(255,255,255,0.8)" }}>{formData.email}</p>
        </div>

        {/* DETAILS */}
        <div style={{ padding: "2rem" }}>
          <Stack spacing={3}>
            <div>
              <label style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginLeft: "4px" }}>Username</label>
              <input
                className="input-glass"
                name="username"
                value={formData.username}
                onChange={handleChange}
                disabled={!editMode}
                style={{ marginTop: "0.5rem", opacity: !editMode ? 0.7 : 1 }}
              />
            </div>

            <div>
              <label style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginLeft: "4px" }}>Email</label>
              <input
                className="input-glass"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!editMode}
                style={{ marginTop: "0.5rem", opacity: !editMode ? 0.7 : 1 }}
              />
            </div>

            <div>
              <label style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginLeft: "4px" }}>Role</label>
              <select
                className="input-glass"
                name="role"
                value={formData.role}
                onChange={handleChange}
                disabled={!editMode}
                style={{ marginTop: "0.5rem", opacity: !editMode ? 0.7 : 1 }}
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id} style={{ color: "black" }}>
                    {role.name || role.role_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginLeft: "4px" }}>Department</label>
              <select
                className="input-glass"
                name="department"
                value={formData.department}
                onChange={handleChange}
                disabled={!editMode}
                style={{ marginTop: "0.5rem", opacity: !editMode ? 0.7 : 1 }}
              >
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id} style={{ color: "black" }}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </Stack>

          {/* BUTTONS */}
          <div style={{ marginTop: "2.5rem", display: "flex", justifyContent: "center", gap: "1rem" }}>
            {!editMode ? (
              <button
                className="btn-primary"
                onClick={() => setEditMode(true)}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <EditIcon fontSize="small" /> Edit Profile
              </button>
            ) : (
              <>
                <button
                  className="btn-primary"
                  onClick={handleSave}
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--success)" }}
                >
                  <SaveIcon fontSize="small" /> Save
                </button>
                <button
                  className="btn-ghost"
                  onClick={() => {
                    setEditMode(false);
                    setFormData({
                      username: userData.username,
                      email: userData.email,
                      role: userData.role,
                      department: userData.department,
                    });
                  }}
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderColor: "var(--danger)", color: "var(--danger)" }}
                >
                  <CancelIcon fontSize="small" /> Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
