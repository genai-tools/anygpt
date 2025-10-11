/**
 * Custom error types for configuration loading
 */

/**
 * Base class for all configuration errors
 */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Thrown when no configuration file is found
 */
export class ConfigNotFoundError extends ConfigError {
  constructor(public readonly searchPaths: string[]) {
    super(
      `No configuration file found. Searched:\n${searchPaths
        .map((p) => `  - ${p}`)
        .join('\n')}\n\n` +
        `Create a config file at ./.anygpt/anygpt.config.ts or use default config.`
    );
  }
}

/**
 * Thrown when configuration file cannot be parsed
 */
export class ConfigParseError extends ConfigError {
  constructor(
    public readonly filePath: string,
    public readonly originalError: unknown
  ) {
    const causeMessage =
      originalError instanceof Error
        ? originalError.message
        : String(originalError);
    super(
      `Failed to parse configuration file: ${filePath}\n\n` +
        `Error: ${causeMessage}\n\n` +
        `Check your configuration file syntax.`
    );
  }
}

/**
 * Thrown when configuration fails validation
 */
export class ConfigValidationError extends ConfigError {
  constructor(public readonly errors: string[]) {
    super(
      `Configuration validation failed:\n${errors
        .map((e) => `  - ${e}`)
        .join('\n')}\n\n` + `Fix the errors above and try again.`
    );
  }
}

/**
 * Thrown when a connector module cannot be loaded
 */
export class ConnectorLoadError extends ConfigError {
  constructor(
    public readonly connectorPackage: string,
    public readonly providerId: string,
    public readonly originalError: unknown
  ) {
    const causeMessage =
      originalError instanceof Error
        ? originalError.message
        : String(originalError);
    super(
      `Failed to load connector '${connectorPackage}' for provider '${providerId}'\n\n` +
        `Error: ${causeMessage}\n\n` +
        `Make sure the connector package is installed:\n` +
        `  npm install ${connectorPackage}`
    );
  }
}
