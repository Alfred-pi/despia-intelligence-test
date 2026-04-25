import { ReactNode } from 'react';
import { motion, Variants } from 'framer-motion';

type TransitionType = 'fade' | 'slide' | 'slideUp' | 'scale' | 'none';

interface PageTransitionProps {
  children: ReactNode;
  type?: TransitionType;
  className?: string;
}

const variants: Record<TransitionType, Variants> = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slide: {
    initial: { x: '100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '-20%', opacity: 0 },
  },
  slideUp: {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -10, opacity: 0 },
  },
  scale: {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.95, opacity: 0 },
  },
  none: {
    initial: {},
    animate: {},
    exit: {},
  },
};

/**
 * Page Transition Wrapper
 * 
 * Native apps don't "jump" between pages.
 * Use this wrapper for smooth transitions.
 * 
 * Types:
 * - fade: Simple opacity transition
 * - slide: iOS-style slide from right
 * - slideUp: Modal-style slide from bottom
 * - scale: Scale + fade (for modals)
 */
export function PageTransition({
  children,
  type = 'slideUp',
  className = '',
}: PageTransitionProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants[type]}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Staggered Children - animate children one by one
 */
interface StaggeredChildrenProps {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
}

export function StaggeredChildren({
  children,
  staggerDelay = 0.05,
  className = '',
}: StaggeredChildrenProps) {
  const container: Variants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  };

  const item: Variants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={container}
      initial="initial"
      animate="animate"
      className={className}
    >
      {Array.isArray(children)
        ? children.map((child, index) => (
            <motion.div key={index} variants={item}>
              {child}
            </motion.div>
          ))
        : children}
    </motion.div>
  );
}

/**
 * Fade In on Scroll - appears when scrolled into view
 */
interface FadeInOnScrollProps {
  children: ReactNode;
  threshold?: number;
  className?: string;
}

export function FadeInOnScroll({
  children,
  threshold = 0.1,
  className = '',
}: FadeInOnScrollProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: threshold }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Parallax Container - subtle parallax on scroll
 */
interface ParallaxProps {
  children: ReactNode;
  offset?: number;
  className?: string;
}

export function Parallax({
  children,
  offset = 50,
  className = '',
}: ParallaxProps) {
  return (
    <motion.div
      initial={{ y: offset }}
      whileInView={{ y: 0 }}
      viewport={{ once: false }}
      transition={{ type: 'spring', stiffness: 100, damping: 30 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Animated Presence helper for conditional rendering
 */
export { AnimatePresence } from 'framer-motion';
