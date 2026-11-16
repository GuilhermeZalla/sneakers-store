import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { DemoBanner } from './components/DemoBanner';
import { AuthProvider } from './context/AuthContext';
import { LocaleProvider } from './context/LocaleContext';
import { StoreProvider } from './context/StoreContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { StoreShell } from './components/StoreShell';
import { AuthPage } from './pages/AuthPage';
import { AccountPage, OrderDetailPage } from './pages/AccountPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { HomePage, CatalogPage, ProductPage, WishlistPage, CartPage } from './pages/StorePages';
import { NotificationProvider } from './context/NotificationContext';
import { PasswordRecoveryPage, VerifyEmailPage } from './pages/AccessPages';
import './styles.css';

const Router = import.meta.env.VITE_DEMO === 'true' ? HashRouter : BrowserRouter;

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <LocaleProvider>
            <AuthProvider>
                <NotificationProvider>
                    <StoreProvider>
                        <Router>
                            {import.meta.env.VITE_DEMO === 'true' && <DemoBanner />}
                            <Routes>
                                <Route path="/login" element={<AuthPage mode="login" />} />
                                <Route path="/register" element={<AuthPage mode="register" />} />
                                <Route element={<StoreShell />}>
                                    <Route path="/" element={<HomePage />} />
                                    <Route
                                        path="/forgot-password"
                                        element={<PasswordRecoveryPage />}
                                    />
                                    <Route
                                        path="/reset-password"
                                        element={<PasswordRecoveryPage reset />}
                                    />
                                    <Route path="/verify-email" element={<VerifyEmailPage />} />
                                    <Route
                                        path="/verify-email/:id/:hash"
                                        element={<VerifyEmailPage />}
                                    />
                                    <Route path="/catalog" element={<CatalogPage />} />
                                    <Route path="/products/:slug" element={<ProductPage />} />
                                    <Route element={<ProtectedRoute />}>
                                        <Route path="/wishlist" element={<WishlistPage />} />
                                        <Route path="/cart" element={<CartPage />} />
                                        <Route path="/checkout" element={<CheckoutPage />} />
                                        <Route path="/account" element={<AccountPage />} />
                                        <Route
                                            path="/account/orders/:id"
                                            element={<OrderDetailPage />}
                                        />
                                    </Route>
                                </Route>
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </Router>
                    </StoreProvider>
                </NotificationProvider>
            </AuthProvider>
        </LocaleProvider>
    </StrictMode>,
);
