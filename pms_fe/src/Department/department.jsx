import axios from "axios";
import React, { useEffect, useState } from "react";
import DynamicTable from "../commons/DynamicTable";
import DynamicOffcanvas from "../commons/DynamicOffcanvas";
import { TextField, Button } from "@mui/material";

const Department = () => {
  const [departmentData, setDepartmentData] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(1);

  const [openAdd, setOpenAdd] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");

  const columns = [
    { field: "id", headerName: "ID" },
    { field: "name", headerName: "Name" },
  ];

  const fetchDepartment = async (pageNum = 1) => {
    try {
      const response = await axios.get(`/api/department/?page=${pageNum}&page_size=${pageSize}`);
      setDepartmentData(response.data.results || []);
      setTotalPages(response.data.total_pages || 1);
      setPage(response.data.current_page || 1);
    } catch (error) {
      console.error("Error fetching department data:", error);
    }
  };

  useEffect(() => {
    fetchDepartment(page);
  }, []);

  const handleNext = () => {
    if (page < totalPages) fetchDepartment(page + 1);
  };

  const handlePrev = () => {
    if (page > 1) fetchDepartment(page - 1);
  };

  const handleAddDepartment = async () => {
    if (!newDeptName.trim()) return;
    try {
      await axios.post("/api/department/", { name: newDeptName });
      setNewDeptName("");
      setOpenAdd(false);
      fetchDepartment(page); // refresh current page
    } catch (error) {
      console.error("Error adding department:", error);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: "0 2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h2 className="gradient-text" style={{ fontSize: "2rem" }}>Departments</h2>
        <button className="btn-primary" onClick={() => setOpenAdd(true)}>
          + Add Department
        </button>
      </div>

      <div className="glass-card" style={{ padding: "1rem" }}>

        <DynamicTable
          data={departmentData}
          columns={columns}
          title="Departments"
          page={page}
          totalPages={totalPages}
          onNext={handleNext}
          onPrev={handlePrev}
        />
      </div>

      {/* Offcanvas for adding department */}
      <DynamicOffcanvas open={openAdd} onClose={() => setOpenAdd(false)} title="Add Department">
        <TextField
          label="Department Name"
          fullWidth
          value={newDeptName}
          onChange={(e) => setNewDeptName(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button variant="contained" color="primary" fullWidth onClick={handleAddDepartment}>
          Add
        </Button>
      </DynamicOffcanvas>
    </div>
  );
};

export default Department;
