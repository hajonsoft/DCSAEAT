const translations = {
  en: {
    nav: {
      home: "Home",
      objects: "Objects",
      users: "Users",
      references: "References",
      signIn: "Sign in with Google",
      signOut: "Sign out",
      signedIn: "Signed in",
      menu: "Menu",
      language: "Language",
    },
    home: {
      welcome: "Welcome to DCSAEAT",
      subtitle:
        "Manage Ancient Egyptian Astronomical Texts and Entities, from Egypt and anywhere. Use the navigation to browse Objects and References, search the collection, and add new records.",
      objectsTitle: "Objects",
      objectsDesc:
        "Browse, search, and manage astronomical texts and related entities in the collection.",
      referencesTitle: "References",
      referencesDesc:
        "Connect bibliographic entries to objects and keep scholarly sources in one place.",
      usersTitle: "Users",
      usersDesc:
        "Administer roles and access so the right people can view or edit the collection.",
      featuredCaption:
        "Astronomical ceiling painting from an ancient Egyptian coffin, with Nut and a field of stars.",
      featuredAlt: "Astronomical scene on an ancient Egyptian coffin",
      partners: "Partner institutions",
      partnersDesc:
        "DCSAEAT is developed in collaboration with institutions dedicated to Egyptology and the study of writing.",
      logoHie: "Hellenic Institute of Egyptology",
      logoHieAlt: "Hellenic Institute of Egyptology logo",
      logoWsc: "Writing & Script Center",
      logoWscAlt: "Writing and Script Center logo",
      browse: "Browse",
    },
    objects: {
      searchPlaceholder: "Search objects…",
      exportCsv: "Export CSV",
      importCsv: "Import CSV",
      all: "All",
      add: "Add",
      noObjects: "No objects found.",
      viewObject: "View Object",
      close: "Close",
      view: "View",
      edit: "Edit",
      delete: "Delete",
      empty: "(empty)",
      untitled: "(untitled)",
      showing: "Showing {start}–{end} of {total} objects",
      failedLoad: "Failed to load objects",
      required: "{field} is required",
      updated: "Object updated",
      added: "Object added",
      failedSave: "Failed to save object",
      deleted: "Object deleted",
      failedDelete: "Failed to delete object",
      importCsvFirst:
        "Please import a CSV file first to configure the form fields",
      objectAlt: "Object image",
      thumbAlt: "Object thumbnail",
      deleteConfirmTitle: "Delete object",
      deleteConfirmBody:
        "Are you sure you want to delete “{name}”? This cannot be undone.",
      deleting: "Deleting...",
    },
    form: {
      viewObject: "View Object",
      editObject: "Edit Object",
      addNewObject: "Add New Object",
      analyzeWithAi: "Analyze with AI",
      analyzing: "Analyzing...",
      noFieldConfig:
        "No field configuration available. Please import a CSV file to set up the form fields.",
      images: "Images (up to 3)",
      uploading: "Uploading images...",
      aiAnalysis: "AI Analysis",
      update: "Update",
      save: "Save",
      cancel: "Cancel",
      preview: "Image preview",
      noAnswer: "No answer returned.",
      requestFailed: "Request failed",
      placeholderNumber: "e.g., 1029, A001",
      placeholderName: "e.g., Object name or title",
      placeholderType: "e.g., Category or type",
      placeholderDate: "e.g., Date or period",
      placeholderLocation: "e.g., Location or place",
      placeholderUrl: "e.g., https://example.com",
      placeholderDescription: "e.g., Description or notes",
      placeholderReference: "e.g., References or sources",
      placeholderEnter: "Enter {field}",
    },
    csv: {
      noObjectsExport: "No objects to export",
      headerRequired:
        "CSV file must have at least a header row and one data row",
      readError: "Error reading CSV file. Please check the file format.",
      noData: "No CSV data available for import",
      mustLogin: "You must be logged in to import data",
      superadminOnly: "Only superadmin users can import CSV data",
      importPreview: "CSV Import Preview",
      foundRows: "Found {count} rows to import. Preview shows first 5 rows.",
      detectedFields: "Detected Fields ({count})",
      fieldOrderNote:
        "Fields will be imported and stored in the same order as they appear in your CSV file.",
      chipNote:
        "Blue chips are fields that already exist in your database. Gray chips are new fields that will be added.",
      fieldConfigNote:
        "Field Configuration: Select filterable fields (primary blue) for dropdown filters and searchable fields (secondary purple) for text search. These settings will be saved and used throughout the application.",
      selectFilterable: "Select Filterable Fields ({count} selected)",
      filterableHelp:
        "Choose which fields should have filter dropdowns in the main interface. These fields will have unique value lists for filtering.",
      selectSearchable: "Select Searchable Fields ({count} selected)",
      searchableHelp:
        "Choose which fields should be included in text search. When users search, the search will look through these selected fields.",
      dataPreview: "Data Preview",
      empty: "empty",
      cancel: "Cancel",
      importing: "Importing...",
      importObjects: "Import {count} Objects",
      importCompleteErrors:
        "Import completed with errors. Imported: {imported}, Skipped: {skipped}, Errors: {errors}. First few errors: {details}",
      noImported:
        "No objects were imported. {skipped} rows were skipped (empty or invalid data).",
      importCompleteSkipped:
        "CSV import complete: {imported} objects imported, {skipped} rows skipped",
      importComplete: "CSV import complete: {imported} objects imported",
      importFailed: "Import failed: {reason}",
      permissionDenied:
        "You don't have permission to add objects to the database.",
      unavailable:
        "Database is currently unavailable. Please try again later.",
      unknownError: "Unknown error occurred.",
      unknownErrorShort: "Unknown error",
      rowError: "Row {row}: {message}",
    },
    users: {
      title: "Users",
      noAccess: "You do not have access to view users.",
      email: "Email",
      name: "Name",
      role: "Role",
      none: "none",
      view: "view",
      edit: "edit",
      superadmin: "superadmin",
    },
    references: {
      title: "References",
      placeholder:
        "A references module will live here. It can be linked to objects, with the ability to add bibliographic entries and connect them via cross-refs.",
    },
    language: {
      english: "English",
      greek: "Ελληνικά",
    },
  },
  el: {
    nav: {
      home: "Αρχική",
      objects: "Αντικείμενα",
      users: "Χρήστες",
      references: "Αναφορές",
      signIn: "Σύνδεση με Google",
      signOut: "Αποσύνδεση",
      signedIn: "Συνδεδεμένος",
      menu: "Μενού",
      language: "Γλώσσα",
    },
    home: {
      welcome: "Καλώς ήρθατε στο DCSAEAT",
      subtitle:
        "Διαχειριστείτε αρχαία αιγυπτιακά αστρονομικά κείμενα και οντότητες, από την Αίγυπτο και από οπουδήποτε. Χρησιμοποιήστε την πλοήγηση για να περιηγηθείτε στα Αντικείμενα και τις Αναφορές, να αναζητήσετε τη συλλογή και να προσθέσετε νέες εγγραφές.",
      objectsTitle: "Αντικείμενα",
      objectsDesc:
        "Περιηγηθείτε, αναζητήστε και διαχειριστείτε αστρονομικά κείμενα και σχετικές οντότητες της συλλογής.",
      referencesTitle: "Αναφορές",
      referencesDesc:
        "Συνδέστε βιβλιογραφικές εγγραφές με αντικείμενα και συγκεντρώστε τις επιστημονικές πηγές σε ένα σημείο.",
      usersTitle: "Χρήστες",
      usersDesc:
        "Διαχειριστείτε ρόλους και πρόσβαση ώστε τα κατάλληλα άτομα να μπορούν να βλέπουν ή να επεξεργάζονται τη συλλογή.",
      featuredCaption:
        "Αστρονομική ζωγραφική οροφής από αρχαία αιγυπτιακή σαρκοφάγο, με τη Νουτ και ένα πεδίο αστεριών.",
      featuredAlt: "Αστρονομική παράσταση σε αρχαία αιγυπτιακή σαρκοφάγο",
      partners: "Συνεργαζόμενοι φορείς",
      partnersDesc:
        "Το DCSAEAT αναπτύσσεται σε συνεργασία με φορείς αφιερωμένους στην αιγυπτιολογία και τη μελέτη της γραφής.",
      logoHie: "Ελληνικό Ινστιτούτο Αιγυπτιολογίας",
      logoHieAlt: "Λογότυπο Ελληνικού Ινστιτούτου Αιγυπτιολογίας",
      logoWsc: "Κέντρο Γραφής και Χειρογράφων",
      logoWscAlt: "Λογότυπο Κέντρου Γραφής και Χειρογράφων",
      browse: "Περιήγηση",
    },
    objects: {
      searchPlaceholder: "Αναζήτηση αντικειμένων…",
      exportCsv: "Εξαγωγή CSV",
      importCsv: "Εισαγωγή CSV",
      all: "Όλα",
      add: "Προσθήκη",
      noObjects: "Δεν βρέθηκαν αντικείμενα.",
      viewObject: "Προβολή αντικειμένου",
      close: "Κλείσιμο",
      view: "Προβολή",
      edit: "Επεξεργασία",
      delete: "Διαγραφή",
      empty: "(κενό)",
      untitled: "(χωρίς τίτλο)",
      showing: "Εμφάνιση {start}–{end} από {total} αντικείμενα",
      failedLoad: "Αποτυχία φόρτωσης αντικειμένων",
      required: "Το πεδίο {field} είναι υποχρεωτικό",
      updated: "Το αντικείμενο ενημερώθηκε",
      added: "Το αντικείμενο προστέθηκε",
      failedSave: "Αποτυχία αποθήκευσης αντικειμένου",
      deleted: "Το αντικείμενο διαγράφηκε",
      failedDelete: "Αποτυχία διαγραφής αντικειμένου",
      importCsvFirst:
        "Εισαγάγετε πρώτα ένα αρχείο CSV για να διαμορφωθούν τα πεδία της φόρμας",
      objectAlt: "Εικόνα αντικειμένου",
      thumbAlt: "Μικρογραφία αντικειμένου",
      deleteConfirmTitle: "Διαγραφή αντικειμένου",
      deleteConfirmBody:
        "Είστε βέβαιοι ότι θέλετε να διαγράψετε το «{name}»; Η ενέργεια δεν μπορεί να αναιρεθεί.",
      deleting: "Γίνεται διαγραφή...",
    },
    form: {
      viewObject: "Προβολή αντικειμένου",
      editObject: "Επεξεργασία αντικειμένου",
      addNewObject: "Προσθήκη νέου αντικειμένου",
      analyzeWithAi: "Ανάλυση με ΤΝ",
      analyzing: "Γίνεται ανάλυση...",
      noFieldConfig:
        "Δεν υπάρχει διαμόρφωση πεδίων. Εισαγάγετε ένα αρχείο CSV για να ρυθμίσετε τα πεδία της φόρμας.",
      images: "Εικόνες (έως 3)",
      uploading: "Μεταφόρτωση εικόνων...",
      aiAnalysis: "Ανάλυση ΤΝ",
      update: "Ενημέρωση",
      save: "Αποθήκευση",
      cancel: "Ακύρωση",
      preview: "Προεπισκόπηση εικόνας",
      noAnswer: "Δεν επιστράφηκε απάντηση.",
      requestFailed: "Το αίτημα απέτυχε",
      placeholderNumber: "π.χ. 1029, A001",
      placeholderName: "π.χ. Όνομα ή τίτλος αντικειμένου",
      placeholderType: "π.χ. Κατηγορία ή τύπος",
      placeholderDate: "π.χ. Ημερομηνία ή περίοδος",
      placeholderLocation: "π.χ. Τοποθεσία ή τόπος",
      placeholderUrl: "π.χ. https://example.com",
      placeholderDescription: "π.χ. Περιγραφή ή σημειώσεις",
      placeholderReference: "π.χ. Αναφορές ή πηγές",
      placeholderEnter: "Εισαγάγετε {field}",
    },
    csv: {
      noObjectsExport: "Δεν υπάρχουν αντικείμενα για εξαγωγή",
      headerRequired:
        "Το αρχείο CSV πρέπει να έχει τουλάχιστον γραμμή επικεφαλίδων και μία γραμμή δεδομένων",
      readError:
        "Σφάλμα ανάγνωσης του αρχείου CSV. Ελέγξτε τη μορφή του αρχείου.",
      noData: "Δεν υπάρχουν δεδομένα CSV για εισαγωγή",
      mustLogin: "Πρέπει να είστε συνδεδεμένοι για να εισαγάγετε δεδομένα",
      superadminOnly:
        "Μόνο υπερχρήστες μπορούν να εισαγάγουν δεδομένα CSV",
      importPreview: "Προεπισκόπηση εισαγωγής CSV",
      foundRows:
        "Βρέθηκαν {count} γραμμές για εισαγωγή. Η προεπισκόπηση δείχνει τις πρώτες 5 γραμμές.",
      detectedFields: "Ανιχνευμένα πεδία ({count})",
      fieldOrderNote:
        "Τα πεδία θα εισαχθούν και θα αποθηκευτούν με την ίδια σειρά που εμφανίζονται στο αρχείο CSV.",
      chipNote:
        "Τα μπλε στοιχεία είναι πεδία που υπάρχουν ήδη στη βάση. Τα γκρι είναι νέα πεδία που θα προστεθούν.",
      fieldConfigNote:
        "Διαμόρφωση πεδίων: Επιλέξτε φιλτραρίσιμα πεδία (μπλε) για αναπτυσσόμενα φίλτρα και πεδία αναζήτησης (μωβ) για αναζήτηση κειμένου. Οι ρυθμίσεις θα αποθηκευτούν και θα χρησιμοποιούνται σε όλη την εφαρμογή.",
      selectFilterable: "Επιλογή φιλτραρίσιμων πεδίων ({count} επιλεγμένα)",
      filterableHelp:
        "Επιλέξτε ποια πεδία θα έχουν αναπτυσσόμενα φίλτρα στην κύρια διεπαφή. Αυτά τα πεδία θα έχουν λίστες μοναδικών τιμών για φιλτράρισμα.",
      selectSearchable: "Επιλογή πεδίων αναζήτησης ({count} επιλεγμένα)",
      searchableHelp:
        "Επιλέξτε ποια πεδία θα περιλαμβάνονται στην αναζήτηση κειμένου. Η αναζήτηση θα γίνεται στα επιλεγμένα πεδία.",
      dataPreview: "Προεπισκόπηση δεδομένων",
      empty: "κενό",
      cancel: "Ακύρωση",
      importing: "Γίνεται εισαγωγή...",
      importObjects: "Εισαγωγή {count} αντικειμένων",
      importCompleteErrors:
        "Η εισαγωγή ολοκληρώθηκε με σφάλματα. Εισήχθησαν: {imported}, Παραλείφθηκαν: {skipped}, Σφάλματα: {errors}. Πρώτα σφάλματα: {details}",
      noImported:
        "Δεν εισήχθησαν αντικείμενα. Παραλείφθηκαν {skipped} γραμμές (κενά ή μη έγκυρα δεδομένα).",
      importCompleteSkipped:
        "Η εισαγωγή CSV ολοκληρώθηκε: εισήχθησαν {imported} αντικείμενα, παραλείφθηκαν {skipped} γραμμές",
      importComplete:
        "Η εισαγωγή CSV ολοκληρώθηκε: εισήχθησαν {imported} αντικείμενα",
      importFailed: "Η εισαγωγή απέτυχε: {reason}",
      permissionDenied:
        "Δεν έχετε δικαίωμα προσθήκης αντικειμένων στη βάση δεδομένων.",
      unavailable:
        "Η βάση δεδομένων δεν είναι διαθέσιμη αυτή τη στιγμή. Δοκιμάστε ξανά αργότερα.",
      unknownError: "Προέκυψε άγνωστο σφάλμα.",
      unknownErrorShort: "Άγνωστο σφάλμα",
      rowError: "Γραμμή {row}: {message}",
    },
    users: {
      title: "Χρήστες",
      noAccess: "Δεν έχετε πρόσβαση στην προβολή χρηστών.",
      email: "Email",
      name: "Όνομα",
      role: "Ρόλος",
      none: "κανένας",
      view: "προβολή",
      edit: "επεξεργασία",
      superadmin: "υπερχρήστης",
    },
    references: {
      title: "Αναφορές",
      placeholder:
        "Εδώ θα βρίσκεται η ενότητα των αναφορών. Θα μπορεί να συνδέεται με αντικείμενα, με δυνατότητα προσθήκης βιβλιογραφικών εγγραφών και διασύνδεσής τους μέσω διασταυρούμενων αναφορών.",
    },
    language: {
      english: "English",
      greek: "Ελληνικά",
    },
  },
};

export default translations;
