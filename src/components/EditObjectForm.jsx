import React, { useState } from "react";
import { ref, deleteObject } from "firebase/storage";
import { storage } from "../firebase";
import { Box, Typography, TextField, IconButton, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import DeleteIcon from "@mui/icons-material/Delete";

function EditObjectForm({ form, setForm, editId, handleAdd, setShowForm, setEditId, images, setImages, uploading, readOnly, fieldOrder }) {
  // --- OpenAI analysis state ---
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiResult, setAiResult] = useState("");

  // Use fieldOrder if provided, otherwise fallback to default fields
  const currentFieldOrder = fieldOrder || [
    "no", "name", "type", "museographicIndex", "astronomicalType", 
    "astronomicalUse", "dating", "findingLocalization", "actualLocation", 
    "content", "links", "stateOfPreservation", "references", "transliterations"
  ];

  // Function to get user-friendly field labels
  const getFieldLabel = (fieldName) => {
    const labelMap = {
      "no": "No.",
      "name": "Name of Object",
      "type": "Type of Object", 
      "museographicIndex": "Museographic Index",
      "astronomicalType": "Astronomical Type",
      "astronomicalUse": "Use (Astronomical, Cosmographic, Ritual, etc…)",
      "dating": "Dating",
      "findingLocalization": "Finding Localization",
      "actualLocation": "Actual Location",
      "content": "Content",
      "links": "Links",
      "stateOfPreservation": "State of Preservation",
      "references": "References",
      "transliterations": "Transliteration(s)",
      // Handle CSV field names that might be different
      "No": "No.",
      "Name of Object": "Name of Object",
      "Type of Object": "Type of Object",
      "Museographic index": "Museographic Index",
      "Astronomical type": "Astronomical Type",
      "Astronomical use": "Astronomical Use",
      "Dating": "Dating",
      "Finding localization": "Finding Localization",
      "Actual location": "Actual Location",
      "Content": "Content",
      "Links": "Links",
      "State of preservation": "State of Preservation",
      "References": "References",
      "Transliterration(s)": "Transliteration(s)",
    };
    return labelMap[fieldName] || fieldName;
  };

  // Function to get field placeholder
  const getFieldPlaceholder = (fieldName) => {
    const placeholderMap = {
      "no": "e.g., 1029",
      "name": "e.g., Ram's head, Ichneumon, Pectoral",
      "type": "e.g., Statue, Pectoral",
      "museographicIndex": "e.g., 1029, 1062, 2021",
      "astronomicalType": "e.g., Amun-Ra, Incarnation of Atum, Sun rising",
      "astronomicalUse": "e.g., Ritual, Symbolism",
      "dating": "e.g., 20th dynasty, Late period, 19th dynasty?",
      "findingLocalization": "e.g., Unknown",
      "actualLocation": "e.g., Kunsthistorisches Museum Vienna",
      "content": "e.g., Description, notes",
      "links": "e.g., https://globalegyptianmuseum.org/detail.aspx?id=4531",
      "stateOfPreservation": "e.g., good, damaged",
      "references": "e.g., Bibliography, museum records",
      "transliterations": "e.g., Hieroglyphic, Demotic, Coptic",
      // Handle CSV variations
      "No": "e.g., 1029",
      "Name of Object": "e.g., Ram's head, Ichneumon, Pectoral",
      "Type of Object": "e.g., Statue, Pectoral",
      "Museographic index": "e.g., 1029, 1062, 2021",
      "Astronomical type": "e.g., Amun-Ra, Incarnation of Atum",
      "Astronomical use": "e.g., Ritual, Symbolism",
      "Dating": "e.g., 20th dynasty, Late period",
      "Finding localization": "e.g., Unknown",
      "Actual location": "e.g., Museum name",
      "Content": "e.g., Description, notes",
      "Links": "e.g., https://example.com",
      "State of preservation": "e.g., good, damaged",
      "References": "e.g., Bibliography",
      "Transliterration(s)": "e.g., Hieroglyphic text",
    };
    return placeholderMap[fieldName] || "";
  };

  // Function to determine if field should be multiline
  const isMultilineField = (fieldName) => {
    return ["content", "links", "references", "transliterations"].includes(fieldName.toLowerCase()) ||
           fieldName.toLowerCase().includes("content") ||
           fieldName.toLowerCase().includes("links") ||
           fieldName.toLowerCase().includes("references") ||
           fieldName.toLowerCase().includes("transliter");
  };

  // Function to determine if field is required
  const isRequiredField = (fieldName) => {
    return fieldName.toLowerCase().includes('name') || 
           fieldName.toLowerCase().includes('title') ||
           fieldName === currentFieldOrder[1]; // second field is usually important
  };

  const importantFields = currentFieldOrder.map(fieldName => ({
    label: getFieldLabel(fieldName),
    value: form[fieldName] || ""
  })).filter(f => f.value && String(f.value).trim());

  // Helper to convert File/Blob to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]); // remove data:*/*;base64,
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Helper to fetch remote image and convert to base64
  const urlToBase64 = async (url) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      return await fileToBase64(blob);
    } catch {
      return null;
    }
  };

  const handleAnalyze = async () => {
    setAiOpen(true);
    setAiLoading(true);
    setAiError("");
    setAiResult("");
    try {
      // Prepare up to 3 images as base64 (including Firebase Storage URLs)
      const base64Images = await Promise.all(
        images.slice(0, 3).map(async (img) => {
          if (img.file) {
            return await fileToBase64(img.file);
          } else if (img.url && img.url.startsWith("data:")) {
            // Already base64
            return img.url.split(",")[1];
          } else if (img.url) {
            // Fetch remote image and convert
            return await urlToBase64(img.url);
          } else if (typeof img === 'string') {
            // If just a string URL
            return await urlToBase64(img);
          } else {
            return null;
          }
        })
      );
      const filteredImages = base64Images.filter(Boolean);

      const imageUrls = images
        .map(img => (typeof img === 'string' ? img : img.url))
        .filter(Boolean);

      let instruction = "You are an expert Egyptologist. Analyze the following object entry and provide insights, suggestions, or highlight any inconsistencies or missing information. Be concise and factual.";
      if (filteredImages.length > 0) {
        instruction +=
          " For each image provided, attempt to read any hieroglyphs, describe the image in detail, and provide any insights or analysis you can about the depicted object(s).";
      }

      // Only include image URLs in aiInput if there are no images being sent
      const aiInput = importantFields
        .filter(f => f.value && String(f.value).trim())
        .map(f => `${f.label}: ${f.value}`)
        .join("\n") +
        (imageUrls.length > 0 && filteredImages.length === 0
          ? "\nImage URLs:\n" + imageUrls.map((url, i) => `Image ${i + 1}: ${url}`).join("\n")
          : "");

      const res = await fetch("https://us-central1-dcsaeat.cloudfunctions.net/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instruction,
          input: aiInput,
          model: "gpt-4o",
          images: filteredImages.length > 0 ? filteredImages : undefined
        })
      });
      if (!res.ok) throw new Error(await res.text() || `HTTP ${res.status}`);
      const data = await res.json();
      setAiResult(data.answer || "No answer returned.");
    } catch (err) {
      setAiError(err.message || "Request failed");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'rgb(204, 255, 255)' }}>
    <Box sx={{ mb: 4, p: 2, border: '1px solid #eee', borderRadius: 2, background: 'rgb(204, 255, 255)' }}>
      <Typography variant="h6" gutterBottom>
        {readOnly ? "View Object" : (editId ? "Edit Object" : "Add New Object")}
      </Typography>
      <Box component="form" sx={{ display: 'grid', gap: 2 }}>
        {/* AI Analysis Button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button variant="outlined" onClick={handleAnalyze} disabled={aiLoading}>
            {aiLoading ? "Analyzing..." : "Analyze with AI"}
          </Button>
        </Box>
        {/* Dynamic form fields based on field order */}
        {currentFieldOrder.map((fieldName) => (
          <TextField
            key={fieldName}
            label={getFieldLabel(fieldName)}
            value={form[fieldName] || ""}
            onChange={e => setForm(f => ({ ...f, [fieldName]: e.target.value }))}
            placeholder={getFieldPlaceholder(fieldName)}
            multiline={isMultilineField(fieldName)}
            minRows={isMultilineField(fieldName) ? 2 : undefined}
            required={isRequiredField(fieldName)}
            size="small"
            disabled={readOnly}
            InputProps={readOnly ? { readOnly: true } : {}}
            type={fieldName.toLowerCase().includes('no') ? "text" : "text"}
          />
        ))}
        {/* Image section */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Images (up to 3)</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            {images.map((img, idx) => (
              <Box key={idx} sx={{ position: 'relative', width: 80, height: 80, border: '1px solid #ccc', borderRadius: 2, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
                <img src={img.url || img} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {!readOnly && (
                  <IconButton
                    size="small"
                    sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'rgba(255,255,255,0.7)' }}
                    onClick={async () => {
                      const imgToDelete = images[idx];
                      if (imgToDelete.url && !imgToDelete.file) {
                        try {
                          const matches = imgToDelete.url.match(/\/o\/([^?]+)/);
                          const path = matches ? decodeURIComponent(matches[1]) : null;
                          if (path) {
                            await deleteObject(ref(storage, path));
                          }
                        } catch (err) {
                          console.warn("Failed to delete image from storage", err);
                        }
                      }
                      setImages(imgs => imgs.filter((_, i) => i !== idx));
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            ))}
            {!readOnly && images.length < 3 && (
              <Box sx={{ width: 80, height: 80, border: '1px dashed #aaa', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#f5f5f5', position: 'relative' }}>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ opacity: 0, width: '100%', height: '100%', position: 'absolute', left: 0, top: 0, cursor: 'pointer' }}
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const url = URL.createObjectURL(file);
                    setImages(imgs => [...imgs, { url, file }]);
                    e.target.value = "";
                  }}
                />
                <PhotoCamera fontSize="large" color="action" />
              </Box>
            )}
          </Box>
          {uploading && !readOnly && <Typography color="text.secondary" fontSize={12}>Uploading images...</Typography>}
        </Box>
        {/* End image section */}
        {/* AI Analysis Result Dialog */}
        {aiOpen && (
          <Box sx={{ mt: 2, p: 2, border: '1px solid #1976d2', borderRadius: 2, background: '#f0f7ff', position: 'relative' }}>
            <Button size="small" onClick={() => setAiOpen(false)} sx={{ position: 'absolute', top: 8, right: 8, minWidth: 0, p: 0.5 }}>
              <CloseIcon fontSize="small" />
            </Button>
            <Typography variant="subtitle1" sx={{ mb: 1, color: '#1976d2' }}>AI Analysis</Typography>
            {aiLoading && <Typography>Analyzing...</Typography>}
            {aiError && <Typography color="error">{aiError}</Typography>}
            {!aiLoading && !aiError && (
              <Typography sx={{ whiteSpace: 'pre-line' }}>{aiResult}</Typography>
            )}
          </Box>
        )}
        {!readOnly && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" startIcon={editId ? <SaveIcon /> : <AddIcon />} onClick={handleAdd} disabled={uploading}>
              {editId ? "Update" : "Save"}
            </Button>
            <Button variant="outlined" startIcon={<CloseIcon />} onClick={() => { setShowForm(false); setEditId(null); setImages([]); }} disabled={uploading}>
              Cancel
            </Button>
          </Box>
        )}
      </Box>
    </Box>
    </div>
  );
}

export default EditObjectForm;
