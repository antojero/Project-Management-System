// CustomTextField.js
import { TextField } from "@mui/material";
import React from "react";

const CustomTextField = ({ label, variant = "outlined", type = "text", sx = {}, ...props }) => {
  return (
    <TextField
      label={label}
      variant={variant}
      type={type}
      fullWidth
      sx={{
        "& .MuiOutlinedInput-root": {
          borderRadius: "12px",   // rounded corners
        },
        "& .MuiInputLabel-root": {
          color: "gray",          // label color
        },
        "& .MuiOutlinedInput-root.Mui-focused": {
          "& > fieldset": {
            borderColor: "#1976d2" // blue border on focus
          }
        },
        ...sx // allow overriding styles dynamically
      }}
      {...props}
    />
  );
};

export default CustomTextField;
