import { useState, useCallback, useRef } from 'react';

interface UsePreventDoubleClickOptions {
  cooldownMs?: number;
  onCooldownClick?: () => void;
}

export function usePreventDoubleClick(options: UsePreventDoubleClickOptions = {}) {
  const { cooldownMs = 2000, onCooldownClick } = options;
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);

  const withPreventDoubleClick = useCallback(
    <T extends any[]>(
      asyncFunction: (...args: T) => Promise<any>
    ) => {
      return async (...args: T) => {
        if (processingRef.current) {
          onCooldownClick?.();
          return;
        }

        processingRef.current = true;
        setIsProcessing(true);

        try {
          const result = await asyncFunction(...args);
          return result;
        } finally {
          setTimeout(() => {
            processingRef.current = false;
            setIsProcessing(false);
          }, cooldownMs);
        }
      };
    },
    [cooldownMs, onCooldownClick]
  );

  return {
    isProcessing,
    withPreventDoubleClick,
  };
}
