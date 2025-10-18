import type { NextConfig } from "next";

const nextConfig: NextConfig = { 
  images: {
    // allow hosting images from Pexels used in TripCard
    domains: ['images.pexels.com'],
  },
};

export default nextConfig;
