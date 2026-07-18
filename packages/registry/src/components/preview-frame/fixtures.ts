/** A tiny self-contained "app" so the demo iframe renders offline. */
const SAMPLE_APP = `<!doctype html><html><head><meta name="color-scheme" content="dark"><style>
  body{margin:0;display:grid;place-items:center;min-height:100vh;background:#0c0d0d;
    color:#b4b8b6;font:13px/1.6 ui-monospace,monospace}
  main{text-align:center}
  h1{color:#fff;font-size:15px;font-weight:600;margin:0 0 4px}
  b{color:#00e599;font-weight:400}
</style></head><body><main><h1>acme-crm</h1><p>running on <b>neon</b></p></main></body></html>`;

export const sampleSrc = `data:text/html;charset=utf-8,${encodeURIComponent(SAMPLE_APP)}`;

/** What the header shows instead of the data: blob. */
export const sampleUrl = "https://acme-crm.vibe.app";

export const sampleErrorDetail =
  "The compute suspended after 5 minutes of inactivity. Restarting usually takes a few seconds.";
