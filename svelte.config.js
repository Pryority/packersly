import adapter from "svelte-adapter-bun";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://svelte.dev/docs/kit/integrations
  // for more information about preprocessors
  preprocess: vitePreprocess(),

  kit: {
    adapter: adapter({
      dynamic_origin: true, // This will use PROTOCOL_HEADER and HOST_HEADER
      xff_depth: 1,
      envPrefix: "", // Keep your empty prefix
      precompress: true,
      out: "build",
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
