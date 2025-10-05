#!/usr/bin/env node
/**
 * Create or update Release PR
 * 
 * This script is called by GitHub Actions to create/update a Release PR
 * when releasable changes are detected.
 */

import * as core from '@actions/core';
import * as github from '@actions/github';
import { Octokit } from '@octokit/rest';

interface GitHubContext {
  repo: {
    owner: string;
    repo: string;
  };
}

async function main() {
  try {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('GITHUB_TOKEN environment variable is required');
    }

    const octokit = new Octokit({ auth: token });
    const context = github.context as unknown as GitHubContext;

    core.info('Checking for existing Release PRs...');

    // Close any existing release PRs
    const { data: existingPRs } = await octokit.rest.pulls.list({
      owner: context.repo.owner,
      repo: context.repo.repo,
      state: 'open',
      head: `${context.repo.owner}:release-next`,
    });

    for (const pr of existingPRs) {
      core.info(`Closing existing Release PR #${pr.number}`);
      await octokit.rest.pulls.update({
        owner: context.repo.owner,
        repo: context.repo.repo,
        pull_number: pr.number,
        state: 'closed',
      });
    }

    // Get version info from package.json changes
    core.info('Comparing release-next branch with main...');
    const { data: comparison } = await octokit.rest.repos.compareCommits({
      owner: context.repo.owner,
      repo: context.repo.repo,
      base: 'main',
      head: 'release-next',
    });

    // Build PR body
    const prBody = buildPRBody(comparison.files?.length || 0, comparison.commits.length);

    // Create new PR
    core.info('Creating new Release PR...');
    const { data: pr } = await octokit.rest.pulls.create({
      owner: context.repo.owner,
      repo: context.repo.repo,
      title: '🚀 Release: Next Version',
      head: 'release-next',
      base: 'main',
      body: prBody,
      draft: false,
    });

    core.info(`Created Release PR #${pr.number}`);

    // Add label
    await octokit.rest.issues.addLabels({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: pr.number,
      labels: ['release'],
    });

    core.setOutput('pr_number', pr.number);
    core.setOutput('pr_url', pr.html_url);

    console.log(`✅ Release PR created: ${pr.html_url}`);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('Unknown error occurred');
    }
    process.exit(1);
  }
}

function buildPRBody(filesChanged: number, commitsCount: number): string {
  return [
    '## 🚀 Release PR',
    '',
    'This PR contains version bumps and changelog updates for the next release.',
    '',
    '### 📦 What\'s included',
    '',
    '- ✅ Version bumps in `package.json`',
    '- ✅ Updated `CHANGELOG.md` files',
    '- ✅ Ready to publish',
    '',
    '### ✅ CI Status',
    '',
    'CI checks have passed on the base commit. They will run again on this PR.',
    '',
    '### 🎯 How to release',
    '',
    '1. **Review** the changes in the "Files changed" tab',
    '2. **Edit** CHANGELOGs if needed (commit directly to this branch)',
    '3. **Wait** for CI to pass',
    '4. **Merge** this PR to publish to npm',
    '',
    '### 📝 What happens on merge?',
    '',
    '- Git tags will be created',
    '- Packages will be published to npm',
    '- Release branch will be deleted',
    '',
    '---',
    '',
    `**Changed files:** ${filesChanged}`,
    `**Commits:** ${commitsCount}`,
  ].join('\n');
}

main();
