import { useEffect, useState } from 'react';
import { Leaf } from 'lucide-react';

interface Particle {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
}

export default function FloatingParticles() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const particleCount = 15;
    const newParticles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 15,
        duration: 15 + Math.random() * 10,
        size: 16 + Math.random() * 16,
      });
    }

    setParticles(newParticles);
  }, []);

  const emojis = ['⚡', '🌱', '♻️', '💡', '🔋', '🌍', '💚', '⭐'];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((particle) => {
        const emoji = emojis[particle.id % emojis.length];
        return (
          <div
            key={particle.id}
            className="absolute animate-leaf-fall opacity-30"
            style={{
              left: `${particle.left}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
              fontSize: `${particle.size}px`,
            }}
          >
            {Math.random() > 0.5 ? (
              <span style={{
                filter: 'drop-shadow(0 0 10px rgba(29, 215, 91, 0.8))',
              }}>
                {emoji}
              </span>
            ) : (
              <Leaf
                size={particle.size}
                className="text-electric animate-wiggle"
                style={{
                  filter: 'drop-shadow(0 0 10px rgba(29, 215, 91, 0.8))',
                }}
              />
            )}
          </div>
        );
      })}
      
      {/* Glowing orbs with movement */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-electric rounded-full animate-glow opacity-20 blur-3xl animate-bounce-fun" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-cyber rounded-full animate-glow opacity-15 blur-3xl animate-float" />
      <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-neon rounded-full animate-glow opacity-20 blur-3xl animate-float-reverse" />
      
      {/* Fun floating emojis in corners */}
      <div className="absolute top-10 left-10 text-6xl opacity-20 animate-spin-slow">⚡</div>
      <div className="absolute top-10 right-10 text-6xl opacity-20 animate-bounce-fun">🌍</div>
      <div className="absolute bottom-10 left-10 text-6xl opacity-20 animate-wiggle">♻️</div>
      <div className="absolute bottom-10 right-10 text-6xl opacity-20 animate-float">💡</div>
    </div>
  );
}
