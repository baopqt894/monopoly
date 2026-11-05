/** @type {import('next').NextConfig} */
const config = {
  transpilePackages: ['@typhu/contracts', '@typhu/game-content', '@typhu/game-engine'],
  // Full typechecking runs via npm run build / CI, separately from the deployment build.
  typescript: { ignoreBuildErrors: true },
};
export default config;
