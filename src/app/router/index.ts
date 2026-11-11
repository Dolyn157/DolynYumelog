import type { RouteRecordRaw } from "vue-router";
import { createMemoryHistory, createRouter, createWebHistory } from "vue-router";

const loadRoute = async <T>(route: string, load: () => Promise<T>): Promise<T> => {
  if (!import.meta.env.SSR || process.env.YUME_SSG_PROFILE !== "1") return load();

  const start = performance.now();
  console.log(`[SSG/profile] import route=${route} start`);
  try {
    return await load();
  } finally {
    console.log(`[SSG/profile] import route=${route} ms=${(performance.now() - start).toFixed(1)}`);
  }
};

export const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: () => loadRoute("/", () => import("../../pages/home/HomePage.vue")),
    props: true,
  },
  {
    path: "/blog/:id?",
    name: "blog",
    component: () => loadRoute("/blog", () => import("../../pages/blog/BlogPage.vue")),
    props: true,
  },
  {
    path: "/tags/:tag",
    name: "tag",
    component: () => loadRoute("/tags", () => import("../../pages/tags/TagPage.vue")),
    props: true,
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: {
      path: "/",
      query: { invalid: "1" },
    },
  },
];

export const createAppRouter = (
  isSSR = Boolean(import.meta.env?.SSR || typeof window === "undefined"),
) =>
  createRouter({
    history: isSSR ? createMemoryHistory() : createWebHistory(),
    routes,
  });

const router = createAppRouter();

export default router;
