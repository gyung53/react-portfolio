import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import WorkPage from './pages/WorkPage';
import InfoPage from './pages/InfoPage';
import LoadingScreen from './components/LoadingScreen';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const isWork = location.pathname === '/' || location.pathname === '/work';
  const isInfo = location.pathname === '/info';

  if (isLoading) {
    return <LoadingScreen onComplete={() => setIsLoading(false)} />;
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-white relative animate-fadeInDown">
      
      {/* --- Common Layout Elements --- */}

      {/* Header / Logo */}
      <div className="fixed top-5 left-20 z-50">
        <h1 className="text-5xl font-bold tracking-widest text-black">
            <Link to="/">KIMKAKYUNG</Link>
        </h1>
      </div>

      {/* Navigation Tabs */}
      <nav className="fixed top-10 right-20 flex gap-5 z-50">
        <Link 
            to="/info" 
            className={`px-6 py-3 text-base font-semibold transition-colors duration-300 ${
                isInfo 
                ? 'text-black border-b-2 border-black' 
                : 'text-gray-400 hover:text-black'
            }`}
        >
            INFO
        </Link>
        <Link 
            to="/" 
            className={`px-6 py-3 text-base font-semibold transition-colors duration-300 ${
                isWork 
                ? 'text-black border-b-2 border-black' 
                : 'text-gray-400 hover:text-black'
            }`}
        >
            WORK
        </Link>
      </nav>

      {/* --- Page Content Routing --- */}
      <Routes>
        <Route path="/" element={<WorkPage />} />
        <Route path="/work" element={<WorkPage />} />
        <Route path="/info" element={<InfoPage />} />
      </Routes>
      
    </div>
  );
}

export default App;