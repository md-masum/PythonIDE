console.log('pyodide-logic.js: Script loaded');

const loader = document.getElementById('loader');
const output = document.getElementById('output');
const runBtn = document.getElementById('run-btn');
const terminateBtn = document.getElementById('terminate-btn');

import { runPythonCodeMainThread, terminateMainThreadExecution } from './pyodide-mainThread.js';

let workerPyodideInstance = null;

let startTime;

// --- Worker Pyodide Functions ---
export function initializeWorkerPyodide() {
    console.log('pyodide-logic.js: initializeWorkerPyodide function triggered');
    if (workerPyodideInstance) {
        console.log('pyodide-logic.js: Terminating existing worker');
        workerPyodideInstance.terminate(); // Terminate existing worker if any
    }
    workerPyodideInstance = new Worker('script/pyodide-worker.js');
    console.log('pyodide-logic.js: New worker created');

    workerPyodideInstance.onmessage = (event) => {
        console.log('pyodide-logic.js: Message received from worker', event.data);
        const { type, status, output: workerOutput, isError, error, content } = event.data;

        if (type === 'realtime_output') {
            if (output.textContent.includes('Code execution started')) {
                output.textContent += content;
            } else {
                output.textContent = `Code execution started at: ${new Date().toLocaleTimeString()}\n\n${content}`;
            }
            return;
        }

        switch (status) {
            case 'loading':
                console.log('pyodide-logic.js: Worker status: loading');
                loader.style.display = 'block';
                runBtn.disabled = true;
                terminateBtn.style.display = 'none';
                output.textContent = 'Loading Pyodide...';
                break;
            case 'ready':
                console.log('pyodide-logic.js: Worker status: ready');
                loader.style.display = 'none';
                runBtn.disabled = false;
                output.textContent = 'Pyodide loaded. Ready to run Python code.';
                break;
            case 'running':
                console.log('pyodide-logic.js: Worker status: running');
                startTime = new Date();
                runBtn.disabled = true;
                terminateBtn.style.display = 'inline-block';
                output.textContent = `Code execution started at: ${startTime.toLocaleTimeString()}\n\n`;
                break;
            case 'complete':
                console.log('pyodide-logic.js: Worker status: complete');
                const endTime = new Date();
                const executionTime = endTime - startTime;
                output.textContent += `\n\nCode execution complete at: ${endTime.toLocaleTimeString()}\nTotal execution time: ${executionTime} ms`;
                runBtn.disabled = false;
                terminateBtn.style.display = 'none';
                // Output is handled by 'realtime_output' type messages
                break;
            case 'error':
                console.log('pyodide-logic.js: Worker status: error', error);
                loader.style.display = 'none';
                runBtn.disabled = false;
                terminateBtn.style.display = 'none';
                output.textContent = `Error: ${error}`;
                output.style.color = 'red';
                break;
        }
    };

    workerPyodideInstance.onerror = (errorEvent) => {
        console.error('pyodide-logic.js: Worker error:', errorEvent);
        loader.style.display = 'none';
        runBtn.disabled = false;
        terminateBtn.style.display = 'none';
        output.textContent = `Worker Error: ${errorEvent.message || errorEvent.error || 'Unknown worker error'}`;
        if (errorEvent.filename) {
            output.textContent += `\nFile: ${errorEvent.filename}, Line: ${errorEvent.lineno}, Column: ${errorEvent.colno}`;
        }
        output.style.color = 'red';
    };

    console.log('pyodide-logic.js: Initializing worker');
    workerPyodideInstance.postMessage({ type: 'init' });
}

export function runPythonCodeWorker(code) {
    console.log('pyodide-logic.js: runPythonCodeWorker function triggered');
    output.textContent = 'Running...'; // Set running message
    output.style.color = ''; // Reset color
    if (workerPyodideInstance) {
        console.log('pyodide-logic.js: Sending code to worker');
        workerPyodideInstance.postMessage({ type: 'run', code: code });
    }
}

export function terminateWorkerExecution() {
    console.log('pyodide-logic.js: terminateWorkerExecution function triggered');
    if (workerPyodideInstance) {
        console.log('pyodide-logic.js: Terminating worker');
        workerPyodideInstance.terminate();
        initializeWorkerPyodide(); // Re-initialize worker after termination
        output.textContent = 'Execution terminated.';
        output.style.color = 'orange';
    }
}

// --- Dispatcher Functions ---
export function runPythonCode(code, useMainThread = false) {
    console.log(`pyodide-logic.js: runPythonCode function triggered (useMainThread: ${useMainThread})`);
    if (useMainThread) {
        console.log('pyodide-logic.js: Running code on main thread');
        runPythonCodeMainThread(code);
    }
    else {
        console.log('pyodide-logic.js: Running code on worker');
        runPythonCodeWorker(code);
    }
}

export function terminatePythonExecution(useMainThread = false) {
    console.log(`pyodide-logic.js: terminatePythonExecution function triggered (useMainThread: ${useMainThread})`);
    if (useMainThread) {
        console.log('pyodide-logic.js: Terminating main thread execution');
        terminateMainThreadExecution();
    }
    else {
        console.log('pyodide-logic.js: Terminating worker execution');
        terminateWorkerExecution();
    }
}