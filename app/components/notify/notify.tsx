import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AlertNotificationProps {
  message: string;
  type: "success" | "error" | "info" | "warning";
  position?: "top-left" | "top-right" | "top-center" | "bottom-left" | "bottom-right" | "bottom-center" | "left-center" | "right-center";
  duration?: number;
  size?: "sm" | "md" | "lg";
  showProgress?: boolean;
  autoHide?: boolean;
  onClose?: () => void;
}

const AlertNotification: React.FC<AlertNotificationProps> = ({ 
  message, 
  type, 
  position = "top-center",
  duration = 10000,
  size = "md",
  showProgress = true,
  autoHide = true,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!autoHide) return;

    const interval = 50;
    const decrement = (100 / duration) * interval;

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - decrement;
        if (newProgress <= 0) {
          clearInterval(progressTimer);
          return 0;
        }
        return newProgress;
      });
    }, interval);

    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(hideTimer);
    };
  }, [duration, autoHide, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  const getTypeConfig = () => {
    switch (type) {
      case "success":
        return {
          bgGradient: "from-emerald-50/95 via-green-50/95 to-teal-50/95",
          borderGradient: "from-emerald-200 via-green-200 to-teal-200",
          textColor: "text-emerald-800",
          secondaryColor: "text-emerald-600",
          progressColor: "from-emerald-400 to-green-500",
          icon: "✓",
          glowColor: "shadow-emerald-500/25"
        };
      case "error":
        return {
          bgGradient: "from-red-50/95 via-rose-50/95 to-pink-50/95",
          borderGradient: "from-red-200 via-rose-200 to-pink-200",
          textColor: "text-red-800",
          secondaryColor: "text-red-600",
          progressColor: "from-red-400 to-rose-500",
          icon: "✕",
          glowColor: "shadow-red-500/25"
        };
      case "info":
        return {
          bgGradient: "from-blue-50/95 via-cyan-50/95 to-sky-50/95",
          borderGradient: "from-blue-200 via-cyan-200 to-sky-200",
          textColor: "text-blue-800",
          secondaryColor: "text-blue-600",
          progressColor: "from-blue-400 to-cyan-500",
          icon: "i",
          glowColor: "shadow-blue-500/25"
        };
      case "warning":
        return {
          bgGradient: "from-amber-50/95 via-yellow-50/95 to-orange-50/95",
          borderGradient: "from-amber-200 via-yellow-200 to-orange-200",
          textColor: "text-amber-800",
          secondaryColor: "text-amber-600",
          progressColor: "from-amber-400 to-yellow-500",
          icon: "⚠",
          glowColor: "shadow-amber-500/25"
        };
    }
  };

  const getSizeConfig = () => {
    switch (size) {
      case "sm":
        return {
          container: "max-w-xs",
          padding: "px-3 py-2",
          iconSize: "w-6 h-6 text-xs",
          textSize: "text-xs",
          closeSize: "w-5 h-5 text-xs",
          spacing: "gap-2"
        };
      case "md":
        return {
          container: "max-w-sm",
          padding: "px-4 py-3",
          iconSize: "w-8 h-8 text-sm",
          textSize: "text-sm",
          closeSize: "w-6 h-6 text-sm",
          spacing: "gap-3"
        };
      case "lg":
        return {
          container: "max-w-md",
          padding: "px-6 py-4",
          iconSize: "w-10 h-10 text-base",
          textSize: "text-base",
          closeSize: "w-8 h-8 text-base",
          spacing: "gap-4"
        };
    }
  };

  const getPositionConfig = () => {
    const baseClasses = "fixed z-50 px-4";
    
    switch (position) {
      case "top-left":
        return {
          containerClass: ${baseClasses} top-5 left-0,
          justifyClass: "justify-start",
          animation: { initial: { x: -100, y: -50, opacity: 0 }, animate: { x: 0, y: 0, opacity: 1 }, exit: { x: -100, y: -50, opacity: 0 } }
        };
      case "top-right":
        return {
          containerClass: ${baseClasses} top-5 right-0,
          justifyClass: "justify-end",
          animation: { initial: { x: 100, y: -50, opacity: 0 }, animate: { x: 0, y: 0, opacity: 1 }, exit: { x: 100, y: -50, opacity: 0 } }
        };
      case "top-center":
        return {
          containerClass: ${baseClasses} top-5 left-0 right-0,
          justifyClass: "justify-center",
          animation: { initial: { y: -100, opacity: 0, scale: 0.9 }, animate: { y: 0, opacity: 1, scale: 1 }, exit: { y: -100, opacity: 0, scale: 0.9 } }
        };
      case "bottom-left":
        return {
          containerClass: ${baseClasses} bottom-5 left-0,
          justifyClass: "justify-start",
          animation: { initial: { x: -100, y: 50, opacity: 0 }, animate: { x: 0, y: 0, opacity: 1 }, exit: { x: -100, y: 50, opacity: 0 } }
        };
      case "bottom-right":
        return {
          containerClass: ${baseClasses} bottom-5 right-0,
          justifyClass: "justify-end",
          animation: { initial: { x: 100, y: 50, opacity: 0 }, animate: { x: 0, y: 0, opacity: 1 }, exit: { x: 100, y: 50, opacity: 0 } }
        };
      case "bottom-center":
        return {
          containerClass: ${baseClasses} bottom-5 left-0 right-0,
          justifyClass: "justify-center",
          animation: { initial: { y: 100, opacity: 0, scale: 0.9 }, animate: { y: 0, opacity: 1, scale: 1 }, exit: { y: 100, opacity: 0, scale: 0.9 } }
        };
      case "left-center":
        return {
          containerClass: ${baseClasses} left-0 top-1/2 -translate-y-1/2,
          justifyClass: "justify-start",
          animation: { initial: { x: -100, opacity: 0, scale: 0.9 }, animate: { x: 0, opacity: 1, scale: 1 }, exit: { x: -100, opacity: 0, scale: 0.9 } }
        };
      case "right-center":
        return {
          containerClass: ${baseClasses} right-0 top-1/2 -translate-y-1/2,
          justifyClass: "justify-end",
          animation: { initial: { x: 100, opacity: 0, scale: 0.9 }, animate: { x: 0, opacity: 1, scale: 1 }, exit: { x: 100, opacity: 0, scale: 0.9 } }
        };
      default:
        return {
          containerClass: ${baseClasses} top-5 left-0 right-0,
          justifyClass: "justify-center",
          animation: { initial: { y: -100, opacity: 0, scale: 0.9 }, animate: { y: 0, opacity: 1, scale: 1 }, exit: { y: -100, opacity: 0, scale: 0.9 } }
        };
    }
  };

  const typeConfig = getTypeConfig();
  const sizeConfig = getSizeConfig();
  const positionConfig = getPositionConfig();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={positionConfig.animation.initial}
          animate={positionConfig.animation.animate}
          exit={positionConfig.animation.exit}
          transition={{ 
            type: "spring", 
            damping: 25, 
            stiffness: 400,
            mass: 0.8
          }}
          className={${positionConfig.containerClass} flex items-center ${positionConfig.justifyClass}}
        >
          <div className={relative ${sizeConfig.container} w-full}>
            {/* Main notification container */}
            <div className={`
              relative overflow-hidden rounded-2xl 
              bg-gradient-to-br ${typeConfig.bgGradient}
              backdrop-blur-xl border-2 border-transparent
              bg-clip-padding
              shadow-xl ${typeConfig.glowColor}
              hover:shadow-2xl transition-all duration-300
            `}>
              {/* Gradient border effect */}
              <div className={`
                absolute inset-0 rounded-2xl p-[2px]
                bg-gradient-to-br ${typeConfig.borderGradient}
                -z-10
              `}>
                <div className={`
                  w-full h-full rounded-[14px]
                  bg-gradient-to-br ${typeConfig.bgGradient}
                `} />
              </div>

              {/* Content */}
              <div className={${sizeConfig.padding} flex items-center ${sizeConfig.spacing} relative z-10}>
                {/* Animated icon */}
                <motion.div 
                  className={`
                    flex-shrink-0 ${sizeConfig.iconSize} rounded-full
                    bg-white/70 backdrop-blur-sm
                    flex items-center justify-center
                    shadow-lg font-bold ${typeConfig.secondaryColor}
                    border border-white/30
                  `}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
                >
                  {typeConfig.icon}
                </motion.div>

                {/* Message */}
                <div className="flex-1 min-w-0">
                  <motion.p 
                    className={font-medium ${typeConfig.textColor} ${sizeConfig.textSize} leading-snug}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {message}
                  </motion.p>
                </div>

                {/* Close button */}
                <motion.button
                  onClick={handleClose}
                  className={`
                    flex-shrink-0 ${sizeConfig.closeSize} rounded-full
                    bg-white/40 hover:bg-white/60
                    backdrop-blur-sm transition-all duration-200
                    flex items-center justify-center
                    group hover:scale-110 active:scale-95
                    border border-white/20 hover:border-white/40
                    font-bold ${typeConfig.secondaryColor}
                  `}
                  whileHover={{ rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                >
                  ×
                </motion.button>
              </div>

              {/* Progress bar */}
              {showProgress && autoHide && (
                <div className="h-1 bg-white/20 backdrop-blur-sm">
                  <motion.div
                    className={h-full bg-gradient-to-r ${typeConfig.progressColor} shadow-sm}
                    initial={{ width: "100%" }}
                    animate={{ width: ${progress}% }}
                    transition={{ duration: 0.05, ease: "linear" }}
                  />
                </div>
              )}
            </div>

            {/* Ambient glow effect */}
            <div className={`
              absolute inset-0 -z-20 blur-3xl opacity-30
              bg-gradient-to-br ${typeConfig.bgGradient}
              transform scale-125 rounded-3xl
            `} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Demo component to showcase all features
const AlertDemo = () => {
  const [notifications, setNotifications] = useState<Array<{
    id: number;
    message: string;
    type: "success" | "error" | "info" | "warning";
    position: "top-left" | "top-right" | "top-center" | "bottom-left" | "bottom-right" | "bottom-center" | "left-center" | "right-center";
    size: "sm" | "md" | "lg";
  }>>([]);

  const addNotification = (type: "success" | "error" | "info" | "warning", position: any, size: "sm" | "md" | "lg") => {
    const messages = {
      success: "Operation completed successfully! Your changes have been saved.",
      error: "Something went wrong. Please try again later.",
      info: "New updates are available for your application.",
      warning: "Your session will expire in 5 minutes. Please save your work."
    };

    const newNotification = {
      id: Date.now(),
      message: messages[type],
      type,
      position,
      size
    };

    setNotifications(prev => [...prev, newNotification]);
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const positions = [
    "top-left", "top-center", "top-right",
    "left-center", "right-center",
    "bottom-left", "bottom-center", "bottom-right"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-800 mb-8 text-center">
          Enhanced Alert Notification System
        </h1>
        
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-slate-700">Test Controls</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Type Tests */}
            <div className="space-y-3">
              <h3 className="font-medium text-slate-600 mb-3">Alert Types</h3>
              {["success", "error", "info", "warning"].map((type) => (
                <button
                  key={type}
                  onClick={() => addNotification(type as any, "top-center", "md")}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    type === "success" ? "bg-emerald-500 hover:bg-emerald-600 text-white" :
                    type === "error" ? "bg-red-500 hover:bg-red-600 text-white" :
                    type === "info" ? "bg-blue-500 hover:bg-blue-600 text-white" :
                    "bg-amber-500 hover:bg-amber-600 text-white"
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>

            {/* Size Tests */}
            <div className="space-y-3">
              <h3 className="font-medium text-slate-600 mb-3">Sizes</h3>
              {["sm", "md", "lg"].map((size) => (
                <button
                  key={size}
                  onClick={() => addNotification("info", "top-center", size as any)}
                  className="w-full px-4 py-2 rounded-lg font-medium bg-slate-500 hover:bg-slate-600 text-white transition-all duration-200"
                >
                  Size: {size.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Position Tests */}
            <div className="space-y-2">
              <h3 className="font-medium text-slate-600 mb-3">Positions</h3>
              <div className="grid grid-cols-3 gap-1 text-xs">
                {positions.map((pos) => (
                  <button
                    key={pos}
                    onClick={() => addNotification("success", pos as any, "sm")}
                    className="px-2 py-1 rounded bg-indigo-500 hover:bg-indigo-600 text-white transition-all duration-200"
                  >
                    {pos.replace("-", " ")}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <button
              onClick={() => setNotifications([])}
              className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-all duration-200"
            >
              Clear All Notifications
            </button>
          </div>
        </div>

        {/* Feature list */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-semibold mb-6 text-slate-700">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
            <div className="space-y-2">
              <p>✓ 8 position options (corners, sides, center)</p>
              <p>✓ 4 alert types (success, error, info, warning)</p>
              <p>✓ 3 size variants (sm, md, lg)</p>
              <p>✓ Smooth spring animations</p>
            </div>
            <div className="space-y-2">
              <p>✓ Auto-hide with progress bar</p>
              <p>✓ Manual close functionality</p>
              <p>✓ Glassmorphism design</p>
              <p>✓ Responsive typography</p>
            </div>
          </div>
        </div>
      </div>

      {/* Render notifications */}
      {notifications.map((notification) => (
        <AlertNotification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          position={notification.position}
          size={notification.size}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

export default AlertNotification;