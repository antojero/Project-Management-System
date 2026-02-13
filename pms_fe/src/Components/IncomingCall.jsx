// src/components/IncomingCall.jsx
import React from "react";
import { Box, Button, Typography, Paper } from "@mui/material";
import { useCall } from "../contexts/CallProvider";

const IncomingCall = () => {
  const { incoming, acceptCall, rejectCall } = useCall();

  if (!incoming) return null;

  return (
    <Paper
      elevation={6}
      sx={{
        position: "fixed",
        right: 24,
        bottom: 24,
        width: 320,
        p: 2,
        zIndex: 9999,
      }}
    >
      <Typography variant="subtitle1">Incoming call</Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        From: <strong>{incoming.from}</strong>
      </Typography>
      <Box display="flex" gap={1} justifyContent="flex-end">
        <Button variant="contained" color="success" onClick={acceptCall}>
          Accept
        </Button>
        <Button variant="outlined" color="error" onClick={rejectCall}>
          Reject
        </Button>
      </Box>
    </Paper>
  );
};

export default IncomingCall;
