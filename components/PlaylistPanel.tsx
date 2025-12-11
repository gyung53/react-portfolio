import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { PROJECTS } from '../constants';

interface PlaylistPanelProps {
  currentProject: Project | null;
  onSelectProject: (id: number) => void;
  onClose: () => void;
}

const PlaylistPanel: React.FC<PlaylistPanelProps> = ({ currentProject, onSelectProject, onClose }) => {
  const [viewMode, setViewMode] = useState<'playingNext' | 'overview'>('playingNext');
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [tab, setTab] = useState<'overview' | 'landing' | 'prototype'>('overview');
  
  useEffect(() => {
    setViewMode('playingNext');
    setTab('overview');
    setProgress(0);
    setIsPlaying(true);
  }, [currentProject]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying && currentProject) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) return 0;
          return prev + 0.5;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentProject]);

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'playingNext' ? 'overview' : 'playingNext');
  };

  const handleNext = () => {
    if (!currentProject) return;
    const idx = PROJECTS.findIndex(p => p.id === currentProject.id);
    const nextId = PROJECTS[(idx + 1) % PROJECTS.length].id;
    onSelectProject(nextId);
  };

  const handlePrev = () => {
    if (!currentProject) return;
    const idx = PROJECTS.findIndex(p => p.id === currentProject.id);
    const prevId = PROJECTS[(idx - 1 + PROJECTS.length) % PROJECTS.length].id;
    onSelectProject(prevId);
  };

  // List View
  if (!currentProject) {
    return (
      <div className="fixed right-0 md:right-[80px] top-1/2 -translate-y-1/2 w-full md:w-[523px] px-4 md:px-0 max-h-[90vh] z-50 flex flex-col pointer-events-none animate-slideInRight">
        <div className="w-full max-h-[80vh] overflow-y-auto bg-white/95 backdrop-blur-md rounded-[20px] shadow-2xl p-[30px] pointer-events-auto">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-base font-bold text-primary tracking-wider">PLAYLIST</h2>
            <button className="text-xl p-1 text-black hover:text-primary hover:scale-110 transition-all">✕</button>
          </div>
          <ul className="flex flex-col gap-3 list-none">
            {PROJECTS.map(p => (
              <li 
                key={p.id}
                onClick={() => onSelectProject(p.id)}
                className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-purple-600/10 hover:translate-x-1 transition-all cursor-pointer"
              >
                <img src={p.thumbnail} alt={p.name} className="w-[50px] h-[50px] rounded-lg object-cover" />
                <div className="flex-1">
                  <div className="text-[15px] font-bold text-black mb-1">{p.name}</div>
                  <div className="text-xs text-gray-400">{p.type}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // Detail View
  return (
    <div className="fixed right-0 md:right-[80px] top-1/2 -translate-y-1/2 w-full md:w-[523px] px-4 md:px-0 max-h-[90vh] z-50 flex flex-col gap-5 pointer-events-none animate-slideInRight">
      
      <div className="flex flex-col bg-white/95 backdrop-blur-md rounded-[20px] shadow-2xl p-[30px] pointer-events-auto">
        <div className="flex justify-between items-center mb-5">
            <h2 className="text-base font-bold text-primary tracking-wider">NOW PLAYING</h2>
            <button 
                onClick={toggleViewMode}
                className="text-xl p-1 text-black hover:text-primary hover:scale-110 transition-all"
                title="More Details"
            >
                ⋯
            </button>
        </div>

        <div className="flex gap-5 mb-6 items-end">
            <img src={currentProject.thumbnail} alt={currentProject.name} className="w-[90px] h-[90px] rounded-xl object-cover shadow-md flex-shrink-0" />
            <div className="flex flex-col pb-0.5">
                <div className="text-2xl font-extrabold text-black mb-2 leading-tight">{currentProject.name}</div>
                <div className="text-sm font-medium text-gray-500">{currentProject.type}</div>
            </div>
        </div>

        <div className="mb-5">
            <div className="w-full h-1.5 bg-black/10 rounded-full mb-2 overflow-hidden relative cursor-pointer">
                <div 
                    className="h-full bg-primary rounded-full transition-all duration-100 ease-linear"
                    style={{ width: `${progress}%` }}
                />
            </div>
            <div className="flex justify-between text-xs text-gray-400">
                <span>24.09.01</span>
                <span>24.12.15</span>
            </div>
        </div>

        <div className="flex justify-center items-center gap-8">
            <button onClick={handlePrev} className="text-2xl text-black hover:text-primary hover:scale-110 transition-all p-1">⏮</button>
            <button onClick={() => setIsPlaying(!isPlaying)} className="text-3xl text-black hover:text-primary hover:scale-110 transition-all p-1">
                {isPlaying ? '⏸' : '▶'}
            </button>
            <button onClick={handleNext} className="text-2xl text-black hover:text-primary hover:scale-110 transition-all p-1">⏭</button>
        </div>
      </div>

      <div className="bg-white/95 backdrop-blur-md rounded-[20px] shadow-2xl p-[30px] min-h-[250px] max-h-[350px] pointer-events-auto flex flex-col">
        {viewMode === 'playingNext' ? (
            <>
                <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase">PLAYING NEXT</h3>
                <div className="flex flex-col gap-2.5 overflow-y-auto pr-1">
                    {PROJECTS.filter(p => p.id !== currentProject.id).map(p => (
                        <div 
                            key={p.id} 
                            onClick={() => onSelectProject(p.id)}
                            className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-transparent hover:bg-purple-600/5 hover:border-purple-600/10 transition-all cursor-pointer flex-shrink-0"
                        >
                            <img src={p.thumbnail} alt={p.name} className="w-[44px] h-[44px] rounded-lg object-cover" />
                            <div className="flex-1">
                                <div className="text-sm font-semibold text-black">{p.name}</div>
                                <div className="text-[11px] text-gray-400">{p.type}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </>
        ) : (
            <>
                <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase">PROJECT DETAILS</h3>
                
                <div className="flex gap-2.5 mb-5 flex-shrink-0">
                    {(['overview', 'landing', 'prototype'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all ${
                                tab === t ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                        >
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                    ))}
                </div>

                <div className="text-sm leading-relaxed text-gray-600 animate-fadeInDown overflow-y-auto pr-2">
                    {tab === 'overview' && currentProject.overview}
                    {tab === 'landing' && (
                        <div>
                            <p className="mb-2">Landing Page structure and design elements.</p>
                            <p>This area can contain more detailed descriptions or links to the actual landing page views.</p>
                        </div>
                    )}
                    {tab === 'prototype' && (
                        <div>
                            <p className="mb-2">Interactive Prototype.</p>
                            <p>Clicking here could open a modal with the Figma prototype or redirect to a demo link.</p>
                        </div>
                    )}
                </div>
            </>
        )}
      </div>

       <button 
         onClick={onClose}
         className="absolute -top-10 right-4 md:right-0 w-8 h-8 flex items-center justify-center bg-white/80 rounded-full text-black hover:bg-white hover:scale-110 transition-all pointer-events-auto shadow-md"
       >
         ✕
       </button>
    </div>
  );
};

export default PlaylistPanel;