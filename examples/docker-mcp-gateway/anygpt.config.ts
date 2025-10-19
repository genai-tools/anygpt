import {defineConfig} from '@anygpt/config';
import dockerMCP from '@anygpt/docker-mcp-plugin';

export default defineConfig({
    plugins: [
        dockerMCP({
            serverRules: [{
                when: { name: 'sequentialthinking' },
                set: { enabled: false }
            }]
        })
    ]
})