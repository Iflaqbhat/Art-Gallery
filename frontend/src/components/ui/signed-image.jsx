import React, { useState } from "react";
import { useSignedUrl } from "@/hooks/use-signed-url";
import { cn } from "@/lib/utils";

/**
 * Image component that automatically handles signed URL refresh
 * Uses public client by default to avoid auth state interference
 */
export const SignedImage = ({
  src,
  alt,
  className,
  fallback,
  onLoad,
  onError,
  expiresIn = 3600,
  usePublicClient = true,
  ...props
}) => {
  const { url, isRefreshing, error } = useSignedUrl(
    src,
    expiresIn,
    usePublicClient
  );
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Debug logging for image state
  React.useEffect(() => {
    console.log("🖼️ [SignedImage] State changed:", {
      originalSrc: src?.substring(0, 50) + "...",
      hasSignedUrl: !!url,
      urlSample: url?.substring(0, 50) + "...",
      isRefreshing,
      error: error?.message,
      imageError,
      imageLoaded,
      usePublicClient,
    });
  }, [src, url, isRefreshing, error, imageError, imageLoaded, usePublicClient]);

  const handleLoad = (e) => {
    console.log(
      "✅ [SignedImage] Image loaded successfully:",
      src?.substring(0, 50) + "..."
    );
    setImageLoaded(true);
    setImageError(false);
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    console.error(
      "❌ [SignedImage] Image failed to load:",
      src?.substring(0, 50) + "...",
      e
    );
    setImageError(true);
    if (onError) onError(e);
  };

  // Show fallback if there's an error or no URL
  if (imageError || error || !url) {
    return (
      fallback || (
        <div
          className={cn(
            "flex items-center justify-center bg-gray-800 text-gray-400",
            className
          )}
        >
          <svg
            className="w-1/3 h-1/3 opacity-50"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      className={cn(
        className,
        isRefreshing && "opacity-75 transition-opacity",
        !imageLoaded && "opacity-0"
      )}
      onLoad={handleLoad}
      onError={handleError}
      {...props}
    />
  );
};

export default SignedImage;
