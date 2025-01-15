import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollProps {
  hasMore: boolean;
  isLoading: boolean;
  onIntersect: () => void;
  threshold?: number;
  rootMargin?: string;
}

export const useInfiniteScroll = ({
  hasMore,
  isLoading,
  onIntersect,
  threshold = 0.5,
  rootMargin = '0px',
}: UseInfiniteScrollProps) => {
  const observerRef = useRef<HTMLDivElement | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  // Callback para el intersection observer
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasMore && !isLoading) {
        onIntersect();
      }
    },
    [hasMore, isLoading, onIntersect]
  );

  // Efecto para crear y limpiar el observer
  useEffect(() => {
    const element = observerRef.current;

    if (!element) return;

    // Limpiar observer anterior si existe
    if (observer.current) {
      observer.current.disconnect();
    }

    // Crear nuevo observer
    observer.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin,
      threshold,
    });

    // Observar elemento
    observer.current.observe(element);

    // Cleanup
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [handleObserver, rootMargin, threshold]);

  return {
    observerRef,
    isLoading,
  };
};