/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return {
      fallback: [
        {
          source: '/socket',
          destination: `http://localhost:3001/socket`,
        },
      ],
    }
  },
}

module.exports = nextConfig
