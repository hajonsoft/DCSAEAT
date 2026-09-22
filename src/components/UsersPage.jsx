import React, { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { Table, TableHead, TableRow, TableCell, TableBody, Select, MenuItem, Typography, Box, TableContainer, Paper } from "@mui/material";
import { useI18n } from "../i18n/I18nContext";

const ROLE_VALUES = ["", "view", "edit", "superadmin"];

function UsersPage({ currentUser }) {
  const { t } = useI18n();
  const [users, setUsers] = useState([]);

  const roleLabel = (role) => {
    if (!role) return t("users.none");
    return t(`users.${role}`);
  };

  useEffect(() => {
    getDocs(collection(db, "users")).then(snapshot => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  const handleRoleChange = async (uid, newRole) => {
    await updateDoc(doc(db, "users", uid), { role: newRole });
    setUsers(users => users.map(u => u.id === uid ? { ...u, role: newRole } : u));
  };

  if (!currentUser || currentUser.role !== "superadmin") {
    return <Box sx={{ p: { xs: 2, md: 4 } }}><Typography>{t("users.noAccess")}</Typography></Box>;
  }

  return (
    <div style={{ backgroundColor: "rgb(204, 255, 255)", minHeight: "100vh" }}>
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Typography variant="h5" gutterBottom>{t("users.title")}</Typography>
      <TableContainer component={Paper} sx={{ overflowX: "auto", maxWidth: "100%" }}>
      <Table size="small" sx={{ minWidth: 480 }}>
        <TableHead>
          <TableRow>
            <TableCell>{t("users.email")}</TableCell>
            <TableCell>{t("users.name")}</TableCell>
            <TableCell>{t("users.role")}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map(u => (
            <TableRow key={u.id}>
              <TableCell sx={{ wordBreak: "break-word" }}>{u.email}</TableCell>
              <TableCell sx={{ wordBreak: "break-word" }}>{u.displayName}</TableCell>
              <TableCell>
                <Select
                  value={u.role}
                  onChange={e => handleRoleChange(u.id, e.target.value)}
                  disabled={currentUser.id === u.id}
                  size="small"
                  sx={{ minWidth: 120, maxWidth: "100%" }}
                >
                  {ROLE_VALUES.map(r => <MenuItem key={r} value={r}>{roleLabel(r)}</MenuItem>)}
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </TableContainer>
    </Box>
    </div>
  );
}

export default UsersPage;
