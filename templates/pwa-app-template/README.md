# Standard PWA App Template

Use this folder as the starting point for every new MPDG or MBA app.

## Built-in standard features

- Mobile-first PWA structure
- Dropdown content pattern
- Offline service worker
- App manifest
- Home screen icon support
- Required return button at the top of the app

## Required hub return rule

Every individual app must include a visible return button at the top:

```html
<a class="hub-return" href="../index.html">← Return to Hub</a>
```

Use `../index.html` when the app is inside a subfolder.

Use `index.html` only when the app is in the same folder as the hub.

## How to create a new app

1. Copy this whole template folder.
2. Rename the copied folder, for example:
   - `apps/kelp-forest/`
   - `apps/sea-otter/`
   - `apps/fee-lookup/`
3. Replace placeholder text:
   - `APP TITLE`
   - `APP SHORT NAME`
   - `APP COLLECTION NAME`
4. Edit `data.js` with the real dropdown content.
5. Update the service worker cache name in `sw.js`.
6. Add the new app link to the hub configuration file.

## Hub link examples

For MPDG hub apps:

```html
<a class="hub-return" href="../index.html">← MPDG Hub</a>
```

For MBA hub apps:

```html
<a class="hub-return" href="../index.html">← MBA Hub</a>
```
