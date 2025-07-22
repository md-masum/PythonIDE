console.log('terminal.js: Script loaded');

let terminalElement;

export function initializeTerminal(elementId) {
    terminalElement = document.getElementById(elementId);
}

export function writeToTerminal(data) {
    if (terminalElement) {
        terminalElement.textContent += data;
    }
}

export function clearTerminal() {
    if (terminalElement) {
        terminalElement.textContent = '';
    }
}

export function setTerminalTheme(isDark) {
    if (terminalElement) {
        if (isDark) {
            terminalElement.style.backgroundColor = '#000000ff';
            terminalElement.style.color = '#f8f9fa';
        } else {
            terminalElement.style.backgroundColor = '#f8f9fa';
            terminalElement.style.color = '#212529';
        }
    }
}