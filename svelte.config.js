import adapter from "svelte-adapter-bun";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://svelte.dev/docs/kit/integrations
  // for more information about preprocessors
  preprocess: vitePreprocess(),

  kit: {
    adapter: adapter({
      dynamic_origin: true, // This helps with Railway's proxy setup
      precompress: true, // Enable compression for better performance
      envPrefix: "",
    }),
    csrf: true,
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
