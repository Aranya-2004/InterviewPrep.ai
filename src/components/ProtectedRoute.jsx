/**
 * components/ProtectedRoute.jsx
 */
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#f8f9fc",fontFamily:"'Plus Jakarta Sans',sans-serif",flexDirection:"column",gap:"1rem"}}>
      <div style={{width:36,height:36,border:"3px solid #3b82f6",borderTopColor:"transparent",borderRadius:"50%",animation:"spin .7s linear infinite"}}/>
      <span style={{color:"#64748b",fontSize:".86rem"}}>Loading…</span>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}