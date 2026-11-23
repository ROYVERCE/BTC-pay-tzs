module.exports = {
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", destination: "/index.html" },
        { source: "/app", destination: "/app.html" },
      ],
    };
  },
};