import React, { useState } from "react";
import { TextField, Button, Card, CardContent, Typography } from "@mui/material";
import axios from "axios";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(`/api/register/`, formData, {
        headers: { "Content-Type": "application/json" },
      });
      console.log("✅ Registration successful:", response.data);
    } catch (error) {
      console.error("❌ Registration failed:", error.response?.data || error.message);
    }
  };

  return (
    <Card sx={{ maxWidth: 400, margin: "50px auto", padding: "20px" }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Register
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Username"
            name="username"
            fullWidth
            margin="normal"
            onChange={handleChange}
          />
          <TextField
            label="Email"
            name="email"
            type="email"
            fullWidth
            margin="normal"
            onChange={handleChange}
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            fullWidth
            margin="normal"
            onChange={handleChange}
          />
          <Button type="submit" variant="contained" color="primary" fullWidth>
            Register
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default Register;
