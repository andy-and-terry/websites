// main.js – BlackMart 2.0 landing page enhancements

document.addEventListener('DOMContentLoaded', () => {
  // Highlight the current year in the footer copyright if present
  const footer = document.querySelector('footer');
  if (footer) {
    footer.innerHTML = footer.innerHTML.replace(
      /\d{4}/,
      new Date().getFullYear()
    );
  }
});
