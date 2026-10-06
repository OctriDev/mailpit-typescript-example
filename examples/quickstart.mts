import assert from "node:assert/strict";
import { Mailpit } from "@octridev/mailpit-example";

const sdk = new Mailpit({
  baseUrl: process.env.MAILPIT_BASE_URL ?? "http://localhost:8025",
});
const subject = "octri-typescript-example";
const text = "A typed SDK example, captured locally by Mailpit.";

const sent = await sdk.message.sendParams({
  from: { email: "sender@example.test", name: "Octri example" },
  to: [{ email: "recipient@example.test" }],
  subject,
  text,
  html: `<p>${text}</p>`,
  attachments: [
    { filename: "example.bin", content: "AP9/gA==", contentType: "application/octet-stream" },
  ],
});
assert.equal(typeof sent.id, "string");
assert.ok(sent.id, "Mailpit must return the new message ID");
assert.equal(Object.hasOwn(sent, "ID"), false, "Response must use the SDK's public field names");

const inbox = await sdk.messages.getParams({ limit: 10 });
assert.ok(inbox.messages?.some((message) => message.id === sent.id));
const results = await sdk.messages.searchParams({ query: `subject:${subject}` });
const message = results.messages?.find((item) => item.id === sent.id);
assert.ok(message, "Search must find the captured message");
assert.equal(message.subject, subject);
assert.equal(message.bcc, null);
assert.equal(message.cc, null);
assert.equal(message.replyTo, null);

const body = await sdk.testing.getMessageTextParams({ id: sent.id });
assert.equal(body.trim(), text);
const html = await sdk.testing.getMessageHtmlParams({ id: sent.id });
assert.ok(html.includes(text));
const detail = await sdk.message.getParams({ id: sent.id });
const partId = detail.attachments?.[0]?.partId;
assert.ok(partId, "Message must include the binary attachment");
const attachment = await sdk.message.attachmentParams({ id: sent.id, partId });
assert.deepEqual(
  new Uint8Array(await attachment.arrayBuffer()),
  new Uint8Array([0, 255, 127, 128]),
);
console.log(`Captured ${sent.id}; verified send, list, search, text, HTML, and binary retrieval.`);
