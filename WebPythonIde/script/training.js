import { exampleCode } from './example-code.js';
import { dropdownData } from './dropdown-data.js';

export function initializeTraining(editor, files, activeFileId, saveFiles, renderFileList, loadActiveFile, setActiveFile, createNewFile, saveActiveFileContent) {
    const exampleModalEl = $('#example-modal');
    let selectedExample = null;

    const populateDropdowns = () => {
        const dropdownContainer = document.querySelector('.navbar-nav.ml-auto');
        dropdownData.forEach(dropdown => {
            const li = document.createElement('li');
            li.className = 'nav-item dropdown no-arrow mx-1';

            const a = document.createElement('a');
            a.className = 'nav-link dropdown-toggle';
            a.href = '#';
            a.id = dropdown.id;
            a.setAttribute('role', 'button');
            a.setAttribute('data-toggle', 'dropdown');
            a.setAttribute('aria-haspopup', 'true');
            a.setAttribute('aria-expanded', 'false');

            const span = document.createElement('span');
            span.className = 'text-gray-600';
            span.textContent = dropdown.title;
            a.appendChild(span);

            const div = document.createElement('div');
            div.className = 'dropdown-list dropdown-menu dropdown-menu-right shadow animated--grow-in';
            div.setAttribute('aria-labelledby', dropdown.id);

            const h6 = document.createElement('h6');
            h6.className = 'dropdown-header';
            h6.textContent = dropdown.header;
            div.appendChild(h6);

            dropdown.items.forEach(item => {
                const itemA = document.createElement('a');
                itemA.className = 'dropdown-item d-flex align-items-center';
                itemA.href = '#';
                itemA.setAttribute('data-example', item.example);

                const itemDiv = document.createElement('div');
                itemDiv.className = 'text-truncate';
                itemDiv.textContent = item.text;
                itemA.appendChild(itemDiv);

                div.appendChild(itemA);
            });

            li.appendChild(a);
            li.appendChild(div);
            dropdownContainer.insertBefore(li, dropdownContainer.lastElementChild);
        });
    };

    populateDropdowns();

    document.body.addEventListener('click', (e) => {
        const dropdownItem = e.target.closest('.dropdown-item[data-example]');
        
        if (dropdownItem) {
            e.preventDefault();
            const exampleKey = dropdownItem.dataset.example;
            console.log(`training.js: Dropdown item clicked: ${exampleKey}`);
            selectedExample = exampleCode[exampleKey];
            
            if (selectedExample) {
                // A small delay to allow the dropdown to close gracefully
                setTimeout(() => {
                    console.log('training.js: Showing example modal');
                    exampleModalEl.modal('show');
                }, 150);
            }
        }
    });

    document.getElementById('load-in-current-file-btn').addEventListener('click', () => {
        if (selectedExample) {
            editor.setValue(selectedExample.code);
            saveActiveFileContent();
            exampleModalEl.modal('hide');
        }
    });

    document.getElementById('create-new-file-from-example-btn').addEventListener('click', () => {
        console.log('training.js: Creating new file from example');
        if (selectedExample) {
            let existingFile = files.find(f => f.name === selectedExample.name);
            if (existingFile) {
                setActiveFile(existingFile.id);
            } else {
                const newFile = {
                    id: Date.now().toString(),
                    name: selectedExample.name,
                    content: selectedExample.code
                };
                files.unshift(newFile);
                saveFiles(); // Save the updated file list
                setActiveFile(newFile.id); // Use the function to properly switch files
            }
            exampleModalEl.modal('hide');
        }
    });
}