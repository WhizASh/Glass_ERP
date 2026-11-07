---
description: Instructions for AI agents to debug frontend and network problems using Chrome DevTools MCP
always_on: true
---

# Browser Debugging with Chrome DevTools Protocol / MCP

When debugging UI bugs, client-side rendering issues, failed API requests, or runtime exceptions:

1. **Check Open Pages**:
   - Use `chrome-devtools` tool `list_pages` to locate the target tab URL (e.g. `http://localhost:5173` or `http://localhost:3000`).

2. **Inspect Console Logs & Exceptions**:
   - Use `list_console_messages` with the relevant `pageId` to view error messages, warnings, uncaught exceptions, and stack traces.
   - Use `get_console_message` to examine full message details if truncated.

3. **Inspect Network Activity**:
   - Use `list_network_requests` with the target `pageId` to identify failed requests (status code 4xx/5xx, CORS errors, or stalled requests).
   - Use `get_network_request` to examine request headers, response headers, and request/response payloads.

4. **DOM & State Inspection**:
   - Use `take_snapshot` to inspect DOM and accessibility trees.
   - Use `evaluate_script` to run diagnostics or probe state variables in the browser context.
