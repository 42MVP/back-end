import { CacheModuleAsyncOptions, CacheModuleOptions } from '@nestjs/cache-manager';

export const cacheConfig: CacheModuleAsyncOptions = {
  useFactory: async (): Promise<CacheModuleOptions> => {
    return {
      store: 'memory',
      ttl: +process.env.CACHE_EXPIRES_IN,
    };
  },
};
