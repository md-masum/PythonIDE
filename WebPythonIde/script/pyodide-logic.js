console.log('pyodide-logic.js: Script loaded');

const loader = document.getElementById('loader');
const runBtn = document.getElementById('run-btn');
const terminateBtn = document.getElementById('terminate-btn');

import { runPythonCodeMainThread, terminateMainThreadExecution } from './pyodide-mainThread.js';
import { writeToTerminal, clearTerminal } from './terminal.js';

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
            writeToTerminal(content);
            return;
        }

        switch (status) {
            case 'loading':
                console.log('pyodide-logic.js: Worker status: loading');
                loader.style.display = 'block';
                runBtn.disabled = true;
                terminateBtn.style.display = 'none';
                break;
            case 'ready':
                console.log('pyodide-logic.js: Worker status: ready');
                loader.style.display = 'none';
                runBtn.disabled = false;
                break;
            case 'running':
                console.log('pyodide-logic.js: Worker status: running');
                startTime = new Date();
                runBtn.disabled = true;
                terminateBtn.style.display = 'inline-block';
                clearTerminal();
                writeToTerminal(`Code execution started at: ${startTime.toLocaleTimeString()}\r\n\r\n`);
                break;
            case 'complete':
                console.log('pyodide-logic.js: Worker status: complete');
                const endTime = new Date();
                const executionTime = endTime - startTime;
                writeToTerminal(`\r\n\r\nCode execution complete at: ${endTime.toLocaleTimeString()}\r\nTotal execution time: ${executionTime} ms\r\n`);
                runBtn.disabled = false;
                terminateBtn.style.display = 'none';
                break;
            case 'error':
                console.log('pyodide-logic.js: Worker status: error', error);
                loader.style.display = 'none';
                runBtn.disabled = false;
                terminateBtn.style.display = 'none';
                writeToTerminal(`\r\nError: ${error}`);
                break;
        }
    };

    workerPyodideInstance.onerror = (errorEvent) => {
        console.error('pyodide-logic.js: Worker error:', errorEvent);
        loader.style.display = 'none';
        runBtn.disabled = false;
        terminateBtn.style.display = 'none';
        let errorMessage = `Worker Error: ${errorEvent.message || errorEvent.error || 'Unknown worker error'}`;
        if (errorEvent.filename) {
            errorMessage += `\r\nFile: ${errorEvent.filename}, Line: ${errorEvent.lineno}, Column: ${errorEvent.colno}`;
        }
        writeToTerminal(errorMessage);
    };

    console.log('pyodide-logic.js: Initializing worker');
    workerPyodideInstance.postMessage({ type: 'init' });
}

export function runPythonCodeWorker(code) {
    console.log('pyodide-logic.js: runPythonCodeWorker function triggered');
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
        writeToTerminal('\r\nExecution terminated.\r\n');
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