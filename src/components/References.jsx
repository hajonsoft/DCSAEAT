import React from "react";
import { Container } from "@mui/material";
import { Typography } from "@mui/material";

function References() {
  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h5" gutterBottom>References</Typography>
      <Typography variant="body2" color="text.secondary">
        (Placeholder) A references module will live here. It can be linked to objects, with
        the ability to add bibliographic entries and connect them via cross-refs.
      </Typography>
    </Container>
  );
}

export default References;
