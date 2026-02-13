import React from "react";
import { Grid, Typography } from "@mui/material";
import GroupsIcon from "@mui/icons-material/Groups";
import WorkIcon from "@mui/icons-material/Work";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";

const DashboardCard = ({ title, value, icon, color }) => (
    <div className="glass-card animate-float" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
            <h3 style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "0.5rem" }}>{title}</h3>
            <div className="gradient-text" style={{ fontSize: "2rem", fontWeight: "bold" }}>{value}</div>
        </div>
        <div style={{
            background: `rgba(${color}, 0.2)`,
            padding: "1rem",
            borderRadius: "12px",
            color: `rgb(${color})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
        }}>
            {icon}
        </div>
    </div>
);

const Dashboard = () => {
    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: "2rem" }}>
                <h1 className="gradient-text" style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>Dashboard Overview</h1>
                <p style={{ color: "var(--text-muted)" }}>Welcome back! Here's what's happening today.</p>
            </div>

            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <DashboardCard
                        title="Total Employees"
                        value="124"
                        icon={<GroupsIcon sx={{ fontSize: 32 }} />}
                        color="139, 92, 246" // Violet
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <DashboardCard
                        title="Active Projects"
                        value="18"
                        icon={<WorkIcon sx={{ fontSize: 32 }} />}
                        color="6, 182, 212" // Cyan
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <DashboardCard
                        title="Pending Tasks"
                        value="32"
                        icon={<PendingActionsIcon sx={{ fontSize: 32 }} />}
                        color="245, 158, 11" // Amber
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <DashboardCard
                        title="Completed Projects"
                        value="45"
                        icon={<AssignmentTurnedInIcon sx={{ fontSize: 32 }} />}
                        color="16, 185, 129" // Emerald
                    />
                </Grid>

                {/* Recent Activity Section */}
                <Grid item xs={12} md={8}>
                    <div className="glass-card" style={{ height: "100%", minHeight: "400px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                            <h3>Project Timeline</h3>
                            <button className="btn-ghost" style={{ fontSize: "0.8rem", padding: "0.5rem 1rem" }}>View All</button>
                        </div>
                        <div style={{
                            height: "300px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "1px dashed rgba(255,255,255,0.1)",
                            borderRadius: "12px",
                            color: "var(--text-muted)"
                        }}>
                            [Chart Placeholder - Project Analytics]
                        </div>
                    </div>
                </Grid>

                {/* Team Members */}
                <Grid item xs={12} md={4}>
                    <div className="glass-card" style={{ height: "100%" }}>
                        <h3>Team Members</h3>
                        <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.5rem", borderRadius: "8px", background: "rgba(255,255,255,0.03)" }}>
                                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--accent-gradient)" }} />
                                    <div>
                                        <div style={{ fontWeight: 600 }}>Team Lead {i}</div>
                                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Frontend Dev</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Grid>
            </Grid>
        </div>
    );
};
export default Dashboard;