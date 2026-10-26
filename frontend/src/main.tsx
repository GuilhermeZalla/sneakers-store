import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LocaleProvider } from './context/LocaleContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthPage } from './pages/AuthPage';
import { AccountPage } from './pages/AccountPage';
import './styles.css';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <LocaleProvider>
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Navigate to="/login" replace />} />
                        <Route path="/login" element={<AuthPage mode="login" />} />
                        <Route path="/register" element={<AuthPage mode="register" />} />
                        <Route element={<ProtectedRoute />}>
                            <Route path="/account" element={<AccountPage />} />
                        </Route>
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </LocaleProvider>
    </StrictMode>,
);
