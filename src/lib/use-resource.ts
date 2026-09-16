"use client";
import { useEffect, useState } from "react";
export function useResource<T>(
  key: string,
  loader: (signal: AbortSignal) => Promise<T>,
) {
  const [state, setState] = useState<{
    data?: T;
    error?: string;
    loading: boolean;
  }>({ loading: true });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: true });
    loader(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setState({ data, loading: false });
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setState({
            error: e instanceof Error ? e.message : "Không tải được dữ liệu.",
            loading: false,
          });
      });
    return () => controller.abort();
  }, [key, revision]); // key represents all request arguments
  return { ...state, retry: () => setRevision((r) => r + 1) };
}
