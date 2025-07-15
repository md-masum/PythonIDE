const loader = document.getElementById('loader');
const output = document.getElementById('output');
const runBtn = document.getElementById('run-btn');
const terminateBtn = document.getElementById('terminate-btn');

let pyodideWorker = null;

export function initializePyodideWorker() {
    if (pyodideWorker) {
        pyodideWorker.terminate(); // Terminate existing worker if any
    }
    pyodideWorker = new Worker('script/pyodide-worker.js');

    pyodideWorker.onmessage = (event) => {
        const { status, output: workerOutput, isError, error } = event.data;

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
                if (isError) {
                    output.style.color = 'red';
                } else {
                    output.style.color = ''; // Reset color
                }
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
        console.error('Worker error:', errorEvent);
        loader.style.display = 'none';
        runBtn.disabled = false;
        terminateBtn.style.display = 'none';
        output.textContent = `Worker Error: ${errorEvent.message || errorEvent.error || 'Unknown worker error'}`;
        if (errorEvent.filename) {
            output.textContent += `\nFile: ${errorEvent.filename}, Line: ${errorEvent.lineno}, Column: ${errorEvent.colno}`;
        }
        output.style.color = 'red';
    };

    pyodideWorker.postMessage({ type: 'init' });
}

export function runPythonCode(code) {
    if (pyodideWorker) {
        pyodideWorker.postMessage({ type: 'run', code: code });
    }
}

export function terminatePythonExecution() {
    if (pyodideWorker) {
        pyodideWorker.terminate();
        initializePyodideWorker(); // Re-initialize worker after termination
        output.textContent = 'Execution terminated.';
        output.style.color = 'orange';
    }
}