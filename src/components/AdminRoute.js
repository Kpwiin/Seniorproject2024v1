import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const AdminRoute = ({ children }) => {
  const { user, role, loading } = useAuth();

  console.log("AdminRoute - User:", user);
  console.log("AdminRoute - Role:", role);
  console.log("AdminRoute - Loading:", loading);

  if (loading || role === null) {
    return <p>Loading...</p>; // Wait for role to be set
  }

  if (!user || role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;
