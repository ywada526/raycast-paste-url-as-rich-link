# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start development mode (hot reload)
npm run build      # Build the extension
npm run lint       # Run ESLint
npm run fix-lint   # Run ESLint with auto-fix
npm run publish    # Publish to Raycast Store
```

## Architecture

This is a Raycast extension with a single `no-view` command that pastes a URL from clipboard as a rich link in the format appropriate for the active application.

### Flow

1. **`src/paste-url-as-rich-link.ts`** — Main entry point. Reads URL from clipboard, looks up the page title via Raycast Browser Extension (`BrowserExtension.getTabs()`), then pastes using a format determined by the active browser hostname.

2. **`src/get-active-tab-hostname.ts`** — Detects the frontmost application and extracts its active tab URL via AppleScript. Supports Safari, Chromium-based browsers (Chrome, Edge, Brave, Vivaldi, Arc), and Firefox. Returns the hostname or `null`.

3. **`src/utils.ts`** — Pure utilities: `validateUrl` (wraps `new URL()`), `escapeHTML` / `unescapeHTML`.

### Paste format by hostname

| Hostname | Format |
|---|---|
| `github.com` | `[title](url)` (Markdown, text only) |
| anything else | `[title](url)` as text + `<a href="url">title</a>` as HTML |

The Raycast Browser Extension is **required** at runtime to resolve the page title from the clipboard URL. If not installed, a confirmation alert is shown with a link to install it.
