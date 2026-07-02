# AEM Dialog Builder

Build AEM dialog `.content.xml` files visually with a live preview — no more hand-writing XML.

![AEM Dialog Builder](https://img.shields.io/badge/AEM-Dialog%20Builder-blue)

## Features

- **Visual Dialog Builder** — Add tabs, fields, and multifields with a few clicks
- **Live AEM Preview** — See exactly how your dialog will look in AEM as you build it
- **XML Import** — Upload or paste existing `.content.xml` files to edit them visually
- **XML Export** — Download the generated XML with one click
- **17 Themes** — Including VS Code Dark+, Monokai, Dracula, Solarized, One Dark Pro, and more
- **Field Types** — Textfield, Textarea, Pathfield, Numberfield
- **Multifield Support** — Composite multifields with sub-fields
- **Validation** — Field name validation and XML parse error reporting with line numbers

## How to Use

1. Click the **AEM Dialog Builder** icon in the Activity Bar (left sidebar)
2. Click **"Open Dialog Builder"** to launch the editor
3. Set your **Dialog Title**
4. Click **"+ Add Tab"** to add tabs
5. Add fields and multifields to each tab
6. See the live AEM preview on the right
7. Click **"Download XML"** to save your `.content.xml`

## Import Existing Dialogs

- **File Upload** — Click the file input and select your `.content.xml`
- **Paste XML** — Click "Paste XML" and paste your XML content directly
- Click **"Proceed"** to import

Supports nested container structures (columns, wells) and both `description` and `fieldDescription` attributes.

## Supported Field Types

| Type | AEM Resource Type |
|------|------------------|
| Textfield | `granite/ui/components/coral/foundation/form/textfield` |
| Textarea | `granite/ui/components/coral/foundation/form/textarea` |
| Pathfield | `granite/ui/components/coral/foundation/form/pathfield` |
| Numberfield | `granite/ui/components/coral/foundation/form/numberfield` |

## Themes

Choose from 17 built-in themes including:
- Clean Light, Dark Mode, Ocean Blue, Warm Sunset, Forest Green
- Lavender Dreams, Midnight Purple, Rose Gold, Slate Pro, Mocha Brown
- VS Code Dark+, VS Code Light+, Monokai, Dracula, Solarized Dark, One Dark Pro, GitHub Light

## Also Available As

- **Chrome Extension** — Load unpacked from the project folder
- **Standalone Web App** — Open `index.html` in any browser

## Requirements

- VS Code 1.80.0 or later

## License

MIT
