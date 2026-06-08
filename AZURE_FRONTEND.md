# Sin Limite UI Azure Frontend

This frontend calls the Azure API Gateway through a production fallback compiled in the source code:

```bash
https://dev.gateway.limitlesscr.online
```

Cloud deployments do not require a `.env` file.

For local development, `NEXT_PUBLIC_API_GATEWAY_URL` can still be used as an optional override. `NEXT_PUBLIC_*` values are embedded during `next build`.
