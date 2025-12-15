import React, { useEffect, useRef, useState } from 'react';

// Content Data for the Resume/Paper
const RESUME_DATA = {
  about: {
    title: "ABOUT",
    desc: [
      "25년 현재, 음악의 트렌드는 무엇일까요?",
      "바로 Easy Listening입니다.",
      "복잡한 정보와 자극적인 콘텐츠 속에서,",
      "사람들은 점점 더 편안하게 흘러가는",
      "이지리스닝 음악에 위로를 받습니다.",
      "저는 디자인도 이와 같아야 한다고 믿습니다.",
      <br key="br1" />,
      "디자인이 스스로를 내세우며",
      "사용자의 생각을 멈추게 하기보다,",
      "다음 단계를 직관적으로 알 수 있도록",
      "편안한 흐름을 만드는 것에 집중합니다.",
      "필요할 때는 시선을 사로잡는 하이라이트를",
      "주되, 궁극적으로는 사용자가 자연스럽게",
      "원하는 목적지에 도달하게 돕는 것.",
      "그런 디자인을 하는 디자이너가 되고 싶습니다.",
      <br key="br2" />,
      "이 서랍장에 담긴 음반들은",
      "명반처럼 세련되지는 않았을 지 모릅니다.",
      "하지만 사용자의 일상에 가장 편안한 멜로디, 익",
      "숙한 멜로디로 스며들기 위해 끊임없이",
      "고민하고 다듬어온 과정, 그 자체입니다."
    ],
    tags: ["#Passionate", "#Detail-oriented", "#Creative", "#Listener", "#Communicator", "#Problem-solver"],
    contact: {
      insta: "@gyung53",
      email: "gyung0353@gmail.com",
      birth: "2003.05.03",
      residence: "경기도 용인"
    }
  },
  skills: [
    {
      name: "Illustrator",
      desc: "아이콘, 로고, 그래픽 일러스트 등 벡터기반의 그래픽을 제작할 때 사용합니다. 확대/축소에도 화질이 깨지지 않는 선명한 결과물이 필요할 때 주로 활용합니다.",
      sub: "It is used for creating vector-based graphics such as icons, logos, and illustrations."
    },
    {
      name: "Photoshop",
      desc: "픽셀기반의 이미지를 편집, 합성, 보정할 때 사용합니다. 주로 목업과 같이 디자인 시안을 실제 사물에 합성해 예상 결과를 확인하거나, 여러 이미지 간의 스타일 통일감을 맞추기 위한 색상 보정 작업에 활용합니다.",
      sub: "It is used for editing, compositing, and retouching pixel-based images."
    },
    {
      name: "Figma & XD",
      desc: "초기 와이어프레임 설계부터 고해상도 디자인 시안을 완성하거나, 디자인 시스템을 구축/관리할 때 활용합니다. 또한 앱 특성상 팀원들의 움직임을 실시간으로 볼 수 있어, 회의 과정에서도 활용합니다.",
      sub: "Used from the initial wireframe design to the creation of high-resolution mockups and design systems."
    },
    {
      name: "After Effects",
      desc: "모션그래픽 등 영상을 제작할 수 있는 툴로서, 주로 UI 디자인 시안이나 서비스의 핵심 기능을 소개하는 홍보 영상을 제작할 때 활용합니다.",
      sub: "A tool for creating motion graphics and videos, mainly used to produce promotional clips."
    }
  ]
};

const InfoPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef(0);
  
  // Animation States
  const [lineWidthProgress, setLineWidthProgress] = useState(0); // 0 to 1
  const [lineHeightProgress, setLineHeightProgress] = useState(0); // 0 to 1
  const [trackTransformX, setTrackTransformX] = useState(0);
  
  // UI States
  const [isPaperUnfolded, setIsPaperUnfolded] = useState(false); // Controls rendering of the overlay
  const [isAnimOpen, setIsAnimOpen] = useState(false); // Controls the CSS transition state
  const [isDarkBg, setIsDarkBg] = useState(false);
  
  // Measurements
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [maxScroll, setMaxScroll] = useState(5000); 
  
  // Constants
  const TOTAL_ITEMS = 13;
  const GAP = 20; 
  const SQUARE_WIDTH = 450; 
  const SQUARE_MARGIN_LEFT = 800; 
  
  // Derived Constants
  const START_OFFSET = windowSize.width * 0.8;
  const END_SPACER_WIDTH = Math.max(0, (windowSize.width / 2) - (SQUARE_WIDTH / 2));
  
  // Generate Items
  const items = Array.from({ length: TOTAL_ITEMS }, (_, i) => {
    const id = i + 1;
    const isVideo = id === 2 || id === 9;
    const ext = isVideo ? 'mp4' : 'png';
    return {
      id,
      isVideo,
      src: `/public/info-${id}.${ext}`,
    };
  });

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Measure Content & Max Scroll
  useEffect(() => {
    const updateMaxScroll = () => {
        if(trackRef.current) {
            const scrollWidth = trackRef.current.scrollWidth;
            const clientWidth = window.innerWidth;
            const total = scrollWidth - clientWidth;
            setMaxScroll(total > 0 ? total : 0);
        }
    };

    const observer = new ResizeObserver(updateMaxScroll);
    if (trackRef.current) observer.observe(trackRef.current);
    
    updateMaxScroll();

    return () => observer.disconnect();
  }, [windowSize, isPaperUnfolded]);

  // Scroll Handling
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (isPaperUnfolded) return;
      
      e.preventDefault();
      scrollRef.current += e.deltaY;
      scrollRef.current = Math.max(0, Math.min(scrollRef.current, maxScroll));
      
      requestAnimationFrame(update);
    };

    const update = () => {
      const scrollY = scrollRef.current;
      setTrackTransformX(scrollY);

      const triggerPoint = maxScroll - 1250;
      
      const widthAnimStart = triggerPoint; 
      const widthAnimEnd = maxScroll - 300; 
      
      const heightAnimStart = maxScroll - 300;
      const heightAnimEnd = maxScroll;

      // 1. Width Expansion Logic
      if (scrollY > widthAnimStart) {
          const p = Math.min((scrollY - widthAnimStart) / (widthAnimEnd - widthAnimStart), 1);
          setLineWidthProgress(p);
      } else {
          setLineWidthProgress(0);
      }

      // 2. Height Thickening Logic
      if (scrollY > heightAnimStart) {
          const p = Math.min((scrollY - heightAnimStart) / (heightAnimEnd - heightAnimStart), 1);
          setLineHeightProgress(p);
          setIsDarkBg(p > 0.9);
      } else {
          setLineHeightProgress(0);
          setIsDarkBg(false);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [maxScroll, isPaperUnfolded]);

  const handleVideoClick = (e: React.MouseEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const openPaper = () => {
    setIsPaperUnfolded(true);
    // Slight delay to allow mount then trigger animation
    setTimeout(() => setIsAnimOpen(true), 50);
  };

  const closePaper = () => {
    setIsAnimOpen(false);
    // Wait for animation to finish before unmounting (5 pages * delay + duration)
    // Delay max approx 0.6s, duration 0.8s -> ~1.5s safe
    setTimeout(() => setIsPaperUnfolded(false), 1200); 
  };

  // Staggered Animation for Lines
  const getStaggeredWidth = (index: number) => {
      if (index === 2) return '100%'; 

      // Sequence: 3 -> 1 -> 4 -> 0
      let start = 0;
      const duration = 0.5;

      switch(index) {
          case 3: start = 0.0; break; 
          case 1: start = 0.15; break;
          case 4: start = 0.3; break;
          case 0: start = 0.45; break; 
          default: start = 0;
      }

      const localP = (lineWidthProgress - start) / duration;
      const clamped = Math.max(0, Math.min(1, localP));
      return `${clamped * 100}%`;
  };

  const getLineStyle = (index: number) => {
      const baseOffset = (index - 2) * 80; 
      const initialHeight = 2;
      const finalHeight = (windowSize.height / 5) + 2; 
      const currentHeight = initialHeight + (finalHeight - initialHeight) * lineHeightProgress;
      const targetOffset = (index - 2) * (windowSize.height / 5); 
      const currentOffset = baseOffset * (1 - lineHeightProgress) + targetOffset * lineHeightProgress;

      return {
          height: `${currentHeight}px`,
          width: getStaggeredWidth(index),
          top: `calc(50% + ${currentOffset}px)`,
          right: 0, 
          position: 'absolute' as const,
          transform: 'translateY(-50%)',
          backgroundColor: '#555555',
          zIndex: 0,
          transition: 'none', 
      };
  };

  // Helper for accordion page style
  const getPageStyle = (index: number) => ({
    backgroundColor: '#ffffff',
    padding: '50px 60px',
    marginBottom: '-1px', 
    borderBottom: '1px dashed #ddd',
    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
    transformOrigin: 'top center',
    transform: isAnimOpen ? 'rotateX(0deg)' : 'rotateX(-90deg)',
    opacity: isAnimOpen ? 1 : 0,
    transition: 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.8s ease',
    // Open: staggered downwards. Close: staggered upwards (reverse)
    transitionDelay: isAnimOpen ? `${index * 0.15}s` : `${(4 - index) * 0.1}s`,
    backfaceVisibility: 'hidden' as const,
    transformStyle: 'preserve-3d' as const,
    position: 'relative' as const,
    zIndex: 50 - index,
    width: '100%',
    minHeight: '300px'
  });

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full h-screen overflow-hidden transition-colors duration-500 ${isDarkBg ? 'bg-[#555555]' : 'bg-white'}`}
    >
      {/* --- Background Lines --- */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={getLineStyle(i)} />
        ))}
      </div>

      {/* --- Horizontal Gallery Track --- */}
      <div 
        ref={trackRef}
        className="absolute top-1/2 left-0 h-auto -translate-y-1/2 flex items-center z-10 will-change-transform"
        style={{ 
            gap: `${GAP}px`, 
            paddingLeft: `${START_OFFSET}px`,
            transform: `translate3d(${-trackTransformX}px, -50%, 0)`,
            opacity: isPaperUnfolded ? 0 : 1, 
            pointerEvents: isPaperUnfolded ? 'none' : 'auto',
            transition: 'opacity 0.5s'
        }}
      >
        {items.map((item) => (
          <div key={item.id} className="relative flex-shrink-0 flex items-center justify-center">
             {item.isVideo ? (
               <video 
                 src={item.src}
                 className="h-[45vh] w-auto object-contain cursor-pointer shadow-lg hover:shadow-2xl transition-all rounded-[20px]" 
                 muted
                 loop
                 playsInline
                 onClick={handleVideoClick}
               />
             ) : (
               <img 
                 src={item.src} 
                 alt={`Info ${item.id}`}
                 className="h-[45vh] w-auto object-contain shadow-lg hover:shadow-2xl transition-all rounded-[20px]" 
               />
             )}
          </div>
        ))}

        {/* --- Square (Lyrics Paper Trigger) --- */}
        <div 
            className="relative flex-shrink-0 flex items-center justify-center"
            style={{ marginLeft: `${SQUARE_MARGIN_LEFT}px` }}
        >
             <div 
                className="bg-white rounded-[2px] shadow-2xl flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                style={{ width: `${SQUARE_WIDTH}px`, height: `${SQUARE_WIDTH}px` }}
                onClick={openPaper}
             >
                 <div className="text-center animate-pulse">
                    <p className="text-4xl font-bold text-[#333]">Now</p>
                 </div>
             </div>
        </div>

        {/* --- End Spacer for Centering --- */}
        <div style={{ width: `${END_SPACER_WIDTH}px`, height: '1px', flexShrink: 0 }} />
      </div>

      {/* --- Contact Info (Fixed Bottom Right) --- */}
      <div 
        className={`fixed right-16 bottom-32 z-20 text-left pointer-events-none transition-all duration-1000 ease-out ${isDarkBg ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
          <div className="mb-8">
              <p className="text-xl text-gray-400 font-light mb-1">Insta</p>
              <p className="text-2xl font-bold text-white tracking-wide">{RESUME_DATA.about.contact.insta}</p>
          </div>
          <div>
              <p className="text-xl text-gray-400 font-light mb-1">E-mail</p>
              <p className="text-2xl font-bold text-white tracking-wide">{RESUME_DATA.about.contact.email}</p>
          </div>
      </div>


      {/* --- Accordion Overlay --- */}
      {isPaperUnfolded && (
        <div 
          className="fixed inset-0 z-50 flex justify-center overflow-y-auto bg-black/30 backdrop-blur-sm"
          onClick={closePaper}
        >
            <div 
                className="relative my-20 w-[700px] pointer-events-auto"
                style={{ perspective: '1200px' }}
                onClick={(e) => e.stopPropagation()} // Prevent close when clicking content
            >
                {/* Close Button */}
                <button 
                  className={`absolute -right-12 top-0 text-white text-3xl font-light hover:rotate-90 transition-transform duration-300 ${isAnimOpen ? 'opacity-100' : 'opacity-0'}`}
                  onClick={closePaper}
                >
                    ✕
                </button>

                {/* Page 1: Header */}
                <div style={getPageStyle(0)}>
                    <div className="w-full border-b-2 border-black pb-4 mb-8 flex justify-between items-end">
                        <h1 className="text-4xl font-black tracking-tighter">KAKYUNG KIM</h1>
                        <span className="text-sm font-bold text-gray-400">PORTFOLIO 2025</span>
                    </div>
                    <div className="flex flex-col items-center justify-center py-10">
                         <p className="text-5xl font-black mb-4">NOW</p>
                         <p className="text-gray-500 font-serif italic">Resume & Story</p>
                    </div>
                </div>

                {/* Page 2: About (Part 1 - Profile & Intro) */}
                <div style={getPageStyle(1)}>
                    <h2 className="text-2xl font-bold mb-8 uppercase tracking-widest">About</h2>
                    <div className="flex gap-10">
                         <div className="w-[180px] flex-shrink-0">
                            <div className="w-[180px] h-[220px] bg-gray-200 overflow-hidden mb-4 shadow-sm">
                                 <img src="/public/info-profile.png" alt="Profile" className="w-full h-full object-cover" 
                                      onError={(e) => e.currentTarget.style.display='none'} 
                                 /> 
                            </div>
                            <div className="text-xs font-bold space-y-1">
                                <p>Name &nbsp; 김가경</p>
                                <p>Birth &nbsp; {RESUME_DATA.about.contact.birth}</p>
                            </div>
                        </div>
                        <div className="flex-1 text-[13px] leading-relaxed font-medium text-gray-800 pt-2">
                             {/* First half of description approx */}
                             {RESUME_DATA.about.desc.slice(0, 10).map((line, idx) => (
                                <React.Fragment key={idx}>
                                    {line}
                                    {typeof line !== 'string' && <div className="h-4" />} 
                                </React.Fragment>
                             ))}
                        </div>
                    </div>
                </div>

                {/* Page 3: About (Part 2 - More Text & Tags) */}
                <div style={getPageStyle(2)}>
                    <div className="text-[13px] leading-relaxed font-medium text-gray-800">
                         {/* Remaining description */}
                         {RESUME_DATA.about.desc.slice(10).map((line, idx) => (
                            <React.Fragment key={idx}>
                                {line}
                                {typeof line !== 'string' && <div className="h-4" />} 
                            </React.Fragment>
                         ))}
                    </div>
                    <div className="mt-12">
                        <h3 className="text-sm font-bold mb-3 uppercase text-gray-400">Keywords</h3>
                        <div className="flex flex-wrap gap-2">
                            {RESUME_DATA.about.tags.map(tag => (
                                <span key={tag} className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full text-xs font-medium">{tag}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Page 4: Skills (Part 1) */}
                <div style={getPageStyle(3)}>
                     <h2 className="text-2xl font-bold mb-8 uppercase tracking-widest">SkillList</h2>
                     <div className="space-y-10">
                        {RESUME_DATA.skills.slice(0, 2).map((skill, idx) => (
                            <div key={idx} className="flex gap-4">
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold mb-2">{skill.name}</h3>
                                    <p className="text-[13px] text-gray-700 leading-normal whitespace-pre-line">{skill.desc}</p>
                                    <p className="text-[11px] text-gray-400 font-light mt-1 italic">{skill.sub}</p>
                                </div>
                            </div>
                        ))}
                     </div>
                </div>

                {/* Page 5: Skills (Part 2) & Footer */}
                <div style={getPageStyle(4)}>
                    <div className="space-y-10 mb-16">
                        {RESUME_DATA.skills.slice(2, 4).map((skill, idx) => (
                            <div key={idx} className="flex gap-4">
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold mb-2">{skill.name}</h3>
                                    <p className="text-[13px] text-gray-700 leading-normal whitespace-pre-line">{skill.desc}</p>
                                    <p className="text-[11px] text-gray-400 font-light mt-1 italic">{skill.sub}</p>
                                </div>
                            </div>
                        ))}
                     </div>
                     
                     <div className="flex justify-center opacity-50 border-t pt-8">
                        <div className="w-8 h-8 rounded-full border border-black flex items-center justify-center text-xs">K</div>
                     </div>
                </div>

            </div>
        </div>
      )}

    </div>
  );
};

export default InfoPage;