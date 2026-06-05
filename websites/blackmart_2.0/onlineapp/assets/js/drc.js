// Discourages casual right-click inspection. Note: this is a lightweight
// deterrent only — DevTools remain accessible via keyboard shortcuts (F12, Ctrl+Shift+I).
document.addEventListener('contextmenu', function(event) {
    event.preventDefault();
});
