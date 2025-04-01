import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase"; 
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setLoading(true);
      if (user) {
        setUser(user);
        try {
          const userRef = doc(db, "UserInfo", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userRole = userSnap.data().role || "user"; // Ensure valid role
            console.log("Fetched Role:", userRole);
            setRole(userRole);
          } else {
            setRole("user"); // Default role if user data isn't found
          }
        } catch (error) {
          console.error("Error fetching role:", error);
          setRole("user");
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });
  
    return () => unsubscribe();
  }, []);  

  // Logout function
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
