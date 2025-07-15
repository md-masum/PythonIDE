document.addEventListener('DOMContentLoaded', () => {
    const output = document.getElementById('output');
    const runBtn = document.getElementById('run-btn');
    const clearBtn = document.getElementById('clear-btn');
    const terminateBtn = document.getElementById('terminate-btn');
    const fileList = document.getElementById('file-list');
    const newFileBtn = document.getElementById('new-file-btn');
    const editorFilename = document.getElementById('editor-filename');
    const loader = document.getElementById('loader');

    const editor = CodeMirror(document.getElementById('editor'), {
        mode: 'python',
        theme: 'material-darker',
        lineNumbers: true,
        indentUnit: 4,
    });

    let files = [];
    let activeFileId = null;
    let pyodideWorker = null;

    const initializeWorker = () => {
        if (pyodideWorker) {
            pyodideWorker.terminate();
        }
        pyodideWorker = new Worker('script/pyodide-worker.js');

        pyodideWorker.onmessage = (event) => {
            const { type, status, output: workerOutput, isError, error, prompt } = event.data;

            if (type === 'input_request') {
                const userInput = window.prompt(prompt || 'Input:');
                pyodideWorker.postMessage({ type: 'input_response', input: userInput });
                return;
            }

            switch (status) {
                case 'loading':
                    loader.style.display = 'block';
                    runBtn.disabled = true;
                    terminateBtn.style.display = 'none';
                    output.textContent = 'Loading Pyodide...';
                    break;
                case 'ready':
                    loader.style.display = 'none';
                    runBtn.disabled = false;
                    output.textContent = 'Pyodide loaded. Ready to run Python code.';
                    break;
                case 'running':
                    runBtn.disabled = true;
                    terminateBtn.style.display = 'inline-block';
                    output.textContent = 'Running...';
                    break;
                case 'complete':
                    runBtn.disabled = false;
                    terminateBtn.style.display = 'none';
                    output.textContent = workerOutput;
                    output.style.color = isError ? 'red' : '';
                    break;
                case 'error':
                    loader.style.display = 'none';
                    runBtn.disabled = false;
                    terminateBtn.style.display = 'none';
                    output.textContent = `Error: ${error}`;
                    output.style.color = 'red';
                    break;
            }
        };

        pyodideWorker.onerror = (errorEvent) => {
            loader.style.display = 'none';
            runBtn.disabled = false;
            terminateBtn.style.display = 'none';
            output.textContent = `Worker Error: ${errorEvent.message}`;
            output.style.color = 'red';
        };

        pyodideWorker.postMessage({ type: 'init' });
    };

    const saveFiles = () => localStorage.setItem('python_ide_files', JSON.stringify(files));
    const loadFiles = () => {
        const savedFiles = localStorage.getItem('python_ide_files');
        if (savedFiles) {
            files = JSON.parse(savedFiles);
            activeFileId = files.length > 0 ? files[0].id : null;
        } else {
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
        const newFile = { id: Date.now().toString(), name: fileName, content: '# Your Python code here\n' };
        files.push(newFile);
        activeFileId = newFile.id;
        saveFiles();
        renderFileList();
        loadActiveFile();
    };

    const deleteFile = (fileId) => {
        if (!confirm("Are you sure you want to delete this file?")) return;
        files = files.filter(f => f.id !== fileId);
        activeFileId = files.length > 0 ? files[0].id : null;
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
        saveActiveFileContent();
        activeFileId = fileId;
        output.textContent = '';
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
            li.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
            li.dataset.id = file.id;
            if (file.id === activeFileId) li.classList.add('active');
            const fileNameSpan = document.createElement('span');
            fileNameSpan.textContent = file.name;
            li.addEventListener('click', () => setActiveFile(file.id));
            const dropdownDiv = document.createElement('div');
            dropdownDiv.className = 'dropdown ms-auto';
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'btn btn-sm btn-secondary';
            toggleBtn.setAttribute('data-bs-toggle', 'dropdown');
            toggleBtn.innerHTML = '&#x22EE;';
            toggleBtn.addEventListener('click', (e) => e.stopPropagation());
            const dropdownMenu = document.createElement('ul');
            dropdownMenu.className = 'dropdown-menu dropdown-menu-end';
            const downloadItem = document.createElement('li');
            downloadItem.innerHTML = `<a class="dropdown-item" href="#">Download</a>`;
            downloadItem.querySelector('a').addEventListener('click', (e) => {
                e.stopPropagation();
                downloadFile(file.id);
            });
            const deleteItem = document.createElement('li');
            deleteItem.innerHTML = `<a class="dropdown-item text-danger" href="#">Delete</a>`;
            deleteItem.querySelector('a').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteFile(file.id);
            });
            dropdownMenu.appendChild(downloadItem);
            dropdownMenu.appendChild(deleteItem);
            dropdownDiv.appendChild(toggleBtn);
            dropdownDiv.appendChild(dropdownMenu);
            li.appendChild(fileNameSpan);
            li.appendChild(dropdownDiv);
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

    runBtn.addEventListener('click', () => {
        const code = editor.getValue();
        if (!code.trim()) return;
        let fileToRun = files.find(f => f.id === activeFileId);
        if (!fileToRun) {
            const newFile = { id: Date.now().toString(), name: 'Untitled.py', content: code };
            files.push(newFile);
            activeFileId = newFile.id;
            fileToRun = newFile;
            saveFiles();
            renderFileList();
            editorFilename.textContent = newFile.name;
        } else {
            fileToRun.content = code;
            saveFiles();
        }
        pyodideWorker.postMessage({ type: 'run', code: fileToRun.content });
    });

    terminateBtn.addEventListener('click', () => {
        if (pyodideWorker) {
            pyodideWorker.terminate();
            initializeWorker();
            output.textContent = 'Execution terminated.';
            output.style.color = 'orange';
        }
    });

    clearBtn.addEventListener('click', () => output.textContent = '');
    newFileBtn.addEventListener('click', () => createNewFile());

    loadFiles();
    initializeWorker();
});
