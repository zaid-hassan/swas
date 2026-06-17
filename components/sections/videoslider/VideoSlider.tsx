"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";

/**
 * VisualReviews (Spotlight Video Carousel)
 * Path: components/sections/visual-reviews/VisualReviews.tsx
 *
 * Cinematic portrait video player.
 * - Center video is scaled and plays automatically.
 * - When video ends, automatically slides to next.
 * - Peeking adjacent videos.
 */

/* ─── Data ───────────────────────────────────────────────────────────────── */
const spotlightVideos = [
  {
    id: 1,
    // Typically use cloud-hosted optimized video URLs (Cloudinary, Mux, AWS)
    // Using demo portrait videos for placeholder
    src: "https://player.vimeo.com/external/517601701.sd.mp4?s=34a50d243288a876a4a2f8149842c65a4a905813&profile_id=165&oauth2_token_id=57447761",
    title: "The Lumina Choker Edit",
    productLink: "/shop",
  },
  {
    id: 2,
    src: "https://player.vimeo.com/external/494639433.sd.mp4?s=d427d263a233303d7c30f40d7c71a337a7183060&profile_id=165&oauth2_token_id=57447761",
    title: "Bridal Bangles Masterclass",
    productLink: "/shop",
  },
  {
    id: 3,
    src: "https://player.vimeo.com/external/435133379.sd.mp4?s=6f21299e537c355c3c0d832d20197d1b32d1f435&profile_id=165&oauth2_token_id=57447761",
    title: "Minimalist Rings Style Guide",
    productLink: "/shop",
  },
  {
    id: 4,
    src: "https://player.vimeo.com/external/494639088.sd.mp4?s=a0f7868512521927705e4630a9161a0670f5e714&profile_id=165&oauth2_token_id=57447761",
    title: "Silver Anklet Season",
    productLink: "/shop",
  },
] as const;

const TOTAL = spotlightVideos.length;

/* ─── Component ─────────────────────────────────────────────────────────── */
export default function VisualReviews() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Browsers block autoplay with sound
  
  // Create an array of refs to store each video element
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Smoothly manage playback based on current index
  useEffect(() => {
    // Pause all videos first
    videoRefs.current.forEach((video) => {
      if (video) {
        video.pause();
      }
    });

    // Play the current focused video
    const activeVideo = videoRefs.current[current];
    if (activeVideo) {
      activeVideo.muted = isMuted;
      activeVideo.currentTime = 0; // Optional: restart from beginning
      if (!isPaused) {
        activeVideo.play().catch((error) => {
          // Autoplay might fail if browser policies block it
          console.warn("Autoplay failed:", error);
          setIsPaused(true); // Show play button if blocked
        });
      }
    }
  }, [current, isPaused, isMuted]);

  // Logic to advance to next video
  const advance = useCallback(() => {
    setCurrent((prev) => (prev + 1) % TOTAL);
    setIsPaused(false); // Reset pause state when moving to next
  }, []);

  // Handle Video Finish - hook this to onEnded event
  const handleVideoEnd = () => {
    advance();
  };

  // User manual controls
  const togglePlay = () => {
    const activeVideo = videoRefs.current[current];
    if (activeVideo) {
      if (isPaused) {
        activeVideo.play();
      } else {
        activeVideo.pause();
      }
      setIsPaused(!isPaused);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // Apply immediate mute change to active video
    const activeVideo = videoRefs.current[current];
    if(activeVideo) {
        activeVideo.muted = !isMuted;
    }
  };

  return (
    // Reusing standard section layout
    <section className="w-full bg-[#FCFAFA] pt-16 pb-24 max-md:pt-10 max-md:pb-16 overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-5 md:px-10">
        
        {/* ── Header (Matching "Curated for You" Style) ────────────────────── */}
        <div className="flex flex-col items-center text-center mb-16 max-md:mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-[1px] bg-[#D4AF37]/60" />
            <p className="text-[10px] md:text-[11px] tracking-[0.35em] uppercase text-[#D4AF37] font-sans font-medium">
              SWAS Spotlight
            </p>
            <div className="w-8 h-[1px] bg-[#D4AF37]/60" />
          </div>
          <h2
            className="text-ink leading-none tracking-tight"
            style={{
              fontSize: "clamp(28px, 4vw, 46px)",
              fontFamily: "var(--font-cormorant), Georgia, serif",
            }}
          >
            <span className="italic font-light">Visual</span> Styles
          </h2>
          <p className="mt-3 text-[14px] md:text-[15px] text-ink/60 font-sans font-light max-w-[500px]">
            See how our signature pieces capture the light
          </p>
        </div>
      </div>

      {/* ── Video Slider Container ────────────────────────────────────────── */}
      <div className="relative w-full flex justify-center items-center">
        
        {/*
          Fixed Viewport that allows peeking adjacent slides.
          Viewport width is roughly 1 main slide + 2 partial slides
        */}
        <div className="w-[85vw] md:w-[60vw] lg:w-[45vw] overflow-visible relative">
          
          <div 
            className="flex gap-6 md:gap-8 transition-transform duration-[700ms] ease-[cubic-bezier(0.25,1,0.5,1)]"
            style={{
                // Calculate position to center the current index
                // based on slide width (100%) + gap (flex layout takes care of gap offset generally)
                transform: `translateX(calc(-${current * 100}% - ${current * (typeof window !== 'undefined' && window.innerWidth < 768 ? 24 : 32)}px))`,
            }}
          >
            {spotlightVideos.map((video, index) => {
              const isActive = index === current;
              
              return (
                <div
                  key={video.id}
                  className="shrink-0 w-full flex flex-col items-center"
                >
                  {/* Portrait Video Chassis */}
                  <div className={`
                    relative aspect-[9/16] w-full max-h-[80vh] overflow-hidden 
                    rounded-[16px] border border-black/5 
                    shadow-sm transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
                    /* Focus Scaling and Dimming adjacents */
                    ${isActive ? 'scale-105 shadow-2xl z-20' : 'opacity-40 scale-95 z-10'}
                  `}>
                    
                    <video
                      ref={(el) => (videoRefs.current[index] = el)}
                      src={video.src}
                      loop={false} // Important: Set to false to trigger auto-advance
                      muted={isMuted} // Required for autoplay
                      playsInline // Important for mobile browsers
                      onEnded={isActive ? handleVideoEnd : undefined} // Trigger advance when current ends
                      className="w-full h-full object-cover"
                    />

                    {/* Active Controls Overlay */}
                    {isActive && (
                      <div className="absolute inset-0 bg-black/10 flex flex-col justify-between p-6 z-30 pointer-events-none">
                        
                        {/* Top: Sound Control */}
                        <div className="flex justify-end pointer-events-auto">
                            <button onClick={toggleMute} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                            </button>
                        </div>

                        {/* Center: Large Play/Pause Toggle */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-auto">
                           <button 
                            onClick={togglePlay}
                            className={`
                                w-20 h-20 rounded-full bg-white/10 backdrop-blur-[2px] border border-white/30
                                flex items-center justify-center text-white 
                                transition-all duration-300
                                ${isPaused ? 'opacity-100 scale-100' : 'opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100'}
                            `}>
                                {isPaused ? <Play size={32} fill="white" /> : <Pause size={32} fill="white" />}
                            </button>
                        </div>

                        {/* Bottom: Label and CTA */}
                        <div className="text-center w-full drop-shadow-md">
                           <p className="text-[12px] md:text-[14px] text-white tracking-widest uppercase font-semibold mb-3">
                             {video.title}
                           </p>
                           <Link
                            href={video.productLink}
                            className="inline-block pointer-events-auto bg-white text-black px-6 py-2.5 text-[9px] tracking-[0.2em] uppercase font-semibold rounded-[2px]"
                           >
                            Know More
                           </Link>
                        </div>
                      </div>
                    )}
                    
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ── Navigation dots ─────────────────────────────────────────────── */}
      <div className="flex justify-center gap-3 mt-16 max-md:mt-12">
        {spotlightVideos.map((_, i) => (
          <button
            key={i}
            onClick={() => {
                setCurrent(i);
                setIsPaused(false);
            }}
            className="transition-all duration-300 rounded-full"
            style={{
              width: i === current ? 10 : 8,
              height: i === current ? 10 : 8,
              transform: "rotate(45deg)",
              backgroundColor: i === current ? "#8B1A1A" : "#D1D1D1",
            }}
          />
        ))}
      </div>
    </section>
  );
}