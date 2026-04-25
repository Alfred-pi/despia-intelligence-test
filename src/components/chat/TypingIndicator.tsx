import { motion } from 'framer-motion';

export function TypingIndicator() {
  return (
    <div className="typing-indicator" aria-label="Thinking">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="typing-dot"
          initial={{ opacity: 0.3, y: 0 }}
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{
            duration: 1.1,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
