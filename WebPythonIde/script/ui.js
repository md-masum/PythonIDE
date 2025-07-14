document.addEventListener('DOMContentLoaded', function () {
    const createFileButton = document.getElementById('create-file');
    const fileList = document.getElementById('file-list');
    const editor = CodeMirror.fromTextArea(document.getElementById('editor'), {
        mode: 'python',
        theme: 'default',
        lineNumbers: true
    });

    let files = JSON.parse(localStorage.getItem('files')) || [];
    let activeFile = null;

    function renderFileList() {
        fileList.innerHTML = '';
        files.forEach((file, index) => {
            const li = document.createElement('li');
            li.className = 'nav-item';
            li.innerHTML = `
                <a class="nav-link" href="#">${file.name}</a>
                <button class="btn btn-sm btn-primary download-button" data-index="${index}">Download</button>
                <button class="btn btn-sm btn-danger delete-button" data-index="${index}">Delete</button>
            `;
            fileList.appendChild(li);
        });
    }

    function saveFiles() {
        localStorage.setItem('files', JSON.stringify(files));
    }

    createFileButton.addEventListener('click', () => {
        const fileName = prompt('Enter file name:');
        if (fileName) {
            const newFile = {
                name: fileName,
                content: ''
            };
            files.push(newFile);
            saveFiles();
            renderFileList();
        }
    });

    fileList.addEventListener('click', (e) => {
        if (e.target.classList.contains('nav-link')) {
            const index = Array.from(fileList.children).indexOf(e.target.parentElement);
            activeFile = files[index];
            editor.setValue(activeFile.content);
            document.getElementById('output').textContent = '';
        }

        if (e.target.classList.contains('download-button')) {
            const index = e.target.dataset.index;
            const file = files[index];
            const blob = new Blob([file.content], { type: 'text/python' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${file.name}.py`;
            a.click();
            URL.revokeObjectURL(url);
        }

        if (e.target.classList.contains('delete-button')) {
            const index = e.target.dataset.index;
            files.splice(index, 1);
            saveFiles();
            renderFileList();
            editor.setValue('');
            document.getElementById('output').textContent = '';
            activeFile = null;
        }
    });

    editor.on('change', () => {
        if (activeFile) {
            activeFile.content = editor.getValue();
            saveFiles();
        }
    });

    renderFileList();
});