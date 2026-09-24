import React, { useState, useRef } from 'react';
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion';

export interface FlipCardProps {
  front: React.ReactNode;
  back: React.ReactNode;
  axis?: 'x' | 'y';
  flipOnClick?: boolean;
  flipped?: boolean;
  draggable?: boolean;
  dragDistance?: number;
  tilt?: boolean;
  tiltMax?: number;
  glare?: boolean;
  glareOpacity?: number;
  hoverScale?: number;
  perspective?: number;
  stiffness?: number;
  damping?: number;
  width?: number | string;
  height?: number | string;
  radius?: number;
  background?: string;
  color?: string;
  shadow?: boolean;
  shadowColor?: string;
  shadowOpacity?: number;
  onFlipChange?: (flipped: boolean) => void;
}

export const FlipCard: React.FC<FlipCardProps> = ({
  front,
  back,
  axis = 'y',
  flipOnClick = true,
  flipped: controlledFlipped,
  draggable = false,
  dragDistance = 0,
  tilt = true,
  tiltMax = 12,
  glare = true,
  glareOpacity = 0.22,
  hoverScale = 1.03,
  perspective = 1100,
  stiffness = 170,
  damping = 20,
  width = 300,
  height = 400,
  radius = 22,
  background = '#27272a',
  color = '#f5f5f5',
  shadow = true,
  shadowColor = '#000000',
  shadowOpacity = 0.45,
  onFlipChange,
}) => {
  const [internalFlipped, setInternalFlipped] = useState(false);
  const isFlipped = controlledFlipped !== undefined ? controlledFlipped : internalFlipped;
  const cardRef = useRef<HTMLDivElement>(null);

  // Mouse position relative to card center (-0.5 to 0.5)
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth springs for tilt
  const tiltX = useSpring(useTransform(y, [-0.5, 0.5], [tiltMax, -tiltMax]), { stiffness, damping });
  const tiltY = useSpring(useTransform(x, [-0.5, 0.5], [-tiltMax, tiltMax]), { stiffness, damping });

  // Glare position
  const glareX = useTransform(x, [-0.5, 0.5], ['0%', '100%']);
  const glareY = useTransform(y, [-0.5, 0.5], ['0%', '100%']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tilt || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const widthPx = rect.width;
    const heightPx = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / widthPx - 0.5);
    y.set(mouseY / heightPx - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const handleClick = () => {
    if (!flipOnClick) return;
    const nextFlipped = !isFlipped;
    if (controlledFlipped === undefined) {
      setInternalFlipped(nextFlipped);
    }
    if (onFlipChange) onFlipChange(nextFlipped);
  };

  const rotateXVal = axis === 'x' ? (isFlipped ? 180 : 0) : 0;
  const rotateYVal = axis === 'y' ? (isFlipped ? 180 : 0) : 0;

  return (
    <div
      style={{
        perspective: `${perspective}px`,
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
      className="relative flex items-center justify-center select-none"
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        whileHover={{ scale: hoverScale }}
        drag={draggable}
        dragConstraints={{ left: -dragDistance, right: dragDistance, top: -dragDistance, bottom: dragDistance }}
        style={{
          width: '100%',
          height: '100%',
          rotateX: tilt ? tiltX : 0,
          rotateY: tilt ? tiltY : 0,
          transformStyle: 'preserve-3d',
          borderRadius: `${radius}px`,
          boxShadow: shadow
            ? `0 20px 30px ${shadowColor}${Math.round(shadowOpacity * 255).toString(16).padStart(2, '0')}`
            : 'none',
        }}
        className="relative cursor-pointer transition-shadow duration-300 border-[2.5px] border-black"
      >
        {/* Animated Inner Flip Container */}
        <motion.div
          animate={{
            rotateX: rotateXVal,
            rotateY: rotateYVal,
          }}
          transition={{
            type: 'spring',
            stiffness,
            damping,
          }}
          style={{
            width: '100%',
            height: '100%',
            transformStyle: 'preserve-3d',
            borderRadius: `${radius}px`,
            backgroundColor: background,
            color,
          }}
          className="relative w-full h-full"
        >
          {/* Front Face */}
          <div
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              borderRadius: `${radius}px`,
              overflow: 'hidden',
              transform: 'rotateX(0deg) rotateY(0deg)',
              transformStyle: 'preserve-3d',
            }}
            className="absolute inset-0 w-full h-full flex items-center justify-center"
          >
            {front}
          </div>

          {/* Back Face */}
          <div
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: axis === 'y' ? 'rotateY(180deg)' : 'rotateX(180deg)',
              transformStyle: 'preserve-3d',
              borderRadius: `${radius}px`,
              overflow: 'hidden',
              backgroundColor: background,
              color,
            }}
            className="absolute inset-0 w-full h-full flex items-center justify-center"
          >
            {back}
          </div>

          {/* Glare Effect */}
          {glare && (
            <motion.div
              style={{
                pointerEvents: 'none',
                background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,${glareOpacity}) 0%, rgba(255,255,255,0) 80%)`,
                borderRadius: `${radius}px`,
              }}
              className="absolute inset-0 z-10"
            />
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default FlipCard;
