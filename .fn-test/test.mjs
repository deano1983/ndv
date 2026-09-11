import fn from "file:///C:/dev/ndv/.fn-test/create-checkout-session.mjs";
const res = await fn(new Request("http://x", {
  method: "POST",
  body: JSON.stringify({ lines: [{ handle: "nope", variantId: "1", quantity: 1 }] }),
}));
console.log("bundled fn:", res.status, JSON.stringify(await res.json()));
