export default {
  poweredByHeader: false,
  async rewrites() { return { beforeFiles: [{ source: "/", destination: "/index.html" }] }; },
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "same-origin" },
    ] }];
  },
};
