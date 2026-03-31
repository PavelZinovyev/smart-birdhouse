/** ключи кэша(единое место для инвалидации и хуков) */

export const queryKeys = {
  sensors: ['sensors'] as const,
  pi: {
    status: ['pi', 'status'] as const,
    cameraStatus: ['pi', 'cameraStatus'] as const,
    videos: ['pi', 'videos'] as const,
    time: ['pi', 'time'] as const,
  },
} as const;
