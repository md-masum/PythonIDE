document.addEventListener('DOMContentLoaded', function () {
    const runButton = document.getElementById('run-button');
    const clearButton = document.getElementById('clear-button');
    const output = document.getElementById('output');
    const editor = document.querySelector('.CodeMirror').CodeMirror;

    runButton.addEventListener('click', async () => {
        const code = editor.getValue();
        output.textContent = 'Running...';

        try {
            // Load pyodide
            const pyodide = await loadPyodide({
                indexURL: 'pyodide/'
            });

            // Intercept input
            pyodide.setStdin({
                raw: (text) => {
                    return prompt(text);
                }
            });

            // Run the python code
            let result = await pyodide.runPythonAsync(code);
            output.textContent = result;
        } catch (err) {
            output.textContent = err;
        }
    });

    clearButton.addEventListener('click', () => {
        output.textContent = '';
    });
});