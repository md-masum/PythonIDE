importScripts('../pyodide/pyodide.js');

let pyodide;

async function loadPyodideAndPackages() {
    self.postMessage({ status: 'loading' });
    try {
        pyodide = await loadPyodide({ indexURL: '../pyodide/' });
        
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
            pyodide.globals.set("user_code", code);
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
            await pyodide.loadPackagesFromImports(code);
            let full_output = await pyodide.runPythonAsync(python_code);
            const [stdout, stderr] = full_output.split("<!!stderr!!>");

            if (stderr.trim()) {
                self.postMessage({ status: 'complete', output: stderr.trim(), isError: true });
            } else {
                self.postMessage({ status: 'complete', output: stdout.trim(), isError: false });
            }
        } catch (err) {
            self.postMessage({ status: 'error', error: `Python Error: ${err.message}` });
        }
    }
};