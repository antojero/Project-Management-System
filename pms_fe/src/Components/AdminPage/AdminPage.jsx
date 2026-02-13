import React, { useEffect, useState } from "react";
import { Box, Button, Typography, CircularProgress } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import axios from "axios";
import DynamicTable from "../../commons/DynamicTable";
import { useNavigate } from "react-router-dom";

const AdminPage = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate()

  // Fetch roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await axios.get("/api/roles/");
        const data = response.data.results || response.data;
        setRoles(data);
      } catch (error) {
        console.error("Error fetching roles:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRoles();
  }, []);

  // Handle edit click
  const handleEdit = (row) => {
    navigate(`/UserRoleEdit/${row.id}`)
    // You can open a modal or offcanvas here to edit the role
  };

  // Table Columns
  const columns = [
    { field: "id", headerName: "ID" },
    { field: "name", headerName: "Role Name" },
    {
      field: "actions",
      headerName: "Actions",
      renderCell: (row) => (
        <Button
          variant="outlined"
          color="primary"
          size="small"
          startIcon={<EditIcon />}
          onClick={() => handleEdit(row)}
        >
          Edit
        </Button>
      ),
    },
  ];

  const handleNavigate = () => {
    navigate("/UserRoleAdd")
  }

  if (loading)
    return (
      <Box display="flex" justifyContent="center" mt={5}>
        <CircularProgress />
      </Box>
    );

  return (
    <div className="animate-fade-in" style={{ padding: "0 2rem" }}>
      {/* Header Section */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem"
        }}
      >
        <h2 className="gradient-text" style={{ fontSize: "2rem" }}>
          Role Management
        </h2>

        <button
          className="btn-primary"
          onClick={handleNavigate}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <AddIcon /> Add Role
        </button>
      </div>

      {/* Dynamic Table with Glass Card */}
      <div className="glass-card" style={{ padding: "1rem" }}>
        <DynamicTable
          data={roles}
          columns={columns}
          title="Roles"
          pagination
          rowsPerPage={5}
        />
      </div>
    </div>
  );
};

export default AdminPage;
