import React, { useEffect, useState } from "react";
import {
  Box, Typography, TextField, Button, List, ListItem, ListItemText,
  Divider, Checkbox, FormControlLabel, CircularProgress, Paper
} from "@mui/material";
import axios from "axios";


const DEFAULT_ACCESS = {
  is_view: false,
  is_add: false,
  is_employeedata: false,
  is_admindata: false,
  is_hrdata: false
};

const UserRoleAdd = () => {
  const [roleName, setRoleName] = useState("");
  const [sidebars, setSidebars] = useState([]);
  const [selectedSidebars, setSelectedSidebars] = useState([]); // array of sidebar objects
  const [accessMap, setAccessMap] = useState({}); // { sidebarId: { ...permissions } }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get("/api/sidebar/");
        setSidebars(res.data || []);
      } catch (err) {
        console.error(err);
        alert("Failed to fetch sidebars");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const toggleSelectSidebar = (sidebar) => {
    const exists = selectedSidebars.find(s => s.id === sidebar.id);
    if (exists) {
      setSelectedSidebars(prev => prev.filter(s => s.id !== sidebar.id));
      setAccessMap(prev => {
        const copy = { ...prev };
        delete copy[sidebar.id];
        return copy;
      });
    } else {
      setSelectedSidebars(prev => [...prev, sidebar]);
      setAccessMap(prev => ({ ...prev, [sidebar.id]: { ...DEFAULT_ACCESS } }));
    }
  };

  const togglePermission = (sidebarId, key) => {
    setAccessMap(prev => ({
      ...prev,
      [sidebarId]: {
        ...prev[sidebarId],
        [key]: !prev[sidebarId]?.[key]
      }
    }));
  };

  const handleSave = async () => {
    if (!roleName.trim()) {
      alert("Enter role name");
      return;
    }
    if (selectedSidebars.length === 0) {
      alert("Select at least one sidebar");
      return;
    }

    setSaving(true);
    try {
      const roleRes = await axios.post("/api/roles/", { name: roleName.trim() });
      const roleId = roleRes.data.id;

      // create access records
      for (const sidebar of selectedSidebars) {
        const payload = {
          role: roleId,
          sidebar_content: sidebar.id,
          ...accessMap[sidebar.id]
        };
        // POST will create or update existing pair (backend handles)
        await axios.post("/api/access/", payload);
      }

      alert("Role created with sidebar access");
      setRoleName("");
      setSelectedSidebars([]);
      setAccessMap({});
    } catch (err) {
      console.error(err);
      alert("Failed to save role/access");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <Box display="flex" justifyContent="center" mt={5}><CircularProgress/></Box>
  );

  return (
    <Box display="flex" gap={3} p={3} height="80vh">
      <Paper sx={{ width: "35%", p: 2 }}>
        <Typography variant="h6">Sidebar Modules (multi-select)</Typography>
        <Divider sx={{ my: 1 }} />
        <List>
          {sidebars.map(s => {
            const checked = !!selectedSidebars.find(ss => ss.id === s.id);
            return (
              <ListItem
                key={s.id}
                button
                onClick={() => toggleSelectSidebar(s)}
                sx={{
                  backgroundColor: checked ? "#e8f0ff" : "transparent",
                  borderRadius: 1,
                  mb: 1
                }}
              >
                <Checkbox checked={checked} />
                <ListItemText primary={s.component_name} secondary={s.action_link} />
              </ListItem>
            );
          })}
        </List>
      </Paper>

      <Paper sx={{ flex: 1, p: 3, overflowY: "auto" }}>
        <Typography variant="h6">Create Role & Permissions</Typography>
        <Divider sx={{ my: 2 }} />

        <TextField
          label="Role Name"
          fullWidth
          value={roleName}
          onChange={(e) => setRoleName(e.target.value)}
          sx={{ mb: 3 }}
        />

        {selectedSidebars.length === 0 ? (
          <Typography color="text.secondary">Select sidebar modules to configure their permissions.</Typography>
        ) : (
          selectedSidebars.map(sidebar => (
            <Box
              key={sidebar.id}
              sx={{ border: "1px solid #ddd", borderRadius: 2, p: 2, mb: 2, backgroundColor: "#fafafa" }}
            >
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                {sidebar.component_name}
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {Object.keys(DEFAULT_ACCESS).map(key => (
                  <FormControlLabel
                    key={key}
                    control={
                      <Checkbox
                        checked={!!accessMap[sidebar.id]?.[key]}
                        onChange={() => togglePermission(sidebar.id, key)}
                      />
                    }
                    label={key.replace("is_", "").replace("_", " ").toUpperCase()}
                  />
                ))}
              </Box>
            </Box>
          ))
        )}

        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Create Role"}
        </Button>
      </Paper>
    </Box>
  );
};

export default UserRoleAdd;
