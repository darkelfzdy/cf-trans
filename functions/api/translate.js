// 文件路径: functions/api/translate.js

import { GoogleGenerativeAI } from '@google/generative-ai';

let currentApiKeyIndex = 0;
const apiKeyEnvNames = ['GOOGLE_AI_API_KEY1', 'GOOGLE_AI_API_KEY2', 'GOOGLE_AI_API_KEY3'];
// availableApiKeys will store the actual key strings found in env, populated on first request to an instance.
let availableApiKeys = [];

// 定义Pages Function的POST请求处理器
export async function onRequestPost(context) {
  // Populate availableApiKeys from environment variables if it's empty.
  // This logic runs once per "cold start" of the function instance.
  if (availableApiKeys.length === 0) {
    apiKeyEnvNames.forEach(keyName => {
      if (context.env[keyName]) {
        availableApiKeys.push(context.env[keyName]);
      }
    });
    // Log if no keys are found after checking all specified environment variables.
    if (availableApiKeys.length === 0) {
      console.error("Initialization: No Google AI API Keys (GOOGLE_AI_API_KEY1, etc.) found in environment variables.");
    }
  }
  try {
    // 1. 从环境变量中安全地获取配置（由Cloudflare平台注入）
    // API Keys are now managed by the `availableApiKeys` array, populated at the start of the function.
    const GEMINI_MODEL_NAME = context.env.GEMINI_MODEL_NAME;
    const AI_GATEWAY_URL = context.env.AI_GATEWAY_URL;

    // 检查必要的环境变量是否存在 (API Keys, Model Name, Gateway URL)
    if (availableApiKeys.length === 0 || !GEMINI_MODEL_NAME || !AI_GATEWAY_URL) {
      let errorDetail = 'Unknown configuration error.';
      if (availableApiKeys.length === 0) {
        errorDetail = 'No Google AI API Keys are configured or found. Please set GOOGLE_AI_API_KEY1, GOOGLE_AI_API_KEY2, or GOOGLE_AI_API_KEY3 in your environment variables.';
        console.error(errorDetail); // Log this critical configuration issue
      } else if (!GEMINI_MODEL_NAME) {
        errorDetail = 'Missing GEMINI_MODEL_NAME environment variable.';
        console.error(errorDetail);
      } else if (!AI_GATEWAY_URL) {
        errorDetail = 'Missing AI_GATEWAY_URL environment variable.';
        console.error(errorDetail);
      }
      return new Response(JSON.stringify({ error: 'Server configuration error.', details: errorDetail }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. 解析前端发送的JSON请求体
    const { text, sourceLang = 'auto', targetLang = 'Chinese' } = await context.request.json();
    if (!text) {
      return new Response(JSON.stringify({ error: 'Input text is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. 选择一个API Key并初始化Google Generative AI SDK实例
    // At this point, availableApiKeys.length > 0 is guaranteed by the check above.
    const selectedApiKey = availableApiKeys[currentApiKeyIndex];
    // Optional: Log which key is being used (be careful with logging full keys in production)
    // console.log(`Using API Key index: ${currentApiKeyIndex}`);

    const genAI = new GoogleGenerativeAI(selectedApiKey);

    // 更新索引，为该函数实例的下一次调用做准备 (轮询)
    // This index is specific to the current function instance and will reset on cold starts.
    // For persistent, cross-instance轮询 that survives cold starts,
    // a Cloudflare KV store or similar stateful mechanism would be required to store `currentApiKeyIndex`.
    currentApiKeyIndex = (currentApiKeyIndex + 1) % availableApiKeys.length;

    // 4. 获取模型实例，并【关键】将baseUrl配置为Cloudflare AI Gateway的URL
    const model = genAI.getGenerativeModel(
      { model: GEMINI_MODEL_NAME },
      { baseUrl: AI_GATEWAY_URL } // 这是通过AI Gateway路由的关键配置
    );

    // 5. 构建清晰的翻译提示（Prompt）
    const prompt = `Translate the following text from ${sourceLang} to ${targetLang}. Only return the translated text, without any additional explanations or context. Text to translate: "${text}"`;

    // 6. 调用模型生成内容
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const translatedText = response.text();

    // 7. 将翻译结果以JSON格式返回给前端
    return new Response(JSON.stringify({ translation: translatedText }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    // 8. 统一的错误处理
    console.error("Error in translation function:", error);
    return new Response(JSON.stringify({ error: 'Failed to process translation.', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}