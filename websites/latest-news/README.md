# Latest News

Static, JSON-driven news feed. Posts marked `"important": true` show as a
dismissible banner at the top of the page; every post shows Report /
Comment / Add post actions on hover, and when a post is clicked open.

## Adding or editing a post

1. Create/edit `assets/data/post-{id}.json`:

   ```json
   {
     "id": 4,
     "title": "Post title",
     "date": "2026-08-01",
     "author": "Name",
     "authorEmail": "author@example.com",
     "summary": "One-line summary shown on the card and in the banner.",
     "content": "Full body text shown when the post is opened.",
     "important": false
   }
   ```

2. List the new file in `assets/data/main.json`'s `posts` array.

`important` posts render as a banner (with an X to dismiss, remembered per
browser via `localStorage`) until unmarked or removed.

## Configuration

- **Report** opens a Google Form (URL in `index.html`). Update
  `REPORT_FORM_URL` if the form changes.
- **Comment** opens a `mailto:` to the post's `authorEmail`.
- **Add post** opens a `mailto:` to `ADD_POST_EMAIL` (currently
  yucheng.lee29@gmail.com).
- Reporting a post also pings [Web3Forms](https://web3forms.com) to notify
  the author it was flagged. Paste your access key into
  `WEB3FORMS_ACCESS_KEY` in `index.html` and enable an autoresponder on the
  `email` field in the Web3Forms dashboard — until then this step is a
  no-op.
