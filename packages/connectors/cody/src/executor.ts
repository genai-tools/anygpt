import { spawn } from 'node:child_process';
import { pipeline } from 'node:stream/promises';
import { Transform } from 'node:stream';
import { cleanCodyOutput, buildCodyArgs } from './utils.js';
import type { CodyConnectorConfig } from './types.js';

/**
 * Execute cody chat command and return the response using pipeline approach
 */
export async function executeCodyChat(
  message: string,
  config: CodyConnectorConfig,
  model?: string
): Promise<string> {
  const args = buildCodyArgs(message, {
    model: model || config.model,
    endpoint: config.endpoint,
    accessToken: config.accessToken,
    workingDirectory: config.workingDirectory,
    showContext: config.showContext,
    debug: config.debug
  });
  
  const codyProcess = spawn(config.cliPath || 'cody', args, {
    env: {
      ...process.env,
      ...(config.accessToken && { SRC_ACCESS_TOKEN: config.accessToken }),
      ...(config.endpoint && { SRC_ENDPOINT: config.endpoint })
    }
  });

  // Create a transform stream to clean output line by line
  const cleanTransform = new Transform({
    transform: (chunk: Buffer, _encoding, callback) => {
      const text = chunk.toString();
      const cleaned = cleanCodyOutput(text);
      if (cleaned) {
        callback(null, cleaned);
      } else {
        callback();
      }
    }
  });

  // Collect output chunks
  const chunks: string[] = [];
  const collectTransform = new Transform({
    transform: (chunk: Buffer, _encoding, callback) => {
      chunks.push(chunk.toString());
      callback();
    }
  });

  let stderr = '';
  codyProcess.stderr.on('data', (data) => {
    stderr += data.toString();
  });

  // Set up timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      codyProcess.kill();
      reject(new Error(`Cody CLI timeout after ${config.timeout}ms`));
    }, config.timeout);
  });

  // Set up process error handling
  const processPromise = new Promise<string>((resolve, reject) => {
    codyProcess.on('error', (error) => {
      reject(new Error(`Failed to spawn cody CLI: ${error.message}`));
    });

    codyProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Cody CLI exited with code ${code}: ${stderr}`));
      } else {
        resolve(chunks.join(''));
      }
    });
  });

  // Use pipeline to process stdout
  try {
    await Promise.race([
      pipeline(
        codyProcess.stdout,
        cleanTransform,
        collectTransform
      ),
      timeoutPromise
    ]);

    return await processPromise;
  } catch (error) {
    codyProcess.kill();
    throw error;
  }
}
