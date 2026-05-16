import type { Plugin, ViteDevServer } from "vite";

const GITHUB_BLOG_BASE =
  "https://raw.githubusercontent.com/chiba233/YumeLog/refs/heads/master/public/data/blog/";

export const dynamicYamlConfig = (blogUrl: string, blogListUrl: string): Plugin => ({
  name: "dynamic-yaml-config",
  configureServer(server: ViteDevServer) {
    server.middlewares.use("/data/config/yamlUrl.json", (_req, res) => {
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          blog: {
            listUrl: blogListUrl,
            url: blogUrl,
            spareUrl: GITHUB_BLOG_BASE,
            spareListUrl: `${GITHUB_BLOG_BASE}list.json`,
          },
          main: { url: "/data/main/" },
        }),
      );
    });
  },
});
