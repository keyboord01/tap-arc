/** Public link to one allowance's spender view. */
export function shareUrl(id: bigint) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/app/a/${id.toString()}`;
}
