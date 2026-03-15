import React from 'react';
import { NavLink } from 'react-router';
import { Home, BarChart2, Star, User } from 'lucide-react';
import { motion } from 'motion/react';

const navItems = [
  { to: '/home', icon: Home, label: 'Home' },
  { to: '/progress', icon: BarChart2, label: 'Progress' },
  { to: '/rewards', icon: Star, label: 'Rewards' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export const BottomNav: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
      <div
        className="w-full max-w-md mx-auto flex items-center justify-around px-2 pt-2 pb-safe"
        style={{
          background: 'linear-gradient(to top, rgba(10,13,26,0.98) 0%, rgba(17,24,39,0.96) 100%)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 12px)',
        }}
      >
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className="flex-1">
            {({ isActive }) => (
              <motion.div
                whileTap={{ scale: 0.88 }}
                className="flex flex-col items-center gap-1 py-1 relative"
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full"
                    style={{ background: 'linear-gradient(90deg, #F97316, #FBBF24)' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <Icon
                  size={22}
                  className={isActive ? 'text-orange-400' : 'text-white/35'}
                  strokeWidth={isActive ? 2.2 : 1.7}
                />
                <span
                  className="text-xs tracking-wide"
                  style={{
                    color: isActive ? '#FB923C' : 'rgba(255,255,255,0.35)',
                    fontWeight: isActive ? 600 : 400,
                    fontSize: 10,
                  }}
                >
                  {label}
                </span>
              </motion.div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
