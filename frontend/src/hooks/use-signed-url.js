import { useState, useEffect, useCallback, useRef } from "react";
import { storage } from "@/lib/supabase";
import { publicStorage } from "@/lib/supabase-public";
import { signedUrlManager } from "@/lib/signed-url-manager";

/**
 * Robust hook to manage signed URLs for Supabase storage files
 * Handles all edge cases, race conditions, and cross-tab synchronization
 * Uses public storage client to avoid auth state interference
 */
export const useSignedUrl = (
  initialUrl,
  expiresIn = 3600,
  usePublicClient = true
) => {
  const [url, setUrl] = useState(initialUrl);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [refreshCount, setRefreshCount] = useState(0);

  // Use refs to avoid stale closure issues
  const currentUrlRef = useRef(initialUrl);
  const isMountedRef = useRef(true);
  const refreshTimeoutRef = useRef(null);
  const retryCountRef = useRef(0);

  // Update refs when props change
  useEffect(() => {
    currentUrlRef.current = initialUrl;
  }, [initialUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  const refreshUrl = useCallback(
    async (forceRefresh = false) => {
      // Don't proceed if component is unmounted
      if (!isMountedRef.current) return;

      const targetUrl = currentUrlRef.current;

      try {
        // Reset error state
        if (isMountedRef.current) {
          setError(null);
        }

        // For non-Supabase URLs, use as-is
        if (!targetUrl || !targetUrl.includes("supabase")) {
          if (isMountedRef.current) {
            setUrl(targetUrl);
          }
          return targetUrl;
        }

        // Check cache first unless forcing refresh
        if (!forceRefresh) {
          const cachedUrl = signedUrlManager.getCachedUrl(targetUrl, expiresIn);
          if (cachedUrl && isMountedRef.current) {
            setUrl(cachedUrl);
            retryCountRef.current = 0; // Reset retry count on success
            return cachedUrl;
          }
        }

        // Set refreshing state
        if (isMountedRef.current) {
          setIsRefreshing(true);
        }

        // Perform the refresh using the appropriate storage client
        const storageClient = usePublicClient ? publicStorage : storage;
        const freshUrl = await signedUrlManager.refreshSignedUrl(
          targetUrl,
          expiresIn,
          { storage: storageClient }
        );

        // Update state if component is still mounted
        if (isMountedRef.current) {
          setUrl(freshUrl);
          setRefreshCount((prev) => prev + 1);
          retryCountRef.current = 0; // Reset retry count on success
        }

        return freshUrl;
      } catch (err) {
        console.warn("Failed to refresh signed URL:", targetUrl, err);

        if (isMountedRef.current) {
          setError(err);

          // Implement exponential backoff for retries
          retryCountRef.current += 1;
          const maxRetries = 3;
          const delay = Math.min(
            1000 * Math.pow(2, retryCountRef.current - 1),
            10000
          );

          if (retryCountRef.current <= maxRetries) {
            refreshTimeoutRef.current = setTimeout(() => {
              if (isMountedRef.current) {
                refreshUrl(forceRefresh);
              }
            }, delay);
          } else {
            // Max retries reached, fallback to original URL
            setUrl(targetUrl);
          }
        }

        return targetUrl; // Fallback to original URL
      } finally {
        if (isMountedRef.current) {
          setIsRefreshing(false);
        }
      }
    },
    [expiresIn]
  );

  // Initial URL refresh when hook mounts or URL changes
  useEffect(() => {
    refreshUrl();
  }, [refreshUrl]);

  // Auto-refresh before expiration
  useEffect(() => {
    if (!url || !url.includes("supabase") || !isMountedRef.current) return;

    const refreshInterval = Math.max(expiresIn * 0.8 * 1000, 60000); // At least 1 minute
    const intervalId = setInterval(() => {
      if (isMountedRef.current) {
        refreshUrl(true);
      }
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [url, expiresIn, refreshUrl]);

  // Listen for cross-tab updates
  useEffect(() => {
    if (!initialUrl || !initialUrl.includes("supabase")) return;

    let isSubscribed = true;

    const handleUpdate = ({ originalUrl, signedUrl }) => {
      if (
        isSubscribed &&
        originalUrl === currentUrlRef.current &&
        isMountedRef.current
      ) {
        setUrl(signedUrl);
        setError(null);
        retryCountRef.current = 0;
      }
    };

    // Use the global messenger directly for better reliability
    const unsubscribe = signedUrlManager.handleUrlUpdate
      ? (() => {
          const originalHandler = signedUrlManager.handleUrlUpdate;
          signedUrlManager.handleUrlUpdate = (data) => {
            originalHandler.call(signedUrlManager, data);
            handleUpdate(data);
          };
          return () => {
            signedUrlManager.handleUrlUpdate = originalHandler;
          };
        })()
      : () => {};

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, [initialUrl]);

  // Manual refresh function
  const manualRefresh = useCallback(() => {
    retryCountRef.current = 0; // Reset retry count
    return refreshUrl(true);
  }, [refreshUrl]);

  return {
    url,
    isRefreshing,
    error,
    refresh: manualRefresh,
    refreshCount, // Can be used to trigger re-renders in components
  };
};

/**
 * Hook to manage multiple signed URLs with proper error handling
 * Uses public storage client by default to avoid auth state interference
 */
export const useSignedUrls = (
  urls,
  expiresIn = 3600,
  usePublicClient = true
) => {
  const [signedUrls, setSignedUrls] = useState(urls || []);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [refreshCount, setRefreshCount] = useState(0);

  const isMountedRef = useRef(true);
  const currentUrlsRef = useRef(urls);

  // Update refs when props change
  useEffect(() => {
    currentUrlsRef.current = urls;
  }, [urls]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const refreshUrls = useCallback(async () => {
    if (!isMountedRef.current) return;

    const targetUrls = currentUrlsRef.current;

    if (!targetUrls || targetUrls.length === 0) {
      if (isMountedRef.current) {
        setSignedUrls([]);
      }
      return;
    }

    try {
      if (isMountedRef.current) {
        setIsRefreshing(true);
        setError(null);
      }

      // Process URLs in parallel with proper error handling
      const refreshPromises = targetUrls.map(async (originalUrl) => {
        try {
          if (!originalUrl || !originalUrl.includes("supabase")) {
            return originalUrl;
          }

          return await signedUrlManager.refreshSignedUrl(
            originalUrl,
            expiresIn,
            { storage: usePublicClient ? publicStorage : storage }
          );
        } catch (err) {
          console.warn(
            "Failed to refresh individual signed URL:",
            originalUrl,
            err
          );
          return originalUrl; // Fallback to original URL
        }
      });

      const refreshedUrls = await Promise.allSettled(refreshPromises);

      // Extract successful results, fallback to original URLs for failures
      const finalUrls = refreshedUrls.map((result, index) => {
        if (result.status === "fulfilled") {
          return result.value;
        } else {
          console.warn("URL refresh failed:", targetUrls[index], result.reason);
          return targetUrls[index]; // Fallback to original URL
        }
      });

      if (isMountedRef.current) {
        setSignedUrls(finalUrls);
        setRefreshCount((prev) => prev + 1);
      }

      return finalUrls;
    } catch (err) {
      console.warn("Failed to refresh signed URLs:", err);

      if (isMountedRef.current) {
        setError(err);
        setSignedUrls(targetUrls); // Fallback to original URLs
      }

      return targetUrls;
    } finally {
      if (isMountedRef.current) {
        setIsRefreshing(false);
      }
    }
  }, [expiresIn, usePublicClient]);

  // Initial refresh
  useEffect(() => {
    refreshUrls();
  }, [refreshUrls]);

  // Auto-refresh before expiration
  useEffect(() => {
    if (!urls || urls.length === 0 || !isMountedRef.current) return;

    const refreshInterval = Math.max(expiresIn * 0.8 * 1000, 60000); // At least 1 minute
    const intervalId = setInterval(() => {
      if (isMountedRef.current) {
        refreshUrls();
      }
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [urls, expiresIn, refreshUrls]);

  return {
    urls: signedUrls,
    isRefreshing,
    error,
    refresh: refreshUrls,
    refreshCount,
  };
};
