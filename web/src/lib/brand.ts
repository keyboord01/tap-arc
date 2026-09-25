/** The logo mark as an SVG string, for places that need it outside React (icons, OG image). */
export const logoMarkSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><rect x="0" y="0" width="36" height="36" rx="10" fill="#177A63"/><path d="M18 6 C18 6 9 16.5 9 22 a9 9 0 0 0 18 0 C27 16.5 18 6 18 6 Z" fill="#F3F7F5"/><rect x="7" y="19" width="22" height="3" fill="#177A63"/></svg>`;

export const logoMarkDataUri = `data:image/svg+xml;base64,${Buffer.from(logoMarkSvg).toString("base64")}`;

export const siteTitle = "Tap: spending limits for USDC on Arc";
export const siteDescription =
  "Put USDC in a vault and give someone an allowance, like 20 USDC every 7 days. The contract enforces the limit, and you can pause, edit, or revoke it at any moment.";
