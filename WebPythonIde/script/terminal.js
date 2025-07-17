console.log('terminal.js: Script loaded');

const term = new Terminal({
    convertEol: true,
    cursorBlink: true,
    theme: {
        background: '#343a40', // A slightly lighter dark gray
        foreground: '#f8f9fa', // Light gray for text
        cursor: 'rgba(255, 255, 255, .5)',
        selection: 'rgba(255, 255, 255, 0.3)'
    }
});
const fitAddon = new FitAddon.FitAddon();
term.loadAddon(fitAddon);

export function initializeTerminal(elementId) {
    const terminalElement = document.getElementById(elementId);
    if (terminalElement) {
        term.open(terminalElement);
        fitAddon.fit();
        window.addEventListener('resize', () => fitAddon.fit());
    }
}

export function writeToTerminal(data) {
    term.write(data);
}

export function clearTerminal() {
    term.clear();
}

export function setTerminalTheme(isDark) {
    term.setOption('theme', isDark ? 
        {
            background: '#343a40',
            foreground: '#f8f9fa',
            cursor: 'rgba(255, 255, 255, .5)',
            selection: 'rgba(255, 255, 255, 0.3)'
        } : 
        {
            background: '#f8f9fa',
            foreground: '#212529',
            cursor: 'rgba(0, 0, 0, .5)',
            selection: 'rgba(0, 0, 0, 0.3)'
        }
    );
}