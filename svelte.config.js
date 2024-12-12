import adapter from "svelte-adapter-bun";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://svelte.dev/docs/kit/integrations
  // for more information about preprocessors
  preprocess: vitePreprocess(),

  kit: {
    adapter: adapter({
      // Existing options
      dynamic_origin: true,
      precompress: true,
      envPrefix: "",

      // Add these proxy-related options
      protocol_header: "x-forwarded-proto",
      host_header: "x-forwarded-host",
      address_header: "x-forwarded-for",
      xff_depth: 1,

      // Ensure proper host/port binding for Railway
      host: "0.0.0.0", // Allow connections from all network interfaces
      port: process.env.PORT || 3000,
    }),
    env: {
      dir: ".",
      publicPrefix: "PUBLIC_",
    },
    alias: {
      "@routes": "src/routes",
      "@components": "src/lib/components",
      "@db": "src/lib/server/db",
      "@server": "src/lib/server",
      "@utils": "src/lib/utils",
      "@types": "src/lib/types",
    },
  },
};

export default config;
