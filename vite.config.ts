import { defineConfig } from "vite";

export default defineConfig(() => {
  const base = process.env.VITE_BASE_PATH ?? (process.env.GITHUB_ACTIONS ? "/Fastboot.js-Next/" : "/");

  return {
    base,
    build: {
      target: "es2022",
      sourcemap: true
    }
  };
});
