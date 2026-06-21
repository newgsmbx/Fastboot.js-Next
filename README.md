# Fastboot.js Next

Fastboot.js Next is a modern WebUSB fastboot workstation built for static hosting. It keeps the core API shape of [kdrag0n/fastboot.js](https://github.com/kdrag0n/fastboot.js) and rebuilds the demo experience with a Material Design 3 interface, bilingual copy, theme switching, safety prompts, progress feedback, and structured logs.

## Features

- Connect Android devices in bootloader / fastboot mode through WebUSB.
- Run raw fastboot commands such as `getvar`, `reboot`, `erase`, `flashing`, and OEM commands.
- Boot a selected image with `bootBlob`.
- Flash an image to a user-selected partition with `flashBlob`.
- Flash a factory image / update ZIP through `flashFactoryZip`.
- Display connection state, device variables, task progress, and logs.
- Require explicit file selection and confirmation before dangerous boot / flash / ZIP actions.
- Material Design 3 color roles, responsive layout, light / dark / system themes.
- `zh-CN` and `en-US` i18n with browser-language default and localStorage persistence.

## Tech Stack

- Vite
- TypeScript
- Native Web Components
- CSS custom properties for Material Design 3 tokens
- `android-fastboot` as the fastboot.js core package
- WebUSB API

## Local Development

All network access in this environment should go through the local proxy:

```bash
export HTTP_PROXY=http://127.0.0.1:9999
export HTTPS_PROXY=http://127.0.0.1:9999
export ALL_PROXY=socks5://127.0.0.1:9999

git config --global http.proxy http://127.0.0.1:9999
git config --global https.proxy http://127.0.0.1:9999
npm config set proxy http://127.0.0.1:9999
npm config set https-proxy http://127.0.0.1:9999
```

Install and run:

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The output is written to `dist/` and contains static assets only.

## GitHub Pages

The Vite config uses `/Fastboot.js-Next/` automatically when `GITHUB_ACTIONS` is set. For manual builds:

```bash
VITE_BASE_PATH=/Fastboot.js-Next/ npm run build
```

Publish `dist/` with your preferred GitHub Pages workflow.

## Cloudflare Pages

Use these settings:

- Build command: `npm run build`
- Build output directory: `dist`
- Environment variable: `VITE_BASE_PATH=/`

## Browser Compatibility

Fastboot.js Next depends on WebUSB. WebUSB is mainly supported by Chromium-based browsers such as Chrome, Edge, and other compatible desktop Chromium builds. Firefox and Safari do not currently provide the required WebUSB API.

The page must be served from a secure context, such as `https://` or `localhost`.

## Safety Notice

Flashing, unlocking, booting unsigned images, or writing partitions can cause data loss, boot failure, and warranty impact. Fastboot.js Next never automatically executes dangerous operations. Users must explicitly select files, enter partitions or commands, and confirm risky actions.

Always back up data and verify image sources before use.

## Relationship to fastboot.js

This project uses the npm package published from [kdrag0n/fastboot.js](https://github.com/kdrag0n/fastboot.js), currently named `android-fastboot`. The client adapter in `src/core/fastbootClient.ts` calls the same APIs used by the original demo:

- `new FastbootDevice()`
- `device.connect()`
- `device.runCommand()`
- `device.getVariable()`
- `device.bootBlob()`
- `device.flashBlob()`
- `device.flashFactoryZip()`

The UI is a new implementation for Fastboot.js Next.

## License

Fastboot.js Next is licensed under the GNU General Public License v3.0 only. See [LICENSE](LICENSE).
