import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

// 页面切换动画变体
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  out: {
    opacity: 0,
    y: -20,
    scale: 0.98,
  },
};

// 页面切换动画配置
const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.4,
};

export const PageTransition: React.FC<PageTransitionProps> = ({ 
  children, 
  className 
}) => {
  return (
    <motion.div
      className={className}
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      {children}
    </motion.div>
  );
};

// 卡片动画组件
interface CardAnimationProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export const CardAnimation: React.FC<CardAnimationProps> = ({ 
  children, 
  delay = 0,
  className 
}) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{
        y: -2,
        transition: { duration: 0.2 },
      }}
    >
      {children}
    </motion.div>
  );
};

// 列表项动画组件
interface ListItemAnimationProps {
  children: React.ReactNode;
  index: number;
  className?: string;
}

export const ListItemAnimation: React.FC<ListItemAnimationProps> = ({ 
  children, 
  index,
  className 
}) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.1,
        ease: 'easeOut',
      }}
      whileHover={{
        x: 4,
        transition: { duration: 0.2 },
      }}
    >
      {children}
    </motion.div>
  );
};

// 按钮点击动画组件
interface ButtonAnimationProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export const ButtonAnimation: React.FC<ButtonAnimationProps> = ({ 
  children, 
  onClick,
  className,
  disabled = false
}) => {
  return (
    <motion.div
      className={className}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      transition={{ duration: 0.1 }}
      onClick={disabled ? undefined : onClick}
      style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      {children}
    </motion.div>
  );
};

// 数字计数动画组件
interface CountUpAnimationProps {
  value: number;
  duration?: number;
  className?: string;
}

export const CountUpAnimation: React.FC<CountUpAnimationProps> = ({ 
  value, 
  duration = 1,
  className 
}) => {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.span
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{
          type: 'spring',
          stiffness: 100,
          damping: 10,
          duration,
        }}
      >
        {value}
      </motion.span>
    </motion.span>
  );
};
