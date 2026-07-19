<template>
  <div class="root">
    <div class="title">
      <h1 :lang="lang">#{{ currentTag }}</h1>
    </div>

    <blog-card :source-posts="tagPosts"></blog-card>

    <p v-if="!yamlLoading && !tagPosts.length" class="empty-state" :lang="lang">
      No posts found for #{{ currentTag }}.
    </p>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onServerPrefetch } from "vue";
import { useRoute } from "vue-router";
import BlogCard from "@/features/blog/components/blogCard.vue";
import { lang } from "@/shared/lib/app/setupLang.ts";
import { posts } from "@/shared/lib/app/useGlobalState.ts";
import { parsePostTags } from "@/shared/lib/app/postTags.ts";
import { useContentStore } from "@/shared/lib/app/contentStore.ts";
import type { Post } from "@/shared/types/blog.ts";
import { yamlLoading } from "@/shared/lib/yaml";

const route = useRoute();
const { getPosts } = useContentStore();

const currentTag = computed(() => String(route.params.tag || "").trim());
const tagPosts = computed(() =>
  posts.value.filter((post) => parsePostTags(post.tags).includes(currentTag.value)),
);

const loadPosts = async () => {
  if (posts.value.length > 0) return;
  posts.value = await getPosts<Post>("blog");
};

if (import.meta.env.SSR) {
  onServerPrefetch(loadPosts);
}

onMounted(loadPosts);
</script>

<style lang="scss" scoped>
.root {
  width: 100%;

  .title {
    margin-top: 5em;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;

    h1 {
      display: flex;
      flex-wrap: wrap;
      align-content: center;
      color: var(--direct-font-color);
      text-shadow: var(--direct-font-shadow);
      font-weight: 500;
      margin: 0;

      @media (min-width: 840px) {
        font-size: 2em;
      }

      @media (max-width: 840px) {
        font-size: 1.8em;
      }
    }
  }
}

.empty-state {
  margin: 1rem auto 4rem;
  text-align: center;
  color: var(--direct-font-color);
}
</style>
