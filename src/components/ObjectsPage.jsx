import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Typography
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import { db } from "../firebase";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp
} from "firebase/firestore";

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

export default ObjectsPage;
