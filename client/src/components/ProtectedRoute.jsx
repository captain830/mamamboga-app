import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Layout from './Layout';  // Import Layout

const ProtectedRoute = () => {
    const { user, token } = useSelector((state) => state.auth);
    const localToken = localStorage.getItem('token');
    const localUser = localStorage.getItem('user');
    
    const finalToken = token || localToken;
    const finalUser = user || (localUser ? JSON.parse(localUser) : null);
    
    console.log('ProtectedRoute - authenticated:', !!finalToken);
    console.log('ProtectedRoute - user:', finalUser?.name);
    
    if (!finalToken || !finalUser) {
        console.log('-> Redirecting to login');
        return <Navigate to="/login" replace />;
    }
    
    console.log('-> Rendering Layout');
    return <Layout />;
};

export default ProtectedRoute;