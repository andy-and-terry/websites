# VideoStream

A lightweight, static video streaming platform for the **Learning for Everyone** educational initiative. Users can log in, browse a catalogue of movies, and watch videos directly in the browser — no server-side runtime required.

## Features

- **Secure login** – passwords are hashed client-side with PBKDF2 (SHA-256, 150 000 iterations) before being compared against stored hashes
- **Role-based accounts** – supports `student` and `teacher` roles stored in `login/users.json`
- **Movie catalogue** – browse a grid of movies loaded from `assets/movies.json`
- **In-browser video player** – watch MP4 videos with autoplay and native browser controls
- **Password reset** – a dedicated reset page at `login/reset.html`
- **Logout** – clears the session and redirects back to the login page

## Project Structure

```
videostream/
├── index.html          # Landing / home page
├── logout.html         # Logout handler (clears session)
├── robots.txt
├── assets/
│   ├── css/            # Site-wide stylesheets
│   ├── js/             # Site-wide scripts
│   ├── movies.json     # Movie catalogue (id, name, poster image URL)
│   └── video/          # MP4 files served to the player (e.g. 1.mp4, 2.mp4)
├── login/
│   ├── index.html      # Login form
│   ├── reset.html      # Password reset page
│   ├── main.js         # Login logic
│   ├── users.json      # User credentials (username, role, salt, hash)
│   └── usertemplate.txt
└── user/
    ├── index.html      # Browse movies (auth-gated)
    ├── styles.css
    └── watch/
        └── index.html  # Video player (auth-gated, ?watchid=<id>)
```

## Getting Started

Because the project is entirely static HTML/CSS/JS, you only need a simple HTTP server — opening `index.html` directly as a `file://` URL will cause fetch requests to fail due to CORS restrictions.

### Using Python

```bash
cd videostream
python3 -m http.server 8080
```

Then open `http://localhost:8080` in your browser.

### Using Node.js (`npx serve`)

```bash
npx serve .
```

## Adding Users

User credentials are stored in `login/users.json`. Each entry follows this structure:

```json
[
  {
    "username": "student_01",
    "role": "student",
    "salt": "<base64-encoded 16-byte salt>",
    "hash": "<base64-encoded PBKDF2 hash>"
  }
]
```

Valid roles are `student` and `teacher`. See `login/usertemplate.txt` for an example.

## Adding Movies

1. Place the MP4 file in `assets/video/` and name it after its numeric ID (e.g. `7.mp4`).
2. Add an entry to `assets/movies.json`:

```json
{
  "id": 7,
  "name": "My New Movie",
  "image": "https://example.com/poster.jpg"
}
```

The browse page will pick up the new entry automatically on next load.

## Authentication Flow

1. User submits their username and password on `login/index.html`.
2. The login script fetches `login/users.json` and looks up the account by username.
3. The password is hashed in the browser using the account's stored salt via the Web Crypto API (PBKDF2).
4. If the resulting hash matches the stored hash, `sessionUser` and `sessionRole` are written to `localStorage` and the user is redirected to `/user/`.
5. The browse and watch pages check for `sessionUser` on load; unauthenticated visitors are redirected to the home page.
6. `logout.html` clears `localStorage` and redirects back to the login page.
