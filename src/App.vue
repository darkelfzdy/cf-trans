<script setup lang="ts">
import { ref, watch } from 'vue';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Languages, X, Copy } from 'lucide-vue-next';

const inputText = ref('');
const translatedText = ref('');
const sourceLang = ref('auto');
const targetLang = ref('zh');
const isLoading = ref(false);
const errorMessage = ref('');
let debounceTimer: number | undefined;

const supportedLanguages = [
  { value: 'auto', text: '自动检测' },
  { value: 'en', text: '英语' },
  { value: 'zh', text: '中文' },
  { value: 'es', text: '西班牙语' },
  { value: 'fr', text: '法语' },
  { value: 'de', text: '德语' },
  { value: 'ja', text: '日语' },
  { value: 'ko', text: '韩语' },
];

const targetLanguages = supportedLanguages.filter(lang => lang.value !== 'auto');

async function translateText() {
  if (!inputText.value.trim()) {
    translatedText.value = '';
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';
  translatedText.value = ''; // 清空旧的翻译结果

  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: inputText.value,
        sourceLang: sourceLang.value,
        targetLang: targetLang.value,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    translatedText.value = data.translation;
  } catch (error: any) {
    console.error('Translation error:', error);
    errorMessage.value = error.message || '翻译失败，请稍后再试。';
    translatedText.value = ''; // 确保出错时翻译结果区为空
  } finally {
    isLoading.value = false;
  }
}

function debouncedTranslate() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    translateText();
  }, 750); // 750ms 延迟
}

watch(inputText, () => {
  if (inputText.value.trim()) {
    debouncedTranslate();
  } else {
    clearTimeout(debounceTimer);
    translatedText.value = '';
    errorMessage.value = '';
  }
});

watch([sourceLang, targetLang], () => {
  if (inputText.value.trim()) {
    translateText(); // 语言更改后立即翻译
  }
});

function swapLanguages() {
  if (sourceLang.value === 'auto') {
    // 如果源语言是自动检测，切换时可以将其设置为一个常用语言，例如英语，或者上次检测到的语言（如果可获取）
    // 这里简单处理，如果目标语言不是英语，则源语言变为英语，否则变为中文
    // 更好的做法是记录上次自动检测的语言
    const oldTarget = targetLang.value;
    targetLang.value = sourceLang.value === 'auto' ? (oldTarget !== 'en' ? 'en' : 'zh') : sourceLang.value;
    sourceLang.value = oldTarget;

  } else {
    const temp = sourceLang.value;
    sourceLang.value = targetLang.value;
    targetLang.value = temp;
  }
}

function clearInput() {
  inputText.value = '';
  translatedText.value = '';
  errorMessage.value = '';
  clearTimeout(debounceTimer);
}

async function copyResult() {
  if (!translatedText.value) return;
  try {
    await navigator.clipboard.writeText(translatedText.value);
    // 可以添加一个提示，比如 "已复制到剪贴板"
    alert('翻译结果已复制到剪贴板！');
  } catch (err) {
    console.error('Failed to copy text: ', err);
    errorMessage.value = '复制失败，请手动复制。';
  }
}
</script>

<template>
  <div class="translator-app flex flex-col items-center p-4 sm:p-8 md:p-12 bg-background text-foreground mt-8">
    <h1 class="text-3xl font-bold mb-6 flex items-center gap-3">
      <img src="/vite.svg" alt="Vite Logo" class="h-8 w-8" /> AI 翻译
    </h1>

    <div class="controls flex flex-row items-center justify-between gap-6 sm:gap-8 mb-10 w-full">
      <Select v-model="sourceLang" class="flex-grow basis-0">
        <SelectTrigger class="w-full" aria-label="源语言">
          <SelectValue placeholder="选择源语言" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem v-for="lang in supportedLanguages" :key="lang.value" :value="lang.value">
              {{ lang.text }}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      <Button @click="swapLanguages" variant="outline" size="icon" aria-label="切换语言" class="p-2 flex-shrink-0 mx-2">
        <Languages class="h-5 w-5" />
      </Button>

      <Select v-model="targetLang" class="flex-grow basis-0">
        <SelectTrigger class="w-full" aria-label="目标语言">
          <SelectValue placeholder="选择目标语言" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem v-for="lang in targetLanguages" :key="lang.value" :value="lang.value">
              {{ lang.text }}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>

    <div class="text-areas grid grid-cols-2 gap-20 w-full flex-grow">
      <div class="relative flex flex-col">
        <Textarea
          v-model="inputText"
          placeholder="输入要翻译的文本"
          aria-label="待翻译文本输入区"
          class="flex-grow resize-none min-h-[300px] p-4 pr-12 border rounded-md"
        />
        <Button @click="clearInput" v-if="inputText" variant="ghost" size="icon" class="absolute top-2 right-2 h-8 w-8" aria-label="清除输入">
          <X class="h-5 w-5" />
        </Button>
      </div>

      <div class="relative flex flex-col">
        <Textarea
          :model-value="translatedText"
          readonly
          placeholder="翻译结果"
          aria-label="翻译结果展示区"
          class="flex-grow resize-none min-h-[300px] p-4 pr-12 border rounded-md bg-muted"
        />
        <Button @click="copyResult" v-if="translatedText" variant="ghost" size="icon" class="absolute top-2 right-2 h-8 w-8" aria-label="复制结果">
          <Copy class="h-5 w-5" />
        </Button>
      </div>
    </div>

    <div v-if="isLoading" class="loading-indicator text-center p-4 text-muted-foreground italic text-lg">
      翻译中...
    </div>

    <div v-if="errorMessage" class="error-message mt-4 text-center p-4 text-destructive bg-destructive/10 border border-destructive rounded-md text-lg w-full max-w-4xl">
      <p>错误: {{ errorMessage }}</p>
    </div>
  </div>
</template>

<style scoped>
/* 移除了大部分自定义样式，优先使用 Tailwind CSS 和 shadcn-vue 组件的默认样式 */
/* .translator-app, h1, .title-logo, .controls, .controls select, .swap-button, */
/* .text-areas, .text-area-container, textarea, .clear-button, .copy-button */
/* 的样式已通过 Tailwind CSS 类在模板中直接定义或由 shadcn-vue 组件提供。 */

.translator-app {
  max-width: 1000px;
  width: 100%; /* 确保在小屏幕上能正确适应 */
  margin-left: auto;
  margin-right: auto;
}

/* 可以保留或调整全局消息提示的样式，或完全依赖 Tailwind 类 */
.loading-indicator {
  /* 样式已通过 Tailwind 类在模板中定义: */
  /* text-center p-4 text-muted-foreground italic text-lg */
}

.error-message {
  /* 样式已通过 Tailwind 类在模板中定义: */
  /* text-center p-4 text-destructive bg-destructive/10 border border-destructive rounded-md text-lg */
}

/* 如果有特定于此组件且无法通过 Tailwind 轻松实现的样式，可以保留在这里 */
/* 例如，如果需要非常特定的动画或过渡效果 */
</style>
