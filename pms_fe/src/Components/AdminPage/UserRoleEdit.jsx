import React, { useEffect, useState } from "react";
import {
  Box, Typography, TextField, Button, List, ListItem, ListItemText,
  Divider, Checkbox, FormControlLabel, CircularProgress, Paper
} from "@mui/material";
import axios from "axios";
import { useParams } from "react-router-dom";


const DEFAULT_ACCESS = {
  is_view: false,
  is_add: false,
  is_employeedata: false,
  is_admindata: false,
  is_hrdata: false
};

const UserRoleEdit = () => {
  const { roleId } = useParams(); // route: /roles/edit/:roleId
  const [roleName, setRoleName] = useState("");
  const [sidebars, setSidebars] = useState([]);
  const [selectedSidebars, setSelectedSidebars] = useState([]); // array of sidebar objects selected
  const [accessMap, setAccessMap] = useState({}); // {sidebarId: { ...permissions, pk? }}
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // fetch sidebars, role info and existing accesses
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [sideRes, roleRes, accessRes] = await Promise.all([
          axios.get("/api/sidebar/"),
          axios.get(`/api/roles/?id=${roleId}`),
          axios.get(`/api/access/?role=${roleId}`)
        ]);

        const sidebarsData = sideRes.data || [];
        setSidebars(sidebarsData);

        if (roleRes.data) {
          setRoleName(roleRes.data.name || "");
        }

        // accessRes.data is array of RoleBasedAccess entries for this role
        const accesses = accessRes.data || [];
        // build selectedSidebars and accessMap
        const selected = [];
        const amap = {};

        for (const ac of accesses) {
          const sidebarId = ac.sidebar_content;
          // find matching sidebar object
          const sidebarObj = sidebarsData.find(s => s.id === sidebarId) || {
            id: sidebarId,
            component_name: ac.sidebar_detail?.component_name || "Unknown",
            action_link: ac.sidebar_detail?.action_link || ""
          };
          selected.push(sidebarObj);
          amap[sidebarId] = {
            is_view: !!ac.is_view,
            is_add: !!ac.is_add,
            is_employeedata: !!ac.is_employeedata,
            is_admindata: !!ac.is_admindata,
            is_hrdata: !!ac.is_hrdata,
            pk: ac.id
          };
        }

        setSelectedSidebars(selected);
        setAccessMap(amap);

      } catch (err) {
        console.error(err);
        alert("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [roleId]);

  // toggle select/deselect a sidebar
  const toggleSelectSidebar = (sidebar) => {
    const exists = selectedSidebars.find(s => s.id === sidebar.id);
    if (exists) {
      // remove
      setSelectedSidebars(prev => prev.filter(s => s.id !== sidebar.id));
      setAccessMap(prev => {
        const copy = { ...prev };
        delete copy[sidebar.id];
        return copy;
      });
    } else {
      // add with default permissions
      setSelectedSidebars(prev => [...prev, sidebar]);
      setAccessMap(prev => ({
        ...prev,
        [sidebar.id]: { ...DEFAULT_ACCESS } // new entries won't have pk
      }));
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

    setSaving(true);
    try {
      // 1) update role name
      await axios.put(`/api/roles/?id=${roleId}`, { name: roleName.trim() });

      // 2) get existing accesses from backend for role (fresh)
      const existingRes = await axios.get(`/api/access/?role=${roleId}`);
      const existingArr = existingRes.data || [];

      const existingBySidebar = {};
      for (const ex of existingArr) {
        existingBySidebar[ex.sidebar_content] = ex; // ex.id etc.
      }

      // 3) For each selected sidebar -> create or update
      for (const sidebar of selectedSidebars) {
        const sid = sidebar.id;
        const ac = accessMap[sid] || DEFAULT_ACCESS;
        const payload = {
          role: roleId,
          sidebar_content: sid,
          is_view: !!ac.is_view,
          is_add: !!ac.is_add,
          is_employeedata: !!ac.is_employeedata,
          is_admindata: !!ac.is_admindata,
          is_hrdata: !!ac.is_hrdata
        };

        // if backend reports existing entry -> PUT by id (to keep same pk)
        if (existingBySidebar[sid]) {
          const existingId = existingBySidebar[sid].id;
          await axios.put(`/api/access/?id=${existingId}`, payload);
        } else {
          // create new
          await axios.post(`/api/access/`, payload);
        }
      }

      // 4) Any existing sidebar that is no longer selected -> delete it
      for (const ex of existingArr) {
        if (!selectedSidebars.find(s => s.id === ex.sidebar_content)) {
          // delete
          if (ex.id) {
            await axios.delete(`/api/access/?id=${ex.id}`);
          }
        }
      }

      alert("Role access updated");
    } catch (err) {
      console.error(err);
      alert("Failed to save changes");
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
        <Typography variant="h6">Edit Role & Permissions</Typography>
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
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </Paper>
    </Box>
  );
};

export default UserRoleEdit;
