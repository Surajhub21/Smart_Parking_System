import { useState, useEffect } from 'react';

const useRealtime = (callback, intervalMs) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let timerId = null;

    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await callback();
        if (isMounted) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
          setData(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData(); // call immediately

    timerId = setInterval(fetchData, intervalMs);

    return () => {
      isMounted = false;
      clearInterval(timerId);
    };
  }, [callback, intervalMs]);

  return { data, loading, error };
};

export default useRealtime;