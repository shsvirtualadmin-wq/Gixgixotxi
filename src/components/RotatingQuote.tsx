import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface Quote {
  text: string;
  author: string;
}

export const QUOTES: Quote[] = [
  { text: "Imagination is more important than knowledge.", author: "Albert Einstein" },
  { text: "Study hard what interests you the most.", author: "Richard Feynman" },
  { text: "If I have seen further, it is by standing on shoulders.", author: "Isaac Newton" },
  { text: "Mathematicians have tried in vain to discover order.", author: "Leonhard Euler" },
  { text: "Mathematics is the queen of the sciences.", author: "Carl Friedrich Gauss" },
  { text: "I think, therefore I am.", author: "René Descartes" },
  { text: "Nothing in life is to be feared, only understood.", author: "Marie Curie" },
  { text: "Nothing is lost, nothing is created, everything is transformed.", author: "Antoine Lavoisier" },
  { text: "Chance favors the prepared mind.", author: "Louis Pasteur" },
  { text: "It is not in the stars to hold our destiny.", author: "William Shakespeare" },
  { text: "In a time of deceit telling the truth is revolutionary.", author: "George Orwell" },
  { text: "Elevate yourself so high that God asks your wish.", author: "Allama Iqbal" },
  { text: "Knowledge gives sight to minds that dare to search.", author: "Mirza Ghalib" },
  { text: "Truth is the ultimate purpose of all scientific inquiry.", author: "Al-Biruni" },
  { text: "Width of life matters more than length of life.", author: "Ibn Sina (Avicenna)" },
  { text: "Education is the most powerful weapon to change the world.", author: "Nelson Mandela" },
  { text: "An unexamined life is not worth living.", author: "Socrates" },
  { text: "We are what we repeatedly do. Excellence is a habit.", author: "Aristotle" },
];

export const RotatingQuote: React.FC = () => {
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const [isPaused, setIsPaused] = useState(false);

  const isPausedRef = useRef(isPaused);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isPausedRef.current) return;

      setQuoteIndex((prevIndex) => {
        let nextIndex: number;
        do {
          nextIndex = Math.floor(Math.random() * QUOTES.length);
        } while (nextIndex === prevIndex && QUOTES.length > 1);
        return nextIndex;
      });
    }, 5500);

    return () => clearInterval(interval);
  }, []);

  const currentQuote = QUOTES[quoteIndex];

  return (
    <div
      className="quote-container relative w-full flex flex-col items-center justify-center my-1 sm:my-2 px-3 py-1 select-none cursor-pointer group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      onTouchCancel={() => setIsPaused(false)}
      title="Hover or tap & hold to pause quote"
    >
      <div className="min-h-[64px] sm:min-h-[76px] flex flex-col items-center justify-center text-center overflow-hidden w-full relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={quoteIndex}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center justify-center"
          >
            <p
              className="font-semibold text-lg sm:text-2xl text-slate-900  tracking-wide leading-snug max-w-lg drop-shadow-xs"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              “{currentQuote.text}”
            </p>
            <span className="block text-xs sm:text-sm font-medium tracking-wider text-blue-700/90  mt-1.5 uppercase">
              — {currentQuote.author}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {isPaused && (
        <span className="absolute -bottom-2 text-[9px] font-bold tracking-widest uppercase text-blue-700/80  bg-blue-500/10  border border-blue-600/20  px-2 py-0.5 rounded-full transition-opacity duration-200 z-10">
          Paused
        </span>
      )}
    </div>
  );
};
