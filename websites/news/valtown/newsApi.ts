import { email } from "https://esm.town/v/std/email";

// val.town's std/email helper always sends to the address on your val.town
// account — it can't relay to arbitrary "to" addresses. So every action
// below sends one email to you, with the relevant contact info
// (author/commenter/submitter email) included in the body so you can
// reply directly from your inbox.

const ALLOWED_ORIGIN = "*"; // tighten to your site's origin once it's live, e.g. "https://yoursite.com"

function jsonResponse(body: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

export default async function (req: Request): Promise<Response> {
  const cors = {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, cors);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400, cors);
  }

  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const action = body.action;

  try {
    if (action === "report") {
      const postTitle = str(body.postTitle);
      if (!postTitle) return jsonResponse({ error: "postTitle is required" }, 400, cors);
      await email({
        subject: `[News] Post flagged: ${postTitle}`,
        text:
          `Post #${str(body.postId) || "?"} "${postTitle}" was reported by a reader.\n` +
          `Author: ${str(body.authorName) || "unknown"} <${str(body.authorEmail) || "unknown"}>`,
      });
    } else if (action === "comment") {
      const postTitle = str(body.postTitle);
      const message = str(body.message);
      if (!postTitle || !message) {
        return jsonResponse({ error: "postTitle and message are required" }, 400, cors);
      }
      await email({
        subject: `[News] Comment on: ${postTitle}`,
        text: `Post #${str(body.postId) || "?"} "${postTitle}"\nFrom: ${str(body.fromEmail) || "anonymous"}\n\n${message}`,
      });
    } else if (action === "addPost") {
      const title = str(body.title);
      const fromEmail = str(body.fromEmail);
      if (!title || !fromEmail) {
        return jsonResponse({ error: "title and fromEmail are required" }, 400, cors);
      }
      await email({
        subject: `[News] New post submission: ${title}`,
        text:
          `From: ${fromEmail}\n` +
          `Important: ${body.important ? "yes" : "no"}\n\n` +
          `Summary:\n${str(body.summary)}\n\n` +
          `Content:\n${str(body.content)}`,
      });
    } else {
      return jsonResponse({ error: "action must be one of: report, comment, addPost" }, 400, cors);
    }
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: "Failed to send email" }, 500, cors);
  }

  return jsonResponse({ ok: true }, 200, cors);
}
