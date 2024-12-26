import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PermissionsProvider } from './contexts/PermissionsContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { FilterPersistenceProvider } from './contexts/FilterPersistenceContext';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Companies } from './pages/Companies';
import { Locations } from './pages/Locations';
import { Circuits } from './pages/Circuits';
import { Proposals } from './pages/Proposals';

function App() {
  return (
    <AuthProvider>
      <PermissionsProvider>
      <NotificationProvider>
      <FilterPersistenceProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="companies" element={<Companies />} />
              <Route path="locations" element={<Locations />} />
              <Route path="circuits" element={<Circuits />} />
              <Route path="proposals" element={<Proposals />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </FilterPersistenceProvider>
      </NotificationProvider>
      </PermissionsProvider>
    </AuthProvider>
  );
}

export default App;