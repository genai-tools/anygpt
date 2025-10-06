import { execa } from 'execa';
import type { PackageRelease } from './changelog';

export async function generateAISummary(
  changelog: string,
  releases: PackageRelease[],
  diff: string,
  aiCommand: string
): Promise<string> {
  try {
    const prompt = `Generate a brief, focused summary of the actual code changes in this release.

IMPORTANT:
- Focus ONLY on actual functional changes, new features, and bug fixes
- Ignore version bumps, dependency updates, and package.json changes
- Keep it under 100 words
- Use bullet points for clarity
- Skip mentioning package versions unless it's critical context

Code Changes (diff):
${diff.slice(0, 5000)}${diff.length > 5000 ? '\n... (truncated)' : ''}

Changelog:
${changelog}

Provide a concise summary of what actually changed in the code.`;

    console.log('🤖 Generating AI summary...');
    const [command, ...args] = aiCommand.split(' ');
    const { stdout } = await execa(command, [...args, prompt], {
      stdio: 'pipe',
    });

    return stdout.trim();
  } catch (error) {
    console.log('⚠️  AI summary generation failed, using default summary');
    console.error(error);
    return '';
  }
}
