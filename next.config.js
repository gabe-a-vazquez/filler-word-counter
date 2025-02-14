/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["lh3.googleusercontent.com", "googleusercontent.com"],
  },
  output: "standalone",
  experimental: {
    serverActions: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.stripe.com https://apis.google.com https://*.googleusercontent.com https://cdn.jsdelivr.net;
              frame-src 'self' https://*.stripe.com https://accounts.google.com https://*.google.com https://*.firebaseapp.com;
              connect-src 'self' https://*.stripe.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.googleapis.com wss://*.deepgram.com https://*.deepgram.com https://*.huggingface.co https://huggingface.co https://cdn-lfs.hf.co https://cdn.jsdelivr.net https://api.smith.langchain.com;
              img-src 'self' data: https://*.stripe.com https://lh3.googleusercontent.com https://*.googleusercontent.com;
              style-src 'self' 'unsafe-inline';
            `
              .replace(/\s{2,}/g, " ")
              .trim(),
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      sharp$: false,
      "onnxruntime-node$": false,
    };

    // Add worker-loader configuration
    config.module.rules.push({
      test: /\.worker\.(js|ts)$/,
      loader: "worker-loader",
      options: {
        filename: "static/[hash].worker.js",
        publicPath: "/_next/",
      },
    });

    return config;
  },
};

module.exports = nextConfig;
