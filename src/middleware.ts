export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/reports/:path*",
    "/users/:path*",
    "/api/data/:path*",
    "/api/sync/:path*",
    "/api/users/:path*",
  ],
};
