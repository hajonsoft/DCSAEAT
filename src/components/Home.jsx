import React from "react";
import { Container } from "@mui/material";
import { Typography } from "@mui/material";

function Home() {
  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Welcome to DCSAEAT</Typography>
      <Typography variant="body1">
        Manage Ancient Egyptian astronomical objects and texts from anywhere. Use the
        navigation to browse <strong>Objects</strong> and <strong>References</strong>, search the
        collection, and add new records.
      </Typography>
    </Container>
  );
}

export default Home;
