import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './styles.css';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <BrowserRouter>
            <Routes>
                <Route
                    path="/"
                    element={
                        <main>
                            <h1>Sneakers</h1>
                        </main>
                    }
                />
            </Routes>
        </BrowserRouter>
    </StrictMode>,
);
