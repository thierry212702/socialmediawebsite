// File: src/hooks/useInfiniteScroll.js
import { useEffect, useRef, useCallback } from 'react';

const useInfiniteScroll = (callback, hasNextPage, isLoading, threshold = 0.8) => {
  const observerRef = useRef();
  const lastElementRef = useCallback(
    (node) => {
      if (isLoading) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextPage) {
            callback();
          }
        },
        { threshold }
      );

      if (node) observerRef.current.observe(node);
    },
    [isLoading, hasNextPage, callback, threshold]
  );

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return lastElementRef;
};

export default useInfiniteScroll;