import React, { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { Table, TableHead, TableRow, TableCell, TableBody, Select, MenuItem, Typography, Box } from "@mui/material";

const ROLES = ["", "view", "edit", "superadmin"];

function UsersPage({ currentUser }) {
  const [users, setUsers] = useState([]);

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
    return <Box sx={{ p: 4 }}><Typography>You do not have access to view users.</Typography></Box>;
  }

  return (
    <div style={{ backgroundColor: "rgb(204, 255, 255)", minHeight: "100vh" }}>
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>Users</Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Email</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Role</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map(u => (
            <TableRow key={u.id}>
              <TableCell>{u.email}</TableCell>
              <TableCell>{u.displayName}</TableCell>
              <TableCell>
                <Select
                  value={u.role}
                  onChange={e => handleRoleChange(u.id, e.target.value)}
                  disabled={currentUser.id === u.id}
                  size="small"
                >
                  {ROLES.map(r => <MenuItem key={r} value={r}>{r || "none"}</MenuItem>)}
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
    </div>
  );
}

export default UsersPage;
