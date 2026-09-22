import React, { useState } from "react";
import { ref, deleteObject } from "firebase/storage";
import { storage } from "../firebase";
import { Box, Typography, TextField, IconButton, Button, Divider } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import DeleteIcon from "@mui/icons-material/Delete";
import { useI18n } from "../i18n/I18nContext";

function EditObjectForm({ form, setForm, editId, handleAdd, setShowForm, setEditId, images, setImages, uploading, readOnly, fieldOrder }) {
  const { t } = useI18n();
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiResult, setAiResult] = useState("");

  const currentFieldOrder = fieldOrder || [];

  const getFieldLabel = (fieldName) => {
    if (!fieldName) return "";

    return fieldName
      .replace(/([A-Z])/g, " $1")
      .replace(/[_-]/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ")
      .trim();
  };

  const getFieldPlaceholder = (fieldName) => {
    if (!fieldName) return "";

    const lowerField = fieldName.toLowerCase();

    if (lowerField.includes("no") || lowerField.includes("number") || lowerField.includes("id")) {
      return t("form.placeholderNumber");
    }
    if (lowerField.includes("name") || lowerField.includes("title")) {
      return t("form.placeholderName");
    }
    if (lowerField.includes("type") || lowerField.includes("category")) {
      return t("form.placeholderType");
    }
    if (lowerField.includes("date") || lowerField.includes("period")) {
      return t("form.placeholderDate");
    }
    if (lowerField.includes("location") || lowerField.includes("place")) {
      return t("form.placeholderLocation");
    }
    if (lowerField.includes("link") || lowerField.includes("url")) {
      return t("form.placeholderUrl");
    }
    if (lowerField.includes("content") || lowerField.includes("description") || lowerField.includes("note")) {
      return t("form.placeholderDescription");
    }
    if (lowerField.includes("reference") || lowerField.includes("source")) {
      return t("form.placeholderReference");
    }

    return t("form.placeholderEnter", { field: getFieldLabel(fieldName).toLowerCase() });
  };

  const isMultilineField = (fieldName) => {
    if (!fieldName) return false;
    const lowerField = fieldName.toLowerCase();
    return (
      lowerField.includes("content") ||
      lowerField.includes("description") ||
      lowerField.includes("note") ||
      lowerField.includes("comment") ||
      lowerField.includes("link") ||
      lowerField.includes("reference") ||
      lowerField.includes("transliter") ||
      lowerField.includes("text")
    );
  };

  const isRequiredField = (fieldName) => {
    if (!fieldName || currentFieldOrder.length === 0) return false;
    const lowerField = fieldName.toLowerCase();

    if (fieldName === currentFieldOrder[0]) return true;

    return (
      lowerField.includes("name") ||
      lowerField.includes("title") ||
      (currentFieldOrder.length > 1 && fieldName === currentFieldOrder[1])
    );
  };

  const importantFields = currentFieldOrder
    .map((fieldName) => ({
      label: getFieldLabel(fieldName),
      value: form[fieldName] || "",
    }))
    .filter((f) => f.value && String(f.value).trim());

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

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
      const base64Images = await Promise.all(
        images.slice(0, 3).map(async (img) => {
          if (img.file) {
            return await fileToBase64(img.file);
          } else if (img.url && img.url.startsWith("data:")) {
            return img.url.split(",")[1];
          } else if (img.url) {
            return await urlToBase64(img.url);
          } else if (typeof img === "string") {
            return await urlToBase64(img);
          } else {
            return null;
          }
        })
      );
      const filteredImages = base64Images.filter(Boolean);

      const imageUrls = images
        .map((img) => (typeof img === "string" ? img : img.url))
        .filter(Boolean);

      let instruction =
        "You are an expert analyst. Analyze the following data entry and provide insights, suggestions, or highlight any inconsistencies or missing information. Be concise and factual.";
      if (filteredImages.length > 0) {
        instruction +=
          " For each image provided, describe the image in detail and provide any insights or analysis you can about the depicted content.";
      }

      const aiInput =
        importantFields
          .filter((f) => f.value && String(f.value).trim())
          .map((f) => `${f.label}: ${f.value}`)
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
          images: filteredImages.length > 0 ? filteredImages : undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`);
      const data = await res.json();
      setAiResult(data.answer || t("form.noAnswer"));
    } catch (err) {
      setAiError(err.message || t("form.requestFailed"));
    } finally {
      setAiLoading(false);
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditId(null);
    setImages([]);
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          mb: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {readOnly ? t("form.viewObject") : editId ? t("form.editObject") : t("form.addNewObject")}
        </Typography>
        <IconButton aria-label={t("form.cancel")} onClick={closeForm} disabled={uploading}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider sx={{ mb: 2.5 }} />

      <Box component="form" sx={{ display: "grid", gap: 2 }}>
        <Box sx={{ display: "flex", justifyContent: { xs: "stretch", sm: "flex-end" } }}>
          <Button
            variant="outlined"
            onClick={handleAnalyze}
            disabled={aiLoading}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            {aiLoading ? t("form.analyzing") : t("form.analyzeWithAi")}
          </Button>
        </Box>

        {currentFieldOrder.length > 0 ? (
          currentFieldOrder.map((fieldName) => (
            <TextField
              key={fieldName}
              label={getFieldLabel(fieldName)}
              value={form[fieldName] || ""}
              onChange={(e) => setForm((f) => ({ ...f, [fieldName]: e.target.value }))}
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
          <Typography color="text.secondary" sx={{ fontStyle: "italic", textAlign: "center", py: 2 }}>
            {t("form.noFieldConfig")}
          </Typography>
        )}

        <Box sx={{ mt: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            {t("form.images")}
          </Typography>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
            {images.map((img, idx) => (
              <Box
                key={idx}
                sx={{
                  position: "relative",
                  width: 96,
                  height: 96,
                  border: "1px solid rgba(48,46,47,0.12)",
                  borderRadius: 2,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#fafafa",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  "@media (hover: hover)": {
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 10px 22px rgba(48,46,47,0.14)",
                    },
                    "&:hover img": { transform: "scale(1.08)" },
                    "&:hover .image-delete": { opacity: 1 },
                  },
                }}
              >
                <Box
                  component="img"
                  src={img.url || img}
                  alt={t("form.preview")}
                  sx={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s ease" }}
                />
                {!readOnly && (
                  <IconButton
                    className="image-delete"
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      bgcolor: "rgba(255,255,255,0.9)",
                      opacity: { xs: 1, md: 0.85 },
                      "&:hover": { bgcolor: "error.light", color: "error.contrastText" },
                    }}
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
                      setImages((imgs) => imgs.filter((_, i) => i !== idx));
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            ))}
            {!readOnly && images.length < 3 && (
              <Box
                sx={{
                  width: 96,
                  height: 96,
                  border: "1px dashed #aaa",
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  background: "#f5f5f5",
                  position: "relative",
                  transition: "border-color 0.2s ease, background 0.2s ease",
                  "@media (hover: hover)": {
                    "&:hover": {
                      borderColor: "primary.main",
                      background: "rgba(48,46,47,0.04)",
                    },
                  },
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{
                    opacity: 0,
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                    left: 0,
                    top: 0,
                    cursor: "pointer",
                  }}
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const url = URL.createObjectURL(file);
                    setImages((imgs) => [...imgs, { url, file }]);
                    e.target.value = "";
                  }}
                />
                <PhotoCamera fontSize="large" color="action" />
              </Box>
            )}
          </Box>
          {uploading && !readOnly && (
            <Typography color="text.secondary" fontSize={12} sx={{ mt: 1 }}>
              {t("form.uploading")}
            </Typography>
          )}
        </Box>

        {aiOpen && (
          <Box
            sx={{
              mt: 1,
              p: 2,
              border: "1px solid #1976d2",
              borderRadius: 2,
              background: "#f0f7ff",
              position: "relative",
            }}
          >
            <Button
              size="small"
              onClick={() => setAiOpen(false)}
              sx={{ position: "absolute", top: 8, right: 8, minWidth: 0, p: 0.5 }}
            >
              <CloseIcon fontSize="small" />
            </Button>
            <Typography variant="subtitle1" sx={{ mb: 1, color: "#1976d2" }}>
              {t("form.aiAnalysis")}
            </Typography>
            {aiLoading && <Typography>{t("form.analyzing")}</Typography>}
            {aiError && <Typography color="error">{aiError}</Typography>}
            {!aiLoading && !aiError && (
              <Typography sx={{ whiteSpace: "pre-line", wordBreak: "break-word", pr: 4 }}>
                {aiResult}
              </Typography>
            )}
          </Box>
        )}

        {!readOnly && (
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", pt: 1 }}>
            <Button
              variant="contained"
              startIcon={editId ? <SaveIcon /> : <AddIcon />}
              onClick={handleAdd}
              disabled={uploading}
              sx={{ flex: { xs: "1 1 140px", sm: "0 0 auto" } }}
            >
              {editId ? t("form.update") : t("form.save")}
            </Button>
            <Button
              variant="outlined"
              startIcon={<CloseIcon />}
              onClick={closeForm}
              disabled={uploading}
              sx={{ flex: { xs: "1 1 140px", sm: "0 0 auto" } }}
            >
              {t("form.cancel")}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default EditObjectForm;
