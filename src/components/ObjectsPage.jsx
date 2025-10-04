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
  // Dynamic filter states
  const [dynamicFilters, setDynamicFilters] = useState({});
  const [availableFilterableFields, setAvailableFilterableFields] = useState([]);
  const [availableSearchableFields, setAvailableSearchableFields] = useState([]);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  // Update available filterable and searchable fields when objects change
  useEffect(() => {
    // Get available filterable fields from stored data
    const getAvailableFilterableFields = () => {
      if (objects.length > 0) {
        // Look for an object with stored filterable fields configuration
        const objectWithFilterableFields = objects.find(obj => obj._filterableFields && Array.isArray(obj._filterableFields));
        if (objectWithFilterableFields) {
          return objectWithFilterableFields._filterableFields;
        }
      }
      // Fallback to empty array if no filterable fields configuration found
      return [];
    };

    // Get available searchable fields from stored data
    const getAvailableSearchableFields = () => {
      if (objects.length > 0) {
        // Look for an object with stored searchable fields configuration
        const objectWithSearchableFields = objects.find(obj => obj._searchableFields && Array.isArray(obj._searchableFields));
        if (objectWithSearchableFields) {
          return objectWithSearchableFields._searchableFields;
        }
        
        // If no searchable fields configured, try to use field order as fallback
        const objectWithFieldOrder = objects.find(obj => obj._fieldOrder && Array.isArray(obj._fieldOrder));
        if (objectWithFieldOrder) {
          // Use first few fields from field order as searchable fields
          const fieldOrder = objectWithFieldOrder._fieldOrder;
          return fieldOrder.slice(0, Math.min(5, fieldOrder.length)); // Use first 5 fields
        }
      }
      // Final fallback: if no configuration at all, return empty array (will trigger fallback search)
      return [];
    };

    const filterableFields = getAvailableFilterableFields();
    setAvailableFilterableFields(filterableFields);
    
    const searchableFields = getAvailableSearchableFields();
    setAvailableSearchableFields(searchableFields);
    
    // Initialize dynamic filters for each filterable field
    const initialFilters = {};
    filterableFields.forEach(field => {
      initialFilters[field] = "";
    });
    setDynamicFilters(initialFilters);
  }, [objects]);

  // Generate filter options for each filterable field
  const getFilterOptions = (fieldName) => {
    return Array.from(
      new Set(objects.map((o) => o[fieldName]).filter(Boolean))
    ).sort();
  };

  // Get the stored field order from existing objects
  const getStoredFieldOrder = () => {
    if (objects.length > 0) {
      // Look for an object with stored field order
      const objectWithOrder = objects.find(obj => obj._fieldOrder && Array.isArray(obj._fieldOrder));
      if (objectWithOrder) {
        return objectWithOrder._fieldOrder;
      }
    }
    // Return empty array if no stored order found - will show message to import CSV first
    return [];
  };

  // Get current field order (dynamic based on stored data)
  const currentFieldOrder = getStoredFieldOrder();

  // Create dynamic form state based on field order
  const createEmptyForm = () => {
    const emptyForm = {};
    currentFieldOrder.forEach(field => {
      emptyForm[field] = "";
    });
    return emptyForm;
  };

  const [form, setForm] = useState(() => createEmptyForm());
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
      if (availableSearchableFields.length > 0) {
        // Use configured searchable fields
        result = result.filter((o) => {
          const searchableValues = availableSearchableFields
            .map(field => o[field])
            .filter(Boolean);
          
          return searchableValues.some((v) => 
            String(v).toLowerCase().includes(t)
          );
        });
      } else {
        // Fallback: search all non-metadata fields if no searchable fields configured
        result = result.filter((o) => {
          const allFields = Object.keys(o).filter(key => 
            !key.startsWith('_') && 
            key !== 'id' && 
            key !== 'createdAt' && 
            key !== 'createdBy' &&
            key !== 'imageUrls'
          );
          
          return allFields.some(field => {
            const value = o[field];
            return value && String(value).toLowerCase().includes(t);
          });
        });
      }
    }
    
    // Apply dynamic filters
    Object.entries(dynamicFilters).forEach(([fieldName, filterValue]) => {
      if (filterValue) {
        result = result.filter((o) => o[fieldName] === filterValue);
      }
    });
    
    return result;
  }, [qText, objects, dynamicFilters, availableSearchableFields]);

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
  }, [qText, dynamicFilters]);

  const handleAdd = async () => {
    // Find a name-like field for validation
    const nameField = currentFieldOrder.find(field => 
      field.toLowerCase().includes('name') || field.toLowerCase().includes('title')
    ) || currentFieldOrder[1]; // fallback to second field if no name field found
    
    if (!form[nameField] || !form[nameField].trim()) {
      setSnack({ open: true, msg: `${nameField} is required`, severity: "warning" });
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

      // Create document data with dynamic fields in correct order
      const docData = {};
      currentFieldOrder.forEach(field => {
        docData[field] = (form[field] || "").trim();
      });
      docData.images = uploadedUrls;
      docData._fieldOrder = currentFieldOrder; // Store field order

      if (editId) {
        // Update existing object
        await updateDoc(doc(db, "objects", editId), docData);
        setSnack({ open: true, msg: "Object updated", severity: "success" });
      } else {
        // Add new object
        docData.createdBy = user?.uid || null;
        docData.createdAt = serverTimestamp();
        await addDoc(collection(db, "objects"), docData);
        setSnack({ open: true, msg: "Object added", severity: "success" });
      }
      
      setForm(createEmptyForm());
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
    // Create form data with dynamic field order
    const editForm = {};
    currentFieldOrder.forEach(field => {
      editForm[field] = obj[field] || "";
    });
    setForm(editForm);
    
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
            gridTemplateColumns: { 
              xs: "1fr", 
              sm: availableFilterableFields.length <= 2 ? `repeat(${availableFilterableFields.length}, 1fr)` : "repeat(4, 1fr)" 
            },
            gap: 2,
            mb: 2,
            width: "100%",
          }}
        >
          {availableFilterableFields.map((fieldName) => (
            <FormControl key={fieldName} size="small" sx={{ width: "100%" }}>
              <InputLabel>{fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/([A-Z])/g, ' $1')}</InputLabel>
              <Select
                label={fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/([A-Z])/g, ' $1')}
                value={dynamicFilters[fieldName] || ""}
                onChange={(e) => setDynamicFilters(prev => ({
                  ...prev,
                  [fieldName]: e.target.value
                }))}
              >
                <MenuItem value="">
                  <em>All</em>
                </MenuItem>
                {getFilterOptions(fieldName).map((opt) => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ))}
        </Box>

        {canEdit && !showForm && (
          <Fab
            color="primary"
            aria-label="add"
            sx={{ position: "fixed", bottom: 32, right: 32, zIndex: 1000 }}
            onClick={() => {
              const fieldOrder = getStoredFieldOrder();
              if (fieldOrder.length === 0) {
                setSnack({
                  open: true,
                  msg: "Please import a CSV file first to configure the form fields",
                  severity: "warning",
                });
                return;
              }
              setShowForm(true);
              setEditId(null);
              setForm(createEmptyForm());
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
                    fieldOrder={currentFieldOrder}
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
                  
                  {/* Dynamic field display based on field order or all available fields */}
                  {(() => {
                    // Use stored field order if available, otherwise show all non-metadata fields
                    const fieldsToShow = viewObj._fieldOrder || 
                      Object.keys(viewObj).filter(key => 
                        !key.startsWith('_') && 
                        key !== 'id' && 
                        key !== 'createdAt' && 
                        key !== 'createdBy' && 
                        key !== 'images' &&
                        key !== 'imageUrls'
                      );
                    
                    return fieldsToShow.map((fieldName) => {
                      const value = viewObj[fieldName];
                      
                      // Generate user-friendly label
                      const label = fieldName
                        .replace(/([A-Z])/g, ' $1') // Add space before capital letters
                        .replace(/[_-]/g, ' ') // Replace underscores and hyphens with spaces
                        .split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                        .join(' ')
                        .trim();
                      
                      const isLongText = fieldName.toLowerCase().includes('content') ||
                                        fieldName.toLowerCase().includes('link') ||
                                        fieldName.toLowerCase().includes('reference') ||
                                        fieldName.toLowerCase().includes('transliter');
                      
                      // Show field even if empty, but with different styling
                      const displayValue = value ? String(value) : '(empty)';
                      const isEmpty = !value || String(value).trim() === '';
                      
                      return (
                        <React.Fragment key={fieldName}>
                          <Typography variant="subtitle2">{label}:</Typography>
                          <Typography 
                            sx={{
                              ...(isLongText ? { wordBreak: "break-all" } : {}),
                              ...(isEmpty ? { fontStyle: 'italic', color: 'text.secondary' } : {})
                            }}
                          >
                            {displayValue}
                          </Typography>
                        </React.Fragment>
                      );
                    }).filter(Boolean);
                  })()}
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
                  fieldOrder={currentFieldOrder}
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
