const loader = document.getElementById('loader');
const output = document.getElementById('output');
const runBtn = document.getElementById('run-btn');
const terminateBtn = document.getElementById('terminate-btn');

let mainThreadPyodideInstance = null;
let mainThreadExecutionTimeout = null;

export async function initializeMainThreadPyodide() {
    loader.style.display = 'block';
    runBtn.disabled = true;
    terminateBtn.style.display = 'none';
    output.textContent = 'Loading Pyodide...';

    try {
        mainThreadPyodideInstance = await loadPyodide({ indexURL: 'pyodide/' });

        // Redirect Python stdout/stderr to the output element
        mainThreadPyodideInstance.setStdout({
            write: (text) => {
                output.textContent += text;
            },
        });
        mainThreadPyodideInstance.setStderr({
            write: (text) => {
                output.textContent += text;
                output.style.color = 'red';
            },
        });

        // Handle input for main thread Pyodide
        mainThreadPyodideInstance.runPython(`
            import sys, js
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
    terminateBtn.style.display = 'inline-block'; // Show terminate button for main thread

    // Set a timeout for main thread execution (e.g., 30 seconds)
    mainThreadExecutionTimeout = setTimeout(() => {
        terminateMainThreadExecution();
        output.textContent += '\n\nExecution timed out after 30 seconds. Terminated.';
        output.style.color = 'orange';
    }, 30000); // 30 seconds

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
            output.textContent += stderr.trim();
            output.style.color = 'red';
        } else {
            output.textContent += stdout.trim();
            output.style.color = '';
        }
        output.textContent += '\nExecution finished.';
    } catch (err) {
        console.error('Main Thread Python execution failed:', err);
        output.textContent += `\nJavaScript Error: ${err.message}`;
        output.style.color = 'red';
    } finally {
        clearTimeout(mainThreadExecutionTimeout);
        runBtn.disabled = false;
        terminateBtn.style.display = 'none';
    }
}

export function terminateMainThreadExecution() {
    if (mainThreadPyodideInstance) {
        // Re-initialize Pyodide to effectively terminate execution
        mainThreadPyodideInstance = null; // Clear reference
        initializeMainThreadPyodide(); // Re-initialize
        output.textContent = 'Execution terminated (Main Thread).';
        output.style.color = 'orange';
        clearTimeout(mainThreadExecutionTimeout);
        runBtn.disabled = false;
        terminateBtn.style.display = 'none';
    }
}
