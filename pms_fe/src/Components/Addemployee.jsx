import React, { useEffect, useState } from "react";
import {
  TextField,
  Button,
  MenuItem,
  Card,
  CardContent,
  Typography,
  Box,
} from "@mui/material";
import axios from "axios";

const Addemployee = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "",
    department: "",
    username: "",
  });

  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roleRes, deptRes] = await Promise.all([
          axios.get("/api/roles/"),
          axios.get("/api/department/"),
        ]);

        setRoles(roleRes.data);
        setDepartments(deptRes.data.results);
      } catch (error) {
        console.error("Error fetching roles or departments:", error);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password || !formData.role || !formData.department) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const response = await axios.post("/api/register/", formData);
      console.log("Employee added:", response.data);
      alert("Employee added successfully!");
      setFormData({ email: "", password: "", role: "", department: "" });
    } catch (error) {
      console.error("Error adding employee:", error.response?.data || error.message);
      alert("Failed to add employee");
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", justifyContent: "center", marginTop: "2rem" }}>
      <div className="glass-card" style={{ width: 400, borderRadius: "24px" }}>
        <h2 className="gradient-text" style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          Add Employee
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginLeft: "4px" }}>Username</label>
            <input
              className="input-glass"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              style={{ marginTop: "0.5rem" }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginLeft: "4px" }}>Email</label>
            <input
              className="input-glass"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{ marginTop: "0.5rem" }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginLeft: "4px" }}>Password</label>
            <input
              className="input-glass"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              style={{ marginTop: "0.5rem" }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginLeft: "4px" }}>Role</label>
            <select
              className="input-glass"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              style={{ marginTop: "0.5rem" }}
            >
              <option value="" style={{ color: "black" }}>Select Role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id} style={{ color: "black" }}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginLeft: "4px" }}>Department</label>
            <select
              className="input-glass"
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
              style={{ marginTop: "0.5rem" }}
            >
              <option value="" style={{ color: "black" }}>Select Department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id} style={{ color: "black" }}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <button
            className="btn-primary"
            type="submit"
            style={{ width: "100%" }}
          >
            Add Employee
          </button>
        </form>
      </div>
    </div>
  );
};

export default Addemployee;
