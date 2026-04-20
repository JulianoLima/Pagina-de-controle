export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/reports/:path*",
    "/users/:path*",
    "/api/data/:path*",
    // /api/sync é protegido por sessão, exceto /api/sync/cron (autenticado via CRON_SECRET).
    "/api/sync",
    "/api/users/:path*",
  ],
};
