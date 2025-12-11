import React, { useState } from 'react';
import { PROJECTS } from '../constants';
import ThreeController from '../components/ThreeController';
import PlaylistPanel from '../components/PlaylistPanel';

const WorkPage: React.FC = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  const currentProject = selectedProjectId 
    ? PROJECTS.find(p => p.id === selectedProjectId) || null 
    : null;

  const bgImage = currentProject ? `url('${currentProject.bgImage}')` : 'none';

  return (
    <>
      {/* Dynamic Background Layer */}
      <div 
         className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out"
         style={{ backgroundImage: bgImage, opacity: currentProject ? 1 : 0 }}
      />
      
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
    </>
  );
};

export default WorkPage;