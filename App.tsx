import React, { useState, useCallback } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import WorkPage from './pages/WorkPage';
import InfoPage from './pages/InfoPage';
import LoadingScreen from './components/LoadingScreen';

function App() {
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const [is3DLoaded, setIs3DLoaded] = useState(false); // 3D 모델 로딩 상태
  const [isNavTextWhite, setIsNavTextWhite] = useState(false);
  
  const location = useLocation();
  const isWork = location.pathname === '/' || location.pathname === '/work';
  const isInfo = location.pathname === '/info';

  // WorkPage -> ThreeController에서 모델 로딩 완료 시 호출
  const handleModelLoadComplete = useCallback(() => {
    console.log("App: 3D Model Loaded Complete");
    setIs3DLoaded(true);
  }, []);

  React.useEffect(() => {
    if (!isInfo) {
      setIsNavTextWhite(false);
    }
  }, [location.pathname, isInfo]);

  const headerTextColor = isNavTextWhite ? 'text-white' : 'text-black';
  const navInactiveColor = isNavTextWhite ? 'text-gray-300 hover:text-white' : 'text-gray-400 hover:text-black';
  const navActiveBorder = isNavTextWhite ? 'border-white' : 'border-black';

  return (
    <div className="w-screen h-screen overflow-hidden bg-white relative animate-fadeInDown">
      
      {/* 
        LoadingScreen:
        - isAssetLoaded: 3D 모델 로딩 완료 여부 전달
        - onComplete: 화면 전환 완료 시 호출
      */}
      {showLoadingScreen && (
        <LoadingScreen 
          isAssetLoaded={is3DLoaded} 
          onComplete={() => setShowLoadingScreen(false)} 
        />
      )}

      {/* 
        Main Content:
        - LoadingScreen 뒤에 미리 렌더링되지만(opacity:0), 3D 모델 로딩은 시작됨
      */}
      <div className={`w-full h-full transition-opacity duration-1000 ${showLoadingScreen ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}`}>
          {/* Header */}
          <div className="fixed top-5 left-8 md:left-20 z-50 transition-colors duration-300">
            <h1 className={`text-[34px] md:text-[52px] font-black tracking-normal ${headerTextColor}`}>
                <Link to="/">KAKYUNG KIM</Link>
            </h1>
          </div>

          {/* Nav */}
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

          <Routes>
            {/* WorkPage에 로딩 완료 콜백 전달 */}
            <Route path="/" element={<WorkPage onModelLoaded={handleModelLoadComplete} />} />
            <Route path="/work" element={<WorkPage onModelLoaded={handleModelLoadComplete} />} />
            <Route 
              path="/info" 
              element={<InfoPage onThemeChange={setIsNavTextWhite} />} 
            />
          </Routes>
      </div>
      
    </div>
  );
}

export default App;