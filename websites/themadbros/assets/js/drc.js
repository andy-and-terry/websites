/*
 * Currently disables the browser's default right-click context menu
 * to prevent casual content copying on the page.
*/

// Prevent the default browser context menu across the whole page.
document.addEventListener("contextmenu", (event) => event.preventDefault());
