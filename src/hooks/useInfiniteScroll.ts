import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseInfiniteScrollOptions {
  threshold?: number; // Distance from bottom to trigger load (in pixels)
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
}

export interface UseInfiniteScrollReturn {
  containerRef: React.RefObject<HTMLDivElement>;
  sentinelRef: React.RefObject<HTMLDivElement>;
}

/**
 * Infinite scroll hook - loads more content when user scrolls near bottom
 * Used for chat history pagination
 */
export const useInfiniteScroll = ({
  threshold = 200,
  hasMore,
  isLoading,
  onLoadMore,
}: UseInfiniteScrollOptions): UseInfiniteScrollReturn => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [observer, setObserver] = useState<IntersectionObserver | null>(null);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      
      // When sentinel is visible and we have more data and aren't loading
      if (entry.isIntersecting && hasMore && !isLoading) {
        onLoadMore();
      }
    },
    [hasMore, isLoading, onLoadMore]
  );

  // Set up IntersectionObserver
  useEffect(() => {
    const options = {
      root: containerRef.current,
      rootMargin: `${threshold}px`,
      threshold: 0.1,
    };

    const obs = new IntersectionObserver(handleIntersection, options);
    setObserver(obs);

    return () => {
      obs.disconnect();
    };
  }, [handleIntersection, threshold]);

  // Observe sentinel element
  useEffect(() => {
    if (observer && sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => {
      if (observer && sentinelRef.current) {
        observer.unobserve(sentinelRef.current);
      }
    };
  }, [observer, sentinelRef]);

  return {
    containerRef,
    sentinelRef,
  };
};

/**
 * Pagination state management for infinite scroll
 */
export interface UsePaginationOptions {
  initialPage?: number;
  pageSize?: number;
}

export interface UsePaginationReturn {
  page: number;
  pageSize: number;
  hasMore: boolean;
  isLoading: boolean;
  setHasMore: (hasMore: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  loadMore: () => void;
  reset: () => void;
}

export const usePagination = ({
  initialPage = 0,
  pageSize = 20,
}: UsePaginationOptions = {}): UsePaginationReturn => {
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      setPage((prev) => prev + 1);
    }
  }, [isLoading, hasMore]);

  const reset = useCallback(() => {
    setPage(initialPage);
    setHasMore(true);
    setIsLoading(false);
  }, [initialPage]);

  return {
    page,
    pageSize,
    hasMore,
    isLoading,
    setHasMore,
    setIsLoading,
    loadMore,
    reset,
  };
};
