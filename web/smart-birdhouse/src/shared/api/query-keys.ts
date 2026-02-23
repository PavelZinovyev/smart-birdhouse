/** Ключи кэша TanStack Query (единое место для инвалидации и хуков) */

export const queryKeys = {
  sensors: ['sensors'] as const,
  pi: {
    status: ['pi', 'status'] as const,
  },
} as const;
