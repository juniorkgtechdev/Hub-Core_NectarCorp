"use client";

import React, { useEffect, useRef, useState } from 'react';

const InteractiveBackground = ({ 
  colorful = true, 
  staticMode = false 
}: { 
  colorful?: boolean; 
  staticMode?: boolean;
}) => {
  const bgRef = useRef<HTMLDivElement>(null);
  const [isIdle, setIsIdle] = useState(true);
  const idleTimeout = useRef<NodeJS.Timeout | null>(null);
  const rafId = useRef<number | null>(null);
  const timeRef = useRef(0);

  // Mouse move handler
  useEffect(() => {
    if (staticMode) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (bgRef.current) {
        const { clientX, clientY } = e;
        bgRef.current.style.setProperty('--mouse-x', `${clientX}px`);
        bgRef.current.style.setProperty('--mouse-y', `${clientY}px`);
      }

      setIsIdle(false);
      
      if (idleTimeout.current) {
        clearTimeout(idleTimeout.current);
      }
      
      idleTimeout.current = setTimeout(() => {
        setIsIdle(true);
      }, 2500); // 2.5 segundos de inatividade
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (idleTimeout.current) clearTimeout(idleTimeout.current);
    };
  }, [staticMode]);

  // Idle animation loop
  useEffect(() => {
    if (staticMode) return;
    
    if (isIdle) {
      const animateIdle = () => {
        timeRef.current += 16; // Aprox 60fps (16ms per frame)
        const time = timeRef.current;
        
        if (bgRef.current) {
          const width = window.innerWidth;
          const height = window.innerHeight;
          
          // Lissajous curve for smooth wandering
          const x = width / 2 + Math.sin(time * 0.0008) * (width * 0.35);
          const y = height / 2 + Math.cos(time * 0.0011) * (height * 0.35);
          
          bgRef.current.style.setProperty('--mouse-x', `${x}px`);
          bgRef.current.style.setProperty('--mouse-y', `${y}px`);
        }
        
        rafId.current = requestAnimationFrame(animateIdle);
      };
      
      rafId.current = requestAnimationFrame(animateIdle);
    } else {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    }

    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [isIdle, staticMode]);

  return (
    <div 
      ref={bgRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        background: '#0a0a0a',
        overflow: 'hidden'
      }}
    >
      {/* 1. Base estática bem fraca (Hexágonos cinzas) */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.2,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='84' height='96' viewBox='0 0 84 96'%3E%3Cg fill='none' stroke='%239AA0AC' stroke-opacity='0.15' stroke-width='1'%3E%3Cpath d='M42 0 L84 24 L84 72 L42 96 L0 72 L0 24 Z'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      
      {/* 2. Máscara de brilho dourado (Ativa quando o mouse move) */}
      {!staticMode && (
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            opacity: isIdle ? 0 : 0.9,
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='84' height='96' viewBox='0 0 84 96'%3E%3Cg fill='none' stroke='%23D9AE55' stroke-opacity='0.8' stroke-width='1.5'%3E%3Cpath d='M42 0 L84 24 L84 72 L42 96 L0 72 L0 24 Z'/%3E%3C/g%3E%3C/svg%3E")`,
            maskImage: `radial-gradient(350px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), black, transparent)`,
            WebkitMaskImage: `radial-gradient(350px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), black, transparent)`,
            transition: 'opacity 1.5s ease',
          }}
        />
      )}

      {/* 3. Máscara Idle (Colorida ou Dourada) */}
      {!staticMode && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: isIdle ? 0.9 : 0,
            maskImage: `radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), black, transparent)`,
            WebkitMaskImage: `radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), black, transparent)`,
            transition: 'opacity 1.5s ease',
          }}
        >
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              background: colorful 
                ? 'linear-gradient(45deg, #4285f4, #a15bcc, #ea4335, #fbbc04, #4285f4)' 
                : 'linear-gradient(45deg, #D9AE55, #fbbc04, #D9AE55)',
              backgroundSize: '300% 300%',
              animation: 'geminiAnim 6s ease infinite',
              maskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='84' height='96' viewBox='0 0 84 96'%3E%3Cg fill='none' stroke='black' stroke-width='1.5'%3E%3Cpath d='M42 0 L84 24 L84 72 L42 96 L0 72 L0 24 Z'/%3E%3C/g%3E%3C/svg%3E")`,
              WebkitMaskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='84' height='96' viewBox='0 0 84 96'%3E%3Cg fill='none' stroke='black' stroke-width='1.5'%3E%3Cpath d='M42 0 L84 24 L84 72 L42 96 L0 72 L0 24 Z'/%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>
      )}

      {/* 4. Brilho neon base centralizado */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 30%, rgba(217, 174, 85, 0.03) 0%, transparent 60%)',
        }}
      />
    </div>
  );
};

export default InteractiveBackground;
