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

  // Use fieldOrder if provided, otherwise use empty array (will be handled by parent)
  const currentFieldOrder = fieldOrder || [];

  // Function to get user-friendly field labels dynamically
  const getFieldLabel = (fieldName) => {
    if (!fieldName) return '';
    
    // Convert camelCase or snake_case to Title Case
    return fieldName
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/[_-]/g, ' ') // Replace underscores and hyphens with spaces
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .trim();
  };

  // Function to get field placeholder dynamically
  const getFieldPlaceholder = (fieldName) => {
    if (!fieldName) return '';
    
    const lowerField = fieldName.toLowerCase();
    
    // Generate smart placeholders based on field name patterns
    if (lowerField.includes('no') || lowerField.includes('number') || lowerField.includes('id')) {
      return 'e.g., 1029, A001';
    }
    if (lowerField.includes('name') || lowerField.includes('title')) {
      return 'e.g., Object name or title';
    }
    if (lowerField.includes('type') || lowerField.includes('category')) {
      return 'e.g., Category or type';
    }
    if (lowerField.includes('date') || lowerField.includes('period')) {
      return 'e.g., Date or period';
    }
    if (lowerField.includes('location') || lowerField.includes('place')) {
      return 'e.g., Location or place';
    }
    if (lowerField.includes('link') || lowerField.includes('url')) {
      return 'e.g., https://example.com';
    }
    if (lowerField.includes('content') || lowerField.includes('description') || lowerField.includes('note')) {
      return 'e.g., Description or notes';
    }
    if (lowerField.includes('reference') || lowerField.includes('source')) {
      return 'e.g., References or sources';
    }
    
    // Default placeholder
    return `Enter ${getFieldLabel(fieldName).toLowerCase()}`;
  };

  // Function to determine if field should be multiline based on field name patterns
  const isMultilineField = (fieldName) => {
    if (!fieldName) return false;
    const lowerField = fieldName.toLowerCase();
    return lowerField.includes('content') ||
           lowerField.includes('description') ||
           lowerField.includes('note') ||
           lowerField.includes('comment') ||
           lowerField.includes('link') ||
           lowerField.includes('reference') ||
           lowerField.includes('transliter') ||
           lowerField.includes('text');
  };

  // Function to determine if field is required based on position and name patterns
  const isRequiredField = (fieldName) => {
    if (!fieldName || currentFieldOrder.length === 0) return false;
    const lowerField = fieldName.toLowerCase();
    
    // First field is usually important (ID/number)
    if (fieldName === currentFieldOrder[0]) return true;
    
    // Name/title fields are typically required
    return lowerField.includes('name') || 
           lowerField.includes('title') ||
           (currentFieldOrder.length > 1 && fieldName === currentFieldOrder[1]); // Second field often important
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

      let instruction = "You are an expert analyst. Analyze the following data entry and provide insights, suggestions, or highlight any inconsistencies or missing information. Be concise and factual.";
      if (filteredImages.length > 0) {
        instruction +=
          " For each image provided, describe the image in detail and provide any insights or analysis you can about the depicted content.";
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
        {currentFieldOrder.length > 0 ? (
          currentFieldOrder.map((fieldName) => (
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
              type="text"
            />
          ))
        ) : (
          <Typography color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 2 }}>
            No field configuration available. Please import a CSV file to set up the form fields.
          </Typography>
        )}
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
