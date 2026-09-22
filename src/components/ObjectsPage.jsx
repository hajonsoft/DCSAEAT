import React, { useState, useEffect, useMemo, useRef } from "react";
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
  Pagination,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import CloseIcon from "@mui/icons-material/Close";
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
import { useI18n } from "../i18n/I18nContext";

function formatFieldLabel(fieldName) {
  return fieldName
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
    .trim();
}

function ObjectsPage({ user }) {
  const { t } = useI18n();
  const tRef = useRef(t);
  tRef.current = t;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [viewObj, setViewObj] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
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
      return obj[nameFields[0]] || t("objects.untitled");
    }
    // Otherwise use the first field
    return obj[orderedFields[0]] || t("objects.untitled");
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
          msg: tRef.current("objects.failedLoad"),
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
      setSnack({ open: true, msg: t("objects.required", { field: nameField }), severity: "warning" });
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
        setSnack({ open: true, msg: t("objects.updated"), severity: "success" });
      } else {
        // Add new object
        docData.createdBy = user?.uid || null;
        docData.createdAt = serverTimestamp();
        await addDoc(collection(db, "objects"), docData);
        setSnack({ open: true, msg: t("objects.added"), severity: "success" });
      }
      
      setForm(createEmptyForm());
      setImages([]);
      setShowForm(false);
      setEditId(null);
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: t("objects.failedSave"), severity: "error" });
    }
    setUploading(false);
  };

  const handleEdit = (obj) => {
    const editForm = {};
    currentFieldOrder.forEach((field) => {
      editForm[field] = obj[field] || "";
    });
    setForm(editForm);
    setImages(Array.isArray(obj.images) ? obj.images.map((url) => ({ url })) : []);
    setViewObj(null);
    setEditId(obj.id);
    setShowForm(true);
  };

  const openView = (obj) => {
    setShowForm(false);
    setEditId(null);
    setViewObj(obj);
  };

  const requestDelete = (obj) => {
    setDeleteTarget(obj);
  };

  const handleDelete = async (id) => {
    try {
      const obj = objects.find((o) => o.id === id);
      if (obj && Array.isArray(obj.images)) {
        for (const url of obj.images) {
          try {
            const matches = url.match(/\/o\/([^?]+)/);
            const path = matches ? decodeURIComponent(matches[1]) : null;
            if (path) {
              await deleteObject(ref(storage, path));
            }
          } catch (err) {
            console.warn("Failed to delete image from storage", err);
          }
        }
      }
      await deleteDoc(doc(db, "objects", id));
      setSnack({ open: true, msg: t("objects.deleted"), severity: "success" });
    } catch (e) {
      console.error(e);
      setSnack({
        open: true,
        msg: t("objects.failedDelete"),
        severity: "error",
      });
      throw e;
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await handleDelete(deleteTarget.id);
      if (viewObj?.id === deleteTarget.id) setViewObj(null);
      setDeleteTarget(null);
    } catch {
      // Snack is already set in handleDelete
    }
    setDeleting(false);
  };

  if (!user || !role) {
    return null;
  }

  const viewFields = viewObj
    ? (viewObj._fieldOrder ||
      Object.keys(viewObj).filter(
        (key) =>
          !key.startsWith("_") &&
          key !== "id" &&
          key !== "createdAt" &&
          key !== "createdBy" &&
          key !== "images" &&
          key !== "imageUrls"
      ))
    : [];

  const showExport = (role === "view" || role === "edit" || role === "superadmin") && objects.length > 0;
  const showImport = role === "superadmin" && objects.length === 0;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, rgb(204, 255, 255) 0%, rgb(232, 248, 255) 55%, #eef6f8 100%)",
      }}
    >
      <Container sx={{ py: { xs: 2, md: 4 }, px: { xs: 2, sm: 3 } }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, sm: 2 },
            mb: 2.5,
            borderRadius: 3,
            border: "1px solid rgba(48,46,47,0.06)",
            backgroundColor: "rgba(255,255,255,0.92)",
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: showExport || showImport ? "1fr auto" : "1fr",
              },
              gap: 2,
              alignItems: "center",
              mb: availableFilterableFields.length ? 2 : 0,
              width: "100%",
            }}
          >
            <TextField
              size="small"
              placeholder={t("objects.searchPlaceholder")}
              value={qText}
              onChange={(e) => setQText(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, opacity: 0.6 }} />,
              }}
              sx={{ width: "100%", backgroundColor: "#fff", borderRadius: 1 }}
            />
            {showExport && (
              <Tooltip title={t("objects.exportCsv")}>
                <IconButton color="primary" onClick={exportCSV}>
                  <FileDownloadIcon />
                </IconButton>
              </Tooltip>
            )}
            {showImport && (
              <Button variant="outlined" component="label" sx={{ whiteSpace: "nowrap" }}>
                {t("objects.importCsv")}
                <input type="file" accept=".csv" hidden onChange={importCSV} />
              </Button>
            )}
          </Box>

          {availableFilterableFields.length > 0 && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md:
                    availableFilterableFields.length <= 2
                      ? `repeat(${availableFilterableFields.length}, 1fr)`
                      : "repeat(4, 1fr)",
                },
                gap: 2,
                width: "100%",
              }}
            >
              {availableFilterableFields.map((fieldName) => (
                <FormControl key={fieldName} size="small" sx={{ width: "100%", backgroundColor: "#fff", borderRadius: 1 }}>
                  <InputLabel>{formatFieldLabel(fieldName)}</InputLabel>
                  <Select
                    label={formatFieldLabel(fieldName)}
                    value={dynamicFilters[fieldName] || ""}
                    onChange={(e) =>
                      setDynamicFilters((prev) => ({
                        ...prev,
                        [fieldName]: e.target.value,
                      }))
                    }
                  >
                    <MenuItem value="">
                      <em>{t("objects.all")}</em>
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
          )}
        </Paper>

        {canEdit && !showForm && (
          <Fab
            color="primary"
            aria-label={t("objects.add")}
            sx={{ position: "fixed", bottom: { xs: 16, md: 32 }, right: { xs: 16, md: 32 }, zIndex: 1000 }}
            onClick={() => {
              const fieldOrder = getStoredFieldOrder();
              if (fieldOrder.length === 0) {
                setSnack({
                  open: true,
                  msg: t("objects.importCsvFirst"),
                  severity: "warning",
                });
                return;
              }
              setViewObj(null);
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
          <Paper
            elevation={0}
            sx={{
              p: 4,
              textAlign: "center",
              borderRadius: 3,
              border: "1px solid rgba(48,46,47,0.06)",
              backgroundColor: "rgba(255,255,255,0.92)",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {t("objects.noObjects")}
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }} ref={addFormRef}>
            {paginatedData.map((o) => {
              const secondaryFields = getOrderedFields(o)
                .slice(1, 4)
                .map((field) => o[field])
                .filter(Boolean);

              return (
                <Card
                  key={o.id}
                  onClick={() => openView(o)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openView(o);
                    }
                  }}
                  sx={{
                    borderRadius: 3,
                    border: "1px solid rgba(48,46,47,0.06)",
                    boxShadow: "0 6px 18px rgba(48,46,47,0.05)",
                    backgroundColor: "rgba(255,255,255,0.94)",
                    cursor: "pointer",
                    transition: "transform 0.25s ease, box-shadow 0.25s ease, background-color 0.25s ease",
                    outline: "none",
                    "@media (hover: hover)": {
                      "&:hover": {
                        transform: "translateY(-3px)",
                        boxShadow: "0 14px 28px rgba(48,46,47,0.12)",
                        backgroundColor: "#fff",
                      },
                      "&:hover .row-thumb img": { transform: "scale(1.08)" },
                      "&:hover .row-actions": { opacity: 1 },
                    },
                  }}
                >
                  <CardContent
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: { xs: 1.25, sm: 2 },
                      p: { xs: 1.5, sm: 2 },
                      "&:last-child": { pb: { xs: 1.5, sm: 2 } },
                    }}
                  >
                    <Box
                      className="row-thumb"
                      sx={{
                        width: { xs: 56, sm: 72 },
                        height: { xs: 56, sm: 72 },
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid #eee",
                        borderRadius: 2,
                        overflow: "hidden",
                        background: "#f4f4f4",
                      }}
                    >
                      {Array.isArray(o.images) && o.images.length > 0 ? (
                        <Box
                          component="img"
                          src={o.images[0]}
                          alt={t("objects.thumbAlt")}
                          sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            transition: "transform 0.4s ease",
                          }}
                        />
                      ) : (
                        <PhotoCamera sx={{ color: "#bbb", fontSize: 26 }} />
                      )}
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography sx={{ fontWeight: 650, wordBreak: "break-word", mb: 0.4 }}>
                        {getPrimaryField(o)}
                      </Typography>
                      {secondaryFields.length > 0 && (
                        <Typography variant="body2" color="text.secondary" sx={{ wordBreak: "break-word" }}>
                          {secondaryFields.join(" • ")}
                        </Typography>
                      )}
                    </Box>
                    <Box
                      className="row-actions"
                      onClick={(e) => e.stopPropagation()}
                      sx={{
                        display: "flex",
                        gap: 0.5,
                        opacity: { xs: 1, md: 0.72 },
                        transition: "opacity 0.2s ease",
                        flexShrink: 0,
                      }}
                    >
                      <Tooltip title={t("objects.view")}>
                        <IconButton
                          aria-label={t("objects.view")}
                          size="small"
                          onClick={() => openView(o)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {canEdit && (
                        <>
                          <Tooltip title={t("objects.edit")}>
                            <IconButton
                              aria-label={t("objects.edit")}
                              size="small"
                              onClick={() => handleEdit(o)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t("objects.delete")}>
                            <IconButton
                              aria-label={t("objects.delete")}
                              size="small"
                              color="error"
                              onClick={() => requestDelete(o)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}

        {filtered.length > 0 && (
          <Box
            sx={{
              mt: 3,
              mb: { xs: 8, md: 0 },
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
              gap: 2,
              px: 1,
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
              {t("objects.showing", {
                start: (page - 1) * itemsPerPage + 1,
                end: Math.min(page * itemsPerPage, filtered.length),
                total: filtered.length,
              })}
            </Typography>
            {totalPages > 1 && (
              <Pagination
                count={totalPages}
                page={page}
                onChange={(event, value) => setPage(value)}
                color="primary"
                size="medium"
                siblingCount={0}
                boundaryCount={1}
                showFirstButton
                showLastButton
                sx={{
                  "& .MuiPagination-ul": { flexWrap: "wrap", justifyContent: "center" },
                }}
              />
            )}
          </Box>
        )}

        <Dialog
          open={Boolean(viewObj)}
          onClose={() => setViewObj(null)}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
        >
          {viewObj && (
            <>
              <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, pr: 1.5 }}>
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    {t("objects.viewObject")}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                    {getPrimaryField(viewObj)}
                  </Typography>
                </Box>
                <IconButton aria-label={t("objects.close")} onClick={() => setViewObj(null)}>
                  <CloseIcon />
                </IconButton>
              </DialogTitle>
              <DialogContent dividers>
                {Array.isArray(viewObj.images) && viewObj.images.length > 0 && (
                  <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
                    {viewObj.images.map((img, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          width: 140,
                          height: 140,
                          maxWidth: "100%",
                          borderRadius: 2,
                          overflow: "hidden",
                          border: "1px solid #eee",
                          transition: "transform 0.3s ease, box-shadow 0.3s ease",
                          "@media (hover: hover)": {
                            "&:hover": {
                              transform: "translateY(-3px)",
                              boxShadow: "0 12px 24px rgba(48,46,47,0.16)",
                            },
                            "&:hover img": { transform: "scale(1.07)" },
                          },
                        }}
                      >
                        <Box
                          component="img"
                          src={img}
                          alt={t("objects.objectAlt")}
                          sx={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s ease" }}
                        />
                      </Box>
                    ))}
                  </Box>
                )}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    gap: 1.5,
                  }}
                >
                  {viewFields.map((fieldName) => {
                    const value = viewObj[fieldName];
                    const isEmpty = !value || String(value).trim() === "";
                    const isLongText =
                      fieldName.toLowerCase().includes("content") ||
                      fieldName.toLowerCase().includes("link") ||
                      fieldName.toLowerCase().includes("reference") ||
                      fieldName.toLowerCase().includes("transliter");
                    return (
                      <Paper
                        key={fieldName}
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          gridColumn: isLongText ? "1 / -1" : "auto",
                          backgroundColor: "#fafafa",
                        }}
                      >
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                          {formatFieldLabel(fieldName)}
                        </Typography>
                        <Typography
                          sx={{
                            wordBreak: isLongText ? "break-all" : "break-word",
                            fontStyle: isEmpty ? "italic" : "normal",
                            color: isEmpty ? "text.secondary" : "text.primary",
                          }}
                        >
                          {isEmpty ? t("objects.empty") : String(value)}
                        </Typography>
                      </Paper>
                    );
                  })}
                </Box>
              </DialogContent>
              <DialogActions sx={{ px: 3, py: 2, gap: 1, flexWrap: "wrap" }}>
                {canEdit && (
                  <>
                    <Button
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => requestDelete(viewObj)}
                    >
                      {t("objects.delete")}
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => handleEdit(viewObj)}
                    >
                      {t("objects.edit")}
                    </Button>
                  </>
                )}
                <Button variant="contained" onClick={() => setViewObj(null)}>
                  {t("objects.close")}
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        <Dialog
          open={showForm}
          onClose={() => {
            if (!uploading) {
              setShowForm(false);
              setEditId(null);
              setImages([]);
            }
          }}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
        >
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
        </Dialog>

        <Dialog
          open={Boolean(deleteTarget)}
          onClose={() => !deleting && setDeleteTarget(null)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>{t("objects.deleteConfirmTitle")}</DialogTitle>
          <DialogContent>
            <Typography>
              {t("objects.deleteConfirmBody", {
                name: deleteTarget ? getPrimaryField(deleteTarget) : "",
              })}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
              {t("form.cancel")}
            </Button>
            <Button
              color="error"
              variant="contained"
              onClick={confirmDelete}
              disabled={deleting}
              startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
            >
              {deleting ? t("objects.deleting") : t("objects.delete")}
            </Button>
          </DialogActions>
        </Dialog>

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

        <CSVManager
          ref={csvManagerRef}
          objects={filtered}
          onImportSuccess={(message) => setSnack({ open: true, msg: message, severity: "success" })}
          onError={(message) => setSnack({ open: true, msg: message, severity: "error" })}
          user={user}
        />
      </Container>
    </Box>
  );
}

export default ObjectsPage;
