/**
 * main.js – Shared script for TMB Social.
 *
 * Handles both the project list (index.html) and project viewer (view.html).
 * Page-specific code runs only when the relevant DOM element is present.
 */

const BASE = "projects/";

// ─── Shared Utilities ────────────────────────────────────────────────────────

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? url : "";
  } catch {
    return "";
  }
}

// ─── index.html – Project List ────────────────────────────────────────────────

function renderCard(feed, project, file) {
  const card = document.createElement("div");
  card.className = "card";

  const tagsText = Array.isArray(project.tags)
    ? project.tags.map(escapeHtml).join(", ")
    : "";

  card.innerHTML = `
    <img src="${escapeHtml(project.thumbnail)}" alt="${escapeHtml(project.title)} thumbnail">
    <h3>${escapeHtml(project.title)}</h3>
    <p>${escapeHtml(project.description)}</p>
    <small>By ${escapeHtml(project.author)}</small><br>
    ${tagsText ? `<small>Tags: ${tagsText}</small><br>` : ""}
    <a href="view.html?file=${encodeURIComponent(file)}">Open</a>
  `;
  feed.appendChild(card);
}

const feed = document.getElementById("feed");

if (feed) {
  fetch(BASE + "projects.json")
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load project index (HTTP ${res.status})`);
      return res.json();
    })
    .then((files) => {
      if (!files.length) {
        const empty = document.createElement("p");
        empty.className = "empty-state";
        empty.textContent = "No community projects yet — check back soon!";
        feed.appendChild(empty);
        return;
      }
      files.forEach((file) => {
        fetch(BASE + file)
          .then((r) => {
            if (!r.ok) throw new Error(`Failed to load project "${file}" (HTTP ${r.status})`);
            return r.json();
          })
          .then((project) => renderCard(feed, project, file))
          .catch((err) => {
            const errEl = document.createElement("p");
            errEl.textContent = `Could not load project "${file}": ${err.message}`;
            feed.appendChild(errEl);
          });
      });
    })
    .catch((err) => {
      feed.textContent = `Could not load projects: ${err.message}`;
    });
}

// ─── view.html – Single Project Viewer ───────────────────────────────────────

const projectEl = document.getElementById("project");

if (projectEl) {
  const params = new URLSearchParams(window.location.search);
  const file = params.get("file");

  if (!file) {
    document.body.innerHTML = "<p>Project not found.</p>";
  } else {
    fetch(BASE + file)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((project) => {
        const tagsText = Array.isArray(project.tags)
          ? project.tags.map(escapeHtml).join(", ")
          : "None";
        const projectUrl = safeUrl(project.url);

        projectEl.innerHTML = `
          <h1>${escapeHtml(project.title)}</h1>
          <p><b>By:</b> ${escapeHtml(project.author)}</p>
          <iframe src="${escapeHtml(projectUrl)}" width="100%" height="600" title="${escapeHtml(project.title)}"></iframe>
          <p>${escapeHtml(project.description)}</p>
          <p><b>Tags:</b> ${tagsText}</p>
          <a href="${escapeHtml(projectUrl)}" target="_blank" rel="noopener noreferrer">Open in new tab</a>
        `;
      })
      .catch((err) => {
        projectEl.innerHTML = `<p>Failed to load project: ${escapeHtml(err.message)}</p>`;
      });
  }
}