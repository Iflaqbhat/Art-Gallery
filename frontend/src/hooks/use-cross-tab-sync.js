import { useEffect, useCallback, useRef } from "react";

/**
 * Hook for synchronizing data across browser tabs using BroadcastChannel API
 * Falls back to localStorage events if BroadcastChannel is not supported
 */
export const useCrossTabSync = (channelName = "app-sync") => {
  const channelRef = useRef(null);
  const handlersRef = useRef(new Map());

  useEffect(() => {
    // Try to use BroadcastChannel first (modern browsers)
    if (typeof BroadcastChannel !== "undefined") {
      channelRef.current = new BroadcastChannel(channelName);
    }

    return () => {
      if (channelRef.current && channelRef.current.close) {
        channelRef.current.close();
      }
    };
  }, [channelName]);

  const broadcast = useCallback(
    (type, data) => {
      const message = { type, data, timestamp: Date.now() };

      // Use BroadcastChannel if available
      if (channelRef.current && channelRef.current.postMessage) {
        try {
          channelRef.current.postMessage(message);
        } catch (error) {
          console.warn(
            "BroadcastChannel failed, falling back to localStorage:",
            error
          );
          // Fallback to localStorage
          localStorage.setItem(
            `${channelName}-${type}`,
            JSON.stringify(message)
          );
        }
      } else {
        // Fallback to localStorage
        localStorage.setItem(`${channelName}-${type}`, JSON.stringify(message));
      }
    },
    [channelName]
  );

  const subscribe = useCallback(
    (type, handler) => {
      const handlerKey = `${type}-${Math.random()}`;
      handlersRef.current.set(handlerKey, { type, handler });

      // BroadcastChannel listener
      const broadcastHandler = (event) => {
        if (event.data && event.data.type === type) {
          handler(event.data.data);
        }
      };

      // localStorage listener (fallback)
      const storageHandler = (event) => {
        if (event.key === `${channelName}-${type}` && event.newValue) {
          try {
            const message = JSON.parse(event.newValue);
            if (message.type === type) {
              handler(message.data);
            }
          } catch (error) {
            console.warn("Error parsing storage event:", error);
          }
        }
      };

      // Add listeners
      if (channelRef.current && channelRef.current.addEventListener) {
        channelRef.current.addEventListener("message", broadcastHandler);
      }
      window.addEventListener("storage", storageHandler);

      // Return cleanup function
      return () => {
        handlersRef.current.delete(handlerKey);
        if (channelRef.current && channelRef.current.removeEventListener) {
          channelRef.current.removeEventListener("message", broadcastHandler);
        }
        window.removeEventListener("storage", storageHandler);
      };
    },
    [channelName]
  );

  return { broadcast, subscribe };
};

/**
 * Hook specifically for syncing signed URLs across tabs
 */
export const useSignedUrlSync = () => {
  const { broadcast, subscribe } = useCrossTabSync("signed-urls");

  const broadcastUrlUpdate = useCallback(
    (originalUrl, signedUrl) => {
      broadcast("url-update", { originalUrl, signedUrl });
    },
    [broadcast]
  );

  const subscribeToUrlUpdates = useCallback(
    (handler) => {
      return subscribe("url-update", handler);
    },
    [subscribe]
  );

  return {
    broadcastUrlUpdate,
    subscribeToUrlUpdates,
  };
};

/**
 * Hook for syncing React Query cache invalidation across tabs
 */
export const useQuerySync = () => {
  const { broadcast, subscribe } = useCrossTabSync("react-query");

  const broadcastInvalidation = useCallback(
    (queryKey) => {
      broadcast("invalidate", { queryKey });
    },
    [broadcast]
  );

  const subscribeToInvalidations = useCallback(
    (handler) => {
      return subscribe("invalidate", handler);
    },
    [subscribe]
  );

  return {
    broadcastInvalidation,
    subscribeToInvalidations,
  };
};
