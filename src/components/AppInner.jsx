import React, { useEffect, useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth } from "../firebase";
import TopNav from "./TopNav";
import ObjectsPage from "./ObjectsPage";
import Home from "./Home";
import References from "./References";
import UsersPage from "./UsersPage";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

function AppInner() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        setAuthReady(true);
        return;
      }
      const userRef = doc(db, "users", u.uid);
      let userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: u.email,
          displayName: u.displayName || "",
          role: "" // no access by default
        });
        userSnap = await getDoc(userRef); // fetch again after creation
      }
      // Merge Auth and Firestore user data
      setUser({
        uid: u.uid,
        email: u.email,
        displayName: u.displayName,
        photoURL: u.photoURL,
        ...userSnap.data(),
      });
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
        <Route path="/users" element={<UsersPage currentUser={user} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppInner;
