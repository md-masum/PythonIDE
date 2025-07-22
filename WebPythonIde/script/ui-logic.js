console.log('ui-logic.js: Script loaded');

import { initializeWorkerPyodide, runPythonCode, terminatePythonExecution } from './pyodide-logic.js';
import { initializeMainThreadPyodide } from './pyodide-mainThread.js';
import { initializeTerminal, clearTerminal, setTerminalTheme, writeToTerminal } from './terminal.js';
import { initializeTraining } from './training.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('ui-logic.js: DOMContentLoaded event fired');

    const runBtn = document.getElementById('run-btn');
    const clearBtn = document.getElementById('clear-btn');
    const terminateBtn = document.getElementById('terminate-btn');
    const fileList = document.getElementById('file-list');
    const newFileBtn = document.getElementById('new-file-btn');
    const editorFilename = document.getElementById('editor-filename');

    const formatBtn = document.getElementById('format-btn');

    const themeSwitcher = document.getElementById('theme-switcher');

    // --- Theme Functions ---
    const applyTheme = (isDark) => {
        console.log(`ui-logic.js: applyTheme called with isDark: ${isDark}`);
        document.body.classList.toggle('dark-theme', isDark);
        editor.setOption('theme', isDark ? 'material-darker' : 'default');
        setTerminalTheme(isDark);
        themeSwitcher.checked = isDark;
    };

    const loadTheme = () => {
        console.log('ui-logic.js: loadTheme called');
        const savedTheme = localStorage.getItem('python_ide_theme');
        console.log(`ui-logic.js: Loaded theme from localStorage: ${savedTheme}`);
        // Default to dark theme if no theme is saved
        applyTheme(savedTheme ? savedTheme === 'dark' : true);
    };

    const saveTheme = (theme) => {
        console.log(`ui-logic.js: saveTheme called with theme: ${theme}`);
        try {
            localStorage.setItem('python_ide_theme', theme);
            console.log('ui-logic.js: Theme saved to localStorage successfully.');
        } catch (e) {
            console.error('ui-logic.js: Error saving theme to localStorage:', e);
        }
    };

    // --- CodeMirror Editor Initialization ---
    console.log('ui-logic.js: Initializing CodeMirror editor');
    const editor = CodeMirror(document.getElementById('editor'), {
        mode: 'python',
        theme: 'material-darker',
        lineNumbers: true,
        indentUnit: 4,
    });

    let files = [];
    let activeFileId = null;

    // --- File System Functions ---
    const saveFiles = () => {
        console.log('ui-logic.js: saveFiles function triggered');
        localStorage.setItem('python_ide_files', JSON.stringify(files));
    };
    const loadFiles = () => {
        console.log('ui-logic.js: loadFiles function triggered');
        const savedFiles = localStorage.getItem('python_ide_files');
        if (savedFiles) {
            files = JSON.parse(savedFiles);
            if (files.length > 0) {
                activeFileId = files[0].id;
            }
        }
        if (files.length === 0) {
            createNewFile('Untitled.py', false);
        }
        renderFileList();
        loadActiveFile();
    };

    const createNewFile = (defaultName = '', promptUser = true) => {
        console.log('ui-logic.js: createNewFile function triggered');
        let fileName = defaultName;
        if (promptUser) {
            fileName = prompt("Enter filename:", defaultName || "Untitled.py");
            if (!fileName) return;
        }

        const newFile = {
            id: Date.now().toString(),
            name: fileName,
            content: '# Your Python code here\n'
        };
        files.unshift(newFile);
        activeFileId = newFile.id;
        saveFiles();
        renderFileList();
        loadActiveFile();
    };

    const deleteFile = (fileId) => {
        console.log('ui-logic.js: deleteFile function triggered for file:', fileId);
        if (!confirm("Are you sure you want to delete this file?")) return;

        files = files.filter(f => f.id !== fileId);
        if (activeFileId === fileId) {
            activeFileId = files.length > 0 ? files[0].id : null;
        }
        if (files.length === 0) {
            createNewFile('Untitled.py', false);
        }
        saveFiles();
        renderFileList();
        loadActiveFile();
    };

    const downloadFile = (fileId) => {
        console.log('ui-logic.js: downloadFile function triggered for file:', fileId);
        const file = files.find(f => f.id === fileId);
        if (file) {
            const blob = new Blob([file.content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name.endsWith('.py') ? file.name : `${file.name}.py`;
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    const renameFile = (fileId) => {
        console.log('ui-logic.js: renameFile function triggered for file:', fileId);
        const file = files.find(f => f.id === fileId);
        if (file) {
            const newName = prompt("Enter new filename:", file.name);
            if (newName && newName !== file.name) {
                file.name = newName;
                saveFiles();
                renderFileList();
                if (file.id === activeFileId) {
                    editorFilename.textContent = newName;
                }
            }
        }
    };

    runBtn.addEventListener('click', () => {
        console.log('ui-logic.js: Run button clicked');
        const code = editor.getValue();
        if (!code.trim()) {
            console.log('ui-logic.js: Code is empty, not running');
            return; // Don't run empty code
        }

        const activeFile = files.find(f => f.id === activeFileId);
        if (activeFile) {
            activeFile.content = code;
            saveFiles();
            const usesInput = /input\s*\(/.test(code);
            console.log(`ui-logic.js: Running code for file: ${activeFile.name}, usesInput: ${usesInput}`);
            runPythonCode(activeFile.content, usesInput);
        } 
    });

    const setActiveFile = (fileId) => {
        console.log('ui-logic.js: setActiveFile function triggered for file:', fileId);
        saveActiveFileContent(); // Save previous file before switching
        activeFileId = fileId;
        clearTerminal(); // Clear terminal on file change
        renderFileList();
        loadActiveFile();
    };

    const loadActiveFile = () => {
        console.log('ui-logic.js: loadActiveFile function triggered');
        const activeFile = files.find(f => f.id === activeFileId);
        if (activeFile) {
            editor.setValue(activeFile.content);
            editorFilename.textContent = activeFile.name;
        } else {
            editor.setValue('');
            editorFilename.textContent = 'No file selected';
        }
        editor.refresh();
    };

    const renderFileList = () => {
        console.log('ui-logic.js: renderFileList function triggered');
        fileList.innerHTML = '';
        files.forEach(file => {
            const li = document.createElement('li');
            li.className = 'nav-item';
            li.dataset.id = file.id;
            if (file.id === activeFileId) {
                li.classList.add('active');
            }

            const fileLink = document.createElement('a');
            fileLink.className = 'nav-link';
            fileLink.href = '#';

            const fileNameSpan = document.createElement('span');
            fileNameSpan.className = 'file-name';
            fileNameSpan.textContent = file.name;
            li.addEventListener('click', () => setActiveFile(file.id));

            const dropdownDiv = document.createElement('div');
            dropdownDiv.className = 'dropdown ms-auto three-dot-menu';

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'btn btn-sm btn-secondary';
            toggleBtn.setAttribute('data-toggle', 'dropdown');
            toggleBtn.setAttribute('aria-expanded', 'false');
            toggleBtn.innerHTML = '&#x22EE;'; // 

            // Prevent parent <li> click event from firing when dropdown toggle is clicked
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            const dropdownMenu = document.createElement('ul');
            dropdownMenu.className = 'dropdown-menu dropdown-menu-end';

            const downloadItem = document.createElement('li');
            downloadItem.innerHTML = `<a class="dropdown-item" href="#">Download</a>`;
            downloadItem.querySelector('a').addEventListener('click', (e) => {
                e.stopPropagation();
                downloadFile(file.id);
            });

            const renameItem = document.createElement('li');
            renameItem.innerHTML = `<a class="dropdown-item" href="#">Rename</a>`;
            renameItem.querySelector('a').addEventListener('click', (e) => {
                e.stopPropagation();
                renameFile(file.id);
            });

            const deleteItem = document.createElement('li');
            deleteItem.innerHTML = `<a class="dropdown-item text-danger" href="#">Delete</a>`;
            deleteItem.querySelector('a').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteFile(file.id);
            });

            dropdownMenu.appendChild(downloadItem);
            dropdownMenu.appendChild(renameItem);
            dropdownMenu.appendChild(deleteItem);
            dropdownDiv.appendChild(toggleBtn);
            dropdownDiv.appendChild(dropdownMenu);

            // Initialize dropdown for the newly created button
            $(toggleBtn).dropdown();

            fileLink.appendChild(fileNameSpan);
            li.appendChild(fileLink);

            li.appendChild(dropdownDiv);
            fileList.appendChild(li);
        });
    };

    const saveActiveFileContent = () => {
        console.log('ui-logic.js: saveActiveFileContent function triggered');
        const activeFile = files.find(f => f.id === activeFileId);
        if (activeFile) {
            activeFile.content = editor.getValue();
            saveFiles();
        }
    };

    terminateBtn.addEventListener('click', () => {
        console.log('ui-logic.js: Terminate button clicked');
        const code = editor.getValue();
        const usesInput = /input\s*\(/.test(code);
        terminatePythonExecution(usesInput);
    });

    clearBtn.addEventListener('click', () => {
        console.log('ui-logic.js: Clear button clicked');
        clearTerminal();
    });
    newFileBtn.addEventListener('click', () => {
        console.log('ui-logic.js: New File button clicked');
        createNewFile();
    });

    themeSwitcher.addEventListener('change', () => {
        console.log('ui-logic.js: Theme switcher changed');
        const isDark = themeSwitcher.checked;
        applyTheme(isDark);
        saveTheme(isDark ? 'dark' : 'light');
    });

    // --- Initial Load ---
    console.log('ui-logic.js: Starting initial load');
    loadFiles();
    initializeTerminal('terminal'); // Initialize terminal first
    loadTheme(); // Then load the theme

    initializeTraining(editor, files, activeFileId, saveFiles, renderFileList, loadActiveFile, setActiveFile, createNewFile, saveActiveFileContent);

    writeToTerminal('Loading Pyodide\n');
    await initializeMainThreadPyodide();
    initializeWorkerPyodide();
    writeToTerminal('Pyodide loaded. Ready to run Python code.\n');
    console.log('ui-logic.js: Initial load complete');
});