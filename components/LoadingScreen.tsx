import React, { useEffect, useRef, useState, useCallback } from 'react';

// ▼▼▼ 로딩 화면 배경 이미지 경로 ▼▼
const LOADING_BG_PATH = "/background.png";

interface LoadingScreenProps {
  onComplete: () => void;
  isAssetLoaded: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete, isAssetLoaded }) => {
  // DOM Refs
  const lpCircleRef = useRef<HTMLDivElement>(null);
  const gaugeProgressRef = useRef<SVGCircleElement>(null);
  const blurImgRef = useRef<HTMLImageElement>(null);
  const welcomeTextRef = useRef<HTMLDivElement>(null);
  const gaugeRingRef = useRef<SVGSVGElement>(null);

  // Logic Refs
  const stateRef = useRef({
    mouseX: window.innerWidth / 2,
    mouseY: window.innerHeight / 2,
    currentX: window.innerWidth / 2,
    currentY: window.innerHeight / 2,
    virtualScrollY: 0,
    loadingComplete: false,       // 게이지가 100% 찼는지
    mainTransitionComplete: false, // 전체 화면 전환 애니메이션이 시작됐는지
    isMouseMoved: false,
    waitingForAsset: false,       // 게이지는 찼으나 에셋 로딩 대기중
  });

  const SCROLL_SPEED = 1.5;
  const LOADING_SCROLL_HEIGHT = window.innerHeight * 1.5;
  const MAIN_SCROLL_HEIGHT = window.innerHeight * 0.5;
  const CIRCUMFERENCE = 2 * Math.PI * 45; // r=45

  const [isExpanding, setIsExpanding] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isGaugeFaded, setIsGaugeFaded] = useState(false);
  const [isMouseVisible, setIsMouseVisible] = useState(false);
  const [showLoadingText, setShowLoadingText] = useState(false); // 3D 로딩 텍스트 표시 여부

  // 1. Define actions using useCallback to be accessible in effects
  const completeLoading = useCallback(() => {
        setIsGaugeFaded(true);
        if (welcomeTextRef.current) welcomeTextRef.current.style.display = 'none';
        setShowLoadingText(false); // Hide loading text if visible
        
        setTimeout(() => {
            setIsExpanding(true);
        }, 100);
  }, []);

  const enterMainSection = useCallback(() => {
        setIsFullScreen(true);
        setTimeout(() => {
            onComplete();
        }, 1000); 
  }, [onComplete]);

  // 2. Watch for Asset Loading Completion (if waiting)
  useEffect(() => {
      // 사용자가 이미 스크롤을 다 내렸고(waitingForAsset), 에셋이 이제 로드되었다면(isAssetLoaded)
      if (stateRef.current.waitingForAsset && isAssetLoaded && !stateRef.current.loadingComplete) {
          stateRef.current.loadingComplete = true;
          stateRef.current.waitingForAsset = false;
          setShowLoadingText(false);
          completeLoading();
      }
  }, [isAssetLoaded, completeLoading]);

  // 3. User Interaction Effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      stateRef.current.mouseX = e.clientX;
      stateRef.current.mouseY = e.clientY;

      if (!stateRef.current.isMouseMoved) {
        stateRef.current.isMouseMoved = true;
        setIsMouseVisible(true);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const state = stateRef.current;

      state.virtualScrollY += e.deltaY * SCROLL_SPEED;
      state.virtualScrollY = Math.max(0, state.virtualScrollY);

      // --- Phase 1: Filling the Gauge ---
      if (!state.loadingComplete) {
        const scrollProgress = Math.min(state.virtualScrollY / LOADING_SCROLL_HEIGHT, 1);

        // UI Update
        if (gaugeProgressRef.current) {
            const offset = CIRCUMFERENCE - (scrollProgress * CIRCUMFERENCE);
            gaugeProgressRef.current.style.strokeDashoffset = offset.toString();
        }

        if (blurImgRef.current) {
            const blurAmount = (1 - scrollProgress) * 40;
            blurImgRef.current.style.filter = `blur(${blurAmount}px)`;
        }

        // Welcome Text Opacity Control
        if (welcomeTextRef.current) {
            // Priority: If waiting for asset (3D loading text shown), force Hide Welcome Text
            if (state.waitingForAsset) {
                welcomeTextRef.current.style.opacity = '0';
                welcomeTextRef.current.style.display = 'none';
            } else {
                welcomeTextRef.current.style.display = 'block';
                welcomeTextRef.current.style.opacity = (1 - scrollProgress).toString();
            }
        }

        // Check completion (Gauge Full)
        if (scrollProgress >= 1) {
            if (isAssetLoaded) {
                // Asset is ready -> Proceed immediately
                state.loadingComplete = true;
                completeLoading();
            } else {
                // Asset NOT ready -> Wait
                if (!state.waitingForAsset) {
                    state.waitingForAsset = true;
                    setShowLoadingText(true);
                    // Force hide welcome text immediately upon state change
                    if (welcomeTextRef.current) {
                        welcomeTextRef.current.style.opacity = '0';
                        welcomeTextRef.current.style.display = 'none';
                    }
                }
            }
        } else {
            // User scrolled back up - reset waiting state
            if (state.waitingForAsset) {
                state.waitingForAsset = false;
                setShowLoadingText(false);
                if (welcomeTextRef.current) {
                    welcomeTextRef.current.style.display = 'block';
                }
            }
        }
      } 
      // --- Phase 2: Expanding to Main ---
      else if (!state.mainTransitionComplete) {
         // This runs only if loadingComplete became true (Asset Loaded)
         const additionalScroll = state.virtualScrollY - LOADING_SCROLL_HEIGHT;
         const mainProgress = Math.min(additionalScroll / MAIN_SCROLL_HEIGHT, 1);

         if (mainProgress > 0.1 && !state.mainTransitionComplete) {
            state.mainTransitionComplete = true;
            enterMainSection();
         }
      }
    };

    let rafId: number;
    const updatePosition = () => {
        const state = stateRef.current;
        // Stop circle movement when transition starts to avoid jitter
        if (!state.mainTransitionComplete) {
            state.currentX += (state.mouseX - state.currentX) * 0.1;
            state.currentY += (state.mouseY - state.currentY) * 0.1;

            if (lpCircleRef.current) {
                lpCircleRef.current.style.left = `${state.currentX}px`;
                lpCircleRef.current.style.top = `${state.currentY}px`;
            }
        }
        rafId = requestAnimationFrame(updatePosition);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('wheel', handleWheel, { passive: false });
    rafId = requestAnimationFrame(updatePosition);

    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('wheel', handleWheel);
        cancelAnimationFrame(rafId);
    };
  }, [CIRCUMFERENCE, isAssetLoaded, completeLoading, enterMainSection]);

  return (
    <section 
        id="loading-section" 
        className="bg-gradient-to-br from-[#f3e7ff] to-[#e0c3fc]"
        style={{ background: 'linear-gradient(135deg, #f3e7ff 0%, #e0c3fc 100%)' }}
    >
        <style>{`
          @keyframes jump {
            0%, 40%, 100% { transform: translateY(0); }
            20% { transform: translateY(-8px); }
          }
          .dot {
            display: inline-block;
            animation: jump 1.2s infinite ease-in-out;
          }
        `}</style>
        
        <div className="blur-background">
            <img 
                ref={blurImgRef}
                src={LOADING_BG_PATH}
                alt="Background" 
                className="bg_img"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
        </div>

        {/* Original Welcome Text */}
        <div 
            className="welcome-text" 
            ref={welcomeTextRef}
            // Double ensure it hides via style prop if React re-renders with showLoadingText=true
            style={{ 
                opacity: showLoadingText ? 0 : undefined,
                display: showLoadingText ? 'none' : 'block'
            }}
        >
            <p className="text-2xl md:text-3xl leading-relaxed font-medium">
                Welcome to my website!<br />Please Scroll to enter.
            </p>
        </div>

        {/* 3D Loading Text (Replaces Welcome text at 100% scroll if needed) */}
        <div 
            className="welcome-text"
            style={{ 
                opacity: showLoadingText ? 1 : 0, 
                visibility: showLoadingText ? 'visible' : 'hidden',
                animation: 'none', // Disable blink for this state
                pointerEvents: 'none',
                transition: 'opacity 0.3s ease'
            }}
        >
            <div className="bg-white/80 backdrop-blur-md px-8 py-4 rounded-full shadow-lg border border-white/50 inline-block">
                <p className="text-xl md:text-2xl leading-none font-bold text-[#9333EA] tracking-wide">
                    3D file loading
                    <span className="dot" style={{ animationDelay: '0s', marginLeft: '4px' }}>.</span>
                    <span className="dot" style={{ animationDelay: '0.2s' }}>.</span>
                    <span className="dot" style={{ animationDelay: '0.4s' }}>.</span>
                </p>
            </div>
        </div>

        <div 
            ref={lpCircleRef}
            className={`lp-circle ${isMouseVisible ? 'visible' : ''} ${isExpanding ? 'expanding' : ''} ${isFullScreen ? 'full-screen' : ''}`} 
            id="lpCircle"
        >
            <svg 
                ref={gaugeRingRef}
                className={`gauge-ring ${isGaugeFaded ? 'fade-out' : ''}`} 
                viewBox="0 0 100 100"
            >
                <defs>
                    <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#9333ea', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#f3e7ff', stopOpacity: 1 }} />
                    </linearGradient>
                </defs>
                <circle 
                    className="gauge-background" 
                    cx="50" 
                    cy="50" 
                    r="45" 
                    fill="none" 
                    stroke="rgba(0,0,0,0.1)" 
                    strokeWidth="1"
                />
                <circle 
                    ref={gaugeProgressRef}
                    className="gauge-progress" 
                    cx="50" 
                    cy="50" 
                    r="45" 
                    fill="none" 
                    stroke="url(#purpleGradient)" 
                    strokeWidth="1"
                    strokeLinecap="round"
                    style={{ strokeDasharray: CIRCUMFERENCE, strokeDashoffset: CIRCUMFERENCE }}
                />
            </svg>

            <div className="center-circle relative">
                <p className="lp-typo">
                    KIMKAKYUNG
                </p>
            </div>
        </div>
    </section>
  );
};

export default LoadingScreen;