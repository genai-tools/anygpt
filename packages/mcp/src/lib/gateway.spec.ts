import { describe, it, expect } from 'vitest';
import { spawn } from 'child_process';
import { join } from 'path';

describe('MCP Server Integration', () => {
  it('should respond to tools/list request', async () => {
    const serverPath = join(__dirname, '../../dist/index.js');
    
    const result = await new Promise<string>((resolve, reject) => {
      const child = spawn('node', [serverPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          OPENAI_API_KEY: 'test-key',
        },
      });

      let output = '';
      let errorOutput = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      // Send tools/list request
      const request = JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {},
      });

      child.stdin.write(request + '\n');
      child.stdin.end();

      // Wait for response or timeout
      setTimeout(() => {
        child.kill();
        if (output) {
          resolve(output);
        } else {
          reject(new Error(`No output received. stderr: ${errorOutput}`));
        }
      }, 2000);

      child.on('error', (error) => {
        reject(error);
      });
    });

    // Parse the response
    const response = JSON.parse(result);
    
    expect(response).toHaveProperty('result');
    expect(response.result).toHaveProperty('tools');
    expect(Array.isArray(response.result.tools)).toBe(true);
    expect(response.result.tools.length).toBeGreaterThan(0);
    
    // Check for expected tools
    const toolNames = response.result.tools.map((t: { name: string }) => t.name);
    expect(toolNames).toContain('anygpt_chat_completion');
    expect(toolNames).toContain('anygpt_list_models');
    expect(toolNames).toContain('anygpt_list_providers');
  }, 10000);

  it('should have proper tool schemas', async () => {
    const serverPath = join(__dirname, '../../dist/index.js');
    
    const result = await new Promise<string>((resolve, reject) => {
      const child = spawn('node', [serverPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          OPENAI_API_KEY: 'test-key',
        },
      });

      let output = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      const request = JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {},
      });

      child.stdin.write(request + '\n');
      child.stdin.end();

      setTimeout(() => {
        child.kill();
        resolve(output);
      }, 2000);

      child.on('error', reject);
    });

    const response = JSON.parse(result);
    const chatTool = response.result.tools.find((t: { name: string }) => t.name === 'anygpt_chat_completion');
    
    expect(chatTool).toBeDefined();
    expect(chatTool.inputSchema).toHaveProperty('properties');
    expect(chatTool.inputSchema.properties).toHaveProperty('messages');
    expect(chatTool.inputSchema.properties).toHaveProperty('model');
    expect(chatTool.inputSchema.properties).toHaveProperty('provider');
    expect(chatTool.inputSchema.required).toContain('messages');
  }, 10000);
});
