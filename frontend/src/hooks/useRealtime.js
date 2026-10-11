import { useState, useEffect, useRef } from 'react';

const useRealtime = (callback, intervalMs) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    let isMounted = true;
    let timerId = null;

    const fetchData = async (isInitial = false) => {
      if (isInitial) {
        setLoading(true);
      }
      try {
        const result = await callbackRef.current();
        if (isMounted) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData(true); // initial fetch

    timerId = setInterval(() => {
      fetchData(false);
    }, intervalMs);

    return () => {
      isMounted = false;
      clearInterval(timerId);
    };
  }, [intervalMs]);

  return { data, loading, error };
};

export default useRealtime;