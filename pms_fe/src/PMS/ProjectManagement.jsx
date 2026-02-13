import axios from "axios";
import React, { useState, useEffect } from "react";
import { Grid } from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import AssessmentIcon from "@mui/icons-material/Assessment";

const ProjectManagement = () => {
    const [departments, setDepartments] = useState([]);

    useEffect(() => {
        const fetchDepartment = async () => {
            try {
                const response = await axios.get("/api/department/");
                setDepartments(response.data.results || response.data);
            } catch (error) {
                console.log("Error", error);
            }
        };
        fetchDepartment();
    }, []);

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: "2rem" }}>
                <h2 className="gradient-text" style={{ fontSize: "2rem" }}>Project Management</h2>
                <p style={{ color: "var(--text-muted)" }}>Oversee projects across all departments</p>
            </div>

            <Grid container spacing={4}>
                {departments.map((dept) => (
                    <Grid item xs={12} sm={6} md={4} key={dept.id}>
                        <div className="glass-card animate-float" style={{ minHeight: "200px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div>
                                    <h3 style={{ fontSize: "1.2rem", fontWeight: 600 }}>{dept.name}</h3>
                                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{dept.description || "No description"}</span>
                                </div>
                                <div style={{
                                    background: "rgba(139, 92, 246, 0.2)",
                                    padding: "0.75rem",
                                    borderRadius: "12px",
                                    color: "var(--primary-color)"
                                }}>
                                    <FolderIcon />
                                </div>
                            </div>

                            <div style={{ marginTop: "1.5rem" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                                    <span style={{ color: "var(--text-muted)" }}>Projects</span>
                                    <span style={{ fontWeight: 600 }}>{dept.project_count || 0}</span>
                                </div>
                                <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "3px", overflow: "hidden" }}>
                                    <div style={{ width: "60%", height: "100%", background: "var(--accent-gradient)" }}></div>
                                </div>
                            </div>

                            <button
                                className="btn-ghost"
                                style={{ marginTop: "1.5rem", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
                            >
                                <AssessmentIcon fontSize="small" /> View Details
                            </button>
                        </div>
                    </Grid>
                ))}
                {departments.length === 0 && (
                    <div style={{ width: "100%", textAlign: "center", color: "var(--text-muted)", marginTop: "2rem" }}>
                        No departments found.
                    </div>
                )}
            </Grid>
        </div>
    );
};

export default ProjectManagement;