import React, { useState, useEffect, useMemo } from "react";
import {
  Container,
  Box,
  TextField,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Typography,
  Fab,
  IconButton,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  Pagination,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { db } from "../firebase";
import {
  addDoc,
  collection,
  serverTimestamp,
  onSnapshot,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { storage } from "../firebase";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import EditObjectForm from "./EditObjectForm";
import CSVManager from "./CSVManager";

function ObjectsPage({ user }) {
  const [viewObj, setViewObj] = useState(null);
  // Permission logic
  const role = user?.role || "";
  const canEdit = role === "edit" || role === "superadmin";
  const addFormRef = React.useRef(null);

  // CSV Manager component reference
  const csvManagerRef = React.useRef(null);

  // Get ordered field names for consistent display
  const getOrderedFields = (obj) => {
    // If object has stored field order, use it
    if (obj._fieldOrder && Array.isArray(obj._fieldOrder)) {
      return obj._fieldOrder;
    }
    // Check if any object in the collection has stored field order
    const objWithOrder = objects.find(o => o._fieldOrder && Array.isArray(o._fieldOrder));
    if (objWithOrder) {
      return objWithOrder._fieldOrder;
    }
    // Otherwise get all non-metadata fields and sort them
    const fallbackFields = Object.keys(obj)
      .filter(key => !key.startsWith('_') && key !== 'id' && key !== 'createdAt' && key !== 'createdBy')
      .sort();
    return fallbackFields;
  };

  // Get the primary display field (usually the first meaningful field)
  const getPrimaryField = (obj) => {
    const orderedFields = getOrderedFields(obj);
    // Try to find name-like fields first
    const nameFields = orderedFields.filter(field => 
      field.toLowerCase().includes('name') || 
      field.toLowerCase().includes('title')
    );
    if (nameFields.length > 0) {
      return obj[nameFields[0]] || "(untitled)";
    }
    // Otherwise use the first field
    return obj[orderedFields[0]] || "(untitled)";
  };

  const importCSV = async (event) => {
    // Use the new CSVManager
    if (csvManagerRef.current) {
      csvManagerRef.current.handleImport(event);
    }
  };

  const exportCSV = () => {
    // Use the new CSVManager
    if (csvManagerRef.current) {
      csvManagerRef.current.handleExport();
    }
  };
  const [loading, setLoading] = useState(true);
  const [objects, setObjects] = useState([]);
  // Load objects from Firestore
  useEffect(() => {
    const q = collection(db, "objects");
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const loadedObjects = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setObjects(loadedObjects);
        setLoading(false);
      },
      (err) => {
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
  const [qText, setQText] = useState("");
  // Filter states
  const [filterType, setFilterType] = useState("");
  const [filterAstroType, setFilterAstroType] = useState("");
  const [filterDating, setFilterDating] = useState("");
  const [filterLocation, setFilterLocation] = useState("");

  // Pagination state
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  // Get unique values for dropdowns
  const typeOptions = useMemo(
    () =>
      Array.from(new Set(objects.map((o) => o.type).filter(Boolean))).sort(),
    [objects]
  );
  const astroTypeOptions = useMemo(
    () =>
      Array.from(
        new Set(objects.map((o) => o.astronomicalType).filter(Boolean))
      ).sort(),
    [objects]
  );
  const datingOptions = useMemo(
    () =>
      Array.from(new Set(objects.map((o) => o.dating).filter(Boolean))).sort(),
    [objects]
  );
  const locationOptions = useMemo(
    () =>
      Array.from(
        new Set(objects.map((o) => o.actualLocation).filter(Boolean))
      ).sort(),
    [objects]
  );

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
    transliterations: "",
  });
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [snack, setSnack] = useState({
    open: false,
    msg: "",
    severity: "info",
  });
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
    if (filterType) result = result.filter((o) => o.type === filterType);
    if (filterAstroType)
      result = result.filter((o) => o.astronomicalType === filterAstroType);
    if (filterDating) result = result.filter((o) => o.dating === filterDating);
    if (filterLocation)
      result = result.filter((o) => o.actualLocation === filterLocation);
    return result;
  }, [
    qText,
    objects,
    filterType,
    filterAstroType,
    filterDating,
    filterLocation,
  ]);

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  }, [filtered, page, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [qText, filterType, filterAstroType, filterDating, filterLocation]);

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
          const storageRef = ref(
            storage,
            `object-images/${Date.now()}-${img.file.name}`
          );
          await uploadBytes(storageRef, img.file);
          const url = await getDownloadURL(storageRef);
          uploadedUrls.push(url);
        } else if (img.url && img.url.startsWith("http")) {
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
          images: uploadedUrls,
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
        transliterations: "",
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
      transliterations: obj.transliterations || "",
    });
    // Prefill images state with URLs for editing
    setImages(
      Array.isArray(obj.images) ? obj.images.map((url) => ({ url })) : []
    );
    setEditId(obj.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      // Find the object to get its images
      const obj = objects.find((o) => o.id === id);
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
      setSnack({
        open: true,
        msg: "Failed to delete object",
        severity: "error",
      });
    }
  };

  if (!user || !role) {
    return null;
  }

  return (
    <div style={{ backgroundColor: "rgb(204, 255, 255)", minHeight: "100vh" }}>
      <Container sx={{ py: 4 }}>
        {/* Top row: search, export, import (full width) */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: (() => {
                // Determine grid layout based on which buttons to show
                const showExport = (role === "view" || role === "edit" || role === "superadmin") && objects.length > 0;
                const showImport = role === "superadmin" && objects.length === 0;
                
                if (showExport && showImport) return "1fr auto auto";
                if (showExport || showImport) return "1fr auto";
                return "1fr";
              })(),
            },
            gap: 2,
            alignItems: "center",
            mb: 1,
            width: "100%",
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
            sx={{ width: "100%" }}
          />
          {/* Show export button only if user has permission AND there is data */}
          {(role === "view" || role === "edit" || role === "superadmin") && objects.length > 0 && (
            <Tooltip title="Export CSV">
              <IconButton color="primary" onClick={exportCSV} sx={{}}>
                <FileDownloadIcon />
              </IconButton>
            </Tooltip>
          )}
          {/* Show import button only if user is superadmin AND there is no data */}
          {role === "superadmin" && objects.length === 0 && (
            <Button
              variant="outlined"
              component="label"
              sx={{ whiteSpace: "nowrap" }}
            >
              Import CSV
              <input type="file" accept=".csv" hidden onChange={importCSV} />
            </Button>
          )}
        </Box>

        {/* Filter row: full width below top row */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(4, 1fr)" },
            gap: 2,
            mb: 2,
            width: "100%",
          }}
        >
          <FormControl size="small" sx={{ width: "100%" }}>
            <InputLabel>Object Type</InputLabel>
            <Select
              label="Object Type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              {typeOptions.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ width: "100%" }}>
            <InputLabel>Astronomical Type</InputLabel>
            <Select
              label="Astronomical Type"
              value={filterAstroType}
              onChange={(e) => setFilterAstroType(e.target.value)}
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              {astroTypeOptions.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ width: "100%" }}>
            <InputLabel>Dating</InputLabel>
            <Select
              label="Dating"
              value={filterDating}
              onChange={(e) => setFilterDating(e.target.value)}
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              {datingOptions.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ width: "100%" }}>
            <InputLabel>Actual Location</InputLabel>
            <Select
              label="Actual Location"
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              {locationOptions.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {canEdit && !showForm && (
          <Fab
            color="primary"
            aria-label="add"
            sx={{ position: "fixed", bottom: 32, right: 32, zIndex: 1000 }}
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
                transliterations: "",
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
            {paginatedData.map((o) =>
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
                <Box
                  key={o.id}
                  sx={{
                    mb: 2,
                    p: 2,
                    border: "1px solid #eee",
                    borderRadius: 2,
                    background: "#fafafa",
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    View Object
                  </Typography>
                  {Array.isArray(viewObj.images) &&
                    viewObj.images.length > 0 && (
                      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                        {viewObj.images.map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt="object"
                            style={{
                              width: 120,
                              height: 120,
                              objectFit: "cover",
                              borderRadius: 8,
                              border: "1px solid #eee",
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  <Typography variant="subtitle2">No:</Typography>
                  <Typography>{viewObj.no}</Typography>
                  <Typography variant="subtitle2">Name:</Typography>
                  <Typography>{viewObj.name}</Typography>
                  <Typography variant="subtitle2">Type:</Typography>
                  <Typography>{viewObj.type}</Typography>
                  <Typography variant="subtitle2">
                    Museographic Index:
                  </Typography>
                  <Typography>{viewObj.museographicIndex}</Typography>
                  <Typography variant="subtitle2">
                    Astronomical Type:
                  </Typography>
                  <Typography>{viewObj.astronomicalType}</Typography>
                  <Typography variant="subtitle2">
                    Use (Astronomical, Cosmographic, Ritual, etc…):
                  </Typography>
                  <Typography>{viewObj.astronomicalUse}</Typography>
                  <Typography variant="subtitle2">Dating:</Typography>
                  <Typography>{viewObj.dating}</Typography>
                  <Typography variant="subtitle2">
                    Finding Localization:
                  </Typography>
                  <Typography>{viewObj.findingLocalization}</Typography>
                  <Typography variant="subtitle2">Actual Location:</Typography>
                  <Typography>{viewObj.actualLocation}</Typography>
                  <Typography variant="subtitle2">Content:</Typography>
                  <Typography>{viewObj.content}</Typography>
                  <Typography variant="subtitle2">Links:</Typography>
                  <Typography sx={{ wordBreak: "break-all" }}>
                    {viewObj.links}
                  </Typography>
                  <Typography variant="subtitle2">
                    State of Preservation:
                  </Typography>
                  <Typography>{viewObj.stateOfPreservation}</Typography>
                  <Typography variant="subtitle2">References:</Typography>
                  <Typography>{viewObj.references}</Typography>
                  <Typography variant="subtitle2">Transliterations:</Typography>
                  <Typography>{viewObj.transliterations}</Typography>
                  <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                    <Button
                      variant="contained"
                      onClick={() => setViewObj(null)}
                    >
                      Close
                    </Button>
                  </Box>
                </Box>
              ) : (
                <ListItem
                  key={o.id}
                  divider
                  secondaryAction={
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Tooltip title="View">
                        <IconButton
                          aria-label="view"
                          size="small"
                          onClick={() => setViewObj(o)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {canEdit && (
                        <>
                          <Tooltip title="Edit">
                            <IconButton
                              aria-label="edit"
                              size="small"
                              onClick={() => handleEdit(o)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              aria-label="delete"
                              size="small"
                              color="error"
                              onClick={() => handleDelete(o.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  }
                >
                  {/* Thumbnail or placeholder */}
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      mr: 2,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid #eee",
                      borderRadius: 1,
                      overflow: "hidden",
                      background: "#fafafa",
                    }}
                  >
                    {Array.isArray(o.images) && o.images.length > 0 ? (
                      <img
                        src={o.images[0]}
                        alt="thumb"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#bbb",
                          fontSize: 24,
                        }}
                      >
                        <PhotoCamera fontSize="inherit" />
                      </Box>
                    )}
                  </Box>
                  <ListItemText
                    primary={getPrimaryField(o)}
                    secondary={
                      (() => {
                        const orderedFields = getOrderedFields(o);
                        // Show the first few non-empty fields after the primary field
                        const secondaryFields = orderedFields.slice(1, 4)
                          .map(field => o[field])
                          .filter(Boolean);
                        return secondaryFields.length > 0 ? secondaryFields.join(" • ") : null;
                      })()
                    }
                  />
                </ListItem>
              )
            )}
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

        {/* Pagination and Results Info */}
        {filtered.length > 0 && (
          <Box sx={{ mt: 3, display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Showing {((page - 1) * itemsPerPage) + 1}-{Math.min(page * itemsPerPage, filtered.length)} of {filtered.length} objects
            </Typography>
            {totalPages > 1 && (
              <Pagination
                count={totalPages}
                page={page}
                onChange={(event, value) => setPage(value)}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            )}
          </Box>
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

        {/* CSV Manager Component */}
        <CSVManager
          ref={csvManagerRef}
          objects={filtered}
          onImportSuccess={(message) => setSnack({ open: true, msg: message, severity: "success" })}
          onError={(message) => setSnack({ open: true, msg: message, severity: "error" })}
          user={user}
        />
      </Container>
    </div>
  );
}

export default ObjectsPage;
