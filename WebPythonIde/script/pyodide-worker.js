importScripts('../pyodide/pyodide.js');

let pyodide;

async function loadPyodideAndPackages() {
    self.postMessage({ status: 'loading' });
    try {
        pyodide = await loadPyodide({ indexURL: '../pyodide/' });

        // Define the JavaScript function that Python will call for real-time output
        pyodide.globals.set("console_output", (text) => {
            self.postMessage({ type: 'realtime_output', content: text });
        });

        self.postMessage({ status: 'ready' });
    } catch (error) {
        self.postMessage({ status: 'error', error: error.message });
    }
}

self.onmessage = async (event) => {
    const { type, code } = event.data;

    if (type === 'init') {
        await loadPyodideAndPackages();
    } else if (type === 'run') {
        if (!pyodide) {
            self.postMessage({ status: 'error', error: 'Pyodide is not loaded yet.' });
            return;
        }

        self.postMessage({ status: 'running' });

        try {
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

            await pyodide.loadPackagesFromImports(code);
            await pyodide.runPythonAsync(code);

            self.postMessage({ status: 'complete', output: 'Execution finished.', isError: false });
        } catch (err) {
            self.postMessage({ status: 'error', error: `Python Error: ${err.message}` });
        }
    }
};