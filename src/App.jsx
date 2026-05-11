import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase/config";
import Home from "./pages/Home";
import Login from "./pages/Login";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (checkingAuth) {
    return <p style={{ textAlign: "center" }}>Loading...</p>;
  }

  if (!user) {
    return <Login />;
  }

  return (
      <>
        <button
            onClick={handleLogout}
            style={{
              position: "fixed",
              top: "15px",
              right: "15px",
              zIndex: 1000,
            }}
        >
          Logout
        </button>

        <Home />
      </>
  );
}

export default App;