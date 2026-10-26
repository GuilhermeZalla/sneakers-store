import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LocaleProvider } from './context/LocaleContext';
import { StoreProvider } from './context/StoreContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { StoreShell } from './components/StoreShell';
import { AuthPage } from './pages/AuthPage';
import { AccountPage, OrderDetailPage } from './pages/AccountPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { HomePage, CatalogPage, ProductPage, WishlistPage, CartPage } from './pages/StorePages';
import './styles.css';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <LocaleProvider>
            <AuthProvider>
                <StoreProvider>
                    <BrowserRouter>
                        <Routes>
                            <Route path="/login" element={<AuthPage mode="login" />} />
                            <Route path="/register" element={<AuthPage mode="register" />} />
                            <Route element={<StoreShell />}>
                                <Route path="/" element={<HomePage />} />
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
                    </BrowserRouter>
                </StoreProvider>
            </AuthProvider>
        </LocaleProvider>
    </StrictMode>,
);
