import React from "react";
import { Container } from "@mui/material";
import { Typography, Box } from "@mui/material";

function Home() {
  return (
    <div
      style={{
        backgroundColor: "rgb(204, 255, 255)",
        height: "100vh",
        width: "100vw",
        display: "flex",
        justifyContent: "center",
        paddingBottom: 40,
      }}
    >
      <Container style={{ marginTop: 40 }}>
        <Typography variant="h4" gutterBottom>
          Welcome to DCSAEAT
        </Typography>
        <Typography variant="body1">
          Manage Ancient Egyptian Astronomical Texts and Entities, from Egypt
          and anywhere. Use the navigation to browse <strong>Objects</strong>{" "}
          and <strong>References</strong>, search the collection, and add new
          records.
        </Typography>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Box sx={{ mt: 2, mb: 4, display: "flex", justifyContent: "center" }}>
            <img
              src={require("../assets/images/coffin.jpg")}
              alt="Coffin"
              style={{
                width: "100%",
                maxWidth: 900,
                borderRadius: 12,
                boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                objectFit: "cover",
                maxHeight: 200,
              }}
            />
          </Box>
          {/* Logos side by side */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "4rem",
              mt: 2,
            }}
          >
            <img
              src={require("../assets/images/logo-hie.jpg")}
              alt="Logo HIE"
              style={{
                height: 80,
                width: "auto",
                borderRadius: 8,
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              }}
            />
            <img
              src={require("../assets/images/logo-wsc.jpg")}
              alt="Logo WSC"
              style={{
                height: 80,
                width: "auto",
                borderRadius: 8,
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              }}
            />
          </Box>
        </div>
      </Container>
    </div>
  );
}

export default Home;
