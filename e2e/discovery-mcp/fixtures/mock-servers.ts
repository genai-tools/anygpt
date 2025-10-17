import type { ServerMetadata, ToolMetadata } from '@anygpt/mcp-discovery';

/**
 * Mock GitHub MCP Server
 */
export const mockGitHubServer: ServerMetadata = {
  name: 'github',
  description: 'GitHub integration for repository and issue management',
  toolCount: 6,
  enabledCount: 6,
  status: 'connected',
  config: {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github']
  }
};

export const mockGitHubTools: ToolMetadata[] = [
  {
    server: 'github',
    name: 'github_create_issue',
    summary: 'Create a new issue in a GitHub repository',
    description: 'Creates a new issue in the specified GitHub repository with the given title, body, and labels',
    tags: ['github', 'issues', 'create', 'write'],
    enabled: true,
    parameters: [
      { name: 'repo', type: 'string', required: true, description: 'Repository name (owner/repo)' },
      { name: 'title', type: 'string', required: true, description: 'Issue title' },
      { name: 'body', type: 'string', required: false, description: 'Issue body' },
      { name: 'labels', type: 'array', required: false, description: 'Issue labels' }
    ]
  },
  {
    server: 'github',
    name: 'github_list_issues',
    summary: 'List issues in a GitHub repository',
    tags: ['github', 'issues', 'list', 'read'],
    enabled: true,
    parameters: [
      { name: 'repo', type: 'string', required: true, description: 'Repository name (owner/repo)' },
      { name: 'state', type: 'string', required: false, description: 'Issue state (open, closed, all)' }
    ]
  },
  {
    server: 'github',
    name: 'github_get_issue',
    summary: 'Get details of a specific GitHub issue',
    tags: ['github', 'issues', 'get', 'read'],
    enabled: true,
    parameters: [
      { name: 'repo', type: 'string', required: true, description: 'Repository name (owner/repo)' },
      { name: 'issue_number', type: 'number', required: true, description: 'Issue number' }
    ]
  },
  {
    server: 'github',
    name: 'github_create_pr',
    summary: 'Create a new pull request',
    tags: ['github', 'pull-requests', 'create', 'write'],
    enabled: true,
    parameters: [
      { name: 'repo', type: 'string', required: true, description: 'Repository name (owner/repo)' },
      { name: 'title', type: 'string', required: true, description: 'PR title' },
      { name: 'head', type: 'string', required: true, description: 'Head branch' },
      { name: 'base', type: 'string', required: true, description: 'Base branch' }
    ]
  },
  {
    server: 'github',
    name: 'github_list_repos',
    summary: 'List repositories for a user or organization',
    tags: ['github', 'repositories', 'list', 'read'],
    enabled: true,
    parameters: [
      { name: 'owner', type: 'string', required: true, description: 'User or organization name' }
    ]
  },
  {
    server: 'github',
    name: 'github_delete_issue',
    summary: 'Delete a GitHub issue (dangerous)',
    tags: ['github', 'issues', 'delete', 'dangerous'],
    enabled: true,
    parameters: [
      { name: 'repo', type: 'string', required: true, description: 'Repository name (owner/repo)' },
      { name: 'issue_number', type: 'number', required: true, description: 'Issue number' }
    ]
  }
];

/**
 * Mock Jira MCP Server
 */
export const mockJiraServer: ServerMetadata = {
  name: 'jira',
  description: 'Jira integration for project management',
  toolCount: 4,
  enabledCount: 4,
  status: 'connected',
  config: {
    command: 'node',
    args: ['./jira-server.js']
  }
};

export const mockJiraTools: ToolMetadata[] = [
  {
    server: 'jira',
    name: 'jira_create_ticket',
    summary: 'Create a new Jira ticket',
    tags: ['jira', 'tickets', 'create', 'write'],
    enabled: true,
    parameters: [
      { name: 'project', type: 'string', required: true, description: 'Project key' },
      { name: 'summary', type: 'string', required: true, description: 'Ticket summary' },
      { name: 'description', type: 'string', required: false, description: 'Ticket description' },
      { name: 'type', type: 'string', required: false, description: 'Issue type (Bug, Task, Story)' }
    ]
  },
  {
    server: 'jira',
    name: 'jira_list_tickets',
    summary: 'List tickets in a Jira project',
    tags: ['jira', 'tickets', 'list', 'read'],
    enabled: true,
    parameters: [
      { name: 'project', type: 'string', required: true, description: 'Project key' },
      { name: 'status', type: 'string', required: false, description: 'Ticket status' }
    ]
  },
  {
    server: 'jira',
    name: 'jira_get_ticket',
    summary: 'Get details of a specific Jira ticket',
    tags: ['jira', 'tickets', 'get', 'read'],
    enabled: true,
    parameters: [
      { name: 'ticket_id', type: 'string', required: true, description: 'Ticket ID (e.g., PROJ-123)' }
    ]
  },
  {
    server: 'jira',
    name: 'jira_update_ticket',
    summary: 'Update a Jira ticket',
    tags: ['jira', 'tickets', 'update', 'write'],
    enabled: true,
    parameters: [
      { name: 'ticket_id', type: 'string', required: true, description: 'Ticket ID' },
      { name: 'fields', type: 'object', required: true, description: 'Fields to update' }
    ]
  }
];

/**
 * Mock Filesystem MCP Server
 */
export const mockFilesystemServer: ServerMetadata = {
  name: 'filesystem',
  description: 'Filesystem operations',
  toolCount: 5,
  enabledCount: 5,
  status: 'connected',
  config: {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem']
  }
};

export const mockFilesystemTools: ToolMetadata[] = [
  {
    server: 'filesystem',
    name: 'read_file',
    summary: 'Read contents of a file',
    tags: ['filesystem', 'read', 'safe'],
    enabled: true,
    parameters: [
      { name: 'path', type: 'string', required: true, description: 'File path' }
    ]
  },
  {
    server: 'filesystem',
    name: 'write_file',
    summary: 'Write contents to a file',
    tags: ['filesystem', 'write', 'dangerous'],
    enabled: true,
    parameters: [
      { name: 'path', type: 'string', required: true, description: 'File path' },
      { name: 'content', type: 'string', required: true, description: 'File content' }
    ]
  },
  {
    server: 'filesystem',
    name: 'list_directory',
    summary: 'List contents of a directory',
    tags: ['filesystem', 'list', 'read', 'safe'],
    enabled: true,
    parameters: [
      { name: 'path', type: 'string', required: true, description: 'Directory path' }
    ]
  },
  {
    server: 'filesystem',
    name: 'delete_file',
    summary: 'Delete a file',
    tags: ['filesystem', 'delete', 'dangerous'],
    enabled: true,
    parameters: [
      { name: 'path', type: 'string', required: true, description: 'File path' }
    ]
  },
  {
    server: 'filesystem',
    name: 'stat_file',
    summary: 'Get file statistics',
    tags: ['filesystem', 'stat', 'read', 'safe'],
    enabled: true,
    parameters: [
      { name: 'path', type: 'string', required: true, description: 'File path' }
    ]
  }
];

/**
 * Mock Docker MCP Server
 */
export const mockDockerServer: ServerMetadata = {
  name: 'docker',
  description: 'Docker container management',
  toolCount: 4,
  enabledCount: 4,
  status: 'connected',
  config: {
    command: 'node',
    args: ['./docker-server.js']
  }
};

export const mockDockerTools: ToolMetadata[] = [
  {
    server: 'docker',
    name: 'docker_list_containers',
    summary: 'List Docker containers',
    tags: ['docker', 'containers', 'list', 'read'],
    enabled: true,
    parameters: [
      { name: 'all', type: 'boolean', required: false, description: 'Show all containers' }
    ]
  },
  {
    server: 'docker',
    name: 'docker_inspect_container',
    summary: 'Inspect a Docker container',
    tags: ['docker', 'containers', 'inspect', 'read'],
    enabled: true,
    parameters: [
      { name: 'container_id', type: 'string', required: true, description: 'Container ID' }
    ]
  },
  {
    server: 'docker',
    name: 'docker_stop_container',
    summary: 'Stop a Docker container',
    tags: ['docker', 'containers', 'stop', 'dangerous'],
    enabled: true,
    parameters: [
      { name: 'container_id', type: 'string', required: true, description: 'Container ID' }
    ]
  },
  {
    server: 'docker',
    name: 'docker_remove_container',
    summary: 'Remove a Docker container',
    tags: ['docker', 'containers', 'remove', 'dangerous'],
    enabled: true,
    parameters: [
      { name: 'container_id', type: 'string', required: true, description: 'Container ID' }
    ]
  }
];

/**
 * All mock servers
 */
export const mockServers: ServerMetadata[] = [
  mockGitHubServer,
  mockJiraServer,
  mockFilesystemServer,
  mockDockerServer
];

/**
 * All mock tools
 */
export const mockTools: ToolMetadata[] = [
  ...mockGitHubTools,
  ...mockJiraTools,
  ...mockFilesystemTools,
  ...mockDockerTools
];

/**
 * Get tools for a specific server
 */
export function getToolsForServer(serverName: string): ToolMetadata[] {
  return mockTools.filter(tool => tool.server === serverName);
}

/**
 * Get server by name
 */
export function getServer(serverName: string): ServerMetadata | undefined {
  return mockServers.find(server => server.name === serverName);
}
