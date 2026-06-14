import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import PrivateRoute from './components/PrivateRoute';
import { ToastContainer } from './components/Toast';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CreateGroupPage from './pages/CreateGroupPage';
import GroupDetailPage from './pages/GroupDetailPage';
import ExpenseFormPage from './pages/ExpenseFormPage';
import ExpenseDetailPage from './pages/ExpenseDetailPage';
import SettleDebtPage from './pages/SettleDebtPage';
import EditExpensePage from './pages/EditExpensePage';
import SettlementHistoryPage from './pages/SettlementHistoryPage';

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <ToastContainer />
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
            <Route path="/groups/new" element={<PrivateRoute><CreateGroupPage /></PrivateRoute>} />
            <Route path="/groups/:id" element={<PrivateRoute><GroupDetailPage /></PrivateRoute>} />
            <Route path="/groups/:id/expenses/new" element={<PrivateRoute><ExpenseFormPage /></PrivateRoute>} />
            <Route path="/groups/:id/expenses/:expenseId" element={<PrivateRoute><ExpenseDetailPage /></PrivateRoute>} />
            <Route path="/groups/:id/expenses/:expenseId/edit" element={<PrivateRoute><EditExpensePage /></PrivateRoute>} />
            <Route path="/groups/:id/settle" element={<PrivateRoute><SettleDebtPage /></PrivateRoute>} />
            <Route path="/groups/:id/settlements" element={<PrivateRoute><SettlementHistoryPage /></PrivateRoute>} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}
