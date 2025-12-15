import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import WorkPage from './pages/WorkPage';
import InfoPage from './pages/InfoPage';
import LoadingScreen from './components/LoadingScreen';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isNavTextWhite, setIsNavTextWhite] = useState(false); // State for header text color
  const location = useLocation();
  const isWork = location.pathname === '/' || location.pathname === '/work';
  const isInfo = location.pathname === '/info';

  // Reset nav color when changing routes
  React.useEffect(() => {
    if (!isInfo) {
      setIsNavTextWhite(false);
    }
  }, [location.pathname, isInfo]);

  if (isLoading) {
    return <LoadingScreen onComplete={() => setIsLoading(false)} />;
  }

  const headerTextColor = isNavTextWhite ? 'text-white' : 'text-black';
  const navInactiveColor = isNavTextWhite ? 'text-gray-300 hover:text-white' : 'text-gray-400 hover:text-black';
  const navActiveBorder = isNavTextWhite ? 'border-white' : 'border-black';

  return (
    <div className="w-screen h-screen overflow-hidden bg-white relative animate-fadeInDown">
      
      {/* --- Common Layout Elements --- */}

      {/* Header / Logo */}
      <div className="fixed top-5 left-8 md:left-20 z-50 transition-colors duration-300">
        <h1 className={`text-3xl md:text-5xl font-bold tracking-widest ${headerTextColor}`}>
            <Link to="/">KAKYUNG KIM</Link>
        </h1>
      </div>

      {/* Navigation Tabs */}
      <nav className="fixed top-8 md:top-10 right-8 md:right-20 flex gap-5 z-50 transition-colors duration-300">
        <Link 
            to="/info" 
            className={`px-3 md:px-6 py-2 md:py-3 text-sm md:text-base font-semibold transition-all duration-300 ${
                isInfo 
                ? `${headerTextColor} border-b-2 ${navActiveBorder}` 
                : navInactiveColor
            }`}
        >
            INFO
        </Link>
        <Link 
            to="/" 
            className={`px-3 md:px-6 py-2 md:py-3 text-sm md:text-base font-semibold transition-all duration-300 ${
                isWork 
                ? `${headerTextColor} border-b-2 ${navActiveBorder}` 
                : navInactiveColor
            }`}
        >
            WORK
        </Link>
      </nav>

      {/* --- Page Content Routing --- */}
      <Routes>
        <Route path="/" element={<WorkPage />} />
        <Route path="/work" element={<WorkPage />} />
        <Route 
          path="/info" 
          element={<InfoPage onThemeChange={setIsNavTextWhite} />} 
        />
      </Routes>
      
    </div>
  );
}

export default App;