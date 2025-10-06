import { execa } from 'execa';
import type { PackageRelease } from './changelog';

export async function generateAISummary(
  changelog: string,
  releases: PackageRelease[],
  diff: string,
  aiCommand: string
): Promise<string> {
  try {
    const releaseInfo = releases.map((r) => `${r.name}@${r.version}`).join(', ');

    const prompt = `Generate a concise, professional summary for this release PR. Include:
1. A brief overview of what's being released (${releaseInfo})
2. Key highlights from the changelog
3. Notable code changes from the diff
4. Any important notes for reviewers

Changelog:
${changelog}

Code Changes (diff):
${diff.slice(0, 5000)}${diff.length > 5000 ? '\n... (truncated)' : ''}

Keep it under 250 words and use a friendly, professional tone. Focus on what matters to reviewers.`;

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
