import React, { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Button,
  Container,
  Box,
  TextField,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Snackbar,
  Alert,
  Tooltip
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";
import HomeIcon from "@mui/icons-material/Home";
import BookmarksIcon from "@mui/icons-material/Bookmarks";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, db } from "./firebase";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp
} from "firebase/firestore";

/* ------------------------------ Layout Shell ------------------------------ */

function TopNav({ user, onLogin, onLogout }) {
  const navLinkStyle = {
    color: "inherit",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 10px",
    borderRadius: 8
  };

  return (
    <AppBar position="sticky" elevation={1}>
      <Toolbar sx={{ gap: 1 }}>
        <IconButton edge="start" color="inherit" aria-label="menu">
          <MenuIcon />
        </IconButton>

        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          DCSAEAT
        </Typography>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Link to="/" style={navLinkStyle}><HomeIcon fontSize="small" /> Home</Link>
          <Link to="/objects" style={navLinkStyle}><Inventory2Icon fontSize="small" /> Objects</Link>
          <Link to="/references" style={navLinkStyle}><BookmarksIcon fontSize="small" /> References</Link>
        </Box>

        <Box sx={{ flexGrow: 0 }} />
        {user ? (
          <Tooltip title={user.email || user.displayName || "Signed in"}>
            <Button color="inherit" onClick={onLogout} startIcon={<LogoutIcon />}>
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

/* --------------------------------- Pages --------------------------------- */

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

/* ------------------------------ Objects Page ------------------------------ */

function ObjectsPage({ user }) {
  const [loading, setLoading] = useState(true);
  const [objects, setObjects] = useState([]);
  const [qText, setQText] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "",
    astronomicalType: "",
    astronomicalUse: ""
  });
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  useEffect(() => {
    const col = collection(db, "objects");
    const q = query(col, orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setObjects(list);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setSnack({ open: true, msg: "Failed to load objects", severity: "error" });
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const t = qText.trim().toLowerCase();
    if (!t) return objects;
    return objects.filter((o) =>
      [o.name, o.type, o.astronomicalType, o.astronomicalUse, o.content, o.findingLocation, o.actualLocation]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(t))
    );
  }, [qText, objects]);

  const handleAdd = async () => {
    if (!form.name.trim()) {
      setSnack({ open: true, msg: "Name is required", severity: "warning" });
      return;
    }
    try {
      await addDoc(collection(db, "objects"), {
        name: form.name.trim(),
        type: form.type.trim(),
        astronomicalType: form.astronomicalType.trim(),
        astronomicalUse: form.astronomicalUse.trim(),
        createdBy: user?.uid || null,
        createdAt: serverTimestamp()
      });
      setAddOpen(false);
      setForm({ name: "", type: "", astronomicalType: "", astronomicalUse: "" });
      setSnack({ open: true, msg: "Object added", severity: "success" });
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to add object", severity: "error" });
    }
  };

  if (!user) {
    return (
      <Container sx={{ py: 6, textAlign: "center" }}>
        <Typography variant="h6" gutterBottom>You must sign in to view Objects.</Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 1,
          alignItems: "center",
          mb: 2
        }}
      >
        <TextField
          size="small"
          placeholder="Search objects…"
          value={qText}
          onChange={(e) => setQText(e.target.value)}
          InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, opacity: 0.6 }} /> }}
        />
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
          Add New
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ py: 6, display: "grid", placeItems: "center" }}>
          <CircularProgress />
        </Box>
      ) : filtered.length === 0 ? (
        <Typography variant="body2" color="text.secondary">No objects found.</Typography>
      ) : (
        <List dense>
          {filtered.map((o) => (
            <ListItem
              key={o.id}
              divider
              secondaryAction={
                <Typography variant="caption" color="text.secondary">
                  {o.type || "—"}
                </Typography>
              }
            >
              <ListItemText
                primary={o.name || "(untitled)"}
                secondary={
                  [o.astronomicalType, o.astronomicalUse].filter(Boolean).join(" • ") || null
                }
              />
            </ListItem>
          ))}
        </List>
      )}

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add New Object</DialogTitle>
        <DialogContent sx={{ pt: 2, display: "grid", gap: 2 }}>
          <TextField
            label="Name of Object"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            autoFocus
            required
          />
          <TextField
            label="Type of Object"
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            placeholder="e.g., ceiling, instrument, text"
          />
          <TextField
            label="Astronomical Type"
            value={form.astronomicalType}
            onChange={(e) => setForm((f) => ({ ...f, astronomicalType: e.target.value }))}
            placeholder="e.g., decanal, star clock, zodiac"
          />
          <TextField
            label="Astronomical Use"
            value={form.astronomicalUse}
            onChange={(e) => setForm((f) => ({ ...f, astronomicalUse: e.target.value }))}
            placeholder="e.g., timekeeping, orientation"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAdd}>Save</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snack.severity} variant="filled" onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Container>
  );
}

/* ----------------------------- Auth + Routing ----------------------------- */

function AppInner() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  if (!authReady) {
    return (
      <Box sx={{ py: 8, display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <BrowserRouter>
      <TopNav user={user} onLogin={login} onLogout={logout} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/objects" element={<ObjectsPage user={user} />} />
        <Route path="/references" element={<References />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return <AppInner />;
}
