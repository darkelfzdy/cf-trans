// 文件路径: functions/api/translate.js

import { GoogleGenerativeAI } from '@google/generative-ai';

// 定义Pages Function的POST请求处理器
export async function onRequestPost(context) {
  try {
    // 1. 从环境变量中安全地获取配置（由Cloudflare平台注入）
    // 这些变量在本地开发时从 .env 文件读取，在生产环境从Cloudflare仪表盘读取。
    const GOOGLE_AI_API_KEY = context.env.GOOGLE_AI_API_KEY;
    const GEMINI_MODEL_NAME = context.env.GEMINI_MODEL_NAME;
    const AI_GATEWAY_URL = context.env.AI_GATEWAY_URL;

    // 检查必要的环境变量是否存在
    if (!GOOGLE_AI_API_KEY || !GEMINI_MODEL_NAME || !AI_GATEWAY_URL) {
      return new Response(JSON.stringify({ error: 'Missing server-side environment variables.' }), {
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

    // 3. 初始化Google Generative AI SDK实例
    const genAI = new GoogleGenerativeAI(GOOGLE_AI_API_KEY);

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