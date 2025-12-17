import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Project } from '../types';
import { PROJECTS } from '../constants';

interface PlaylistPanelProps {
  currentProject: Project | null;
  onSelectProject: (id: number) => void;
  onClose: () => void;
}

const PlaylistPanel: React.FC<PlaylistPanelProps> = ({ currentProject, onSelectProject, onClose }) => {
  const [viewMode, setViewMode] = useState<'playingNext' | 'overview'>('overview');
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const triggerRef = useRef(false);
  
  // State Reset Pattern: Check if project ID changed during render
  const [lastProjectId, setLastProjectId] = useState<number | undefined>(currentProject?.id);

  if (currentProject?.id !== lastProjectId) {
    setLastProjectId(currentProject?.id);
    setViewMode('overview');
    setProgress(0);
    setIsPlaying(true);
    triggerRef.current = false;
  }

  // Playing Next를 위한 순환 리스트 생성 (현재 프로젝트 다음부터 시작)
  const orderedProjects = useMemo(() => {
    if (!currentProject) return [];
    const currentIndex = PROJECTS.findIndex(p => p.id === currentProject.id);
    if (currentIndex === -1) return [];

    const after = PROJECTS.slice(currentIndex + 1);
    const before = PROJECTS.slice(0, currentIndex);
    return [...after, ...before];
  }, [currentProject]);

  // Auto-play interval
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying && currentProject) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) return 100; // Cap at 100
          return prev + 0.5; // Speed of progress
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentProject]);

  // Handle track switch when progress finishes
  useEffect(() => {
    if (progress >= 100 && currentProject && !triggerRef.current) {
        triggerRef.current = true; // 실행 잠금
        const currentIndex = PROJECTS.findIndex(p => p.id === currentProject.id);
        if (currentIndex !== -1) {
            const nextIndex = (currentIndex + 1) % PROJECTS.length;
            const nextId = PROJECTS[nextIndex].id;
            onSelectProject(nextId);
        }
    }
  }, [progress, currentProject, onSelectProject]);

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'playingNext' ? 'overview' : 'playingNext');
  };

  const handleNext = () => {
    if (!currentProject) return;
    const currentIndex = PROJECTS.findIndex(p => p.id === currentProject.id);
    if (currentIndex !== -1) {
        const nextIndex = (currentIndex + 1) % PROJECTS.length;
        onSelectProject(PROJECTS[nextIndex].id);
    }
  };

  const handlePrev = () => {
    if (!currentProject) return;
    const currentIndex = PROJECTS.findIndex(p => p.id === currentProject.id);
    if (currentIndex !== -1) {
        const prevIndex = (currentIndex - 1 + PROJECTS.length) % PROJECTS.length;
        onSelectProject(PROJECTS[prevIndex].id);
    }
  };

  // List View
  if (!currentProject) {
    return (
      <div className="fixed right-0 md:right-[80px] top-1/2 -translate-y-1/2 w-full md:w-[523px] px-4 md:px-0 max-h-[90vh] z-50 flex flex-col pointer-events-none animate-slideInRight">
        <div className="w-full max-h-[80vh] overflow-y-auto bg-white/95 backdrop-blur-md rounded-[20px] shadow-2xl p-[30px] pointer-events-auto">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-base font-bold text-primary tracking-wider">PLAYLIST</h2>
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
                <span>{currentProject.startDate}</span>
                <span>{currentProject.endDate}</span>
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
                    {orderedProjects.map(p => (
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
                
                <div className="text-sm leading-relaxed text-gray-600 animate-fadeInDown overflow-y-auto pr-2 flex-1 mb-4">
                    <p className="font-bold text-black mb-2">Overview</p>
                    {currentProject.overview}
                </div>

                <div className="flex gap-2.5 mt-auto pt-4 border-t border-gray-100">
                    <a
                        href={currentProject.landingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-center px-4 py-2.5 rounded-xl text-[13px] font-bold bg-primary text-white hover:bg-purple-700 hover:-translate-y-0.5 transition-all shadow-md"
                    >
                        Landing Page ↗
                    </a>
                    <a
                        href={currentProject.prototypeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-center px-4 py-2.5 rounded-xl text-[13px] font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 hover:-translate-y-0.5 transition-all"
                    >
                        Prototype ↗
                    </a>
                    {/* 3rd Button (Conditionally Rendered) */}
                    {currentProject.codeUrl && (
                        <a
                            href={currentProject.codeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 text-center px-4 py-2.5 rounded-xl text-[13px] font-bold bg-black text-white hover:bg-gray-800 hover:-translate-y-0.5 transition-all shadow-md"
                        >
                            Code ↗
                        </a>
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