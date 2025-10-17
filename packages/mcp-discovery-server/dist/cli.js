#!/usr/bin/env node
import { DiscoveryMCPServer } from "./server-L-nyejKI.js";

//#region src/cli.ts
/**
* CLI entry point for MCP Discovery Server
* Starts the server with stdio transport
*/
async function main() {
	const server = new DiscoveryMCPServer({
		enabled: true,
		cache: {
			enabled: true,
			ttl: 3600
		},
		toolRules: []
	});
	console.error("MCP Discovery Server starting...");
	console.error("Registered 5 meta-tools:");
	console.error("  - list_mcp_servers");
	console.error("  - search_tools");
	console.error("  - list_tools");
	console.error("  - get_tool_details");
	console.error("  - execute_tool");
	await server.start();
	console.error("MCP Discovery Server ready");
}
main().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});

//#endregion
export {  };
//# sourceMappingURL=cli.js.map