<script setup lang="ts">
import { ref, watch } from 'vue';

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
  <div class="translator-app">
    <h1>Cloudflare AI 翻译</h1>

    <div class="controls">
      <select v-model="sourceLang" aria-label="源语言">
        <option v-for="lang in supportedLanguages" :key="lang.value" :value="lang.value">
          {{ lang.text }}
        </option>
      </select>

      <button @click="swapLanguages" class="swap-button" aria-label="切换语言">
        ↔️
      </button>

      <select v-model="targetLang" aria-label="目标语言">
        <option v-for="lang in targetLanguages" :key="lang.value" :value="lang.value">
          {{ lang.text }}
        </option>
      </select>
    </div>

    <div class="text-areas">
      <div class="text-area-container">
        <textarea
          v-model="inputText"
          placeholder="输入要翻译的文本"
          aria-label="待翻译文本输入区"
        ></textarea>
        <button @click="clearInput" v-if="inputText" class="clear-button" aria-label="清除输入">
          ❌
        </button>
      </div>

      <div class="text-area-container">
        <textarea
          :value="translatedText"
          readonly
          placeholder="翻译结果"
          aria-label="翻译结果展示区"
        ></textarea>
        <button @click="copyResult" v-if="translatedText" class="copy-button" aria-label="复制结果">
          📋
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="loading-indicator">
      翻译中...
    </div>

    <div v-if="errorMessage" class="error-message">
      <p>错误: {{ errorMessage }}</p>
    </div>
  </div>
</template>

<style scoped>
.translator-app {
  /* max-width: 800px; */ /* 移除最大宽度限制 */
  width: 100%; /* 占满父容器 (#app) 的宽度 */
  min-height: 100vh; /* 至少占满视口高度 */
  margin: 0; /* 移除外边距 */
  padding: 20px; /* 保留一些内边距 */
  font-family: sans-serif;
  /* background-color: #f9f9f9; */ /* 背景色由全局 style.css 控制 */
  /* border-radius: 8px; */ /* 移除圆角，使其更像全屏应用 */
  /* box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); */ /* 移除阴影 */
  display: flex;
  flex-direction: column;
  box-sizing: border-box; /* 确保 padding 不会增加总宽度/高度 */
}

h1 {
  text-align: center;
  /* color: #333; */ /* 颜色由全局 style.css 控制 */
  margin-bottom: 25px; /* 稍微增加底部边距 */
  font-size: 2.2em; /* 适当调整标题大小 */
}

.controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px; /* 稍微增加底部边距 */
  gap: 15px; /* 稍微增加间隙 */
  flex-wrap: wrap; /* 允许控件换行 */
}

.controls select {
  padding: 12px 15px; /* 增加内边距 */
  border: 1px solid #ccc;
  border-radius: 6px; /* 稍微增加圆角 */
  flex-grow: 1;
  font-size: 1.1em; /* 增加字体大小 */
  min-width: 150px; /* 确保下拉框有最小宽度 */
}

.swap-button {
  padding: 12px 20px; /* 增加内边距 */
  /* background-color: #007bff; */ /* 颜色由全局 style.css 控制或保持默认 */
  /* color: white; */
  border: none;
  border-radius: 6px; /* 稍微增加圆角 */
  cursor: pointer;
  font-size: 1.2em; /* 增加字体大小 */
}

/* .swap-button:hover { */
  /* background-color: #0056b3; */ /* 颜色由全局 style.css 控制或保持默认 */
/* } */

.text-areas {
  display: flex;
  gap: 25px; /* 稍微增加间隙 */
  margin-bottom: 25px; /* 稍微增加底部边距 */
  flex-grow: 1; /* 使文本区域占据剩余空间 */
  flex-direction: row; /* 默认是row，确保 */
}

@media (max-width: 768px) {
  .text-areas {
    flex-direction: column; /* 在小屏幕上垂直排列 */
  }
  .controls {
    flex-direction: column;
  }
  .controls select {
    width: 100%;
  }
}


.text-area-container {
  flex: 1; /* 每个文本区域容器占据一半空间 */
  position: relative;
  display: flex; /* 使 textarea 可以 flex-grow */
  flex-direction: column;
}

textarea {
  width: 100%;
  /* height: 300px; */ /* 移除固定高度，让其自适应或通过 flex-grow 控制 */
  flex-grow: 1; /* 使 textarea 填满其容器的高度 */
  padding: 15px; /* 增加内边距 */
  border: 1px solid #ccc;
  border-radius: 6px; /* 稍微增加圆角 */
  font-size: 1.1em; /* 增加字体大小 */
  box-sizing: border-box;
  resize: none; /* 禁止用户调整大小，以保持布局 */
  min-height: 200px; /* 设置最小高度 */
}

textarea[readonly] {
  /* background-color: #f0f0f0; */ /* 背景色由全局 style.css 控制 */
}

.clear-button,
.copy-button {
  position: absolute;
  top: 15px; /* 调整位置 */
  right: 15px; /* 调整位置 */
  background: none;
  border: none;
  font-size: 1.4em; /* 增加图标大小 */
  cursor: pointer;
  padding: 8px; /* 增加点击区域 */
  /* color: #666; */ /* 颜色由全局 style.css 控制 */
}

/* .clear-button:hover, */
/* .copy-button:hover { */
  /* color: #333; */ /* 颜色由全局 style.css 控制 */
/* } */

.loading-indicator {
  text-align: center;
  padding: 15px; /* 增加内边距 */
  /* color: #007bff; */ /* 颜色由全局 style.css 控制 */
  font-style: italic;
  font-size: 1.1em;
}

.error-message {
  text-align: center;
  padding: 15px; /* 增加内边距 */
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 6px; /* 稍微增加圆角 */
  font-size: 1.1em;
}
</style>
