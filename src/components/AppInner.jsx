import React, { useEffect, useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth } from "../firebase";
import TopNav from "./TopNav";
import ObjectsPage from "./ObjectsPage";
import Home from "./Home";
import References from "./References";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

function AppInner() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  if (!authReady) {
    return (
      <Box sx={{ py: 8, display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <BrowserRouter>
      <TopNav user={user} onLogin={login} onLogout={logout} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/objects" element={<ObjectsPage user={user} />} />
        <Route path="/references" element={<References />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppInner;
