# Docker MCP Registry Submission Specification

**Related Use Case**: [Docker MCP Toolkit Integration](../use-cases/docker-mcp-toolkit.md)  
**Related Spec**: [Docker Container](./docker-container.md)  
**Official Guide**: [Docker MCP Registry CONTRIBUTING.md](https://github.com/docker/mcp-registry/blob/main/CONTRIBUTING.md)

Specification for submitting AnyGPT to the official Docker MCP Registry.

## Overview

The Docker MCP Registry is the official catalog of MCP servers for Docker Desktop MCP Toolkit. Submission requires:

1. A `server.yaml` file with metadata and configuration
2. A Dockerfile that meets container requirements
3. Testing with Docker's validation tools
4. Pull request to the registry repository

## server.yaml Format

### Complete Example

```yaml
name: anygpt
image: mcp/anygpt
type: server
meta:
  category: ai-integration
  tags:
    - openai
    - anthropic
    - ai
    - llm
    - multi-provider
about:
  title: AnyGPT
  description: Universal AI provider gateway with support for OpenAI, Anthropic, and other providers. Route requests to multiple AI providers with a unified interface.
  icon: https://avatars.githubusercontent.com/u/YOUR_ORG?s=200&v=4
source:
  project: https://github.com/YOUR_ORG/openai-gateway-mcp
  branch: main
  dockerfile: Dockerfile
config:
  description: Configure AI provider API keys and default settings
  secrets:
    - name: anygpt.openai_api_key
      env: OPENAI_API_KEY
      example: sk-proj-...
    - name: anygpt.anthropic_api_key
      env: ANTHROPIC_API_KEY
      example: sk-ant-...
  env:
    - name: DEFAULT_PROVIDER
      example: openai
      value: '{{anygpt.default_provider}}'
    - name: DEFAULT_MODEL
      example: gpt-4o
      value: '{{anygpt.default_model}}'
    - name: LOG_LEVEL
      example: info
      value: '{{anygpt.log_level}}'
  parameters:
    type: object
    properties:
      default_provider:
        type: string
        description: Default AI provider to use
        default: openai
      default_model:
        type: string
        description: Default model to use
        default: gpt-4o
      log_level:
        type: string
        description: Logging level
        enum: [debug, info, warn, error]
        default: info
```

### Field Descriptions

#### Top-Level Fields

| Field    | Type   | Required | Description                                  |
| -------- | ------ | -------- | -------------------------------------------- |
| `name`   | string | ✅       | Unique identifier (lowercase, hyphens only)  |
| `image`  | string | ✅       | Docker image name (`mcp/anygpt` or your own) |
| `type`   | string | ✅       | Always `"server"` for MCP servers            |
| `meta`   | object | ✅       | Metadata for categorization                  |
| `about`  | object | ✅       | Display information                          |
| `source` | object | ✅       | Source code location                         |
| `config` | object | ⚠️       | Configuration (if server needs config)       |
| `run`    | object | ⚠️       | Runtime options (volumes, commands)          |

#### meta Object

| Field      | Type   | Required | Description                             |
| ---------- | ------ | -------- | --------------------------------------- |
| `category` | string | ✅       | Primary category (see categories below) |
| `tags`     | array  | ✅       | Search tags (3-5 recommended)           |

**Available Categories**:

- `ai-integration` - AI and LLM integrations
- `database` - Database access
- `devops` - Development and operations tools
- `productivity` - Productivity tools
- `search` - Search and information retrieval
- `communication` - Communication platforms
- `cloud` - Cloud services
- `data` - Data processing

#### about Object

| Field         | Type   | Required | Description                       |
| ------------- | ------ | -------- | --------------------------------- |
| `title`       | string | ✅       | Display name (user-friendly)      |
| `description` | string | ✅       | Short description (1-2 sentences) |
| `icon`        | string | ✅       | Icon URL (200x200px recommended)  |

#### source Object

| Field        | Type   | Required | Description                                |
| ------------ | ------ | -------- | ------------------------------------------ |
| `project`    | string | ✅       | GitHub repository URL                      |
| `branch`     | string | ⚠️       | Git branch (default: `main`)               |
| `dockerfile` | string | ⚠️       | Path to Dockerfile (default: `Dockerfile`) |

#### config Object

Configuration for user-provided settings.

| Field         | Type   | Required | Description                         |
| ------------- | ------ | -------- | ----------------------------------- |
| `description` | string | ✅       | What the configuration is for       |
| `secrets`     | array  | ⚠️       | Sensitive values (API keys, tokens) |
| `env`         | array  | ⚠️       | Non-sensitive environment variables |
| `parameters`  | object | ⚠️       | JSON Schema for UI form             |

##### secrets Array

Each secret object:

```yaml
- name: anygpt.openai_api_key # Unique identifier
  env: OPENAI_API_KEY # Environment variable name
  example: sk-proj-... # Example value (not real key!)
```

**Important**: Secrets are stored securely and injected as environment variables.

##### env Array

Each env object:

```yaml
- name: DEFAULT_PROVIDER # Environment variable name
  example: openai # Example value
  value: '{{anygpt.default_provider}}' # Template variable
```

**Template Syntax**: `{{server_name.parameter_name}}`

##### parameters Object

JSON Schema for configuration UI:

```yaml
parameters:
  type: object
  properties:
    default_provider:
      type: string
      description: Default AI provider to use
      enum: [openai, anthropic, google] # Optional: dropdown
      default: openai
    max_tokens:
      type: integer
      description: Maximum tokens per request
      minimum: 1
      maximum: 128000
      default: 4096
  required:
    - default_provider
```

**Supported Types**: `string`, `integer`, `number`, `boolean`, `array`, `object`

#### run Object

Runtime configuration (optional):

```yaml
run:
  command:
    - '{{filesystem.paths|volume-target|into}}'
  volumes:
    - '{{filesystem.paths|volume|into}}'
  disableNetwork: true
```

**Use Cases**:

- Mount volumes for filesystem access
- Disable network for security
- Override default command

## Submission Options

### Option A: Docker-Built Image (Recommended)

**Benefits**:

- Automatic security scanning
- Cryptographic signatures
- SBOM generation
- Provenance tracking
- Automatic updates
- Published to `mcp/anygpt` namespace

**Process**:

1. Create `server.yaml` with `image: mcp/anygpt`
2. Ensure Dockerfile is in repository
3. Submit PR to docker/mcp-registry
4. Docker builds and publishes image upon approval

**Image Location**: `docker.io/mcp/anygpt:latest`

### Option B: Self-Provided Image

**Benefits**:

- Full control over build process
- Custom CI/CD pipeline
- Private registry support

**Limitations**:

- No automatic security features
- Manual SBOM generation
- Manual security scanning
- Self-hosted maintenance

**Process**:

1. Build and publish image to your registry
2. Create `server.yaml` with `image: ghcr.io/YOUR_ORG/anygpt-mcp`
3. Submit PR to docker/mcp-registry
4. Maintain image updates yourself

**Image Location**: `ghcr.io/YOUR_ORG/anygpt-mcp:latest`

## Testing Workflow

### Prerequisites

Install required tools:

```bash
# Go 1.24+
go version

# Docker Desktop
docker --version

# Task (taskfile.dev)
brew install go-task/tap/go-task  # macOS
# or
sh -c "$(curl --location https://taskfile.dev/install.sh)" -- -d -b /usr/local/bin
```

### Fork and Clone Registry

```bash
git clone https://github.com/YOUR_USERNAME/mcp-registry.git
cd mcp-registry
```

### Generate server.yaml

**Option 1: Wizard (Recommended)**

```bash
task wizard
```

Follow prompts:

1. Enter GitHub repository URL
2. Review auto-detected values
3. Add environment variables
4. Add secrets
5. Confirm generation

**Option 2: Manual Creation**

```bash
task create -- --category ai-integration \
  https://github.com/YOUR_ORG/openai-gateway-mcp \
  -e DEFAULT_PROVIDER=openai \
  -e DEFAULT_MODEL=gpt-4o
```

**Option 3: Manual File**

Create `servers/anygpt/server.yaml` manually using the format above.

### Build Image (Docker-Built Only)

If using Docker-built images:

```bash
task build -- --tools anygpt
```

This:

1. Clones your repository
2. Builds Docker image
3. Validates MCP protocol
4. Tests tool listing

**Skip if using self-provided image.**

### Generate Catalog

```bash
task catalog -- anygpt
```

This creates `catalogs/anygpt/catalog.yaml` for local testing.

### Import to Docker Desktop

```bash
docker mcp catalog import $PWD/catalogs/anygpt/catalog.yaml
```

### Test in Docker Desktop

1. Open Docker Desktop
2. Go to MCP Toolkit section
3. Find "AnyGPT" in the list
4. Click "Configure"
5. Add API keys and settings
6. Enable the server
7. Test with an MCP client (Claude, Cursor, etc.)

### Verify Functionality

Test key features:

- [ ] Server appears in MCP Toolkit
- [ ] Configuration UI works
- [ ] Server starts successfully
- [ ] Tools are listed correctly
- [ ] Chat completion works
- [ ] Model listing works
- [ ] Provider listing works
- [ ] Error handling works

### Reset Catalog

After testing:

```bash
docker mcp catalog reset
```

This restores the default Docker catalog.

## Submission Process

### 1. Create Pull Request

```bash
git checkout -b add-anygpt
git add servers/anygpt/server.yaml
git commit -m "Add AnyGPT MCP server"
git push origin add-anygpt
```

Open PR at: https://github.com/docker/mcp-registry/compare

### 2. PR Title and Description

**Title**: `Add AnyGPT MCP server`

**Description**:

```markdown
## Description

Adds AnyGPT, a universal AI provider gateway with support for multiple providers.

## Features

- Multi-provider support (OpenAI, Anthropic, Google)
- Unified interface for all providers
- Model aliasing and routing
- Configuration-driven setup

## Testing

- [x] Tested with `task build --tools anygpt`
- [x] Tested with `task catalog anygpt`
- [x] Imported to Docker Desktop
- [x] Verified all tools work
- [x] Tested with Claude Desktop

## License

MIT License - allows commercial and private use

## Checklist

- [x] server.yaml is complete and valid
- [x] Dockerfile is in repository
- [x] All secrets are documented
- [x] Tested locally with Docker Desktop
- [x] License allows distribution
```

### 3. CI Validation

GitHub Actions will run:

- YAML validation
- Schema validation
- Dockerfile validation (if Docker-built)
- Image build test (if Docker-built)

**Fix any failures** before requesting review.

### 4. Review Process

Docker team will review:

- Code quality and security
- License compatibility
- Documentation completeness
- Test coverage
- User value

**Response time**: Usually 1-2 weeks

### 5. Approval and Merge

Once approved:

- All commits squashed into one
- Merged to main branch
- Image built (if Docker-built)
- Published to catalog within 24 hours

## Post-Submission

### Catalog Availability

Server will be available in:

- Docker Desktop MCP Toolkit (immediate)
- Docker Hub MCP Catalog (24 hours)
- `mcp/anygpt` image (if Docker-built, 24 hours)

### Updates

**For Docker-built images**:

- Push updates to your repository
- Submit PR to update `source.branch` or `source.dockerfile`
- Docker rebuilds automatically

**For self-provided images**:

- Build and push new image version
- Update `image` tag in server.yaml if needed
- Submit PR with changes

### Monitoring

Monitor your server:

- Docker Hub downloads (if Docker-built)
- GitHub issues from users
- Security vulnerabilities
- Dependency updates

## Compliance Requirements

### License

Server MUST have compatible license:

- ✅ MIT
- ✅ Apache 2.0
- ✅ BSD
- ❌ GPL (not allowed)

### Security

Server MUST:

- Run as non-root user
- Not expose network ports
- Handle secrets securely
- Pass security scanning

### Quality

Server MUST:

- Follow MCP protocol correctly
- Handle errors gracefully
- Log to stderr only
- Document all configuration

### Documentation

Repository MUST include:

- README with usage instructions
- LICENSE file
- Example configuration
- Troubleshooting guide

## Common Issues

### Build Failures

**Issue**: `task build --tools anygpt` fails

**Solutions**:

- Verify Dockerfile is valid
- Check all dependencies are available
- Ensure MCP server starts correctly
- Verify stdout is clean (no logs)

### Catalog Import Fails

**Issue**: `docker mcp catalog import` fails

**Solutions**:

- Validate server.yaml syntax
- Check all required fields are present
- Verify image exists (if self-provided)
- Check Docker Desktop is running

### Server Not Listed

**Issue**: Server doesn't appear in MCP Toolkit

**Solutions**:

- Restart Docker Desktop
- Re-import catalog
- Check Docker Desktop logs
- Verify catalog.yaml is correct

### Configuration UI Issues

**Issue**: Configuration form doesn't work

**Solutions**:

- Validate `parameters` JSON Schema
- Check template syntax: `{{server.param}}`
- Verify required fields are marked
- Test with simple config first

## Examples

### Minimal Server (No Config)

```yaml
name: simple-mcp
image: mcp/simple-mcp
type: server
meta:
  category: devops
  tags:
    - simple
about:
  title: Simple MCP
  description: A simple MCP server with no configuration
  icon: https://example.com/icon.png
source:
  project: https://github.com/example/simple-mcp
```

### Server with Secrets Only

```yaml
name: github-mcp
image: mcp/github-mcp
type: server
meta:
  category: devops
  tags:
    - github
about:
  title: GitHub MCP
  description: GitHub API integration
  icon: https://github.com/github.png
source:
  project: https://github.com/example/github-mcp
config:
  secrets:
    - name: github.token
      env: GITHUB_TOKEN
      example: ghp_...
```

### Server with Volumes

```yaml
name: filesystem-mcp
image: mcp/filesystem-mcp
type: server
meta:
  category: devops
  tags:
    - filesystem
about:
  title: Filesystem MCP
  description: Local filesystem access
  icon: https://example.com/icon.png
source:
  project: https://github.com/example/filesystem-mcp
run:
  command:
    - '{{filesystem.paths|volume-target|into}}'
  volumes:
    - '{{filesystem.paths|volume|into}}'
  disableNetwork: true
config:
  parameters:
    type: object
    properties:
      paths:
        type: array
        items:
          type: string
        default:
          - /Users/local-test
    required:
      - paths
```

## Validation Checklist

Before submitting PR:

- [ ] `server.yaml` is complete and valid
- [ ] All required fields are present
- [ ] Category is appropriate
- [ ] Tags are relevant (3-5 tags)
- [ ] Description is clear and concise
- [ ] Icon URL is valid (200x200px)
- [ ] Source repository is public
- [ ] Dockerfile exists at specified path
- [ ] License is compatible (MIT/Apache)
- [ ] All secrets are documented
- [ ] All env vars are documented
- [ ] Parameters schema is valid
- [ ] Tested with `task build` (if Docker-built)
- [ ] Tested with `task catalog`
- [ ] Imported to Docker Desktop
- [ ] All tools work correctly
- [ ] Configuration UI works
- [ ] Error handling works
- [ ] Logs go to stderr only
- [ ] README is complete
- [ ] Examples are provided

## References

- [Docker MCP Registry](https://github.com/docker/mcp-registry)
- [CONTRIBUTING.md](https://github.com/docker/mcp-registry/blob/main/CONTRIBUTING.md)
- [Docker MCP Toolkit Docs](https://docs.docker.com/ai/mcp-catalog-and-toolkit/toolkit/)
- [MCP Protocol Spec](https://modelcontextprotocol.io/introduction)
- [JSON Schema](https://json-schema.org/)
- [Task Documentation](https://taskfile.dev/)
