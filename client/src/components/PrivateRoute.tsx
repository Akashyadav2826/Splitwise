import { type ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function PrivateRoute({ children }: { children: ReactElement }) {
  const { token, isLoading } = useAuth();
  if (isLoading) return <div className="flex items-center justify-center h-screen text-gray-500">Loading...</div>;
  return token ? children : <Navigate to="/login" replace />;
}
