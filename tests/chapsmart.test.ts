import assert from "node:assert/strict";
import { isVodacomMpesa, normalizeTzPhone } from "../lib/validation";
import { estimateSats, invoiceIdFromVerifyUrl } from "../lib/chapsmart";

assert.equal(normalizeTzPhone("0741 234 567"), "255741234567");
assert.equal(normalizeTzPhone("+255741234567"), "255741234567");
assert.equal(normalizeTzPhone("12345"), null);
for (const p of ["255741234567", "255751234567", "255761234567", "255791234567"]) assert.ok(isVodacomMpesa(p), p);
for (const p of ["255711234567", "255681234567", "255781234567", "255771234567"]) assert.ok(!isVodacomMpesa(p), p);
// README example: multiplier 626 msat/TZS, 10,000 TZS + 2.2% => 6,398,... msats
assert.equal(estimateSats(10000, 626), Math.ceil((10000 * 626 * 1.022) / 1000));
assert.equal(invoiceIdFromVerifyUrl("https://chapsmart.com/.well-known/lnurlp/verify/F1YouABC123"), "F1YouABC123");
assert.throws(() => invoiceIdFromVerifyUrl("https://evil.example/.well-known/lnurlp/verify/F1YouABC123"));
console.log("ok");
