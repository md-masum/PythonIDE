
const loader = document.getElementById('loader');
const output = document.getElementById('output');
const runBtn = document.getElementById('run-btn');

let pyodide = null;

window.initPyodide = async function() {
    loader.style.display = 'block';
    runBtn.disabled = true;
    try {
        pyodide = await loadPyodide({ indexURL: 'pyodide/' });
        pyodide.runPython(`
            import sys, io, js
            def custom_input(prompt=''):
                return js.window.prompt(prompt) or ''
            __builtins__.input = custom_input
        `);
        console.log('✅ Pyodide initialized and ready.');
        output.textContent = 'Pyodide loaded. Ready to run Python code.';
    } catch (error) {
        console.error('Pyodide initialization failed:', error);
        output.textContent = `Failed to load Pyodide: ${error.message}`;
    } finally {
        loader.style.display = 'none';
        runBtn.disabled = false;
    }
}

window.runCode = async function(code) {
    if (!pyodide) {
        output.textContent = 'Pyodide is not loaded yet.';
        return;
    }

    if (!code.trim()) {
        return;
    }

    runBtn.disabled = true;
    output.textContent = 'Running...';

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
            output.textContent = stderr.trim();
        } else {
            output.textContent = stdout.trim();
        }
    } catch (err) {
        output.textContent = `JavaScript Error: ${err.message}`;
    } finally {
        runBtn.disabled = false;
    }
}
