import React, { useEffect, useRef, useState } from 'react';

interface LoadingScreenProps {
  onComplete: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
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
    loadingComplete: false,
    mainTransitionComplete: false,
    isMouseMoved: false,
  });

  const SCROLL_SPEED = 1.5;
  const LOADING_SCROLL_HEIGHT = window.innerHeight * 1.5;
  const MAIN_SCROLL_HEIGHT = window.innerHeight * 0.5;
  const CIRCUMFERENCE = 2 * Math.PI * 45; // r=45

  const [isExpanding, setIsExpanding] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isGaugeFaded, setIsGaugeFaded] = useState(false);
  const [isMouseVisible, setIsMouseVisible] = useState(false);

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

      if (!state.loadingComplete) {
        const scrollProgress = Math.min(state.virtualScrollY / LOADING_SCROLL_HEIGHT, 1);

        if (gaugeProgressRef.current) {
            const offset = CIRCUMFERENCE - (scrollProgress * CIRCUMFERENCE);
            gaugeProgressRef.current.style.strokeDashoffset = offset.toString();
        }

        if (blurImgRef.current) {
            const blurAmount = (1 - scrollProgress) * 40;
            blurImgRef.current.style.filter = `blur(${blurAmount}px)`;
        }

        if (welcomeTextRef.current) {
            welcomeTextRef.current.style.opacity = (1 - scrollProgress).toString();
        }

        if (scrollProgress >= 1) {
            state.loadingComplete = true;
            completeLoading();
        }
      } 
      else if (!state.mainTransitionComplete) {
         const additionalScroll = state.virtualScrollY - LOADING_SCROLL_HEIGHT;
         const mainProgress = Math.min(additionalScroll / MAIN_SCROLL_HEIGHT, 1);

         if (mainProgress > 0.1 && !state.mainTransitionComplete) {
            state.mainTransitionComplete = true;
            enterMainSection();
         }
      }
    };

    const completeLoading = () => {
        setIsGaugeFaded(true);
        if (welcomeTextRef.current) welcomeTextRef.current.style.display = 'none';
        
        setTimeout(() => {
            setIsExpanding(true);
        }, 100);
    };

    const enterMainSection = () => {
        setIsFullScreen(true);
        setTimeout(() => {
            onComplete();
        }, 1000); 
    };

    let rafId: number;
    const updatePosition = () => {
        const state = stateRef.current;
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
  }, [onComplete, CIRCUMFERENCE]);

  return (
    <section id="loading-section">
        <div className="blur-background">
            <img 
                ref={blurImgRef}
                src="/assets/images/background.png" 
                alt="" 
                className="bg_img"
                onError={(e) => {
                    e.currentTarget.style.display = 'none';
                }}
            />
        </div>

        <div className="welcome-text" ref={welcomeTextRef}>
            <p className="text-2xl md:text-3xl leading-relaxed">Welcome to my website!<br />Please Scroll to enter.</p>
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

            <div className="center-circle">
                <p className="lp-typo">KIMKAKYUNG</p>
            </div>
        </div>
    </section>
  );
};

export default LoadingScreen;