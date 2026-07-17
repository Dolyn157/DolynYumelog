<template>
  <n-button
    :color="themeColor"
    :style="{ '--dynamic-width': props.btnWidth }"
    :title="buttonTitle"
    class="buttonTheme sync-btn"
    round
    @click="toggleTheme"
  >
    <template #icon>
      <n-icon :component="buttonIcon" size="20" />
    </template>
    <span class="commonText themeToggleSpan">{{ buttonText }}</span>
  </n-button>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { NButton, NIcon } from "naive-ui";
import { WeatherMoon24Regular, WeatherSunny24Regular } from "@vicons/fluent";
import { isDarkTheme, themeColor, themeMode } from "@/shared/lib/app/useTheme.ts";

interface Props {
  btnWidth?: string;
}

const props = withDefaults(defineProps<Props>(), {
  btnWidth: "auto",
});

const buttonIcon = computed(() =>
  isDarkTheme.value ? WeatherSunny24Regular : WeatherMoon24Regular,
);
const buttonText = computed(() => (isDarkTheme.value ? "白天" : "黑夜"));
const buttonTitle = computed(() => (isDarkTheme.value ? "切换到白天主题" : "切换到黑夜主题"));

const toggleTheme = () => {
  themeMode.value = isDarkTheme.value ? "light" : "dark";
};
</script>

<style lang="scss" scoped>
.buttonTheme {
  height: 2.2em;
  border: 1px solid rgba(var(--glow-rgb), 0.2);
  pointer-events: auto;
  min-width: var(--dynamic-width, auto);
  width: auto;

  @media (min-width: 301px) {
    min-width: var(--dynamic-width, auto);
  }

  @media (max-width: 300px) {
    min-width: 5em !important;
    width: 5em !important;
    padding: 0 !important;

    .n-icon {
      margin-left: 6px !important;
    }
  }
}

.themeToggleSpan {
  display: inline-block;
  white-space: nowrap;

  @media (max-width: 300px) {
    display: none;
  }
}
</style>
