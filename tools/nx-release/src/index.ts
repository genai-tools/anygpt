// Export executor for Nx
export { default as releaseExecutor } from './executors/release/executor.js';

// Export types for external use
export type { ReleaseExecutorSchema } from './executors/release/schema.js';
export type { PackageRelease } from './lib/changelog.js';
