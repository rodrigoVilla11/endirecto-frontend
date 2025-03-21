// InfiniteScrollContext.tsx
import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';

interface InfiniteScrollContextType {
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  setHasMore: (value: boolean) => void;
  setIsLoading: (value: boolean) => void;
  resetPagination: () => void;
  observerRef: React.RefObject<HTMLDivElement>;
}

const InfiniteScrollContext = createContext<InfiniteScrollContextType | undefined>(undefined);

interface InfiniteScrollProviderProps {
  children: ReactNode;
  threshold?: number;
  initialPage?: number;
}

export const InfiniteScrollProvider = ({ 
  children, 
  threshold = 0.5,
  initialPage = 1
}: InfiniteScrollProviderProps) => {
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

  const resetPagination = () => {
    setPage(initialPage);
    setHasMore(true);
  };

  useEffect(() => {
    if (!observerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry.isIntersecting && hasMore && !isLoading) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold }
    );

    observer.observe(observerRef.current);

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [hasMore, isLoading, threshold]);

  const value = {
    page,
    hasMore,
    isLoading,
    setHasMore,
    setIsLoading,
    resetPagination,
    observerRef
  };

  return (
    <InfiniteScrollContext.Provider value={value}>
      {children}
    </InfiniteScrollContext.Provider>
  );
};

export const useInfiniteScroll = () => {
  const context = useContext(InfiniteScrollContext);
  if (context === undefined) {
    throw new Error('useInfiniteScroll must be used within an InfiniteScrollProvider');
  }
  return context;
};