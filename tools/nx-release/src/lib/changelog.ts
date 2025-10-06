import { execa } from 'execa';
import { readFile } from 'fs/promises';

export interface PackageRelease {
  name: string;
  version: string;
}

export async function extractChangelog(
  patterns: string[]
): Promise<{ changelog: string; releases: PackageRelease[] }> {
  let changelog = '';
  const releases: PackageRelease[] = [];

  for (const pattern of patterns) {
    const { stdout } = await execa('bash', [
      '-c',
      `ls ${pattern} 2>/dev/null || true`,
    ]);

    const files = stdout.split('\n').filter(Boolean);

    for (const file of files) {
      try {
        const content = await readFile(file, 'utf-8');
        const pkgName = file.split('/').slice(-2, -1)[0];

        // Extract first changelog entry (between first two ## headers)
        const lines = content.split('\n');
        const firstHeaderIdx = lines.findIndex((l) => l.startsWith('## '));
        if (firstHeaderIdx === -1) continue;

        // Extract version from first header (e.g., "## 0.8.0 (2025-10-06)")
        const versionMatch = lines[firstHeaderIdx].match(/##\s+([\d.]+)/);
        if (versionMatch) {
          releases.push({ name: pkgName, version: versionMatch[1] });
        }

        const secondHeaderIdx = lines.findIndex(
          (l, i) => i > firstHeaderIdx && l.startsWith('## ')
        );
        const endIdx = secondHeaderIdx === -1 ? lines.length : secondHeaderIdx;

        const entry = lines.slice(firstHeaderIdx, endIdx).join('\n').trim();
        if (entry) {
          changelog += `\n### 📦 ${pkgName}\n${entry}\n`;
        }
      } catch {
        // Skip files that can't be read
      }
    }
  }

  return { changelog, releases };
}

export function extractReleasesFromTags(tags: string[]): PackageRelease[] {
  return tags
    .map((tag) => {
      const match = tag.match(/^(.+)@([\d.]+)$/);
      if (match) {
        return { name: match[1], version: match[2] };
      }
      return null;
    })
    .filter((r): r is PackageRelease => r !== null);
}

export function buildPRTitle(releases: PackageRelease[]): string {
  if (releases.length === 1) {
    return `Release ${releases[0].name} v${releases[0].version}`;
  } else if (releases.length > 1) {
    return `Release: ${releases.map((r) => `${r.name}@${r.version}`).join(', ')}`;
  } else {
    return `Release: ${new Date().toISOString().split('T')[0]}`;
  }
}
