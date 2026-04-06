import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, type RenderHookOptions } from "@testing-library/react";

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function createWrapper(client?: QueryClient) {
  const qc = client ?? createTestQueryClient();
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  }
  return Wrapper;
}

export function renderHookWithQuery<T>(
  hook: () => T,
  client?: QueryClient,
  options?: Omit<RenderHookOptions<unknown>, "wrapper">,
) {
  const qc = client ?? createTestQueryClient();
  const result = renderHook(hook, { wrapper: createWrapper(qc), ...options });
  return { ...result, queryClient: qc };
}
