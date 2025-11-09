import { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

interface SearchBarProps {
  onSelect: (location: string) => void;
}

const canadianLocations = [
  { display: 'Toronto, ON', city: 'Toronto' },
  { display: 'Halifax, NS', city: 'Halifax' },
  { display: 'Vancouver, BC', city: 'Vancouver' },
  { display: 'Montreal, QC', city: 'Montreal' },
  { display: 'Calgary, AB', city: 'Calgary' },
  { display: 'Ottawa, ON', city: 'Ottawa' },
];

export default function SearchBar({ onSelect }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredLocations = query
    ? canadianLocations.filter(loc =>
        loc.display.toLowerCase().includes(query.toLowerCase())
      )
    : canadianLocations;

  const handleSelect = (location: { display: string; city: string }) => {
    setQuery(location.display);
    setIsOpen(false);
    onSelect(location.city);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="relative"
      >
        {/* Futuristic Search Bar with Neon Glow */}
        <motion.div 
          className="relative rounded-2xl overflow-visible"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          {/* Outer Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-electric via-neon to-cyber opacity-50 blur-xl rounded-2xl" />
          
          {/* Main Search Container */}
          <div className="relative glass-card rounded-2xl border-2 border-electric/40 shadow-[0_0_30px_rgba(29,215,91,0.4)] hover:shadow-[0_0_50px_rgba(29,215,91,0.6)] transition-all backdrop-blur-xl">
            <div className="flex items-center px-6 py-5">
              <motion.div
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity }
                }}
              >
                <Search className="text-electric mr-4" size={28} style={{
                  filter: 'drop-shadow(0 0 8px rgba(29, 215, 91, 0.8))'
                }} />
              </motion.div>
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                placeholder="Search a province or city..."
                className="flex-1 bg-transparent text-foreground placeholder:text-electric/60 outline-none text-xl font-semibold"
                style={{
                  textShadow: '0 0 10px rgba(29, 215, 91, 0.3)'
                }}
              />
              
              {/* Animated Corner Accents */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-neon rounded-tl-2xl" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-neon rounded-tr-2xl" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyber rounded-bl-2xl" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyber rounded-br-2xl" />
            </div>
            
            {/* Animated Underline */}
            <motion.div
              className="h-0.5 bg-gradient-to-r from-transparent via-electric to-transparent"
              animate={{
                opacity: [0.3, 1, 0.3],
                scaleX: [0.8, 1, 0.8]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>

        {/* Futuristic Dropdown */}
        {isOpen && filteredLocations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full left-0 right-0 mt-4 z-50"
          >
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-electric/30 to-cyber/30 blur-xl rounded-2xl" />
              
              {/* Dropdown Content */}
              <div className="relative glass-card rounded-2xl overflow-hidden border-2 border-electric/30 shadow-[0_0_30px_rgba(29,215,91,0.4)] backdrop-blur-xl">
                {filteredLocations.map((location, index) => (
                  <motion.button
                    key={location.city}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSelect(location)}
                    className="w-full flex items-center px-6 py-4 hover:bg-electric/20 transition-all text-left border-b border-electric/10 last:border-0 group relative overflow-hidden"
                  >
                    {/* Hover effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-electric/0 via-electric/20 to-electric/0 opacity-0 group-hover:opacity-100 transition-opacity"
                      animate={{
                        x: ['-100%', '100%']
                      }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    
                    <MapPin className="text-neon mr-4 z-10" size={20} style={{
                      filter: 'drop-shadow(0 0 6px rgba(255, 230, 0, 0.6))'
                    }} />
                    <span className="text-foreground font-semibold z-10 group-hover:text-electric transition-colors" style={{
                      textShadow: '0 0 8px rgba(29, 215, 91, 0.2)'
                    }}>
                      {location.display}
                    </span>
                    
                    {/* Corner Accent */}
                    <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-electric/30 group-hover:border-neon/60 transition-colors" />
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
