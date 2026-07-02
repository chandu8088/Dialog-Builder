const tabs = [];

// Validation function
function validateFieldName(name) {
  return /^[a-z][a-zA-Z0-9]*$/.test(name); // starts with lowercase, no spaces
}

// --- Theme Definitions ---
const themes = [
  { id: 'clean', name: 'Clean Light', colors: ['#f5f7fa', '#4361ee', '#ffffff'] },
  { id: 'dark', name: 'Dark Mode', colors: ['#1a1a2e', '#6366f1', '#2d2d44'] },
  { id: 'ocean', name: 'Ocean Blue', colors: ['#0c1929', '#0ea5e9', '#132f4c'] },
  { id: 'sunset', name: 'Warm Sunset', colors: ['#fef7f0', '#e85d04', '#ffffff'] },
  { id: 'forest', name: 'Forest Green', colors: ['#f0f7f4', '#16a34a', '#ffffff'] },
  { id: 'lavender', name: 'Lavender Dreams', colors: ['#f5f0ff', '#7c3aed', '#ffffff'] },
  { id: 'midnight', name: 'Midnight Purple', colors: ['#13091f', '#a855f7', '#1e1033'] },
  { id: 'rose', name: 'Rose Gold', colors: ['#fff5f5', '#e11d48', '#ffffff'] },
  { id: 'slate', name: 'Slate Pro', colors: ['#1e293b', '#38bdf8', '#334155'] },
  { id: 'mocha', name: 'Mocha Brown', colors: ['#faf6f1', '#92400e', '#ffffff'] },
  { id: 'vscode-dark', name: 'VS Code Dark+', colors: ['#1e1e1e', '#569cd6', '#252526'] },
  { id: 'vscode-light', name: 'VS Code Light+', colors: ['#ffffff', '#0066b8', '#f3f3f3'] },
  { id: 'monokai', name: 'Monokai', colors: ['#272822', '#f92672', '#3e3d32'] },
  { id: 'dracula', name: 'Dracula', colors: ['#282a36', '#bd93f9', '#44475a'] },
  { id: 'solarized-dark', name: 'Solarized Dark', colors: ['#002b36', '#268bd2', '#073642'] },
  { id: 'one-dark', name: 'One Dark Pro', colors: ['#282c34', '#61afef', '#21252b'] },
  { id: 'github-light', name: 'GitHub Light', colors: ['#ffffff', '#0969da', '#f6f8fa'] },
];

// --- Theme Switcher ---
function initTheme() {
  const saved = localStorage.getItem('aem-dialog-theme') || 'clean';
  document.documentElement.setAttribute('data-theme', saved);
  buildThemeMenu();
  updateThemeButton(saved);
}

function buildThemeMenu() {
  const menu = document.getElementById('themeMenu');
  menu.innerHTML = '';
  themes.forEach(theme => {
    const item = document.createElement('div');
    item.className = 'theme-option';
    item.dataset.theme = theme.id;
    item.innerHTML = `
      <span class="theme-swatch-group">
        ${theme.colors.map(c => `<span class="theme-swatch" style="background:${c}"></span>`).join('')}
      </span>
      <span class="theme-option-name">${theme.name}</span>
    `;
    item.addEventListener('click', () => {
      switchTheme(theme.id);
      closeThemeMenu();
    });
    menu.appendChild(item);
  });
}

function updateThemeButton(themeId) {
  const theme = themes.find(t => t.id === themeId);
  if (!theme) return;
  document.getElementById('currentThemeName').textContent = theme.name;
  const swatch = document.getElementById('currentSwatch');
  swatch.style.background = theme.colors[1];
}

function switchTheme(themeId) {
  document.documentElement.setAttribute('data-theme', themeId);
  localStorage.setItem('aem-dialog-theme', themeId);
  updateThemeButton(themeId);
}

function closeThemeMenu() {
  document.getElementById('themeMenu').classList.remove('open');
}

// --- Event bindings ---
document.addEventListener("DOMContentLoaded", () => {
  initTheme();

  document.getElementById('themeDropdownBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('themeMenu').classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!document.getElementById('themeDropdown').contains(e.target)) {
      closeThemeMenu();
    }
  });

  document.getElementById("dialogTitle").addEventListener("input", render);
  document.getElementById("addTabBtn").addEventListener("click", addTab);
  document.getElementById("downloadBtn").addEventListener("click", downloadXML);
  document.getElementById("xmlProceedBtn").addEventListener("click", handleXmlImport);
  document.getElementById("xmlPasteBtn").addEventListener("click", togglePasteArea);

  render();
});

// --- XML Import ---
function togglePasteArea() {
  const area = document.getElementById('xmlPasteArea');
  area.style.display = area.style.display === 'none' ? 'block' : 'none';
}

function handleXmlImport() {
  const fileInput = document.getElementById('xmlFileInput');
  const pasteInput = document.getElementById('xmlPasteInput');
  const errorsDiv = document.getElementById('xmlErrors');
  errorsDiv.style.display = 'none';
  errorsDiv.innerHTML = '';

  const pastedXml = pasteInput.value.trim();
  const file = fileInput.files[0];

  if (pastedXml) {
    // Prioritize pasted XML
    parseAndImportXml(pastedXml);
  } else if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      parseAndImportXml(e.target.result);
    };
    reader.readAsText(file);
  } else {
    showXmlErrors([{ line: '-', message: 'Please select an XML file or paste XML content, then click Proceed.' }]);
  }
}

function parseAndImportXml(xmlText) {
  const errorsDiv = document.getElementById('xmlErrors');
  errorsDiv.style.display = 'none';
  errorsDiv.innerHTML = '';

  // Parse XML
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');

  // Check for parsing errors
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    const errorText = parseError.textContent;
    const errors = extractParseErrors(errorText, xmlText);
    showXmlErrors(errors);
    return;
  }

  // Validate structure
  const validationErrors = validateAemDialogXml(doc, xmlText);
  if (validationErrors.length > 0) {
    showXmlErrors(validationErrors);
    return;
  }

  // Extract data from XML
  try {
    const imported = extractDialogData(doc);
    tabs.length = 0;
    imported.tabs.forEach(t => tabs.push(t));
    document.getElementById('dialogTitle').value = imported.title;
    render();
  } catch (err) {
    showXmlErrors([{ line: '-', message: 'Failed to import: ' + err.message }]);
  }
}

function extractParseErrors(errorText, xmlText) {
  const errors = [];
  const lineMatch = errorText.match(/line\s+(\d+)/i);
  const colMatch = errorText.match(/column\s+(\d+)/i);
  const line = lineMatch ? lineMatch[1] : '-';
  let message = errorText.replace(/This page contains the following errors:/, '').replace(/Below is a rendering of the page up to the first error./, '').trim();
  if (message.length > 200) message = message.substring(0, 200) + '...';
  errors.push({ line: line, column: colMatch ? colMatch[1] : null, message: message });
  return errors;
}

function validateAemDialogXml(doc, xmlText) {
  const errors = [];
  const lines = xmlText.split('\n');

  const root = doc.documentElement;
  if (!root || root.nodeName !== 'jcr:root') {
    const lineNum = findLineContaining(lines, '<jcr:root') || 1;
    errors.push({ line: lineNum, message: 'Root element must be <jcr:root>. Found: <' + (root ? root.nodeName : 'none') + '>' });
    return errors;
  }

  const content = root.querySelector('content');
  if (!content) {
    errors.push({ line: findLineContaining(lines, 'content') || '-', message: 'Missing <content> element under <jcr:root>.' });
    return errors;
  }

  const contentItems = content.querySelector('items');
  if (!contentItems) {
    errors.push({ line: findLineContaining(lines, 'items') || '-', message: 'Missing <items> element under <content>.' });
    return errors;
  }

  // Check for tabs
  const tabElements = contentItems.children;
  if (tabElements.length === 0) {
    errors.push({ line: '-', message: 'No tab elements found inside <content><items>.' });
  }

  return errors;
}

function findLineContaining(lines, text) {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(text)) return i + 1;
  }
  return null;
}

function extractDialogData(doc) {
  const root = doc.documentElement;
  const title = root.getAttribute('jcr:title') || '';
  const content = root.querySelector('content');
  const contentItems = content.querySelector('items');
  const importedTabs = [];

  Array.from(contentItems.children).forEach(tabEl => {
    const tab = {
      title: tabEl.getAttribute('jcr:title') || tabEl.nodeName,
      fields: [],
      multifields: []
    };

    // Recursively collect fields from nested containers/columns
    collectFields(tabEl, tab);
    importedTabs.push(tab);
  });

  return { title, tabs: importedTabs };
}

function collectFields(parentEl, tab) {
  const items = parentEl.querySelector('items');
  if (!items) return;

  Array.from(items.children).forEach(el => {
    const resType = el.getAttribute('sling:resourceType') || '';

    if (resType.includes('multifield')) {
      // It's a multifield
      const mf = {
        nodeName: el.nodeName,
        fieldLabel: el.getAttribute('fieldLabel') || '',
        fieldDescription: el.getAttribute('description') || el.getAttribute('fieldDescription') || '',
        name: '',
        items: []
      };

      const fieldContainer = el.querySelector('field');
      if (fieldContainer) {
        mf.name = (fieldContainer.getAttribute('name') || '').replace('./', '');
        const mfItems = fieldContainer.querySelector('items');
        if (mfItems) {
          Array.from(mfItems.children).forEach(subEl => {
            const subType = extractFieldType(subEl.getAttribute('sling:resourceType') || '');
            mf.items.push({
              type: subType,
              label: subEl.getAttribute('fieldLabel') || '',
              name: (subEl.getAttribute('name') || subEl.nodeName).replace('./', ''),
              description: subEl.getAttribute('description') || subEl.getAttribute('fieldDescription') || '',
              required: subEl.getAttribute('required') === 'true' || subEl.getAttribute('required') === '{Boolean}true'
            });
          });
        }
      }
      tab.multifields.push(mf);
    } else if (resType.includes('foundation/form/')) {
      // It's a form field
      const type = extractFieldType(resType);
      tab.fields.push({
        type: type,
        label: el.getAttribute('fieldLabel') || '',
        name: (el.getAttribute('name') || el.nodeName).replace('./', ''),
        description: el.getAttribute('description') || el.getAttribute('fieldDescription') || '',
        required: el.getAttribute('required') === 'true' || el.getAttribute('required') === '{Boolean}true'
      });
    } else if (resType.includes('container') || resType.includes('well') || resType.includes('fixedcolumns') || resType === '') {
      // It's a layout container (column, well, fixedcolumns, etc.) — recurse into it
      collectFields(el, tab);
    }
  });
}

function extractFieldType(resourceType) {
  if (resourceType.includes('textarea')) return 'textarea';
  if (resourceType.includes('pathfield')) return 'pathfield';
  if (resourceType.includes('numberfield')) return 'numberfield';
  return 'textfield';
}

function showXmlErrors(errors) {
  const errorsDiv = document.getElementById('xmlErrors');
  errorsDiv.style.display = 'block';
  let html = '<div class="xml-errors-title">&#9888; XML Import Errors</div><ul>';
  errors.forEach(err => {
    html += `<li><span class="xml-error-line">Line ${err.line}${err.column ? ', Col ' + err.column : ''}</span>: ${encodeHTML(err.message)}</li>`;
  });
  html += '</ul>';
  errorsDiv.innerHTML = html;
}

function addTab() {
  const tab = { title: "New Tab", fields: [], multifields: [] };
  tabs.push(tab);
  render();
}

function addField(tabIndex) {
  tabs[tabIndex].fields.push({
    type: "textfield",
    label: "New Field",
    name: "fieldName",
    description: "",
    required: false
  });
  render();
}

function removeField(tabIndex, fieldIndex) {
  tabs[tabIndex].fields.splice(fieldIndex, 1);
  render();
}

function addMultifield(tabIndex) {
  tabs[tabIndex].multifields.push({
    nodeName: "multifieldNode",
    fieldLabel: "Multifield Label",
    fieldDescription: "",
    name: "accordianItems",
    items: []
  });
  render();
}

function removeMultifield(tabIndex, multiIndex) {
  tabs[tabIndex].multifields.splice(multiIndex, 1);
  render();
}

function addMultifieldItem(tabIndex, multiIndex) {
  tabs[tabIndex].multifields[multiIndex].items.push({
    type: "textfield",
    label: "Sub Field",
    name: "subFieldName",
    description: "",
    required: false
  });
  render();
}

function removeMultifieldItem(tabIndex, multiIndex, itemIndex) {
  tabs[tabIndex].multifields[multiIndex].items.splice(itemIndex, 1);
  render();
}

function updateTabTitle(index, value) {
  tabs[index].title = value;
  document.getElementById("xmlOutput").value = generateXML();
  renderPreview();
}

function updateField(tabIndex, fieldIndex, key, value) {
  tabs[tabIndex].fields[fieldIndex][key] = value;
  document.getElementById("xmlOutput").value = generateXML();
  renderPreview();
}

function toggleRequired(tabIndex, fieldIndex, checked) {
  tabs[tabIndex].fields[fieldIndex].required = checked;
  document.getElementById("xmlOutput").value = generateXML();
  renderPreview();
}

function updateMultifield(tabIndex, multiIndex, key, value) {
  tabs[tabIndex].multifields[multiIndex][key] = value;
  document.getElementById("xmlOutput").value = generateXML();
  renderPreview();
}

function updateMultifieldItem(tabIndex, multiIndex, itemIndex, key, value) {
  tabs[tabIndex].multifields[multiIndex].items[itemIndex][key] = value;
  document.getElementById("xmlOutput").value = generateXML();
  renderPreview();
}

// --- XML generation (unchanged except formatting cleanup) ---
function generateXML() {
  const dialogTitle = document.getElementById("dialogTitle").value;
  return `<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:jcr="http://www.jcp.org/jcr/1.0"
    jcr:primaryType="nt:unstructured"
    jcr:title="${dialogTitle}"
    sling:resourceType="cq/gui/components/authoring/dialog">
    <content jcr:primaryType="nt:unstructured"
        sling:resourceType="granite/ui/components/coral/foundation/tabs">
        <items jcr:primaryType="nt:unstructured">
          ${tabs.map((tab, i) => `
            <tab${i+1}
                jcr:primaryType="nt:unstructured"
                jcr:title="${tab.title}"
                sling:resourceType="granite/ui/components/coral/foundation/container">
                <items jcr:primaryType="nt:unstructured">
                  ${tab.fields.map(f => {
                    let attrs = `
                        jcr:primaryType="nt:unstructured"
                        sling:resourceType="granite/ui/components/coral/foundation/form/${f.type}"
                        fieldLabel="${f.label}"
                        name="./${f.name}"`;
                    if (f.description?.trim()) {
                      attrs += `\n                        fieldDescription="${f.description}"`;
                    }
                    if (f.required) {
                      attrs += `\n                        required="true"`;
                    }
                    return `<${f.name}${attrs ? "\n                        " + attrs.trim() : ""}/>`;
                  }).join("\n")}
                  ${tab.multifields.map(mf => `
                    <${mf.nodeName}
                        jcr:primaryType="nt:unstructured"
                        sling:resourceType="granite/ui/components/coral/foundation/form/multifield"
                        composite="{Boolean}true"
                        fieldLabel="${mf.fieldLabel}"${mf.fieldDescription ? `
                        fieldDescription="${mf.fieldDescription}"` : ""}>
                        <field
                            jcr:primaryType="nt:unstructured"
                            sling:resourceType="granite/ui/components/coral/foundation/container"
                            name="./${mf.name}">
                            <items jcr:primaryType="nt:unstructured">
                              ${mf.items.map(item => `
                                <${item.name}
                                    jcr:primaryType="nt:unstructured"
                                    sling:resourceType="granite/ui/components/coral/foundation/form/${item.type}"
                                    fieldLabel="${item.label}"${item.description ? `
                                    fieldDescription="${item.description}"` : ""}${item.required ? `
                                    required="true"` : ""} 
                                    name="./${item.name}"/>`).join("\n")}
                            </items>
                        </field>
                    </${mf.nodeName}>`).join("\n")}
                </items>
            </tab${i+1}>`).join("\n")}
        </items>
    </content>
</jcr:root>`;
}

function render() {
  const container = document.getElementById("tabs");
  container.innerHTML = "";

  const fieldOptions = ["textfield", "textarea", "pathfield", "numberfield"];

  tabs.forEach((tab, tabIndex) => {
    const tabDiv = document.createElement("div");
    tabDiv.className = "tab";

    // Tab Title
    const titleInput = document.createElement("input");
    titleInput.value = tab.title;
    titleInput.placeholder = "Tab Title";
    titleInput.addEventListener("input", e => updateTabTitle(tabIndex, e.target.value));
    tabDiv.appendChild(titleInput);

    // Add Field button
    const addFieldBtn = document.createElement("button");
    addFieldBtn.textContent = "+ Add Field";
    addFieldBtn.addEventListener("click", () => addField(tabIndex));
    tabDiv.appendChild(addFieldBtn);

    // Add Multifield button
    const addMultiBtn = document.createElement("button");
    addMultiBtn.textContent = "+ Add Multifield";
    addMultiBtn.addEventListener("click", () => addMultifield(tabIndex));
    tabDiv.appendChild(addMultiBtn);

    // Fields
    tab.fields.forEach((field, fieldIndex) => {
      const fieldDiv = document.createElement("div");
      fieldDiv.className = "field";

      // Type
      const typeSelectField = document.createElement("select");
      fieldOptions.forEach(opt => {
        const option = document.createElement("option");
        option.value = opt;
        option.textContent = opt;
        if (field.type === opt) option.selected = true;
        typeSelectField.appendChild(option);
      });
      typeSelectField.addEventListener("change", e => updateField(tabIndex, fieldIndex, "type", e.target.value));
      fieldDiv.appendChild(typeSelectField);

      // Label
      const labelInputField = document.createElement("input");
      labelInputField.value = field.label;
      labelInputField.placeholder = "Field Label";
      labelInputField.addEventListener("input", e => updateField(tabIndex, fieldIndex, "label", e.target.value));
      fieldDiv.appendChild(labelInputField);

      // Name with validation
      const nameInputField = document.createElement("input");
      nameInputField.value = field.name;
      nameInputField.placeholder = "Field Name";
      const nameErrorSpan = document.createElement("span");
      nameErrorSpan.style.color = "red";
      nameErrorSpan.style.fontSize = "12px";
      nameErrorSpan.style.display = "block";

      nameInputField.addEventListener("input", e => {
        const val = e.target.value;
        if (!validateFieldName(val)) {
          nameInputField.style.border = "1px solid red";
          nameErrorSpan.textContent = "Field name must start with lowercase, no spaces";
        } else {
          nameInputField.style.border = "";
          nameErrorSpan.textContent = "";
        }
        updateField(tabIndex, fieldIndex, "name", val);
      });
      fieldDiv.appendChild(nameInputField);
      fieldDiv.appendChild(nameErrorSpan);

      // Description
      const descInputField = document.createElement("input");
      descInputField.value = field.description;
      descInputField.placeholder = "Description (optional)";
      descInputField.addEventListener("input", e => updateField(tabIndex, fieldIndex, "description", e.target.value));
      fieldDiv.appendChild(descInputField);

      // Required + Remove
      const controlsSpan = document.createElement("span");
      controlsSpan.className = "field-controls";

      const requiredCheckboxField = document.createElement("input");
      requiredCheckboxField.type = "checkbox";
      requiredCheckboxField.checked = field.required;
      requiredCheckboxField.addEventListener("change", e => toggleRequired(tabIndex, fieldIndex, e.target.checked));
      controlsSpan.appendChild(requiredCheckboxField);

      const requiredLabelField = document.createElement("label");
      requiredLabelField.textContent = " Required";
      controlsSpan.appendChild(requiredLabelField);

      fieldDiv.appendChild(controlsSpan);

      const removeFieldBtn = document.createElement("button");
      removeFieldBtn.className = "remove-btn";
      removeFieldBtn.textContent = "Remove Field";
      removeFieldBtn.addEventListener("click", () => removeField(tabIndex, fieldIndex));
      fieldDiv.appendChild(removeFieldBtn);

      tabDiv.appendChild(fieldDiv);
    });

    // Multifields (same pattern as above, CSP-safe with addEventListener)
    tab.multifields.forEach((mf, multiIndex) => {
      const multiDiv = document.createElement("div");
      multiDiv.className = "field";

      const nodeInputMF = document.createElement("input");
      nodeInputMF.value = mf.nodeName;
      nodeInputMF.placeholder = "Multifield Node Name";
      nodeInputMF.addEventListener("input", e => updateMultifield(tabIndex, multiIndex, "nodeName", e.target.value));
      multiDiv.appendChild(nodeInputMF);

      const labelInputMF = document.createElement("input");
      labelInputMF.value = mf.fieldLabel;
      labelInputMF.placeholder = "Multifield Label";
      labelInputMF.addEventListener("input", e => updateMultifield(tabIndex, multiIndex, "fieldLabel", e.target.value));
      multiDiv.appendChild(labelInputMF);

      const descInputMF = document.createElement("input");
      descInputMF.value = mf.fieldDescription;
      descInputMF.placeholder = "Multifield Description (optional)";
      descInputMF.addEventListener("input", e => updateMultifield(tabIndex, multiIndex, "fieldDescription", e.target.value));
      multiDiv.appendChild(descInputMF);

      const nameInputMF = document.createElement("input");
      nameInputMF.value = mf.name;
      nameInputMF.placeholder = "Multifield Name";
      nameInputMF.addEventListener("input", e => updateMultifield(tabIndex, multiIndex, "name", e.target.value));
      multiDiv.appendChild(nameInputMF);

      const addItemBtn = document.createElement("button");
      addItemBtn.textContent = "+ Add Sub Field";
      addItemBtn.addEventListener("click", () => addMultifieldItem(tabIndex, multiIndex));
      multiDiv.appendChild(addItemBtn);

      const removeMultiBtn = document.createElement("button");
      removeMultiBtn.textContent = "Remove Multifield";
      removeMultiBtn.addEventListener("click", () => removeMultifield(tabIndex, multiIndex));
      multiDiv.appendChild(removeMultiBtn);

      // Sub-fields
      mf.items.forEach((item, itemIndex) => {
        const itemDiv = document.createElement("div");
        itemDiv.className = "field";

        const typeSelectItem = document.createElement("select");
        ["textfield", "textarea", "pathfield", "numberfield"].forEach(opt => {
          const option = document.createElement("option");
          option.value = opt;
          option.textContent = opt;
          if (item.type === opt) option.selected = true;
          typeSelectItem.appendChild(option);
        });
        typeSelectItem.addEventListener("change", e => updateMultifieldItem(tabIndex, multiIndex, itemIndex, "type", e.target.value));
        itemDiv.appendChild(typeSelectItem);

        const labelInputItem = document.createElement("input");
        labelInputItem.value = item.label;
        labelInputItem.placeholder = "Sub Field Label";
        labelInputItem.addEventListener("input", e => updateMultifieldItem(tabIndex, multiIndex, itemIndex, "label", e.target.value));
        itemDiv.appendChild(labelInputItem);

        const nameInputItem = document.createElement("input");
        nameInputItem.value = item.name;
        nameInputItem.placeholder = "Sub Field Name";
        const nameErrorSpanItem = document.createElement("span");
        nameErrorSpanItem.style.color = "red";
        nameErrorSpanItem.style.fontSize = "12px";
        nameErrorSpanItem.style.display = "block";

        nameInputItem.addEventListener("input", e => {
          const val = e.target.value;
          if (!validateFieldName(val)) {
            nameInputItem.style.border = "1px solid red";
            nameErrorSpanItem.textContent = "Must start with lowercase, no spaces";
          } else {
            nameInputItem.style.border = "";
            nameErrorSpanItem.textContent = "";
          }
          updateMultifieldItem(tabIndex, multiIndex, itemIndex, "name", val);
        });
        itemDiv.appendChild(nameInputItem);
        itemDiv.appendChild(nameErrorSpanItem);

        const descInputItem = document.createElement("input");
        descInputItem.value = item.description;
        descInputItem.placeholder = "Description (optional)";
        descInputItem.addEventListener("input", e => updateMultifieldItem(tabIndex, multiIndex, itemIndex, "description", e.target.value));
        itemDiv.appendChild(descInputItem);

        const controlsSpan = document.createElement("span");
        controlsSpan.className = "field-controls";

        const requiredCheckboxItem = document.createElement("input");
        requiredCheckboxItem.type = "checkbox";
        requiredCheckboxItem.checked = item.required;
        requiredCheckboxItem.addEventListener("change", e => updateMultifieldItem(tabIndex, multiIndex, itemIndex, "required", e.target.checked));
        controlsSpan.appendChild(requiredCheckboxItem);

        const requiredLabelItem = document.createElement("label");
        requiredLabelItem.textContent = " Required";
        controlsSpan.appendChild(requiredLabelItem);
        itemDiv.appendChild(controlsSpan);

        const removeItemBtn = document.createElement("button");
        removeItemBtn.className = "remove-btn";
        removeItemBtn.textContent = "Remove Sub Field";
        removeItemBtn.addEventListener("click", () => removeMultifieldItem(tabIndex, multiIndex, itemIndex));
        itemDiv.appendChild(removeItemBtn);

        multiDiv.appendChild(itemDiv);
      });

      tabDiv.appendChild(multiDiv);
    });

    container.appendChild(tabDiv);
  });

  document.getElementById("xmlOutput").value = generateXML();
  renderPreview();
}

// --- AEM Dialog Preview ---
function renderPreview() {
  const preview = document.getElementById("aemPreview");
  const dialogTitle = document.getElementById("dialogTitle").value || "Component Dialog";

  if (tabs.length === 0) {
    preview.innerHTML = '<div class="aem-dialog-empty">Add tabs and fields to see the preview</div>';
    return;
  }

  let html = '';

  // Dialog title bar
  html += `<div class="aem-titlebar">
    <span class="aem-titlebar-text">${encodeHTML(dialogTitle)}</span>
    <span class="aem-titlebar-close">&times;</span>
  </div>`;

  // Tabs bar
  html += '<div class="aem-tabs">';
  tabs.forEach((tab, i) => {
    html += `<div class="aem-tab ${i === 0 ? 'aem-tab-active' : ''}" data-tab-index="${i}">${encodeHTML(tab.title)}</div>`;
  });
  html += '</div>';

  // Tab contents
  html += '<div class="aem-tab-contents">';
  tabs.forEach((tab, tabIndex) => {
    html += `<div class="aem-tab-content ${tabIndex === 0 ? 'aem-tab-content-active' : ''}" data-tab-content="${tabIndex}">`;

    // Regular fields
    tab.fields.forEach(field => {
      html += renderPreviewField(field);
    });

    // Multifields
    tab.multifields.forEach(mf => {
      html += `<div class="aem-multifield">
        <label class="aem-field-label">${encodeHTML(mf.fieldLabel)}${mf.fieldDescription ? `<span class="aem-field-desc">${encodeHTML(mf.fieldDescription)}</span>` : ''}</label>
        <div class="aem-multifield-items">
          <div class="aem-multifield-item">`;
      mf.items.forEach(item => {
        html += renderPreviewField(item);
      });
      html += `</div>
        </div>
        <button class="aem-add-btn" type="button">+ Add</button>
      </div>`;
    });

    if (tab.fields.length === 0 && tab.multifields.length === 0) {
      html += '<div class="aem-empty-tab">No fields added yet</div>';
    }

    html += '</div>';
  });
  html += '</div>';

  // Dialog footer
  html += `<div class="aem-footer">
    <button class="aem-btn aem-btn-cancel" type="button">Cancel</button>
    <button class="aem-btn aem-btn-done" type="button">Done</button>
  </div>`;

  preview.innerHTML = html;

  // Tab switching in preview
  preview.querySelectorAll('.aem-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const idx = tab.dataset.tabIndex;
      preview.querySelectorAll('.aem-tab').forEach(t => t.classList.remove('aem-tab-active'));
      preview.querySelectorAll('.aem-tab-content').forEach(c => c.classList.remove('aem-tab-content-active'));
      tab.classList.add('aem-tab-active');
      preview.querySelector(`[data-tab-content="${idx}"]`).classList.add('aem-tab-content-active');
    });
  });
}

function renderPreviewField(field) {
  let inputHtml = '';
  switch (field.type) {
    case 'textarea':
      inputHtml = `<textarea class="aem-input aem-textarea" placeholder="Enter ${encodeHTML(field.label)}" readonly></textarea>`;
      break;
    case 'pathfield':
      inputHtml = `<div class="aem-pathfield"><input class="aem-input" placeholder="/content/" readonly /><span class="aem-pathfield-icon">&#128193;</span></div>`;
      break;
    case 'numberfield':
      inputHtml = `<input class="aem-input aem-numberfield" type="number" placeholder="0" readonly />`;
      break;
    default:
      inputHtml = `<input class="aem-input" placeholder="Enter ${encodeHTML(field.label)}" readonly />`;
  }

  return `<div class="aem-field">
    <label class="aem-field-label">
      ${encodeHTML(field.label)}${field.required ? '<span class="aem-required">*</span>' : ''}
      ${field.description ? `<span class="aem-field-desc">${encodeHTML(field.description)}</span>` : ''}
    </label>
    ${inputHtml}
  </div>`;
}

function encodeHTML(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function downloadXML() {
  const blob = new Blob([generateXML()], { type: "application/xml" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = ".content.xml";
  link.click();
}
