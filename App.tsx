
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Home from './views/Home';
import Search from './views/Search';
import Detail from './views/Detail';
import Admin from './views/Admin';
import { Area, Restaurant } from './types';
import { mockRestaurants } from './data/mockData';

const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState('home');
  const [routeParams, setRouteParams] = useState<any>({});
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>(mockRestaurants);

  // Reset scroll position on navigation
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPath]);

  const navigate = (path: string, params: any = {}) => {
    setCurrentPath(path);
    setRouteParams(params);
  };

  const handleAddRestaurant = (newRes: Restaurant) => {
    setAllRestaurants(prev => [newRes, ...prev]);
  };

  const renderView = () => {
    switch (currentPath) {
      case 'home':
        return <Home onNavigate={navigate} />;
      case 'search':
        return <Search onNavigate={navigate} initialArea={routeParams.area as Area} />;
      case 'detail':
        return <Detail id={routeParams.id} onNavigate={navigate} allRestaurants={allRestaurants} />;
      case 'admin':
        return <Admin onAddRestaurant={handleAddRestaurant} onNavigate={navigate} />;
      default:
        return <Home onNavigate={navigate} />;
    }
  };

  return (
    <Layout onNavigate={navigate} currentPath={currentPath}>
      {renderView()}
    </Layout>
  );
};

export default App;
