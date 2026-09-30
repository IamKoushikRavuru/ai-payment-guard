import React, { useRef, useState } from 'react'

interface Card3DProps {
  children: React.ReactNode
  className?: string
  intensity?: number // Higher means more tilt
  glareOpacity?: number
}

export const Card3D: React.FC<Card3DProps> = ({
  children,
  className = '',
  intensity = 15,
  glareOpacity = 0.15,
}) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const rotX = ((y - centerY) / centerY) * -intensity
    const rotY = ((x - centerX) / centerX) * intensity

    setRotateX(rotX)
    setRotateY(rotY)
    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
    })
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    setRotateX(0)
    setRotateY(0)
  }

  return (
    <div
      style={{ perspective: '1000px' }}
      className="transition-transform duration-200 ease-out"
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: isHovered
            ? `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`
            : 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
          transformStyle: 'preserve-3d',
          transition: isHovered ? 'transform 0.08s ease-out' : 'transform 0.4s ease-out',
        }}
        className={`relative overflow-hidden ${className}`}
      >
        {/* Dynamic mouse spotlight glare overlay */}
        {isHovered && (
          <div
            className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-300 rounded-[inherit]"
            style={{
              background: `radial-gradient(circle 280px at ${glarePos.x}% ${glarePos.y}%, rgba(6, 182, 212, ${glareOpacity}), transparent 70%)`,
            }}
          />
        )}
        {children}
      </div>
    </div>
  )
}
