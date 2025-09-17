
import React, { useState, useEffect, useMemo } from "react";
import { Container, Box, TextField, Button, CircularProgress, Snackbar, Alert, Typography, Fab, IconButton, MenuItem, FormControl, InputLabel, Select, Tooltip, List, ListItem, ListItemText } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { db } from "../firebase";
import { addDoc, collection, serverTimestamp, onSnapshot, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import EditObjectForm from "./EditObjectForm";

function ObjectsPage({ user }) {
  const [viewObj, setViewObj] = useState(null);
  // Permission logic
  const role = user?.role || "";
  const canEdit = role === "edit" || role === "superadmin";
  const addFormRef = React.useRef(null);

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
  // Load objects from Firestore
  useEffect(() => {
    const q = collection(db, "objects");
    const unsub = onSnapshot(q, (snapshot) => {
      setObjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => {
      setSnack({ open: true, msg: "Failed to load objects", severity: "error" });
      setLoading(false);
    });
    return () => unsub();
  }, []);
  const [qText, setQText] = useState("");
  // Filter states
  const [filterType, setFilterType] = useState("");
  const [filterAstroType, setFilterAstroType] = useState("");
  const [filterDating, setFilterDating] = useState("");
  const [filterLocation, setFilterLocation] = useState("");

  // Get unique values for dropdowns
  const typeOptions = useMemo(() => Array.from(new Set(objects.map(o => o.type).filter(Boolean))).sort(), [objects]);
  const astroTypeOptions = useMemo(() => Array.from(new Set(objects.map(o => o.astronomicalType).filter(Boolean))).sort(), [objects]);
  const datingOptions = useMemo(() => Array.from(new Set(objects.map(o => o.dating).filter(Boolean))).sort(), [objects]);
  const locationOptions = useMemo(() => Array.from(new Set(objects.map(o => o.actualLocation).filter(Boolean))).sort(), [objects]);

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
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'info' });
  // ...existing code...

  const filtered = useMemo(() => {
    let result = objects;
    const t = qText.trim().toLowerCase();
    if (t) {
      result = result.filter((o) =>
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
    }
    if (filterType) result = result.filter(o => o.type === filterType);
    if (filterAstroType) result = result.filter(o => o.astronomicalType === filterAstroType);
    if (filterDating) result = result.filter(o => o.dating === filterDating);
    if (filterLocation) result = result.filter(o => o.actualLocation === filterLocation);
    return result;
  }, [qText, objects, filterType, filterAstroType, filterDating, filterLocation]);

  const handleAdd = async () => {
    if (!form.name.trim()) {
      setSnack({ open: true, msg: "Name is required", severity: "warning" });
      return;
    }
    setUploading(true);
    try {
      // Upload new images to Firebase Storage
      const uploadedUrls = [];
      for (const img of images) {
        if (img.file) {
          const storageRef = ref(storage, `object-images/${Date.now()}-${img.file.name}`);
          await uploadBytes(storageRef, img.file);
          const url = await getDownloadURL(storageRef);
          uploadedUrls.push(url);
        } else if (img.url && img.url.startsWith('http')) {
          uploadedUrls.push(img.url);
        }
      }
      if (editId) {
        // Update existing object
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
          transliterations: form.transliterations.trim(),
          images: uploadedUrls
        });
        setSnack({ open: true, msg: "Object updated", severity: "success" });
      } else {
        // Add new object
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
          images: uploadedUrls,
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
      setImages([]);
      setShowForm(false);
      setEditId(null);
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to save object", severity: "error" });
    }
    setUploading(false);
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
    // Prefill images state with URLs for editing
    setImages(Array.isArray(obj.images) ? obj.images.map(url => ({ url })) : []);
    setEditId(obj.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      // Find the object to get its images
      const obj = objects.find(o => o.id === id);
      // Delete all images from storage
      if (obj && Array.isArray(obj.images)) {
        for (const url of obj.images) {
          try {
            // Extract the storage path from the URL
            const matches = url.match(/\/o\/([^?]+)/);
            const path = matches ? decodeURIComponent(matches[1]) : null;
            if (path) {
              await deleteObject(ref(storage, path));
            }
          } catch (err) {
            // Ignore errors for missing files
            console.warn("Failed to delete image from storage", err);
          }
        }
      }
      // Delete the Firestore document
      await deleteDoc(doc(db, "objects", id));
      setSnack({ open: true, msg: "Object deleted", severity: "success" });
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to delete object", severity: "error" });
    }
  };

  if (!user || !role) {
    return null;
  }

  return (
    <Container sx={{ py: 4 }}>
      {/* Top row: search, export, import (full width) */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: (role === 'superadmin' ? '1fr auto auto' : '1fr auto') },
          gap: 2,
          alignItems: 'center',
          mb: 1,
          width: '100%',
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
          sx={{ width: '100%' }}
        />
        {(role === 'view' || role === 'edit' || role === 'superadmin') && (
          <Tooltip title="Export CSV">
            <IconButton color="primary" onClick={exportCSV} sx={{}}>
              <FileDownloadIcon />
            </IconButton>
          </Tooltip>
        )}
        {role === 'superadmin' && (
          <Button variant="outlined" component="label" sx={{ whiteSpace: 'nowrap' }}>
            Import CSV
            <input type="file" accept=".csv" hidden onChange={importCSV} />
          </Button>
        )}
      </Box>

      {/* Filter row: full width below top row */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 2,
          width: '100%',
        }}
      >
        <FormControl size="small" sx={{ width: '100%' }}>
          <InputLabel>Object Type</InputLabel>
          <Select
            label="Object Type"
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
          >
            <MenuItem value=""><em>All</em></MenuItem>
            {typeOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ width: '100%' }}>
          <InputLabel>Astronomical Type</InputLabel>
          <Select
            label="Astronomical Type"
            value={filterAstroType}
            onChange={e => setFilterAstroType(e.target.value)}
          >
            <MenuItem value=""><em>All</em></MenuItem>
            {astroTypeOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ width: '100%' }}>
          <InputLabel>Dating</InputLabel>
          <Select
            label="Dating"
            value={filterDating}
            onChange={e => setFilterDating(e.target.value)}
          >
            <MenuItem value=""><em>All</em></MenuItem>
            {datingOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ width: '100%' }}>
          <InputLabel>Actual Location</InputLabel>
          <Select
            label="Actual Location"
            value={filterLocation}
            onChange={e => setFilterLocation(e.target.value)}
          >
            <MenuItem value=""><em>All</em></MenuItem>
            {locationOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {canEdit && !showForm && (
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
            editId === o.id ? (
              <Box key={o.id} sx={{ mb: 2 }}>
                <EditObjectForm
                  form={form}
                  setForm={setForm}
                  editId={editId}
                  handleAdd={handleAdd}
                  setShowForm={setShowForm}
                  setEditId={setEditId}
                  images={images}
                  setImages={setImages}
                  uploading={uploading}
                />
              </Box>
            ) : viewObj && viewObj.id === o.id ? (
              <Box key={o.id} sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 2, background: '#fafafa' }}>
                <Typography variant="h6" gutterBottom>View Object</Typography>
                {Array.isArray(viewObj.images) && viewObj.images.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    {viewObj.images.map((img, idx) => (
                      <img key={idx} src={img} alt="object" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid #eee' }} />
                    ))}
                  </Box>
                )}
                <Typography variant="subtitle2">No:</Typography>
                <Typography>{viewObj.no}</Typography>
                <Typography variant="subtitle2">Name:</Typography>
                <Typography>{viewObj.name}</Typography>
                <Typography variant="subtitle2">Type:</Typography>
                <Typography>{viewObj.type}</Typography>
                <Typography variant="subtitle2">Museographic Index:</Typography>
                <Typography>{viewObj.museographicIndex}</Typography>
                <Typography variant="subtitle2">Astronomical Type:</Typography>
                <Typography>{viewObj.astronomicalType}</Typography>
                <Typography variant="subtitle2">Astronomical Use:</Typography>
                <Typography>{viewObj.astronomicalUse}</Typography>
                <Typography variant="subtitle2">Dating:</Typography>
                <Typography>{viewObj.dating}</Typography>
                <Typography variant="subtitle2">Finding Localization:</Typography>
                <Typography>{viewObj.findingLocalization}</Typography>
                <Typography variant="subtitle2">Actual Location:</Typography>
                <Typography>{viewObj.actualLocation}</Typography>
                <Typography variant="subtitle2">Content:</Typography>
                <Typography>{viewObj.content}</Typography>
                <Typography variant="subtitle2">Links:</Typography>
                <Typography sx={{ wordBreak: 'break-all' }}>{viewObj.links}</Typography>
                <Typography variant="subtitle2">State of Preservation:</Typography>
                <Typography>{viewObj.stateOfPreservation}</Typography>
                <Typography variant="subtitle2">References:</Typography>
                <Typography>{viewObj.references}</Typography>
                <Typography variant="subtitle2">Transliterations:</Typography>
                <Typography>{viewObj.transliterations}</Typography>
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button variant="contained" onClick={() => setViewObj(null)}>Close</Button>
                </Box>
              </Box>
            ) : (
              <ListItem key={o.id} divider
                secondaryAction={
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="View">
                      <IconButton aria-label="view" size="small" onClick={() => setViewObj(o)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {canEdit && <>
                      <Tooltip title="Edit">
                        <IconButton aria-label="edit" size="small" onClick={() => handleEdit(o)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton aria-label="delete" size="small" color="error" onClick={() => handleDelete(o.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </>}
                  </Box>
                }
              >
                {/* Thumbnail or placeholder */}
                <Box sx={{ width: 56, height: 56, mr: 2, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #eee', borderRadius: 1, overflow: 'hidden', background: '#fafafa' }}>
                  {Array.isArray(o.images) && o.images.length > 0 ? (
                    <img src={o.images[0]} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontSize: 24 }}>
                      <PhotoCamera fontSize="inherit" />
                    </Box>
                  )}
                </Box>
                <ListItemText
                  primary={o.name || "(untitled)"}
                  secondary={
                    [o.astronomicalType, o.astronomicalUse].filter(Boolean).join(" • ") || null
                  }
                />
              </ListItem>
            )
          ))}
          {/* Add form at the bottom */}
          {canEdit && showForm && !editId && (
            <Box ref={addFormRef} sx={{ mb: 2 }}>
              <EditObjectForm
                form={form}
                setForm={setForm}
                editId={editId}
                handleAdd={handleAdd}
                setShowForm={setShowForm}
                setEditId={setEditId}
                images={images}
                setImages={setImages}
                uploading={uploading}
              />
            </Box>
          )}
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
