/** Coerce MySQL / JWT ids (number | string | bigint) to stable equality. */
function sameUserId(a, b) {
  if (a == null || b == null) return false;
  return Number(a) === Number(b);
}

module.exports = { sameUserId };
