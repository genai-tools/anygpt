// Export executor for Nx
export { default as releaseExecutor } from './executors/release/executor';

// Export types for external use
export type { ReleaseExecutorSchema } from './executors/release/schema';
export type { PackageRelease } from './lib/changelog';
