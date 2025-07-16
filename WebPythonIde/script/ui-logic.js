import { initializeWorkerPyodide, runPythonCode, terminatePythonExecution } from './pyodide-logic.js';
import { initializeMainThreadPyodide } from './pyodide-mainThread.js';

document.addEventListener('DOMContentLoaded', async () => {
    const output = document.getElementById('output');
    const runBtn = document.getElementById('run-btn');
    const clearBtn = document.getElementById('clear-btn');
    const terminateBtn = document.getElementById('terminate-btn');
    const fileList = document.getElementById('file-list');
    const newFileBtn = document.getElementById('new-file-btn');
    const editorFilename = document.getElementById('editor-filename');

    // --- CodeMirror Editor Initialization ---
    const editor = CodeMirror(document.getElementById('editor'), {
        mode: 'python',
        theme: 'material-darker',
        lineNumbers: true,
        indentUnit: 4,
    });

    let files = [];
    let activeFileId = null;

    // --- File System Functions ---
    const saveFiles = () => localStorage.setItem('python_ide_files', JSON.stringify(files));
    const loadFiles = () => {
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
        files.push(newFile);
        activeFileId = newFile.id;
        saveFiles();
        renderFileList();
        loadActiveFile();
    };

    const deleteFile = (fileId) => {
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

    const setActiveFile = (fileId) => {
        saveActiveFileContent(); // Save previous file before switching
        activeFileId = fileId;
        output.textContent = ''; // Clear output on file change
        renderFileList();
        loadActiveFile();
    };

    const loadActiveFile = () => {
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
        fileList.innerHTML = '';
        files.forEach(file => {
            const li = document.createElement('li');
            li.className = `list-group-item list-group-item-action d-flex justify-content-between align-items-center ${file.id === activeFileId ? 'active' : ''}`;
            li.dataset.id = file.id;
            li.innerHTML = `
                <span class="file-name">${file.name}</span>
                <div class="dropdown ms-auto">
                    <button class="btn btn-sm btn-secondary" data-bs-toggle="dropdown" aria-expanded="false">&#x22EE;</button>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li><a class="dropdown-item download-file" href="#">Download</a></li>
                        <li><a class="dropdown-item text-danger delete-file" href="#">Delete</a></li>
                    </ul>
                </div>
            `;

            li.addEventListener('click', () => setActiveFile(file.id));
            li.querySelector('.download-file').addEventListener('click', (e) => {
                e.stopPropagation();
                downloadFile(file.id);
            });
            li.querySelector('.delete-file').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteFile(file.id);
            });

            fileList.appendChild(li);
        });
    };

    const saveActiveFileContent = () => {
        const activeFile = files.find(f => f.id === activeFileId);
        if (activeFile) {
            activeFile.content = editor.getValue();
            saveFiles();
        }
    };

    // --- Event Listeners ---
    runBtn.addEventListener('click', () => {
        const code = editor.getValue();
        if (!code.trim()) {
            return; // Don't run empty code
        }

        const activeFile = files.find(f => f.id === activeFileId);
        if (activeFile) {
            activeFile.content = code;
            saveFiles();
            const usesInput = /input\s*\(/.test(code);
            runPythonCode(activeFile.content, usesInput);
        } 
    });

    terminateBtn.addEventListener('click', () => {
        const code = editor.getValue();
        const usesInput = /input\s*\(/.test(code);
        terminatePythonExecution(usesInput);
    });

    clearBtn.addEventListener('click', () => output.textContent = '');
    newFileBtn.addEventListener('click', () => createNewFile());

    // --- Initial Load ---
    loadFiles();
    initializeWorkerPyodide();
    await initializeMainThreadPyodide();
});