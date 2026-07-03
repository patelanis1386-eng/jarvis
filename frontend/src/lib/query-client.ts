import { QueryClient } from "@tanstack/react-query";

const STALE_TIMES = {
  default: 1000 * 60 * 5,
  conversations: 1000 * 30,
  messages: 1000 * 10,
  user: 1000 * 60 * 30,
  analytics: 1000 * 60 * 5,
  plugins: 1000 * 60 * 15,
  knowledge: 1000 * 60 * 10,
  memories: 1000 * 60 * 5,
  notifications: 1000 * 30,
} as const;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIMES.default,
        gcTime: 1000 * 60 * 30,
        retry: (failureCount, error) => {
          if (error instanceof Error && error.message.includes("401")) {
            return false;
          }
          if (error instanceof Error && error.message.includes("404")) {
            return false;
          }
          return failureCount < 2;
        },
        retryDelay: (attemptIndex) =>
          Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        refetchOnMount: true,
      },
      mutations: {
        retry: 1,
        retryDelay: 1000,
      },
    },
  });
}

export function createDefaultQueryClient(): QueryClient {
  const queryClient = createQueryClient();

  queryClient.setQueryDefaults(["conversations"], {
    staleTime: STALE_TIMES.conversations,
  });

  queryClient.setQueryDefaults(["messages"], {
    staleTime: STALE_TIMES.messages,
  });

  queryClient.setQueryDefaults(["user"], {
    staleTime: STALE_TIMES.user,
  });

  queryClient.setQueryDefaults(["analytics"], {
    staleTime: STALE_TIMES.analytics,
  });

  return queryClient;
}

export const queryClient = createDefaultQueryClient();
export { STALE_TIMES };
