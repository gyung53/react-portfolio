import React, { useState } from 'react';
import { PROJECTS } from '../constants';
import ThreeController from '../components/ThreeController';
import PlaylistPanel from '../components/PlaylistPanel';

interface WorkPageProps {
  onModelLoaded?: () => void;
}

const WorkPage: React.FC<WorkPageProps> = ({ onModelLoaded }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  const currentProject = selectedProjectId 
    ? PROJECTS.find(p => p.id === selectedProjectId) || null 
    : null;

  return (
    <>
      {/* Background Layers */}
      {PROJECTS.map((project) => (
        <div 
           key={project.id}
           className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out pointer-events-none"
           style={{ 
             backgroundImage: `url('${project.bgImage}')`, 
             opacity: selectedProjectId === project.id ? 1 : 0,
             zIndex: 0
           }}
        />
      ))}
      
      {/* 3D Scene - Pass loading callback */}
      <ThreeController 
        selectedId={selectedProjectId} 
        onLPSelect={(id) => setSelectedProjectId(id)}
        onLoadComplete={onModelLoaded}
      />

      {/* UI Panel */}
      <PlaylistPanel 
        currentProject={currentProject}
        onSelectProject={(id) => setSelectedProjectId(id)}
        onClose={() => setSelectedProjectId(null)}
      />
    </>
  );
};

export default WorkPage;