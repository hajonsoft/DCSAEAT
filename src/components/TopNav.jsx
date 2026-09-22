import React, { useState } from "react";

import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Button,
  Box,
  Tooltip,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";
import HomeIcon from "@mui/icons-material/Home";
import BookmarksIcon from "@mui/icons-material/Bookmarks";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import PeopleIcon from "@mui/icons-material/People";
import { Link, useLocation } from "react-router-dom";
import { useI18n } from "../i18n/I18nContext";
import LanguageSwitcher from "./LanguageSwitcher";

function TopNav({ user, onLogin, onLogout }) {
  const { t } = useI18n();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const canBrowseCollection =
    user && (user.role === "edit" || user.role === "superadmin" || user.role === "view");
  const canBrowseUsers = user?.role === "superadmin";

  const navItems = [
    { to: "/", label: t("nav.home"), icon: <HomeIcon fontSize="small" />, show: true },
    { to: "/objects", label: t("nav.objects"), icon: <Inventory2Icon fontSize="small" />, show: canBrowseCollection },
    { to: "/users", label: t("nav.users"), icon: <PeopleIcon fontSize="small" />, show: canBrowseUsers },
    { to: "/references", label: t("nav.references"), icon: <BookmarksIcon fontSize="small" />, show: canBrowseCollection },
  ].filter((item) => item.show);

  const navLinkStyle = {
    color: "inherit",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 10px",
    borderRadius: 8,
    whiteSpace: "nowrap",
  };

  return (
    <AppBar
      position="sticky"
      elevation={1}
      style={{ backgroundColor: "#302e2f" }}
    >
      <Toolbar sx={{ gap: 1, minHeight: { xs: 56, sm: 64 }, px: { xs: 1, sm: 2 } }}>
        <IconButton
          edge="start"
          color="inherit"
          aria-label={t("nav.menu")}
          onClick={() => setDrawerOpen(true)}
          sx={{ display: { xs: "inline-flex", md: "none" } }}
        >
          <MenuIcon />
        </IconButton>

        <Typography variant="h6" sx={{ flexGrow: { xs: 1, md: 0 }, mr: { md: 2 }, fontSize: { xs: "1.05rem", sm: "1.25rem" } }}>
          DCSAEAT
        </Typography>

        <Box sx={{ display: { xs: "none", md: "flex" }, gap: 0.5, flexGrow: 1 }}>
          {navItems.map((item) => (
            <Link key={item.to} to={item.to} style={navLinkStyle}>
              {item.icon} {item.label}
            </Link>
          ))}
        </Box>

        <LanguageSwitcher />
        {user ? (
          <Tooltip title={user.email || user.displayName || t("nav.signedIn")}>
            <Button
              color="inherit"
              onClick={onLogout}
              startIcon={<LogoutIcon />}
              sx={{
                minWidth: { xs: 40, sm: "auto" },
                px: { xs: 1, sm: 1.5 },
                "& .MuiButton-startIcon": { mr: { xs: 0, sm: 1 } },
              }}
            >
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                {t("nav.signOut")}
              </Box>
            </Button>
          </Tooltip>
        ) : (
          <Button
            color="inherit"
            onClick={onLogin}
            startIcon={<LoginIcon />}
            sx={{
              minWidth: { xs: 40, sm: "auto" },
              px: { xs: 1, sm: 1.5 },
              "& .MuiButton-startIcon": { mr: { xs: 0, sm: 1 } },
            }}
          >
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
              {t("nav.signIn")}
            </Box>
          </Button>
        )}
      </Toolbar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: "min(320px, 86vw)" } }}
      >
        <Box sx={{ py: 1 }} role="presentation">
          <Typography variant="h6" sx={{ px: 2, py: 1.5 }}>
            DCSAEAT
          </Typography>
          <Divider />
          <List>
            {navItems.map((item) => (
              <ListItemButton
                key={item.to}
                component={Link}
                to={item.to}
                selected={location.pathname === item.to}
                onClick={() => setDrawerOpen(false)}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
}

export default TopNav;
