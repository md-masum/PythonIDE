console.log('pyodide-mainThread.js: Script loaded');

const loader = document.getElementById('loader');
const output = document.getElementById('output');
const runBtn = document.getElementById('run-btn');
const terminateBtn = document.getElementById('terminate-btn');

let mainThreadPyodideInstance = null;
let mainThreadExecutionTimeout = null;

export async function initializeMainThreadPyodide() {
    console.log('pyodide-mainThread.js: initializeMainThreadPyodide function triggered');
    loader.style.display = 'block';
    runBtn.disabled = true;
    terminateBtn.style.display = 'none';
    output.textContent = 'Loading Pyodide...';

    try {
        console.log('pyodide-mainThread.js: Loading Pyodide');
        mainThreadPyodideInstance = await loadPyodide({ indexURL: 'pyodide/' });
        console.log('pyodide-mainThread.js: Pyodide loaded');

        // Redirect Python stdout/stderr to the output element
        mainThreadPyodideInstance.setStdout({
            write: (text) => {
                console.log('pyodide-mainThread.js: stdout:', text);
                output.textContent += text;
            },
        });
        mainThreadPyodideInstance.setStderr({
            write: (text) => {
                console.error('pyodide-mainThread.js: stderr:', text);
                output.textContent += text;
                output.style.color = 'red';
            },
        });

        // Handle input for main thread Pyodide
        console.log('pyodide-mainThread.js: Setting up custom input handler');
        mainThreadPyodideInstance.runPython(`
            import sys, js
            def custom_input(prompt=''):
                return js.window.prompt(prompt) or ''
            __builtins__.input = custom_input
        `);

        output.textContent = 'Pyodide loaded (Main Thread). Ready to run Python code.';
        console.log('pyodide-mainThread.js: Pyodide initialization complete');
    } catch (error) {
        console.error('pyodide-mainThread.js: Main Thread Pyodide initialization failed:', error);
        output.textContent = `Failed to load Pyodide (Main Thread): ${error.message}`;
        output.style.color = 'red';
    } finally {
        loader.style.display = 'none';
        runBtn.disabled = false;
    }
}

export async function runPythonCodeMainThread(code) {
    console.log('pyodide-mainThread.js: runPythonCodeMainThread function triggered');
    const startTime = new Date();
    output.textContent = `Code execution started at: ${startTime.toLocaleTimeString()}\n\n`;
    output.style.color = ''; // Reset color
    runBtn.disabled = true;
    terminateBtn.style.display = 'inline-block'; // Show terminate button for main thread

    // Set a timeout for main thread execution (e.g., 30 seconds)
    console.log('pyodide-mainThread.js: Setting execution timeout');
    mainThreadExecutionTimeout = setTimeout(() => {
        console.log('pyodide-mainThread.js: Execution timed out');
        terminateMainThreadExecution();
        output.textContent += '\n\nExecution timed out after 30 seconds. Terminated.';
        output.style.color = 'orange';
    }, 30000); // 30 seconds

    try {
        console.log('pyodide-mainThread.js: Executing Python code');
        mainThreadPyodideInstance.globals.set("user_code", code);
        const python_code = `
import sys, io, traceback, json
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
    output = json.dumps({"stdout": stdout_val, "stderr": stderr_val})
output
        `;
        await mainThreadPyodideInstance.loadPackagesFromImports(code);
        let result = await mainThreadPyodideInstance.runPythonAsync(python_code);
        let { stdout, stderr } = JSON.parse(result);

        if (stderr) {
            output.textContent += stderr;
            output.style.color = 'red';
        } else {
            output.textContent += stdout;
            output.style.color = '';
        }
        const endTime = new Date();
        const executionTime = endTime - startTime;
        output.textContent += `\n\nCode execution complete at: ${endTime.toLocaleTimeString()}\nTotal execution time: ${executionTime} ms`;
        console.log('pyodide-mainThread.js: Python code execution complete');
    } catch (err) {
        console.error('pyodide-mainThread.js: Main Thread Python execution failed:', err);
        output.textContent += `\nJavaScript Error: ${err.message}`;
        output.style.color = 'red';
    } finally {
        console.log('pyodide-mainThread.js: Clearing execution timeout');
        clearTimeout(mainThreadExecutionTimeout);
        runBtn.disabled = false;
        terminateBtn.style.display = 'none';
    }
}

export function terminateMainThreadExecution() {
    console.log('pyodide-mainThread.js: terminateMainThreadExecution function triggered');
    if (mainThreadPyodideInstance) {
        console.log('pyodide-mainThread.js: Terminating main thread execution');
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
