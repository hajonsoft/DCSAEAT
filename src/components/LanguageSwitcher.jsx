import React, { useState } from "react";
import { Box, Button, Menu, MenuItem, Tooltip } from "@mui/material";
import TranslateIcon from "@mui/icons-material/Translate";
import { useI18n } from "../i18n/I18nContext";

function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  return (
    <>
      <Tooltip title={t("nav.language")}>
        <Button
          color="inherit"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          startIcon={<TranslateIcon />}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
          aria-label={t("nav.language")}
          sx={{
            minWidth: { xs: 40, sm: 72 },
            px: { xs: 1, sm: 1.5 },
            "& .MuiButton-startIcon": { mr: { xs: 0, sm: 1 } },
          }}
        >
          <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
            {language === "el" ? "ΕΛ" : "EN"}
          </Box>
        </Button>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem
          selected={language === "en"}
          onClick={() => {
            setLanguage("en");
            setAnchorEl(null);
          }}
        >
          {t("language.english")}
        </MenuItem>
        <MenuItem
          selected={language === "el"}
          onClick={() => {
            setLanguage("el");
            setAnchorEl(null);
          }}
        >
          {t("language.greek")}
        </MenuItem>
      </Menu>
    </>
  );
}

export default LanguageSwitcher;
