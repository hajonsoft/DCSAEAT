import React from "react";
import { ref, deleteObject } from "firebase/storage";
import { storage } from "../firebase";
import { Box, Typography, TextField, IconButton, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import DeleteIcon from "@mui/icons-material/Delete";

function EditObjectForm({ form, setForm, editId, handleAdd, setShowForm, setEditId, images, setImages, uploading }) {
  return (
    <Box sx={{ mb: 4, p: 2, border: '1px solid #eee', borderRadius: 2, background: '#fafafa' }}>
      <Typography variant="h6" gutterBottom>{editId ? "Edit Object" : "Add New Object"}</Typography>
      <Box component="form" sx={{ display: 'grid', gap: 2 }}>
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
        {/* Image upload section */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Images (up to 3)</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            {images.map((img, idx) => (
              <Box key={idx} sx={{ position: 'relative', width: 80, height: 80, border: '1px solid #ccc', borderRadius: 2, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
                <img src={img.url || img} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <IconButton
                  size="small"
                  sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'rgba(255,255,255,0.7)' }}
                  onClick={async () => {
                    const imgToDelete = images[idx];
                    // If the image has a url and no file, it's an existing image in storage
                    if (imgToDelete.url && !imgToDelete.file) {
                      try {
                        const matches = imgToDelete.url.match(/\/o\/([^?]+)/);
                        const path = matches ? decodeURIComponent(matches[1]) : null;
                        if (path) {
                          await deleteObject(ref(storage, path));
                        }
                      } catch (err) {
                        // Ignore errors for missing files
                        console.warn("Failed to delete image from storage", err);
                      }
                    }
                    setImages(imgs => imgs.filter((_, i) => i !== idx));
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
            {images.length < 3 && (
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
          {uploading && <Typography color="text.secondary" fontSize={12}>Uploading images...</Typography>}
        </Box>
        {/* End image upload section */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" startIcon={editId ? <SaveIcon /> : <AddIcon />} onClick={handleAdd} disabled={uploading}>
            {editId ? "Update" : "Save"}
          </Button>
          <Button variant="outlined" startIcon={<CloseIcon />} onClick={() => { setShowForm(false); setEditId(null); setImages([]); }} disabled={uploading}>
            Cancel
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default EditObjectForm;
