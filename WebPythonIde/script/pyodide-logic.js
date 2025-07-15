const loader = document.getElementById('loader');
const output = document.getElementById('output');
const runBtn = document.getElementById('run-btn');
const terminateBtn = document.getElementById('terminate-btn');

let workerPyodideInstance = null;
let mainThreadPyodideInstance = null;

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
    output.textContent = ''; // Clear output at the start of a new run
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

// --- Main Thread Pyodide Functions ---
export async function initializeMainThreadPyodide() {
    loader.style.display = 'block';
    runBtn.disabled = true;
    terminateBtn.style.display = 'none';
    output.textContent = 'Loading Pyodide...';

    try {
        mainThreadPyodideInstance = await loadPyodide({ indexURL: 'pyodide/' });

        // Redirect Python stdout/stderr to the output element
        mainThreadPyodideInstance.runPython(`
            import sys, io, js
            def custom_input(prompt=''):
                return js.window.prompt(prompt) or ''
            __builtins__.input = custom_input
        `);

        output.textContent = 'Pyodide loaded (Main Thread). Ready to run Python code.';
    } catch (error) {
        console.error('Main Thread Pyodide initialization failed:', error);
        output.textContent = `Failed to load Pyodide (Main Thread): ${error.message}`;
        output.style.color = 'red';
    } finally {
        loader.style.display = 'none';
        runBtn.disabled = false;
    }
}

export async function runPythonCodeMainThread(code) {
    output.textContent = ''; // Clear output at the start of a new run
    output.style.color = ''; // Reset color
    runBtn.disabled = true;
    terminateBtn.style.display = 'none'; // No terminate for main thread blocking code

    try {
        mainThreadPyodideInstance.globals.set("user_code", code);
        const python_code = `
import sys, io, traceback
stdout_orig = sys.stdout
stderr_orig = sys.stderr
stdout_new = io.StringIO()
stderr_new = io.StringIO()
sys.stdout = stdout_new
sys.stderr = stderr_new
output = None
try:
    exec(user_code, globals())
except Exception:
    sys.stderr.write(traceback.format_exc())
finally:
    sys.stdout = stdout_orig
    sys.stderr = stderr_orig
    stdout_val = stdout_new.getvalue()
    stderr_val = stderr_new.getvalue()
    output = stdout_val + "<!!stderr!!>" + stderr_val
output
        `;
        await mainThreadPyodideInstance.loadPackagesFromImports(code);
        let full_output = await mainThreadPyodideInstance.runPythonAsync(python_code);
        const [stdout, stderr] = full_output.split("<!!stderr!!>");

        if (stderr.trim()) {
            output.textContent = stderr.trim();
            output.style.color = 'red';
        } else {
            output.textContent = stdout.trim();
            output.style.color = '';
        }
    } catch (err) {
        console.error('Main Thread Python execution failed:', err);
        output.textContent = `\nJavaScript Error: ${err.message}`;
        output.style.color = 'red';
    } finally {
        runBtn.disabled = false;
    }
}

// --- Dispatcher Functions ---
export function runPythonCode(code, useMainThread = false) {
    if (useMainThread) {
        runPythonCodeMainThread(code);
    }
    else {
        runPythonCodeWorker(code);
    }
}

export function terminatePythonExecution(useMainThread = false) {
    if (useMainThread) {
        // Cannot terminate blocking main thread execution directly
        output.textContent = 'Cannot terminate main thread execution directly. Close the tab if it\'s stuck.';
        output.style.color = 'orange';
    }
    else {
        terminateWorkerExecution();
    }
}