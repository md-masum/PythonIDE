console.log('pyodide-worker.js: Script loaded');

importScripts('../pyodide/pyodide.js');

let pyodide;

async function loadPyodideAndPackages() {
    console.log('pyodide-worker.js: loadPyodideAndPackages function triggered');
    self.postMessage({ status: 'loading' });
    try {
        console.log('pyodide-worker.js: Loading Pyodide');
        pyodide = await loadPyodide({ indexURL: '../pyodide/' });
        console.log('pyodide-worker.js: Pyodide loaded');

        // Define the JavaScript function that Python will call for real-time output
        pyodide.globals.set("console_output", (text) => {
            // console.log('pyodide-worker.js: Sending real-time output to main thread', text);
            self.postMessage({ type: 'realtime_output', content: text });
        });

        self.postMessage({ status: 'ready' });
        console.log('pyodide-worker.js: Pyodide initialization complete');
    } catch (error) {
        console.error('pyodide-worker.js: Pyodide initialization failed:', error);
        self.postMessage({ status: 'error', error: error.message });
    }
}

self.onmessage = async (event) => {
    console.log('pyodide-worker.js: Message received from main thread', event.data);
    const { type, code } = event.data;

    if (type === 'init') {
        console.log('pyodide-worker.js: Initializing Pyodide');
        await loadPyodideAndPackages();
    } else if (type === 'run') {
        console.log('pyodide-worker.js: Running Python code');
        if (!pyodide) {
            console.error('pyodide-worker.js: Pyodide is not loaded yet');
            self.postMessage({ status: 'error', error: 'Pyodide is not loaded yet.' });
            return;
        }

        self.postMessage({ status: 'running' });

        try {
            console.log('pyodide-worker.js: Setting up stdout/stderr redirection');
            // Redirect Python stdout/stderr to a custom JS function
            pyodide.runPython(`
import sys

class Console:
    def write(self, text):
        # Call the JavaScript function defined in the worker's global scope
        console_output(text)
    def flush(self):
        pass

sys.stdout = Console()
sys.stderr = Console()

# User code will be executed here
`);

            console.log('pyodide-worker.js: Loading packages from imports');
            await pyodide.loadPackagesFromImports(code);
            console.log('pyodide-worker.js: Executing Python code');
            await pyodide.runPythonAsync(code);

            self.postMessage({ status: 'complete', output: 'Execution finished.', isError: false });
            console.log('pyodide-worker.js: Python code execution complete');
        } catch (err) {
            console.error('pyodide-worker.js: Python execution failed:', err);
            self.postMessage({ status: 'error', error: `Python Error: ${err.message}` });
        }
    }
};