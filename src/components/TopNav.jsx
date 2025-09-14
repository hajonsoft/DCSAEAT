import React from "react";

import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Button,
  Box,
  Tooltip,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";
import HomeIcon from "@mui/icons-material/Home";
import BookmarksIcon from "@mui/icons-material/Bookmarks";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import { Link } from "react-router-dom";

function TopNav({ user, onLogin, onLogout }) {
  const navLinkStyle = {
    color: "inherit",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 10px",
    borderRadius: 8,
  };

  return (
    <AppBar
      position="sticky"
      elevation={1}
      style={{ backgroundColor: "#302e2f" }}
    >
      <Toolbar sx={{ gap: 1 }}>
        <IconButton edge="start" color="inherit" aria-label="menu">
          <MenuIcon />
        </IconButton>

        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          DCSAEAT
        </Typography>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Link to="/" style={navLinkStyle}>
            <HomeIcon fontSize="small" /> Home
          </Link>
          <Link to="/objects" style={navLinkStyle}>
            <Inventory2Icon fontSize="small" /> Objects
          </Link>
          <Link to="/references" style={navLinkStyle}>
            <BookmarksIcon fontSize="small" /> References
          </Link>
        </Box>

        <Box sx={{ flexGrow: 0 }} />
        {user ? (
          <Tooltip title={user.email || user.displayName || "Signed in"}>
            <Button
              color="inherit"
              onClick={onLogout}
              startIcon={<LogoutIcon />}
            >
              Sign out
            </Button>
          </Tooltip>
        ) : (
          <Button color="inherit" onClick={onLogin} startIcon={<LoginIcon />}>
            Sign in with Google
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default TopNav;
