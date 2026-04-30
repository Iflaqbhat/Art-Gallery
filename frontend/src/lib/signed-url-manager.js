/**
 * Comprehensive signed URL manager with race condition protection,
 * proper error handling, and cross-tab synchronization
 */

// Global state to prevent race conditions
const refreshLocks = new Map();
const urlCache = new Map();

// Utility to create a unique key for a URL
const createUrlKey = (url) => {
  try {
    return btoa(url).replace(/[^a-zA-Z0-9]/g, "");
  } catch (error) {
    console.warn("Failed to create URL key:", error);
    return url.replace(/[^a-zA-Z0-9]/g, "_");
  }
};

// Utility to validate if a URL is a Supabase storage URL
const isSupabaseStorageUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  return url.includes("/storage/v1/object/") && url.includes("supabase");
};

// Utility to parse Supabase storage URL
const parseSupabaseUrl = (url) => {
  try {
    if (!isSupabaseStorageUrl(url)) {
      return null;
    }

    const urlParts = url.split("/storage/v1/object/");
    if (urlParts.length !== 2) {
      throw new Error("Invalid Supabase storage URL format");
    }

    const pathPart = urlParts[1];
    const pathSegments = pathPart.split("/");

    if (pathSegments.length < 2) {
      throw new Error("Invalid path segments in storage URL");
    }

    const bucket = pathSegments[0];
    const filePath = pathSegments.slice(1).join("/").split("?")[0]; // Remove query params

    if (!bucket || !filePath) {
      throw new Error("Missing bucket or file path");
    }

    return { bucket, filePath };
  } catch (error) {
    console.error("Failed to parse Supabase URL:", url, error);
    return null;
  }
};

// Storage utilities with error handling
const storage = {
  get: (key) => {
    try {
      if (typeof localStorage === "undefined") return null;
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.warn("Failed to read from localStorage:", key, error);
      return null;
    }
  },

  set: (key, value) => {
    try {
      if (typeof localStorage === "undefined") return false;
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn("Failed to write to localStorage:", key, error);
      return false;
    }
  },

  remove: (key) => {
    try {
      if (typeof localStorage === "undefined") return false;
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn("Failed to remove from localStorage:", key, error);
      return false;
    }
  },
};

// Cross-tab communication with robust error handling
class CrossTabMessenger {
  constructor(channelName = "signed-url-sync") {
    this.channelName = channelName;
    this.channel = null;
    this.listeners = new Map();
    this.setupChannel();
  }

  setupChannel() {
    try {
      if (typeof BroadcastChannel !== "undefined") {
        this.channel = new BroadcastChannel(this.channelName);
        this.channel.addEventListener("message", this.handleMessage.bind(this));
      }
    } catch (error) {
      console.warn("BroadcastChannel setup failed:", error);
      this.channel = null;
    }

    // Always set up localStorage fallback
    window.addEventListener("storage", this.handleStorageEvent.bind(this));
  }

  handleMessage(event) {
    try {
      if (
        event.data &&
        event.data.type &&
        this.listeners.has(event.data.type)
      ) {
        const handlers = this.listeners.get(event.data.type);
        handlers.forEach((handler) => {
          try {
            handler(event.data.payload);
          } catch (error) {
            console.warn("Message handler error:", error);
          }
        });
      }
    } catch (error) {
      console.warn("Failed to handle cross-tab message:", error);
    }
  }

  handleStorageEvent(event) {
    try {
      if (!event.key || !event.key.startsWith(`${this.channelName}-`)) return;

      const messageType = event.key.replace(`${this.channelName}-`, "");
      if (!event.newValue || !this.listeners.has(messageType)) return;

      const data = JSON.parse(event.newValue);
      const handlers = this.listeners.get(messageType);
      handlers.forEach((handler) => {
        try {
          handler(data.payload);
        } catch (error) {
          console.warn("Storage handler error:", error);
        }
      });
    } catch (error) {
      console.warn("Failed to handle storage event:", error);
    }
  }

  broadcast(type, payload) {
    try {
      const message = { type, payload, timestamp: Date.now() };

      // Try BroadcastChannel first
      if (this.channel && this.channel.postMessage) {
        try {
          this.channel.postMessage(message);
          return true;
        } catch (error) {
          console.warn("BroadcastChannel send failed:", error);
        }
      }

      // Fallback to localStorage
      return storage.set(`${this.channelName}-${type}`, message);
    } catch (error) {
      console.warn("Failed to broadcast message:", error);
      return false;
    }
  }

  subscribe(type, handler) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type).add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.listeners.get(type);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.listeners.delete(type);
        }
      }
    };
  }

  destroy() {
    try {
      if (this.channel && this.channel.close) {
        this.channel.close();
      }
      window.removeEventListener("storage", this.handleStorageEvent.bind(this));
      this.listeners.clear();
    } catch (error) {
      console.warn("Failed to destroy messenger:", error);
    }
  }
}

// Global messenger instance
const messenger = new CrossTabMessenger();

// Signed URL manager with comprehensive error handling
export class SignedUrlManager {
  constructor() {
    this.refreshPromises = new Map();
    this.cachePrefix = "signed_url_v2_";
    this.defaultExpiresIn = 3600;

    // Subscribe to cross-tab updates
    messenger.subscribe("url-updated", this.handleUrlUpdate.bind(this));
    messenger.subscribe(
      "url-refresh-start",
      this.handleRefreshStart.bind(this)
    );
    messenger.subscribe(
      "url-refresh-complete",
      this.handleRefreshComplete.bind(this)
    );
  }

  handleUrlUpdate({ originalUrl, signedUrl, expiresIn }) {
    try {
      // Update local cache
      this.setCachedUrl(originalUrl, signedUrl, expiresIn);

      // Update in-memory cache
      urlCache.set(originalUrl, {
        url: signedUrl,
        timestamp: Date.now(),
        expiresIn: expiresIn || this.defaultExpiresIn,
      });
    } catch (error) {
      console.warn("Failed to handle URL update:", error);
    }
  }

  handleRefreshStart({ originalUrl }) {
    try {
      refreshLocks.set(originalUrl, Date.now());
    } catch (error) {
      console.warn("Failed to handle refresh start:", error);
    }
  }

  handleRefreshComplete({ originalUrl }) {
    try {
      refreshLocks.delete(originalUrl);
    } catch (error) {
      console.warn("Failed to handle refresh complete:", error);
    }
  }

  getCacheKey(url) {
    return `${this.cachePrefix}${createUrlKey(url)}`;
  }

  getCachedUrl(originalUrl, expiresIn = this.defaultExpiresIn) {
    try {
      // Check in-memory cache first
      if (urlCache.has(originalUrl)) {
        const cached = urlCache.get(originalUrl);
        const age = Date.now() - cached.timestamp;
        const maxAge = (cached.expiresIn || expiresIn) * 1000 * 0.9;

        if (age < maxAge) {
          return cached.url;
        } else {
          urlCache.delete(originalUrl);
        }
      }

      // Check localStorage
      const cacheKey = this.getCacheKey(originalUrl);
      const cached = storage.get(cacheKey);

      if (cached) {
        const age = Date.now() - cached.timestamp;
        const maxAge = (cached.expiresIn || expiresIn) * 1000 * 0.9;

        if (age < maxAge) {
          // Update in-memory cache
          urlCache.set(originalUrl, cached);
          return cached.url;
        } else {
          // Expired, remove from cache
          storage.remove(cacheKey);
          urlCache.delete(originalUrl);
        }
      }
    } catch (error) {
      console.warn("Failed to get cached URL:", error);
    }

    return null;
  }

  setCachedUrl(originalUrl, signedUrl, expiresIn = this.defaultExpiresIn) {
    try {
      const cacheData = {
        url: signedUrl,
        timestamp: Date.now(),
        expiresIn,
      };

      // Update in-memory cache
      urlCache.set(originalUrl, cacheData);

      // Update localStorage
      const cacheKey = this.getCacheKey(originalUrl);
      storage.set(cacheKey, cacheData);

      return true;
    } catch (error) {
      console.warn("Failed to cache URL:", error);
      return false;
    }
  }

  async refreshSignedUrl(
    originalUrl,
    expiresIn = this.defaultExpiresIn,
    { storage: storageClient }
  ) {
    try {
      // Check if not a Supabase storage URL
      if (!isSupabaseStorageUrl(originalUrl)) {
        return originalUrl;
      }

      // Check for existing refresh operation
      if (refreshLocks.has(originalUrl)) {
        const lockTime = refreshLocks.get(originalUrl);
        const lockAge = Date.now() - lockTime;

        // If lock is older than 30 seconds, assume it's stale
        if (lockAge > 30000) {
          refreshLocks.delete(originalUrl);
        } else {
          // Wait for existing operation
          if (this.refreshPromises.has(originalUrl)) {
            return await this.refreshPromises.get(originalUrl);
          }
        }
      }

      // Check cache first
      const cachedUrl = this.getCachedUrl(originalUrl, expiresIn);
      if (cachedUrl) {
        return cachedUrl;
      }

      // Start refresh operation
      const refreshPromise = this._performRefresh(
        originalUrl,
        expiresIn,
        storageClient
      );
      this.refreshPromises.set(originalUrl, refreshPromise);

      try {
        const result = await refreshPromise;
        return result;
      } finally {
        this.refreshPromises.delete(originalUrl);
      }
    } catch (error) {
      console.error("Failed to refresh signed URL:", originalUrl, error);
      return originalUrl; // Fallback to original URL
    }
  }

  async _performRefresh(originalUrl, expiresIn, storageClient) {
    try {
      // Broadcast refresh start
      messenger.broadcast("url-refresh-start", { originalUrl });
      refreshLocks.set(originalUrl, Date.now());

      // Parse URL
      const parsed = parseSupabaseUrl(originalUrl);
      if (!parsed) {
        throw new Error("Failed to parse Supabase storage URL");
      }

      const { bucket, filePath } = parsed;

      // Get signed URL from Supabase
      const freshUrl = await storageClient.getSignedUrl(
        bucket,
        filePath,
        expiresIn
      );

      if (!freshUrl) {
        throw new Error("Received empty signed URL from Supabase");
      }

      // Cache the result
      this.setCachedUrl(originalUrl, freshUrl, expiresIn);

      // Broadcast to other tabs
      messenger.broadcast("url-updated", {
        originalUrl,
        signedUrl: freshUrl,
        expiresIn,
      });

      return freshUrl;
    } catch (error) {
      console.error("Signed URL refresh failed:", error);
      throw error;
    } finally {
      // Clean up
      refreshLocks.delete(originalUrl);
      messenger.broadcast("url-refresh-complete", { originalUrl });
    }
  }

  // Clean up expired cache entries
  cleanupCache() {
    try {
      const now = Date.now();

      // Clean in-memory cache
      for (const [url, cached] of urlCache.entries()) {
        const age = now - cached.timestamp;
        const maxAge = cached.expiresIn * 1000;

        if (age > maxAge) {
          urlCache.delete(url);
        }
      }

      // Clean localStorage cache
      if (typeof localStorage !== "undefined") {
        const keysToRemove = [];

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(this.cachePrefix)) {
            try {
              const cached = JSON.parse(localStorage.getItem(key));
              const age = now - cached.timestamp;
              const maxAge = cached.expiresIn * 1000;

              if (age > maxAge) {
                keysToRemove.push(key);
              }
            } catch (error) {
              // Invalid cache entry, remove it
              keysToRemove.push(key);
            }
          }
        }

        keysToRemove.forEach((key) => localStorage.removeItem(key));
      }
    } catch (error) {
      console.warn("Cache cleanup failed:", error);
    }
  }
}

// Global signed URL manager instance
export const signedUrlManager = new SignedUrlManager();

// Clean up cache every 5 minutes
setInterval(() => {
  signedUrlManager.cleanupCache();
}, 5 * 60 * 1000);

// Clean up on page unload
window.addEventListener("beforeunload", () => {
  signedUrlManager.cleanupCache();
});
