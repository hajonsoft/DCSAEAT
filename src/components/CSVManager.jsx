import React, { useState, useMemo, forwardRef, useImperativeHandle, useCallback } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Alert,
  Chip,
  IconButton,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Close as CloseIcon } from "@mui/icons-material";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useI18n } from "../i18n/I18nContext";

const CSVManager = forwardRef(({ objects, user, onImportSuccess, onError }, ref) => {
  const { t } = useI18n();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [csvData, setCsvData] = useState(null);
  const [csvFields, setCsvFields] = useState([]);
  const [importing, setImporting] = useState(false);
  const [rawCsvText, setRawCsvText] = useState(""); // Store the raw CSV text
  const [filterableFields, setFilterableFields] = useState([]); // Store which fields should be filterable
  const [searchableFields, setSearchableFields] = useState([]); // Store which fields should be searchable

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    handleImport,
    handleExport,
  }));

  // Detect CSV delimiter (comma or semicolon)
  const detectDelimiter = (csvText) => {
    const firstLine = csvText.split('\n')[0];
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    
    console.log('Delimiter detection - Commas:', commaCount, 'Semicolons:', semicolonCount);
    return semicolonCount > commaCount ? ';' : ',';
  };

  // Parse CSV row with detected delimiter
  const parseCsvRow = (line, delimiter) => {
    if (delimiter === ',') {
      // Original comma parsing with quote handling
      return line
        .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
        .map((cell) => cell.replace(/^"|"$/g, "").replace(/""/g, '"'));
    } else {
      // Semicolon parsing - simpler since semicolons are less likely to appear in quoted text
      return line.split(';').map((cell) => cell.trim());
    }
  };

  // Handle import trigger from parent
  const handleImport = (event) => {
    handleFileSelect(event);
  };

  // Handle export trigger from parent
  const handleExport = () => {
    if (!objects.length) {
      if (onError) onError(t("csv.noObjectsExport"));
      return;
    }

    // Use CSV header order if available, otherwise get field names from objects
    const fields = csvFields && csvFields.length > 0 ? csvFields : getFieldNames();
    console.log('Exporting with field order:', fields);
    const csvRows = [fields.join(",")];
    
    objects.forEach((obj) => {
      const row = fields.map((f) => {
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

    // Get field names from existing objects or use default fallback
  const getFieldNames = useCallback(() => {
    // If we have CSV data, use the CSV header order
    if (csvFields && csvFields.length > 0) {
      return csvFields;
    }
    
    // Check if any existing objects have stored field order
    if (objects.length > 0) {
      // Look for an object with stored field order
      const objectWithOrder = objects.find(obj => obj._fieldOrder && Array.isArray(obj._fieldOrder));
      if (objectWithOrder) {
        console.log('Using stored field order from existing object:', objectWithOrder._fieldOrder);
        return objectWithOrder._fieldOrder;
      }
      
      // Fallback: get field names from existing objects in a consistent order
      const fieldSet = new Set();
      objects.forEach((obj) => {
        Object.keys(obj).forEach((key) => {
          // Exclude Firebase metadata fields and our custom metadata
          if (!key.startsWith("_") && key !== "id" && key !== "createdAt" && key !== "createdBy") {
            fieldSet.add(key);
          }
        });
      });
      return Array.from(fieldSet).sort();
    }
    
    // No default fallback - return empty array if no existing data
    return [];
  }, [objects, csvFields]);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      setRawCsvText(text); // Store the raw CSV text for import
      const lines = text.split(/\r?\n/).filter(Boolean);
      
      if (lines.length < 2) {
        if (onError) onError(t("csv.headerRequired"));
        return;
      }

      // Detect delimiter and parse CSV headers from first line
      const delimiter = detectDelimiter(text);
      console.log('Using delimiter:', delimiter);
      const headers = parseCsvRow(lines[0], delimiter).map(cell => cell.trim());

      // Parse data rows (limit to first 5 for preview)
      const dataRows = lines.slice(1, 6).map((line) => parseCsvRow(line, delimiter));

      setCsvFields(headers);
      setCsvData({ headers, dataRows, totalRows: lines.length - 1, delimiter });
      setShowImportDialog(true);
    } catch (error) {
      console.error("Error reading CSV file:", error);
      if (onError) onError(t("csv.readError"));
    }

    // Reset file input
    event.target.value = "";
  };

  const handleImportFromDialog = async () => {
    if (!csvData || !rawCsvText) {
      if (onError) onError(t("csv.noData"));
      return;
    }

    console.log("Starting CSV import...");
    console.log("User:", user);
    console.log("CSV Data:", csvData);
    console.log("CSV Fields:", csvFields);

    setImporting(true);
    const errors = [];
    let importedCount = 0;
    let skippedCount = 0;

    try {
      // Check if user is authenticated and has proper permissions
      if (!user?.uid) {
        console.error("User not authenticated:", user);
        if (onError) onError(t("csv.mustLogin"));
        setImporting(false);
        return;
      }

      // Check if user has superadmin role for import
      const userRole = user?.role || "";
      console.log("User role:", userRole);
      if (userRole !== "superadmin") {
        console.error("Insufficient permissions. User role:", userRole);
        if (onError) onError(t("csv.superadminOnly"));
        setImporting(false);
        return;
      }

      const lines = rawCsvText.split(/\r?\n/).filter(Boolean);
      const headers = csvFields;
      const delimiter = csvData.delimiter || detectDelimiter(rawCsvText);
      console.log("Processing", lines.length - 1, "data rows with headers:", headers);
      console.log("Using delimiter:", delimiter);
      console.log("Expected field count:", headers.length);
      console.log("Filterable fields:", filterableFields.length, filterableFields);
      console.log("Searchable fields:", searchableFields.length, searchableFields);

      // Validate field configurations
      if (filterableFields.some(field => !headers.includes(field))) {
        console.warn("Some filterable fields not found in CSV headers");
      }
      if (searchableFields.some(field => !headers.includes(field))) {
        console.warn("Some searchable fields not found in CSV headers");
      }

      let totalRows = 0;
      let processedRows = 0;
      let emptyRowCount = 0;
      let missingNameCount = 0;

      for (let i = 1; i < lines.length; i++) {
        totalRows++;
        try {
          const row = parseCsvRow(lines[i], delimiter);
          processedRows++;

          // For rows with fewer fields than headers, pad with empty strings
          while (row.length < headers.length) {
            row.push("");
          }
          
          // For rows with more fields than headers, truncate to header count
          if (row.length > headers.length) {
            row.splice(headers.length);
          }

          // Skip rows where all fields are empty
          if (row.every((cell) => !cell.trim())) {
            console.log(`❌ Row ${i}: All fields empty`);
            emptyRowCount++;
            skippedCount++;
            continue;
          }

          const obj = {};
          headers.forEach((header, idx) => {
            obj[header] = row[idx] || "";
          });

          // Only require that at least one meaningful field has content
          // Check if we have a name/title or number field with content
          const nameField = headers.find(h => h.toLowerCase().includes('name'));
          const noField = headers.find(h => h.toLowerCase().includes('no'));
          const titleField = headers.find(h => h.toLowerCase().includes('title'));
          
          const hasValidContent = 
            (nameField && obj[nameField] && obj[nameField].trim()) ||
            (noField && obj[noField] && obj[noField].trim()) ||
            (titleField && obj[titleField] && obj[titleField].trim()) ||
            // Or if first field (likely an ID/number) has content
            (headers[0] && obj[headers[0]] && obj[headers[0]].trim());

          if (!hasValidContent) {
            console.log(`❌ Row ${i}: No meaningful content found`);
            missingNameCount++;
            skippedCount++;
            continue;
          }

          console.log(`✅ Row ${i}: Importing successfully`);

          // Create Firestore document with ordered fields and metadata
          const orderedDoc = {};
          // Add fields in CSV header order first
          headers.forEach(header => {
            orderedDoc[header] = obj[header];
          });
          // Add metadata fields including field order and filterable fields
          orderedDoc.createdBy = user.uid;
          orderedDoc.createdAt = serverTimestamp();
          orderedDoc._fieldOrder = headers; // Store original CSV field order
          orderedDoc._filterableFields = filterableFields; // Store filterable fields configuration
          orderedDoc._searchableFields = searchableFields; // Store searchable fields configuration
          
                    // Attempt to add to Firestore
          await addDoc(collection(db, "objects"), orderedDoc);
          importedCount++;
        } catch (rowError) {
          console.error(`Import error for row ${i}:`, rowError);
          errors.push(t("csv.rowError", { row: i, message: rowError.message || t("csv.unknownErrorShort") }));
        }
      }

      console.log(`📊 Import Summary:`);
      console.log(`- Total rows in CSV: ${totalRows}`);
      console.log(`- Rows processed: ${processedRows}`);
      console.log(`- Successfully imported: ${importedCount}`);
      console.log(`- Skipped: ${skippedCount}`);
      console.log(`  - Empty rows: ${emptyRowCount}`);
      console.log(`  - No meaningful content: ${missingNameCount}`);
      console.log(`- Errors: ${errors.length}`);

      // Close dialog and reset state
      setShowImportDialog(false);
      setCsvData(null);
      setCsvFields([]);
      setRawCsvText("");

      // Report results
      if (errors.length > 0) {
        const errorMessage = t("csv.importCompleteErrors", {
          imported: importedCount,
          skipped: skippedCount,
          errors: errors.length,
          details: errors.slice(0, 3).join("; "),
        });
        if (onError) onError(errorMessage);
      } else if (importedCount === 0) {
        if (onError) onError(t("csv.noImported", { skipped: skippedCount }));
      } else {
        const message = skippedCount > 0
          ? t("csv.importCompleteSkipped", { imported: importedCount, skipped: skippedCount })
          : t("csv.importComplete", { imported: importedCount });
        if (onImportSuccess) onImportSuccess(message);
      }
    } catch (error) {
      console.error("Import error:", error);
      let reason = t("csv.unknownError");

      if (error.code === "permission-denied") {
        reason = t("csv.permissionDenied");
      } else if (error.code === "unavailable") {
        reason = t("csv.unavailable");
      } else if (error.message) {
        reason = error.message;
      }

      const errorMessage = t("csv.importFailed", { reason });
      
      if (onError) onError(errorMessage);
    }
    setImporting(false);
  };

  const knownFields = useMemo(() => getFieldNames(), [getFieldNames]);

  return (
    <>
      {/* Import Preview Dialog */}
      <Dialog open={showImportDialog} onClose={() => setShowImportDialog(false)} maxWidth="lg" fullWidth fullScreen={isMobile}>
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {t("csv.importPreview")}
            <IconButton onClick={() => setShowImportDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {csvData && (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                {t("csv.foundRows", { count: csvData.totalRows })}
              </Alert>

              {/* Field Mapping Info */}
              <Typography variant="h6" gutterBottom>
                {t("csv.detectedFields", { count: csvFields.length })}
              </Typography>
              <Box sx={{ mb: 3, display: "flex", flexWrap: "wrap", gap: 1 }}>
                {csvFields.map((field, idx) => (
                  <Chip
                    key={idx}
                    label={field}
                    color={knownFields.includes(field) ? "primary" : "default"}
                    variant={knownFields.includes(field) ? "filled" : "outlined"}
                  />
                ))}
              </Box>

              <Alert severity="info" sx={{ mb: 2 }}>
                {t("csv.fieldOrderNote")}
              </Alert>

              <Alert severity="info" sx={{ mb: 2 }}>
                {t("csv.chipNote")}
              </Alert>

              <Alert severity="success" sx={{ mb: 3 }}>
                {t("csv.fieldConfigNote")}
              </Alert>

              {/* Filterable Fields Selection */}
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                {t("csv.selectFilterable", { count: filterableFields.length })}
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                {t("csv.filterableHelp")}
              </Alert>
              <Box sx={{ mb: 3, display: "flex", flexWrap: "wrap", gap: 1 }}>
                {csvFields.map((field, idx) => (
                  <Chip
                    key={idx}
                    label={field}
                    clickable
                    color={filterableFields.includes(field) ? "primary" : "default"}
                    variant={filterableFields.includes(field) ? "filled" : "outlined"}
                    onClick={() => {
                      setFilterableFields(prev => 
                        prev.includes(field) 
                          ? prev.filter(f => f !== field)
                          : [...prev, field]
                      );
                    }}
                  />
                ))}
              </Box>

              {/* Searchable Fields Selection */}
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                {t("csv.selectSearchable", { count: searchableFields.length })}
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                {t("csv.searchableHelp")}
              </Alert>
              <Box sx={{ mb: 3, display: "flex", flexWrap: "wrap", gap: 1 }}>
                {csvFields.map((field, idx) => (
                  <Chip
                    key={idx}
                    label={field}
                    clickable
                    color={searchableFields.includes(field) ? "secondary" : "default"}
                    variant={searchableFields.includes(field) ? "filled" : "outlined"}
                    onClick={() => {
                      setSearchableFields(prev => 
                        prev.includes(field) 
                          ? prev.filter(f => f !== field)
                          : [...prev, field]
                      );
                    }}
                  />
                ))}
              </Box>

              {/* Data Preview */}
              <Typography variant="h6" gutterBottom>
                {t("csv.dataPreview")}
              </Typography>
              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      {csvData.headers.map((header, idx) => (
                        <TableCell key={idx} sx={{ fontWeight: "bold", bgcolor: "grey.100" }}>
                          {header}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {csvData.dataRows.map((row, rowIdx) => (
                      <TableRow key={rowIdx}>
                        {row.map((cell, cellIdx) => (
                          <TableCell key={cellIdx} sx={{ maxWidth: 200 }}>
                            <Typography variant="body2" noWrap title={cell}>
                              {cell || <em style={{ opacity: 0.5 }}>{t("csv.empty")}</em>}
                            </Typography>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setShowImportDialog(false)}>{t("csv.cancel")}</Button>
          <Button
            variant="contained"
            onClick={handleImportFromDialog}
            disabled={importing || !csvData}
          >
            {importing ? t("csv.importing") : t("csv.importObjects", { count: csvData?.totalRows || 0 })}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
});

export default CSVManager;