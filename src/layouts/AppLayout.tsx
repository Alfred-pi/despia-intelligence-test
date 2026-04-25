import { ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Search, Settings } from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

// Page titles and icons
const pageConfig: Record<string, { title: string; icon: typeof Bell }> = {
  '/': { title: 'Despia', icon: Bell },
  '/explore': { title: 'Explore', icon: Search },
  '/profile': { title: 'Profile', icon: Settings },
};

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const config = pageConfig[location.pathname] || { title: 'App', icon: Bell };
  const Icon = config.icon;

  useEffect(() => {
    // Default to dark theme
    if (!document.documentElement.getAttribute('data-theme')) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  return (
    <div className="app-shell">
      {/* Persistent Top Bar - no animation on page change */}
      <div className="top-bar">
        <div className="top-bar-content">
          <motion.span 
            key={config.title}
            className="top-bar-title"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            {config.title}
          </motion.span>
          <motion.button 
            className="top-bar-action"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Icon size={20} />
          </motion.button>
        </div>
      </div>

      {/* Main Content with page transitions */}
      <main className="main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
