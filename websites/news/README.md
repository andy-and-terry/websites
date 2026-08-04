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

**Report**, **Comment**, and **Add post** all POST JSON to a single
val.town HTTP val (`NEWS_API_URL` in `index.html`), which emails you via
val.town's built-in `std/email`. The val's source lives at
`valtown/newsApi.ts`.

### Deploying the val

1. On [val.town](https://www.val.town), create a new **HTTP val** and
   paste in the contents of `valtown/newsApi.ts`.
2. Deploy it, then copy its live URL (`https://<you>-<val-name>.web.val.run`).
3. Paste that URL into `NEWS_API_URL` in `index.html`.
4. Once the site has a real domain, tighten `ALLOWED_ORIGIN` in
   `valtown/newsApi.ts` from `"*"` to that origin and redeploy.

### Request shape

```json
{ "action": "report", "postId": 1, "postTitle": "...", "authorName": "...", "authorEmail": "..." }
{ "action": "comment", "postId": 1, "postTitle": "...", "message": "...", "fromEmail": "..." }
{ "action": "addPost", "title": "...", "summary": "...", "content": "...", "important": false, "fromEmail": "..." }
```

`std/email` can only send to the val.town account's own address (it can't
relay to arbitrary recipients), so every action lands as one email to you
with the relevant contact info in the body — reply to the commenter/author
directly from there.
