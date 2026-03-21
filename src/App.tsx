import { useState } from 'react';
import type { Page } from './types';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import Home from './pages/Home';
import Search from './pages/Search';
import Detail from './pages/Detail';
import Admin from './pages/Admin';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('');
  const [searchKey, setSearchKey] = useState(0);
  const [searchInitialQuery, setSearchInitialQuery] = useState('');

  const handleNavigate = (page: Page, restaurantId?: string, searchParams?: { query?: string }) => {
    if (restaurantId) setSelectedRestaurantId(restaurantId);
    if (page === 'search') {
      setSearchInitialQuery(searchParams?.query ?? '');
      setSearchKey((k) => k + 1);
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-50">
        <Header currentPage={currentPage} onNavigate={handleNavigate} />

        {currentPage === 'home' && <Home onNavigate={handleNavigate} />}
        {currentPage === 'search' && <Search key={searchKey} initialQuery={searchInitialQuery} onNavigate={handleNavigate} />}
        {currentPage === 'detail' && selectedRestaurantId && (
          <Detail restaurantId={selectedRestaurantId} onNavigate={handleNavigate} />
        )}
        {currentPage === 'admin' && <Admin />}
      </div>
    </AuthProvider>
  );
}
