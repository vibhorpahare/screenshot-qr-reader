# QR Link Scanner

A tiny Chrome extension that decodes a QR code from a screenshot — drag, drop, paste, done. No camera, no uploads, no tracking. Everything happens locally in the popup.

Built for the common "I see a QR code on LinkedIn / a website and want the link without pulling out my phone" moment.

## Features

- **Drag & drop** a screenshot, or **`Ctrl+V` paste** straight from your clipboard
- Decodes locally in the browser using [jsQR](https://github.com/cozmo/jsQR) — no network calls, no server
- **Per-tab history** — every QR you decode while a tab is open stays listed there, with a thumbnail and timestamp, and clears automatically when the tab closes
- Smart action button: links get an **Open** button, plain text gets a **Copy** button
- Zero permissions beyond `storage` and `tabs` (used only to remember per-tab history and open links)

## Install

This isn't on the Chrome Web Store — load it as an unpacked extension:

1. Clone this repo
   ```bash
   git clone https://github.com/vibhorpahare/qr-link-scanner.git
   ```
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the `qr-link-scanner` folder
5. Pin the extension icon to your toolbar

## Usage

1. Take a screenshot of the QR code you want to read (e.g. `Cmd+Shift+4` on macOS)
2. Click the extension icon
3. Drop the screenshot into the popup, or just hit `Ctrl+V` if it's on your clipboard
4. Get the decoded link/text instantly, with a one-click **Open** or **Copy**

History for the current tab is listed below the drop zone and persists until you close that tab (or hit **clear**).

## How it works

- `popup.js` reads the dropped/pasted image into a canvas and runs it through `jsQR` to decode
- Decoded results are stored per tab in `chrome.storage.session`, keyed by tab ID
- `background.js` listens for `chrome.tabs.onRemoved` and wipes that tab's history the moment it closes

## Tech

- Manifest V3
- [jsQR](https://github.com/cozmo/jsQR) (bundled locally, MIT licensed) for QR decoding
- No build step, no dependencies to install — plain HTML/CSS/JS

## License

MIT — see [LICENSE](LICENSE).
