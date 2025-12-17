import React, { useEffect, useRef, useState, useMemo } from 'react';

// --- Types & Data ---

// Content Data
const RESUME_DATA = {
  about: {
    introLine: [
        "일상에 스며드는 디자인을 추구하는",
        "프로덕트 디자이너 김가경입니다."
    ],
    desc1: [
      "25년 현재, 음악의 트렌드는 무엇일까요?",
      "바로 Easy Listening입니다.",
      "복잡한 정보와 자극적인 콘텐츠 속에서,",
      "사람들은 점점 더 편안하게 흘러가는",
      "이지리스닝 음악에 위로를 받습니다.",
      "저는 디자인도 이와 같아야 한다고 믿습니다."
    ],
    desc2: [
      "디자인이 스스로를 내세우며",
      "사용자의 생각을 멈추게 하기보다,",
      "다음 단계를 직관적으로 알 수 있도록",
      "편안한 흐름을 만드는 것에 집중합니다.",
      "필요할 때는 시선을 사로잡는 하이라이트를",
      "주되, 궁극적으로는 사용자가 자연스럽게",
      "원하는 목적지에 도달하게 돕는 것.",
      "그런 디자인을 하는 디자이너가 되고 싶습니다."
    ],
    desc3: [
      "이 서랍장에 담긴 음반들은",
      "명반처럼 세련되지는 않았을 지 모릅니다.",
      "하지만 사용자의 일상에 가장 편안한 멜로디,",
      "익숙한 멜로디로 스며들기 위해 끊임없이",
      "고민하고 다듬어온 과정, 그 자체입니다."
    ],
    advantages: [
        "# Enthusiastic", "# Responsible",
        "# Adaptable", "# Leadership-oriented"
    ],
    contact: {
      insta: "@gyung53",
      email: "gyung0353@gmail.com",
      birth: "2003.05.03",
      residence: "경기도 용인"
    }
  },
  skills: {
    design: [
      {
        title: 'Illustrator',
        desc: '아이콘, 로고, 그래픽 일러스트 등\n벡터기반의 그래픽을 제작할 때\n사용합니다. 확대/축소에도 화질이\n깨지지 않는 선명한 결과물이\n 필요할 때 주로 활용합니다.',
        sub: 'It is used for creating\nvector-based graphics such as\nicons, logos, and illustrations.'
      },
      {
        title: 'Figma & XD',
        desc: '초기 와이어프레임 설계부터\n고해상도 디자인 시안을 완성하거나,\n디자인 시스템을 구축/관리할 때\n활용합니다. 또한 앱 특성상 팀원들의\n움직임을 실시간으로 볼 수 있어,\n회의 과정에서도 활용합니다.',
        sub: 'Used from the initial wireframe\ndesign to the creation of\nhigh-resolution mockups\nand design systems.'
      },
      {
        title: 'Photoshop',
        desc: '픽셀기반의 이미지를 편집, 합성,\n보정할 때 사용합니다.\n주로 목업과 같이 디자인 시안을\n실제 사물에 합성해 예상 결과를\n확인하거나, 여러 이미지 간의\n스타일 통일감을 맞추기 위한\n색상 보정 작업에 활용합니다.',
        sub: 'It is used for editing,\ncompositing, and retouching\npixel-based images.'
      },
      {
        title: 'After Effects',
        desc: '모션그래픽 등 영상을 제작할 수 있는\n툴로서, 주로 UI 디자인 시안이나\n서비스의 핵심 기능을 소개하는 \n홍보영상을 제작할 때 활용합니다.',
        sub: 'A tool for creating motion\ngraphics and videos, mainly\nused to produce promotional\nclips.'
      }
    ],
    threeD: [
       {
        title: 'Indesign',
        desc: '인쇄물 및 디지털 문서의 레이아웃을\n편집하는 툴로서, 용량이 작은 것이\n장점입니다. 주로 텍스트와 이미지가\n많은 문서를 제작할 때 활용합니다.',
        sub: 'A tool for editing layouts of\nprinted and digital documents,\nknown for its small file size.'
       },
       {
        title: 'Blender',
        desc: 'UI, 출판, 영상 등 다양한 디자인\n분야의 시각적 완성도를 높이기 위해\n입체감 있는 3D 그래픽 에셋을\n제작할 때 활용합니다.',
        sub: 'Used to create realistic\n3D graphic assets that enhance\nthe visual quality of various\ndesign fields.'
       }
    ],
    dev: [
      {
        title: 'HTML',
        desc: '웹 페이지의 기본 구조와 뼈대를\n만드는 마크업 언어로서, 웹 개발 시\nCSS와 JavaScript가 적용될 기본\n토대를 만들 때 활용합니다.',
        sub: 'A markup language used to\nbuild the basic structure and\nframework of web pages.'
      },
      {
        title: 'CSS',
        desc: 'HTML로 만든 구조 위에 폰트, 색상,\n간격 등 디자인 시안을 구현하거나,\n반응형 웹을 제작하여 다양한\n디바이스에 대응할 때 활용합니다.',
        sub: 'Used to implement design\nelements such as fonts, colors,\nand spacing on structures.'
      },
      {
        title: 'JavaScript',
        desc: 'CSS만으로 구현하기 어려운 복잡한\n애니메이션 효과나, 사용자의 행동에\n반응하는 기능을 만들 때 활용합니다.',
        sub: 'Used to create complex\nanimation effects and\ninteractive features.'
      },
      {
        title: 'GitHub',
        desc: 'HTML/CSS/JS로 작성한 프로젝트의\n소스 코드를 저장하고 변경 이력을\n관리하거나, GitHub Pages를 \n이용해 포트폴리오나 프로젝트 사이트를\n웹에 호스팅할 때 활용합니다.',
        sub: 'Used to store source code and\nmanage version history for\nprojects built with HTML, CSS,\nand JS.'
      }
    ],
    ai: [
       {
        title: 'Gemini',
        desc: '리서치 과정에서 논문 요약 및\n근거자료 서치에 활용하거나,\n필요한 문장 초안을 작성할 때,\n혹은 프로젝트의 전반적인 흐름을\n정리하는 용도로 활용합니다.',
        sub: 'Used to summarize papers\nand search for supporting data\nduring research.'
       },
       {
        title: 'Midjourney',
        desc: '디자인 초기 단계에 시각적 컨셉이나\n무드보드 아이디어를 빠르게\n탐색하거나, 디자인에 사용할\n이미지를 생성할 때 활용합니다.',
        sub: 'Used in the early stages\nof design to quickly explore\nvisual concepts.'
       },
       {
        title: 'Claude',
        desc: '복잡한 JavaScript 로직을\n구현하거나, 코드의 디버깅 및\n최적화를 위해 활용합니다.',
        sub: 'Used to implement complex\nJavaScript logic, as well as\nfor code debugging.'
       },
       {
        title: 'Notion',
        desc: '문서 작성 및 협업 툴로서,\n주로 수집한 자료를 아카이빙하거나,\n프로젝트의 일정을 관리하고\n진행 상황을 공유할 때 활용합니다.',
        sub: 'A document creation and\ncollaboration tool, mainly used\nfor archiving.'
       },
       {
        title: 'Chat GPT',
        desc: '아이디어를 브레인스토밍 하거나,\n여러 아이디어를 정리할 때\n주로 활용합니다.',
        sub: 'Mainly used for brainstorming\nand organizing ideas.'
       }
    ]
  }
};

// Dimensions for each item
const ITEM_DIMENSIONS: Record<number, { width: number; height: number }> = {
  1: { width: 432, height: 300 },
  2: { width: 887, height: 500 },
  3: { width: 610, height: 424 },
  4: { width: 380, height: 300 },
  5: { width: 500, height: 500 },
  6: { width: 1039, height: 468 },
  7: { width: 344, height: 468 },
  8: { width: 344, height: 730 },
  9: { width: 891, height: 500 },
  10: { width: 500, height: 500 },
  11: { width: 552, height: 650 },
  12: { width: 671, height: 400 },
  13: { width: 375, height: 600 },
};

// --- Video Component ---
const VideoItem = React.memo(({ src, width, height }: { src: string, width: number, height: number }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Sync state: check if playing
    setIsPlaying(!video.paused && !video.ended);

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  const handleClick = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  return (
    <div 
      className="relative flex-shrink-0 bg-gray-100 cursor-pointer overflow-hidden rounded-[20px]"
      style={{ width: `${width}px`, height: `${height}px` }}
      onClick={handleClick}
    >
      <video 
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover block"
        muted
        loop
        playsInline
      />
      
      <div 
        className={`absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity duration-300 ${isPlaying ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <div className="bg-white/90 backdrop-blur-sm px-6 py-2 rounded-full border border-gray-200 shadow-sm transition-transform duration-300 hover:scale-105">
           <span className="text-sm font-bold text-black tracking-wide">Click to play!</span>
        </div>
      </div>
    </div>
  );
});

interface InfoPageProps {
    onThemeChange?: (isDark: boolean) => void;
}

const InfoPage: React.FC<InfoPageProps> = ({ onThemeChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef(0);
  
  // Animation States
  const [lineWidthProgress, setLineWidthProgress] = useState(0); 
  const [lineHeightProgress, setLineHeightProgress] = useState(0); 
  const [trackTransformX, setTrackTransformX] = useState(0);
  const [yearText, setYearText] = useState("2024");
  
  // UI States
  const [isPaperUnfolded, setIsPaperUnfolded] = useState(false); 
  const [isAnimOpen, setIsAnimOpen] = useState(false); // Controls the 3D unfold animation
  const [isDarkBg, setIsDarkBg] = useState(false);
  
  // Measurements
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [maxScroll, setMaxScroll] = useState(5000); 
  
  // Constants
  const TOTAL_ITEMS = 13;
  const GAP = 20; 
  const SQUARE_WIDTH = 450; 
  const SQUARE_MARGIN_LEFT = 800; 
  const START_OFFSET = windowSize.width * 0.8;
  const END_SPACER_WIDTH = Math.max(0, (windowSize.width / 2) - (SQUARE_WIDTH / 2));
  
  const items = useMemo(() => Array.from({ length: TOTAL_ITEMS }, (_, i) => {
    const id = i + 1;
    const isVideo = id === 2 || id === 9;
    const ext = isVideo ? 'mp4' : 'png';
    return { id, isVideo, src: `/public/info-${id}.${ext}` };
  }), []);

  // Pre-calculate accumulated widths for parallax logic
  const accumulatedWidths = useMemo(() => {
    const arr = [0];
    let current = 0;
    for(let i = 1; i <= TOTAL_ITEMS; i++) {
        const dims = ITEM_DIMENSIONS[i] || { width: 500, height: 500 };
        current += dims.width + GAP;
        arr.push(current);
    }
    return arr;
  }, []);

  // Update Parent Theme (Header Color)
  useEffect(() => {
    if (onThemeChange) {
        onThemeChange(isDarkBg);
    }
  }, [isDarkBg, onThemeChange]);

  const getAccumulatedWidth = (endIndex: number) => {
      // Use memoized array for performance if needed, but this function handles specific end index
      // Keeping logic consistent with existing pattern
      let width = 0;
      for (let i = 0; i < endIndex; i++) {
          const dims = ITEM_DIMENSIONS[i + 1] || { width: 500, height: 500 };
          width += dims.width + GAP;
      }
      return width;
  };

  const item11StartOffset = useMemo(() => START_OFFSET + getAccumulatedWidth(10), [START_OFFSET]);
  const squareStartOffset = useMemo(() => START_OFFSET + getAccumulatedWidth(TOTAL_ITEMS) + SQUARE_MARGIN_LEFT - GAP, [START_OFFSET]);

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

      if (scrollY > widthAnimStart) {
          const p = Math.min((scrollY - widthAnimStart) / (widthAnimEnd - widthAnimStart), 1);
          setLineWidthProgress(p);
      } else {
          setLineWidthProgress(0);
      }

      if (scrollY > heightAnimStart) {
          const p = Math.min((scrollY - heightAnimStart) / (heightAnimEnd - heightAnimStart), 1);
          setLineHeightProgress(p);
          setIsDarkBg(p > 0.9);
      } else {
          setLineHeightProgress(0);
          setIsDarkBg(false);
      }

      const viewportCenterInWorld = scrollY + (windowSize.width / 2);
      if (viewportCenterInWorld >= squareStartOffset) {
          setYearText("NOW");
      } else if (viewportCenterInWorld >= item11StartOffset) {
          setYearText("2025");
      } else {
          setYearText("2024");
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [maxScroll, isPaperUnfolded, item11StartOffset, squareStartOffset, windowSize.width]);

  // Unfold Animation Logic
  const openPaper = () => {
    setIsPaperUnfolded(true);
    // Slight delay to trigger animation after mount
    setTimeout(() => setIsAnimOpen(true), 50);
  };

  const closePaper = () => {
    setIsAnimOpen(false);
    // Wait for animation (total duration depends on delay+transition)
    // 6 pages * 0.15s delay + 0.8s duration ~ 1.7s
    setTimeout(() => setIsPaperUnfolded(false), 1400); 
  };

  const getStaggeredWidth = (index: number) => {
      if (index === 2) return '100%'; 
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
  const TOTAL_PAGES = 6;
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
    transitionDelay: isAnimOpen ? `${index * 0.15}s` : `${(TOTAL_PAGES - index - 1) * 0.1}s`,
    backfaceVisibility: 'hidden' as const,
    transformStyle: 'preserve-3d' as const,
    position: 'relative' as const,
    zIndex: 50 - index,
    width: '100%',
    height: '700px' // FORCE SQUARE 700px (matching width)
  });

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full h-screen overflow-hidden transition-colors duration-500 ${isDarkBg ? 'bg-[#555555]' : 'bg-white'}`}
    >
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      {/* Floating Year */}
      <div className={`fixed left-1/2 -translate-x-1/2 bottom-[5%] z-0 pointer-events-none transition-colors duration-500`}>
        <p className={`text-[60px] font-bold leading-none tracking-tighter transition-all duration-500 text-[#333333]`}>
            {yearText}
        </p>
      </div>

      {/* Background Lines */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={getLineStyle(i)} />
        ))}
      </div>

      {/* Horizontal Track */}
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
        {items.map((item, index) => {
          const dims = ITEM_DIMENSIONS[item.id] || { width: 500, height: 500 };
          const isTargetForBubby = item.id >= 6 && item.id <= 8;
          let bubbyLocalLeft = 0;

          if (isTargetForBubby) {
              const startOf6 = START_OFFSET + accumulatedWidths[5]; // Index 5 is Item 6
              const startOf8 = START_OFFSET + accumulatedWidths[7]; // Index 7 is Item 8
              const widthOf8 = ITEM_DIMENSIONS[8].width;
              
              const itemStart = START_OFFSET + accumulatedWidths[index]; // Current Item Start
              
              // 1. Trigger: When Info-6's Left Edge hits the CENTER of the screen.
              const screenCenter = trackTransformX + (windowSize.width / 2);
              
              // Only start incrementing delta if screenCenter > startOf6
              const scrollDelta = Math.max(0, screenCenter - startOf6);
              
              // 2. Position Calculation
              // Start at the very left edge of Info-6 (startOf6)
              // Speed factor to ensure it travels across
              const bubbySpeed = 0.85; 
              let bubbyGlobalX = startOf6 + (scrollDelta * bubbySpeed);

              // 3. Stop Point: 30% of Info-8
              const stopPoint = startOf8 + (widthOf8 * 0.8);
              
              // Cap the movement
              bubbyGlobalX = Math.min(bubbyGlobalX, stopPoint);
              
              // Convert to local coordinate
              bubbyLocalLeft = bubbyGlobalX - itemStart;
          }

          return (
            <div 
                key={item.id} 
                className={`relative flex-shrink-0 flex items-center justify-center ${isTargetForBubby ? 'overflow-hidden' : ''}`}
            >
              {item.isVideo ? (
                <VideoItem src={item.src} width={dims.width} height={dims.height} />
              ) : (
                <>
                    <img 
                      src={item.src} 
                      alt={`Info ${item.id}`}
                      className="object-cover transition-all rounded-[20px] relative z-0" 
                      style={{ width: `${dims.width}px`, height: `${dims.height}px` }}
                    />
                    {isTargetForBubby && (
                        <img 
                            src="/public/info-bubby.png" 
                            alt="Bubby Decoration"
                            className="absolute z-10 pointer-events-none max-w-none" 
                            style={{ 
                                left: `${bubbyLocalLeft}px`,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: '402px', 
                                height: '392px',
                                willChange: 'left'
                            }} 
                        />
                    )}
                </>
              )}
            </div>
          );
        })}

        {/* Square Trigger */}
        <div 
            className="relative flex-shrink-0 flex items-center justify-center"
            style={{ marginLeft: `${SQUARE_MARGIN_LEFT}px` }}
        >
             <div 
                className="bg-white rounded-[2px] shadow-2xl flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                style={{ width: `${SQUARE_WIDTH}px`, height: `${SQUARE_WIDTH}px` }}
                onClick={openPaper}
             />
        </div>

        <div style={{ width: `${END_SPACER_WIDTH}px`, height: '1px', flexShrink: 0 }} />
      </div>

      {/* Contact Info (Visible on Dark Bg) */}
      <div 
        className={`fixed right-32 bottom-32 z-20 text-left pointer-events-none transition-all duration-1000 ease-out ${isDarkBg ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
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
          className="fixed inset-0 z-50 flex justify-center overflow-y-auto bg-black/30 backdrop-blur-sm no-scrollbar"
          onClick={closePaper}
        >
            <div 
                className="relative my-20 w-[700px] pointer-events-auto"
                style={{ perspective: '1200px' }}
                onClick={(e) => e.stopPropagation()} 
            >
                {/* Close Button Inside (Relative to Lyrics Sheet) */}
                <button 
                  className={`absolute -right-12 top-0 text-white text-3xl font-light hover:rotate-90 transition-transform duration-300 ${isAnimOpen ? 'opacity-100' : 'opacity-0'}`}
                  onClick={closePaper}
                >
                    ✕
                </button>

                {/* Page 0: Header */}
                <div style={getPageStyle(0)}>
                    <div className="w-full border-b-2 border-black pb-4 mb-8 flex justify-between items-end">
                        <h1 className="text-4xl font-black tracking-normal">KAKYUNG KIM</h1>
                        <span className="text-sm font-bold text-gray-400">PORTFOLIO 2025</span>
                    </div>
                    <div className="flex flex-col items-center justify-center py-10">
                         <p className="text-5xl font-black mb-4 tracking-normal">NOW</p>
                         <p className="text-gray-500 font-serif italic">Resume & Story</p>
                    </div>
                </div>

                {/* Page 1: ABOUT */}
                <div style={getPageStyle(1)}>
                    <h2 className="text-2xl font-bold mb-8 uppercase tracking-normal">About</h2>
                    <div className="flex gap-10 h-[550px] pb-4">
                         {/* LEFT COLUMN */}
                         <div className="w-[200px] flex-shrink-0 flex flex-col h-full">
                            {/* Profile Image */}
                            <div className="w-full aspect-[4/5] bg-gray-200 overflow-hidden mb-6 shadow-sm flex-shrink-0">
                                 <img src="/public/info-profile.png" alt="Profile" className="w-full h-full object-cover" 
                                      onError={(e) => e.currentTarget.style.display='none'} 
                                 /> 
                            </div>
                            
                            {/* Intro Line - Moved Here */}
                            <div className="text-[14px] leading-snug mb-auto break-keep">
                               <p className="font-normal text-gray-800 mb-1">{RESUME_DATA.about.introLine[0]}</p>
                               <div className="mb-1">
                                    <span className="font-bold text-black border-b-2 border-black pb-0.5">프로덕트 디자이너 김가경</span>
                                    <span className="font-normal text-black">입니다.</span>
                               </div>
                            </div>

                            {/* Contact Info - Moved to Bottom */}
                            <div className="text-[12px] font-medium text-gray-800 space-y-2 mt-4">
                                <div className="flex items-center"><span className="w-20 font-bold text-gray-500">Name</span> <span className="font-bold">김가경</span></div>
                                <div className="flex items-center"><span className="w-20 font-bold text-gray-500">Birth</span> <span className="font-bold">{RESUME_DATA.about.contact.birth}</span></div>
                                <div className="flex items-center"><span className="w-20 font-bold text-gray-500">Residence</span> <span className="font-bold">{RESUME_DATA.about.contact.residence}</span></div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN */}
                        <div className="flex-1 text-[13px] leading-[1.4] font-medium text-gray-800 pt-2 pl-6 flex flex-col justify-between h-full">
                             <div className="space-y-6">
                                 <p>
                                   {RESUME_DATA.about.desc1.map((l, i) => <React.Fragment key={i}>{l}<br/></React.Fragment>)}
                                 </p>
                                 <p>
                                   {RESUME_DATA.about.desc2.map((l, i) => <React.Fragment key={i}>{l}<br/></React.Fragment>)}
                                 </p>
                                 <p>
                                   {RESUME_DATA.about.desc3.map((l, i) => <React.Fragment key={i}>{l}<br/></React.Fragment>)}
                                 </p>
                             </div>

                             {/* Advantage Section */}
                             <div className="mt-4">
                                <h3 className="text-xl font-bold mb-4">Advantage</h3>
                                <div className="grid grid-cols-2 gap-y-1 gap-x-4 text-[13px] font-medium text-gray-800">
                                    {RESUME_DATA.about.advantages.map((tag, i) => (
                                        <span key={i}>{tag}</span>
                                    ))}
                                </div>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Page 2: Design Skills */}
                <div style={getPageStyle(2)}>
                    <div className="mb-8 relative inline-block">
                        <span className="relative z-10 text-2xl font-bold tracking-normal uppercase">SkillList</span>
                        <span className="absolute left-0 bottom-1 w-full h-3 bg-cyan-100 -z-0"></span>
                    </div>
                    <div className="grid grid-cols-2 gap-10">
                        {RESUME_DATA.skills.design.map((skill, idx) => (
                            <div key={idx}>
                                <h3 className="text-xl font-bold mb-2">{skill.title}</h3>
                                <p className="text-[13px] text-gray-700 leading-normal whitespace-pre-line">{skill.desc}</p>
                                <p className="text-[11px] text-gray-400 font-light mt-1 whitespace-pre-line leading-[1.3]">{skill.sub}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Page 3: 3D Skills */}
                <div style={getPageStyle(3)}>
                     <div className="mb-8 relative inline-block">
                        <span className="relative z-10 text-2xl font-bold tracking-normal uppercase">SkillList</span>
                        <span className="absolute left-0 bottom-1 w-full h-3 bg-cyan-100 -z-0"></span>
                    </div>
                    <div className="space-y-10">
                        {RESUME_DATA.skills.threeD.map((skill, idx) => (
                            <div key={idx}>
                                <h3 className="text-xl font-bold mb-2">{skill.title}</h3>
                                <p className="text-[13px] text-gray-700 leading-normal whitespace-pre-line">{skill.desc}</p>
                                <p className="text-[11px] text-gray-400 font-light mt-1 whitespace-pre-line leading-[1.3]">{skill.sub}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Page 4: Dev Skills */}
                <div style={getPageStyle(4)}>
                    <div className="mb-8 relative inline-block">
                        <span className="relative z-10 text-2xl font-bold tracking-normal uppercase">SkillList</span>
                        <span className="absolute left-0 bottom-1 w-full h-3 bg-cyan-100 -z-0"></span>
                    </div>
                    <div className="grid grid-cols-2 gap-10">
                        {RESUME_DATA.skills.dev.map((skill, idx) => (
                            <div key={idx}>
                                <h3 className="text-xl font-bold mb-2">{skill.title}</h3>
                                <p className="text-[13px] text-gray-700 leading-normal whitespace-pre-line">{skill.desc}</p>
                                <p className="text-[11px] text-gray-400 font-light mt-1 whitespace-pre-line leading-[1.3]">{skill.sub}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Page 5: AI Skills */}
                <div style={getPageStyle(5)}>
                    <div className="mb-8 relative inline-block">
                        <span className="relative z-10 text-2xl font-bold tracking-normal uppercase">SkillList</span>
                        <span className="absolute left-0 bottom-1 w-full h-3 bg-cyan-100 -z-0"></span>
                    </div>
                    <div className="grid grid-cols-2 gap-10">
                        {RESUME_DATA.skills.ai.map((skill, idx) => (
                            <div key={idx}>
                                <h3 className="text-xl font-bold mb-2">{skill.title}</h3>
                                <p className="text-[13px] text-gray-700 leading-normal whitespace-pre-line">{skill.desc}</p>
                                <p className="text-[11px] text-gray-400 font-light mt-1 whitespace-pre-line leading-[1.3]">{skill.sub}</p>
                            </div>
                        ))}
                    </div>
                    {/* Extra bottom margin for scroll area */}
                    <div className="h-32"></div>
                </div>

            </div>
        </div>
      )}

    </div>
  );
};

export default InfoPage;