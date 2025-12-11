import React, { useState } from 'react';
import { PROJECTS } from './constants';
import ThreeController from './components/ThreeController';
import PlaylistPanel from './components/PlaylistPanel';

function App() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  const currentProject = selectedProjectId 
    ? PROJECTS.find(p => p.id === selectedProjectId) || null 
    : null;

  const bgImage = currentProject ? `url('${currentProject.bgImage}')` : 'none';

  return (
    <div className="w-screen h-screen overflow-hidden bg-white relative transition-all duration-700">
       {/* Dynamic Background Layer */}
       <div 
         className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out opacity-100"
         style={{ backgroundImage: bgImage, opacity: currentProject ? 1 : 0 }}
       />

      {/* Header / Logo */}
      <div className="fixed top-5 left-20 text-5xl font-bold tracking-widest z-50 animate-fadeInDown">
        KIMKAKYUNG
      </div>

      {/* Navigation Tabs */}
      <nav className="fixed top-10 right-20 flex gap-5 z-50 animate-fadeInDown">
        <a href="#" className="px-6 py-3 text-base font-semibold text-gray-400 hover:text-black transition-colors">INFO</a>
        <a href="#" className="px-6 py-3 text-base font-semibold text-black border-b-2 border-black">WORK</a>
      </nav>

      {/* 3D Scene */}
      <ThreeController 
        selectedId={selectedProjectId} 
        onLPSelect={(id) => setSelectedProjectId(id)}
      />

      {/* Right Side UI Panel */}
      <PlaylistPanel 
        currentProject={currentProject}
        onSelectProject={(id) => setSelectedProjectId(id)}
        onClose={() => setSelectedProjectId(null)}
      />
    </div>
  );
}

export default App;
