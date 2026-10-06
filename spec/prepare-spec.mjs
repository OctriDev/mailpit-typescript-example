import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import swagger2openapi from "swagger2openapi";

const root = new URL("./", import.meta.url);
const original = JSON.parse(readFileSync(new URL("mailpit.swagger.json", root), "utf8"));
const spec = structuredClone(original);

// Mailpit returns null for these arrays in ordinary list/search responses.
for (const field of ["Bcc", "Cc", "ReplyTo"]) {
  assert.equal(spec.definitions.MessageSummary.properties[field].type, "array");
  spec.definitions.MessageSummary.properties[field]["x-nullable"] = true;
}

// Keep the same wire schema, but give its public response model a reusable name.
// This avoids Octri's current TypeScript inline-response wire-name limitation.
const response = spec.responses.SendMessageResponse;
assert.equal(response.schema.properties.ID.type, "string");
assert.equal(spec.definitions.SendMessageResult, undefined);
spec.definitions.SendMessageResult = response.schema;
response.schema = { $ref: "#/definitions/SendMessageResult" };
spec.responses.BinaryResponse.schema.format = "binary";

assert.deepEqual(spec.paths, original.paths);
assert.deepEqual(spec.parameters, original.parameters);
assert.equal(Object.keys(spec.paths).length, 19);

// A shared Swagger response inherits media types at the operation that uses it.
// Inline it before conversion so text and binary routes keep their `produces`.
for (const item of Object.values(spec.paths)) {
  for (const operation of Object.values(item)) {
    if (!operation?.responses) continue;
    for (const [status, response] of Object.entries(operation.responses)) {
      const prefix = "#/responses/";
      if (/^2\d\d$/.test(status) && response.$ref?.startsWith(prefix)) {
        operation.responses[status] = structuredClone(spec.responses[response.$ref.slice(prefix.length)]);
      }
    }
  }
}
// Feed OpenAPI 3 to Octri so nullability does not rely on extension handling.
const { openapi } = await swagger2openapi.convertObj(spec, {
  patch: true,
  warnOnly: true,
  targetVersion: "3.0.0",
  warnLogger: () => {},
});
for (const field of ["Bcc", "Cc", "ReplyTo"]) {
  assert.equal(openapi.components.schemas.MessageSummary.properties[field].nullable, true);
}
assert.equal(Object.keys(openapi.paths).length, Object.keys(original.paths).length);
assert.ok(openapi.paths["/view/{ID}.txt"].get.responses["200"].content["text/plain"]);
assert.ok(openapi.paths["/view/{ID}.html"].get.responses["200"].content["text/html"]);
const out = new URL("openapi.json", root);
writeFileSync(out, `${JSON.stringify(openapi, null, 2)}\n`);
console.log(`Prepared ${fileURLToPath(out)}: 25 operations retained.`);
