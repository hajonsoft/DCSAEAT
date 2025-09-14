import React, { useState, useEffect, useMemo } from "react";
import { Container, Box, TextField, Button, List, ListItem, ListItemText, CircularProgress, Snackbar, Alert, Typography, Fab, IconButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
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
  // ...existing code...
  const importCSV = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return;
    // Expected field order
    const expectedFields = [
      "no","name","type","museographicIndex","astronomicalType","astronomicalUse","dating","findingLocalization","actualLocation","content","links","stateOfPreservation","references","transliterations"
    ];
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(cell => cell.replace(/^"|"$/g, "").replace(/""/g, '"'));
      if (row.length !== expectedFields.length) continue;
      // Skip rows where all fields are empty
      if (row.every(cell => !cell.trim())) continue;
      const obj = {};
      expectedFields.forEach((f, idx) => { obj[f] = row[idx]; });
      // Skip rows with no name
      if (!obj["name"] || obj["name"].trim() === "") continue;
      try {
        await addDoc(collection(db, "objects"), {
          ...obj,
          createdBy: user?.uid || null,
          createdAt: serverTimestamp(),
        });
      } catch (e) {
        console.error("Import error", e);
      }
    }
    setSnack({ open: true, msg: "CSV import complete", severity: "success" });
    event.target.value = "";
  };
  // ...existing code...
  const exportCSV = () => {
    if (!filtered.length) return;
    const fields = [
      "no","name","type","museographicIndex","astronomicalType","astronomicalUse","dating","findingLocalization","actualLocation","content","links","stateOfPreservation","references","transliterations"
    ];
    const csvRows = [fields.join(",")];
    filtered.forEach(obj => {
      const row = fields.map(f => {
        let val = obj[f] || "";
        // Escape quotes and wrap in quotes
        val = String(val).replace(/"/g, '""');
        return `"${val}"`;
      });
      csvRows.push(row.join(","));
    });
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "objects.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  const [loading, setLoading] = useState(true);
  const [objects, setObjects] = useState([]);
  const [qText, setQText] = useState("");
  const [form, setForm] = useState({
    no: "",
    name: "",
    type: "",
    museographicIndex: "",
    astronomicalType: "",
    astronomicalUse: "",
    dating: "",
    findingLocalization: "",
    actualLocation: "",
    content: "",
    links: "",
    stateOfPreservation: "",
    references: "",
    transliterations: ""
  });
  const [snack, setSnack] = useState({
    open: false,
    msg: "",
    severity: "success",
  });
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

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
        setSnack({
          open: true,
          msg: "Failed to load objects",
          severity: "error",
        });
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const t = qText.trim().toLowerCase();
    if (!t) return objects;
    return objects.filter((o) =>
      [
        o.name,
        o.type,
        o.astronomicalType,
        o.astronomicalUse,
        o.content,
        o.findingLocation,
        o.actualLocation,
      ]
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
      if (editId) {
        const { doc, updateDoc } = await import("firebase/firestore");
        await updateDoc(doc(db, "objects", editId), {
          no: form.no.trim(),
          name: form.name.trim(),
          type: form.type.trim(),
          museographicIndex: form.museographicIndex.trim(),
          astronomicalType: form.astronomicalType.trim(),
          astronomicalUse: form.astronomicalUse.trim(),
          dating: form.dating.trim(),
          findingLocalization: form.findingLocalization.trim(),
          actualLocation: form.actualLocation.trim(),
          content: form.content.trim(),
          links: form.links.trim(),
          stateOfPreservation: form.stateOfPreservation.trim(),
          references: form.references.trim(),
          transliterations: form.transliterations.trim()
        });
        setSnack({ open: true, msg: "Object updated", severity: "success" });
      } else {
        await addDoc(collection(db, "objects"), {
          no: form.no.trim(),
          name: form.name.trim(),
          type: form.type.trim(),
          museographicIndex: form.museographicIndex.trim(),
          astronomicalType: form.astronomicalType.trim(),
          astronomicalUse: form.astronomicalUse.trim(),
          dating: form.dating.trim(),
          findingLocalization: form.findingLocalization.trim(),
          actualLocation: form.actualLocation.trim(),
          content: form.content.trim(),
          links: form.links.trim(),
          stateOfPreservation: form.stateOfPreservation.trim(),
          references: form.references.trim(),
          transliterations: form.transliterations.trim(),
          createdBy: user?.uid || null,
          createdAt: serverTimestamp(),
        });
        setSnack({ open: true, msg: "Object added", severity: "success" });
      }
      setForm({
        no: "",
        name: "",
        type: "",
        museographicIndex: "",
        astronomicalType: "",
        astronomicalUse: "",
        dating: "",
        findingLocalization: "",
        actualLocation: "",
        content: "",
        links: "",
        stateOfPreservation: "",
        references: "",
        transliterations: ""
      });
      setShowForm(false);
      setEditId(null);
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to save object", severity: "error" });
    }
  };

  const handleEdit = (obj) => {
    setForm({
      no: obj.no || "",
      name: obj.name || "",
      type: obj.type || "",
      museographicIndex: obj.museographicIndex || "",
      astronomicalType: obj.astronomicalType || "",
      astronomicalUse: obj.astronomicalUse || "",
      dating: obj.dating || "",
      findingLocalization: obj.findingLocalization || "",
      actualLocation: obj.actualLocation || "",
      content: obj.content || "",
      links: obj.links || "",
      stateOfPreservation: obj.stateOfPreservation || "",
      references: obj.references || "",
      transliterations: obj.transliterations || ""
    });
    setEditId(obj.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      const { doc, deleteDoc } = await import("firebase/firestore");
      await deleteDoc(doc(db, "objects", id));
      setSnack({ open: true, msg: "Object deleted", severity: "success" });
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to delete object", severity: "error" });
    }
  };

  if (!user) {
    return (
      <Container sx={{ py: 6, textAlign: "center" }}>
        <Typography variant="h6" gutterBottom>
          You must sign in to view Objects.
        </Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr auto auto",
          gap: 1,
          alignItems: "center",
          mb: 2,
        }}
      >
        <TextField
          size="small"
          placeholder="Search objects…"
          value={qText}
          onChange={(e) => setQText(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, opacity: 0.6 }} />,
          }}
        />
        <Button variant="outlined" onClick={exportCSV} sx={{ whiteSpace: 'nowrap' }}>Export CSV</Button>
        <Button variant="outlined" component="label" sx={{ whiteSpace: 'nowrap' }}>
          Import CSV
          <input type="file" accept=".csv" hidden onChange={importCSV} />
        </Button>
      </Box>

      {/* Inline Add/Edit Form */}
      {showForm && (
        <Box sx={{ mb: 4, p: 2, border: '1px solid #eee', borderRadius: 2, background: '#fafafa' }}>
          <Typography variant="h6" gutterBottom>{editId ? "Edit Object" : "Add New Object"}</Typography>
          <Box component="form" sx={{ display: 'grid', gap: 2 }}>
            {/* ...all form fields unchanged... */}
            <TextField label="No." value={form.no} onChange={e => setForm(f => ({ ...f, no: e.target.value }))} placeholder="e.g., 1029" type="number" size="small" />
            <TextField label="Name of Object" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., Ram's head, Ichneumon, Pectoral" required size="small" />
            <TextField label="Type of Object" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} placeholder="e.g., Statue, Pectoral" size="small" />
            <TextField label="Museographic Index" value={form.museographicIndex} onChange={e => setForm(f => ({ ...f, museographicIndex: e.target.value }))} placeholder="e.g., 1029, 1062, 2021" size="small" />
            <TextField label="Astronomical Type" value={form.astronomicalType} onChange={e => setForm(f => ({ ...f, astronomicalType: e.target.value }))} placeholder="e.g., Amun-Ra, Incarnation of Atum, Sun rising" size="small" />
            <TextField label="Astronomical Use" value={form.astronomicalUse} onChange={e => setForm(f => ({ ...f, astronomicalUse: e.target.value }))} placeholder="e.g., Ritual, Symbolism" size="small" />
            <TextField label="Dating" value={form.dating} onChange={e => setForm(f => ({ ...f, dating: e.target.value }))} placeholder="e.g., 20th dynasty, Late period, 19th dynasty?" size="small" />
            <TextField label="Finding Localization" value={form.findingLocalization} onChange={e => setForm(f => ({ ...f, findingLocalization: e.target.value }))} placeholder="e.g., Unknown" size="small" />
            <TextField label="Actual Location" value={form.actualLocation} onChange={e => setForm(f => ({ ...f, actualLocation: e.target.value }))} placeholder="e.g., Kunsthistorisches Museum Vienna" size="small" />
            <TextField label="Content" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="e.g., Description, notes" multiline minRows={2} size="small" />
            <TextField label="Links" value={form.links} onChange={e => setForm(f => ({ ...f, links: e.target.value }))} placeholder="e.g., https://globalegyptianmuseum.org/detail.aspx?id=4531" multiline minRows={2} size="small" />
            <TextField label="State of Preservation" value={form.stateOfPreservation} onChange={e => setForm(f => ({ ...f, stateOfPreservation: e.target.value }))} placeholder="e.g., good, damaged" size="small" />
            <TextField label="References" value={form.references} onChange={e => setForm(f => ({ ...f, references: e.target.value }))} placeholder="e.g., Bibliography, museum records" multiline minRows={2} size="small" />
            <TextField label="Transliteration(s)" value={form.transliterations} onChange={e => setForm(f => ({ ...f, transliterations: e.target.value }))} placeholder="e.g., Hieroglyphic, Demotic, Coptic" multiline minRows={2} size="small" />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
                Save
              </Button>
              <Button variant="outlined" onClick={() => { setShowForm(false); setEditId(null); }}>
                Cancel
              </Button>
            </Box>
          </Box>
        </Box>
      )}
      {!showForm && (
        <Fab
          color="primary"
          aria-label="add"
          sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1000 }}
          onClick={() => {
            setShowForm(true);
            setEditId(null);
            setForm({
              no: "",
              name: "",
              type: "",
              museographicIndex: "",
              astronomicalType: "",
              astronomicalUse: "",
              dating: "",
              findingLocalization: "",
              actualLocation: "",
              content: "",
              links: "",
              stateOfPreservation: "",
              references: "",
              transliterations: ""
            });
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {loading ? (
        <Box sx={{ py: 6, display: "grid", placeItems: "center" }}>
          <CircularProgress />
        </Box>
      ) : filtered.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No objects found.
        </Typography>
      ) : (
        <List dense>
          {filtered.map((o) => (
            <ListItem key={o.id} divider
              secondaryAction={
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton aria-label="edit" size="small" onClick={() => handleEdit(o)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton aria-label="delete" size="small" color="error" onClick={() => handleDelete(o.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
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

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
      >
        <Alert
          severity={snack.severity}
          variant="filled"
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default ObjectsPage;
