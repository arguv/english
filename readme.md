https://arguv.github.io/english/

Local server:

```sh
npx serve
```

`serve` reads `serve.json` and sends `Cache-Control: no-store`,
`X-Frame-Options: DENY`, and `Content-Security-Policy: frame-ancestors 'none'`
on all responses, including JavaScript, CSS, JSON, and images.

GitHub Pages does not apply `serve.json` or support custom response headers.
The published GitHub Pages site therefore still uses its host's cache policy
and does not enforce these framing restrictions. To enforce them in production,
configure the same headers on a host or reverse proxy that supports custom
response headers. HTML meta tags cannot enforce these policies.
