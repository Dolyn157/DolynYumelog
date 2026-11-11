import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();

const targetFiles = [];

const collectIfExists = (filePath) => {
  if (fs.existsSync(filePath)) targetFiles.push(filePath);
};

const findPnpmViteSsgDist = () => {
  const pnpmRoot = path.join(projectRoot, "node_modules", ".pnpm");
  if (!fs.existsSync(pnpmRoot)) return;

  for (const name of fs.readdirSync(pnpmRoot)) {
    if (!name.startsWith("vite-ssg@")) continue;
    collectIfExists(path.join(pnpmRoot, name, "node_modules", "vite-ssg", "dist", "index.mjs"));
    collectIfExists(path.join(pnpmRoot, name, "node_modules", "vite-ssg", "bin", "vite-ssg.js"));
  }
};

const findViteCacheFiles = () => {
  const viteDepsDir = path.join(projectRoot, "node_modules", ".vite", "deps");
  if (!fs.existsSync(viteDepsDir)) return;

  for (const name of fs.readdirSync(viteDepsDir)) {
    if (!name.startsWith("vite-ssg") || !name.endsWith(".js")) continue;
    collectIfExists(path.join(viteDepsDir, name));
  }
};

findPnpmViteSsgDist();
findViteCacheFiles();

if (process.env.YUME_SSG_PROFILE === "1") {
  const sharedDir = path.join(projectRoot, "node_modules", "vite-ssg", "dist", "shared");
  for (const name of fs.readdirSync(sharedDir)) {
    if (/^vite-ssg\..+\.mjs$/.test(name)) collectIfExists(path.join(sharedDir, name));
  }
}

const profileMarker = "const yumeSsgProfile =";

const addBuildProfile = (text) => {
  if (text.includes(profileMarker)) return text;

  const checkpoints = [
    [
      "  const serverEntry =",
      `  ${profileMarker} process.env.YUME_SSG_PROFILE === "1";
  const yumeTimer = (enabled, label) => {
    let last = performance.now();
    return (stage) => {
      if (!enabled) return;
      const now = performance.now();
      console.log("[SSG/profile] " + label + " " + stage + " ms=" + (now - last).toFixed(1));
      last = now;
    };
  };
  const yumeBuildStep = yumeTimer(yumeSsgProfile, "build");
  const serverEntry =`,
    ],
    [
      "  const includedRoutes = serverEntryIncludedRoutes",
      '  yumeBuildStep("import-server-entry");\n  const includedRoutes = serverEntryIncludedRoutes',
    ],
    [
      "  let routesPaths = includeAllRoutes",
      '  yumeBuildStep("create-route-discovery-app");\n  let routesPaths = includeAllRoutes',
    ],
    [
      '  buildLog("Rendering Pages...", routesPaths.length);',
      '  yumeBuildStep("discover-routes");\n  buildLog("Rendering Pages...", routesPaths.length);',
    ],
    [
      "  const queue = new PQueue({ concurrency });",
      '  yumeBuildStep("prepare-renderer");\n  const queue = new PQueue({ concurrency });',
    ],
    [
      "        const appCtx = await createApp(route);",
      '        const yumePageStep = yumeTimer(yumeSsgProfile && route === routesPaths[0], "route=" + route);\n        const appCtx = await createApp(route);\n        yumePageStep("create-app");',
    ],
    [
      "          await router.isReady();",
      '          yumePageStep("router-push");\n          await router.isReady();\n          yumePageStep("router-ready");',
    ],
    [
      "        const appHTML = await renderToString(app, ctx);",
      '        yumePageStep("before-render");\n        const appHTML = await renderToString(app, ctx);\n        yumePageStep("render-to-string");',
    ],
    [
      "        const jsdom = new JSDOM(renderedHTML);",
      '        yumePageStep("assemble-html");\n        const jsdom = new JSDOM(renderedHTML);\n        yumePageStep("create-dom");',
    ],
    [
      "        const formatted = await formatHtml(transformed, formatting);",
      '        yumePageStep("apply-head-and-hooks");\n        const formatted = await formatHtml(transformed, formatting);\n        yumePageStep("format-html");',
    ],
    [
      '        await fs.writeFile(resolve(out, filename), formatted, "utf-8");',
      '        await fs.writeFile(resolve(out, filename), formatted, "utf-8");\n        yumePageStep("write-html");',
    ],
  ];
  for (const [anchor, replacement] of checkpoints) {
    if (!text.includes(anchor)) throw new Error(`Missing vite-ssg profile anchor: ${anchor}`);
    text = text.replace(anchor, replacement);
  }
  return text;
};

const transform = (text) => {
  return text.replace(
    /router\.beforeEach\(\(to, from, next\) => \{\s+if \(isFirstRoute \|\| entryRoutePath && entryRoutePath === to\.path\) \{\s+isFirstRoute = false;\s+entryRoutePath = to\.path;\s+to\.meta\.state = context\.initialState;\s+\}\s+next\(\);\s+\}\);/g,
    `router.beforeEach((to, from) => {\n      if (isFirstRoute || entryRoutePath && entryRoutePath === to.path) {\n        isFirstRoute = false;\n        entryRoutePath = to.path;\n        to.meta.state = context.initialState;\n      }\n    });`,
  );
};

let changed = 0;

for (const file of targetFiles) {
  const original = fs.readFileSync(file, "utf8");
  const updated = original.includes('buildLog("Rendering Pages..."')
    ? addBuildProfile(original)
    : transform(original);
  if (updated !== original) {
    fs.writeFileSync(file, updated, "utf8");
    changed += 1;
    console.log(`[patch-vite-ssg] patched: ${path.relative(projectRoot, file)}`);
  }
}

if (changed === 0) {
  console.log("[patch-vite-ssg] no changes needed.");
}
