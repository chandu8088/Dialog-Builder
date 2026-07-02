---
title: I Built an AEM Dialog Builder — Works as a VS Code Extension, Chrome Extension & Web App
published: false
description: A visual tool to build AEM dialog .content.xml files with live preview, XML import, and 17 themes — no more hand-writing XML.
tags: aem, vscode, webdev, productivity
cover_image: 
---

## The Problem

If you've worked with Adobe Experience Manager (AEM), you know the pain of writing `.content.xml` dialog files by hand. The deeply nested XML structure, the long `sling:resourceType` paths, remembering the correct attributes for each field type — it's tedious, error-prone, and slow.

I wanted something where I could **visually** build a dialog, see exactly how it would look, and just download the XML. So I built it.

## What I Built

**AEM Dialog Builder** — a visual tool that lets you:

- Add tabs, fields, and multifields with buttons
- See a **live AEM dialog preview** that updates as you type
- Import existing `.content.xml` files to edit them visually
- Download the generated XML with one click
- Choose from **17 themes** (including VS Code Dark+, Dracula, Monokai)

And it works in **3 ways**:
1. ⚡ **VS Code Extension** — opens right in your editor with an Activity Bar icon
2. 🌐 **Chrome Extension** — quick access from your browser toolbar
3. 📄 **Standalone Web App** — just open `index.html` in any browser

## Demo

<!-- Replace with your actual GIF/video -->
![AEM Dialog Builder Demo](https://your-demo-gif-url-here.gif)

## Features at a Glance

### Visual Builder
Add tabs and fields with clicks. Each field supports:
- **Textfield** — single line text input
- **Textarea** — multi-line text
- **Pathfield** — AEM content path with browse icon
- **Numberfield** — numeric input

Plus **composite multifields** with unlimited sub-fields.

### Live AEM Preview
The right panel shows exactly how your dialog will render in AEM's Coral UI — complete with the title bar, tab navigation, field labels, required indicators, and the Done/Cancel footer. It updates in real-time.

### XML Import
Have an existing dialog? Upload the `.content.xml` file or paste the XML directly. The tool:
- Parses the full structure (including nested containers/columns)
- Reports errors with **line numbers** if the XML is invalid
- Populates the builder so you can edit visually

### 17 Themes
Switch themes instantly with a color-preview dropdown:

| Light Themes | Dark Themes |
|---|---|
| Clean Light | VS Code Dark+ |
| Warm Sunset | Monokai |
| Forest Green | Dracula |
| Rose Gold | Solarized Dark |
| GitHub Light | One Dark Pro |
| Lavender Dreams | Midnight Purple |
| Mocha Brown | Ocean Blue |
| VS Code Light+ | Slate Pro |
| | Dark Mode |

Your choice persists across sessions.

## Tech Stack

Intentionally simple — **zero dependencies**:

- Vanilla JavaScript (no React, no framework)
- CSS Custom Properties for theming
- DOMParser for XML parsing
- LocalStorage for theme persistence
- VS Code Webview API for the extension

The entire extension is **~20KB** packaged.

## How to Install

### VS Code Extension
1. Download the `.vsix` from [Releases](https://github.com/your-username/aem-dialog-builder/releases)
2. In VS Code: Extensions → `...` → Install from VSIX
3. Click the new icon in the Activity Bar → "Open Dialog Builder"

Or from the Marketplace: search **"AEM Dialog Builder"**

### Chrome Extension
1. Clone the repo
2. Go to `chrome://extensions/` → Enable Developer mode
3. Click "Load unpacked" → select the project folder

### Web App
Just open `index.html` in any browser. That's it.

## How I Built the VS Code Extension

The VS Code version uses the **Webview API**:

```javascript
// Activity Bar sidebar with a "Open" button
vscode.window.registerWebviewViewProvider('aemDialogBuilder.sidebarView', provider);

// Full editor panel with the same HTML/CSS/JS
vscode.window.createWebviewPanel('aemDialogBuilder', 'AEM Dialog Builder', vscode.ViewColumn.One, {
  enableScripts: true,
  retainContextWhenHidden: true
});
```

The same `index.css` and `index.js` power all three platforms. The only difference is the Download button — in VS Code it triggers a native Save dialog via `postMessage`:

```javascript
if (typeof acquireVsCodeApi !== 'undefined') {
  const vscode = acquireVsCodeApi();
  vscode.postMessage({ command: 'download', content: xmlContent });
} else {
  // Browser: use Blob + download link
}
```

## What's Next

- [ ] More field types (checkbox, select, radio, datepicker, colorfield)
- [ ] Drag-and-drop reordering of fields
- [ ] Component-level templates (Hero, Carousel, etc.)
- [ ] Copy XML to clipboard button
- [ ] Publish to VS Code Marketplace

## Try It Out

- 🔗 **GitHub**: [github.com/your-username/aem-dialog-builder](https://github.com/your-username/aem-dialog-builder)
- 📦 **VS Code Extension**: [Download .vsix](https://github.com/your-username/aem-dialog-builder/releases)

If this saves you even 10 minutes on your next AEM project, give it a ⭐ on GitHub!

---

*What field types or features would you like to see added? Drop a comment below!*
