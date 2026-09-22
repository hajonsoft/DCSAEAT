import React from "react";
import { Container } from "@mui/material";
import { Typography } from "@mui/material";
import { useI18n } from "../i18n/I18nContext";

function References() {
  const { t } = useI18n();
  return (
    <div style={{ backgroundColor: "rgb(204, 255, 255)", minHeight: "100vh" }}>
    <Container sx={{ py: { xs: 2, md: 4 }, px: { xs: 2, sm: 3 } }}>
      <Typography variant="h5" gutterBottom>{t("references.title")}</Typography>
      <Typography variant="body2" color="text.secondary">
        {t("references.placeholder")}
      </Typography>
    </Container>
    </div>
  );
}

export default References;
