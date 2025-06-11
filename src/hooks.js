// 懒加载Hook
import { useState, useEffect, useRef } from 'react';

export const useLazyLoad = (options = {}) => {
  const [visibleItems, setVisibleItems] = useState(new Set());
  const observerRef = useRef();

  const defaultOptions = {
    threshold: 0.1,
    rootMargin: '50px',
    ...options
  };

  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const itemId = entry.target.dataset.itemId;
          if (itemId) {
            setVisibleItems(prev => new Set([...prev, itemId]));
          }
        }
      });
    }, defaultOptions);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const observe = (element, itemId) => {
    if (element && observerRef.current && itemId) {
      element.dataset.itemId = itemId;
      observerRef.current.observe(element);
    }
  };

  const unobserve = (element) => {
    if (element && observerRef.current) {
      observerRef.current.unobserve(element);
    }
  };

  return { visibleItems, observe, unobserve };
};

// 防抖Hook
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// 本地存储Hook
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
};
