const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

function activate(context) {
  // Register sidebar webview provider
  const provider = new AemDialogSidebarProvider(context.extensionUri, context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('aemDialogBuilder.sidebarView', provider)
  );

  // Register command to open full editor panel
  const disposable = vscode.commands.registerCommand('aemDialogBuilder.open', () => {
    openEditorPanel(context);
  });
  context.subscriptions.push(disposable);
}

// --- Sidebar View Provider ---
class AemDialogSidebarProvider {
  constructor(extensionUri, context) {
    this._extensionUri = extensionUri;
    this._context = context;
  }

  resolveWebviewView(webviewView) {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, 'webview')]
    };

    webviewView.webview.html = this._getSidebarHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(message => {
      if (message.command === 'openEditor') {
        openEditorPanel(this._context);
      }
    });
  }

  _getSidebarHtml(webview) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      padding: 16px;
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }
    .icon {
      font-size: 48px;
      margin-top: 20px;
      opacity: 0.7;
    }
    h3 {
      margin: 0;
      font-weight: 600;
    }
    p {
      text-align: center;
      opacity: 0.8;
      font-size: 12px;
      line-height: 1.5;
    }
    button {
      width: 100%;
      padding: 10px 16px;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    button:hover {
      background: var(--vscode-button-hoverBackground);
    }
  </style>
</head>
<body>
  <div class="icon">&#128196;</div>
  <h3>AEM Dialog Builder</h3>
  <p>Build AEM dialog .content.xml files visually with live preview.</p>
  <button id="openBtn">Open Dialog Builder</button>
  <script>
    const vscode = acquireVsCodeApi();
    document.getElementById('openBtn').addEventListener('click', () => {
      vscode.postMessage({ command: 'openEditor' });
    });
  </script>
</body>
</html>`;
  }
}

// --- Full Editor Panel ---
function openEditorPanel(context) {
  const panel = vscode.window.createWebviewPanel(
    'aemDialogBuilder',
    'AEM Dialog Builder',
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'webview'))]
    }
  );

  const webviewPath = path.join(context.extensionPath, 'webview');
  const cssUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(webviewPath, 'index.css')));
  const jsUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(webviewPath, 'index.js')));

  panel.webview.html = getWebviewContent(cssUri, jsUri);

  panel.webview.onDidReceiveMessage(
    message => {
      if (message.command === 'download') {
        const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
        const saveOptions = {
          defaultUri: vscode.Uri.file(path.join(workspacePath, '.content.xml')),
          filters: { 'XML Files': ['xml'] }
        };
        vscode.window.showSaveDialog(saveOptions).then(uri => {
          if (uri) {
            fs.writeFileSync(uri.fsPath, message.content, 'utf8');
            vscode.window.showInformationMessage(`Saved: ${uri.fsPath}`);
          }
        });
      }
    },
    undefined,
    context.subscriptions
  );
}

function getWebviewContent(cssUri, jsUri) {
  return `<!DOCTYPE html>
<html lang="en" data-theme="vscode-dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AEM Dialog Builder</title>
  <link rel="stylesheet" href="${cssUri}">
</head>
<body>
  <div class="theme-switcher">
    <label>Theme:</label>
    <div class="theme-dropdown" id="themeDropdown">
      <button type="button" class="theme-dropdown-btn" id="themeDropdownBtn">
        <span class="theme-swatch" id="currentSwatch"></span>
        <span id="currentThemeName">VS Code Dark+</span>
        <span class="theme-arrow">&#9662;</span>
      </button>
      <div class="theme-dropdown-menu" id="themeMenu"></div>
    </div>
  </div>

  <h1>AEM Dialog XML Generator</h1>

  <div class="main-layout">
    <div class="builder-panel">
      <div class="dialog-title-row">
        <div>
          <label>Dialog Title:</label>
          <input id="dialogTitle" type="text" placeholder="Dialog Title" />
        </div>
        <div class="xml-upload-group">
          <label for="xmlFileInput">Import XML:</label>
          <input type="file" id="xmlFileInput" accept="*/*" />
          <button id="xmlPasteBtn" type="button">Paste XML</button>
          <button id="xmlProceedBtn" type="button">Proceed</button>
        </div>
        <div class="xml-upload-tip">Tip: Press Cmd+Shift+. in file dialog to show hidden files</div>
      </div>
      <div id="xmlPasteArea" class="xml-paste-area" style="display:none;">
        <label>Paste your .content.xml here:</label>
        <textarea id="xmlPasteInput" rows="8" placeholder="Paste XML content here..."></textarea>
      </div>
      <div id="xmlErrors" class="xml-errors" style="display:none;"></div>

      <button id="addTabBtn">+ Add Tab</button>
      <div id="tabs"></div>

      <h3>Generated XML:</h3>
      <textarea id="xmlOutput" rows="15" cols="80"></textarea>
      <br />
      <button id="downloadBtn">Download XML</button>
    </div>

    <div class="preview-panel">
      <div class="preview-header">
        <span class="preview-title">AEM Dialog Preview</span>
        <span class="preview-badge">LIVE</span>
      </div>
      <div class="aem-dialog" id="aemPreview">
        <div class="aem-dialog-empty">Add tabs and fields to see the preview</div>
      </div>
    </div>
  </div>

  <script src="${jsUri}"></script>
</body>
</html>`;
}

function deactivate() {}

module.exports = { activate, deactivate };
