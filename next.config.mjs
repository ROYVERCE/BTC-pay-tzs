const nextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", destination: "/index.html" },
        { source: "/app", destination: "/app.html" },
      ],
    };
  },
};

export default nextConfig;
