const loader = document.getElementById('loader');
const output = document.getElementById('output');
const runBtn = document.getElementById('run-btn');
const terminateBtn = document.getElementById('terminate-btn');

import * as mainThreadModule from './pyodide-mainThread.js';

export const initializeMainThreadPyodide = mainThreadModule.initializeMainThreadPyodide;
export const runPythonCodeMainThread = mainThreadModule.runPythonCodeMainThread;
export const terminateMainThreadExecution = mainThreadModule.terminateMainThreadExecution;

let workerPyodideInstance = null;

// --- Worker Pyodide Functions ---
export function initializeWorkerPyodide() {
    if (workerPyodideInstance) {
        workerPyodideInstance.terminate(); // Terminate existing worker if any
    }
    workerPyodideInstance = new Worker('script/pyodide-worker.js');

    workerPyodideInstance.onmessage = (event) => {
        const { type, status, output: workerOutput, isError, error, content } = event.data;

        if (type === 'realtime_output') {
            if(output.textContent == 'Running...'){
                output.textContent = content;
                return;
            }else{
                output.textContent += content;
                return;
            }
            
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
                // Output is handled by 'realtime_output' type messages
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

    workerPyodideInstance.onerror = (errorEvent) => {
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

    workerPyodideInstance.postMessage({ type: 'init' });
}

export function runPythonCodeWorker(code) {
    output.textContent = 'Running...'; // Set running message
    output.style.color = ''; // Reset color
    if (workerPyodideInstance) {
        workerPyodideInstance.postMessage({ type: 'run', code: code });
    }
}

export function terminateWorkerExecution() {
    if (workerPyodideInstance) {
        workerPyodideInstance.terminate();
        initializeWorkerPyodide(); // Re-initialize worker after termination
        output.textContent = 'Execution terminated.';
        output.style.color = 'orange';
    }
}

// --- Dispatcher Functions ---
export function runPythonCode(code, useMainThread = false) {
    if (useMainThread) {
        runPythonCodeMainThread(code);
    } else {
        runPythonCodeWorker(code);
    }
}

export function terminatePythonExecution(useMainThread = false) {
    if (useMainThread) {
        terminateMainThreadExecution();
    } else {
        terminateWorkerExecution();
    }
}