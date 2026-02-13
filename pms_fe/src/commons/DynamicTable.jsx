import React from "react";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  TableContainer,
  Typography,
} from "@mui/material";

const DynamicTable = ({ data, columns, title, onRowClick }) => {
  if (!data || data.length === 0) {
    return (
      <Typography variant="body1" align="center" sx={{ mt: 2 }}>
        No data available
      </Typography>
    );
  }

  return (
    <TableContainer
      component={Paper}
      sx={{
        mt: 3,
        borderRadius: 2,
        boxShadow: 3,
        overflowX: "auto",
      }}
    >
      {/* Table Title */}
      {title && (
        <Typography
          variant="h6"
          sx={{
            p: 2,
            backgroundColor: "#f5f5f5",
            borderBottom: "1px solid #ddd",
            fontWeight: 600,
          }}
        >
          {title}
        </Typography>
      )}

      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: "#1976d2" }}>
            {columns.map((col, index) => (
              <TableCell key={index} sx={{ color: "#fff", fontWeight: "bold" }}>
                {col.headerName}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow key={rowIndex} hover>
              {columns.map((col, colIndex) => (
                <TableCell key={colIndex}>
                  {col.renderCell
                    ? col.renderCell(row) // ✅ Render custom cell if provided
                    : col.isLink
                    ? (
                        <span
                          style={{
                            color: "#1976d2",
                            cursor: "pointer",
                            textDecoration: "underline",
                          }}
                          onClick={() => onRowClick && onRowClick(row.id)}
                        >
                          {row[col.field]}
                        </span>
                      )
                    : row[col.field]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default DynamicTable;
