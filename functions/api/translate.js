// 文件路径: functions/api/translate.js

// 定义Pages Function的POST请求处理器
export async function onRequestPost(context) {
  try {
    // 1. 从环境变量中安全地获取配置（由Cloudflare平台注入）
    // 这些变量在本地开发时从 .env 文件读取，在生产环境从Cloudflare仪表盘读取。
    // GOOGLE_AI_API_KEY 现在用作 OpenAI 兼容 API 的 API 密钥 (Bearer Token)
    const API_KEY = context.env.GOOGLE_AI_API_KEY;
    // GEMINI_MODEL_NAME 现在用作 OpenAI 兼容 API 请求中的模型名称
    const MODEL_NAME = context.env.GEMINI_MODEL_NAME;
    // AI_GATEWAY_URL 现在是 OpenAI 兼容 API 的基础 URL
    const API_BASE_URL = context.env.AI_GATEWAY_URL;

    // 检查必要的环境变量是否存在 (名称保持不变，含义已更新)
    if (!API_KEY || !MODEL_NAME || !API_BASE_URL) {
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

    // 3. 构建 OpenAI 兼容 API 的请求 URL
    // 假设 OpenAI 兼容的 completions 端点是 /chat/completions
    const requestUrl = `${API_BASE_URL}/chat/completions`;

    // 4. 构建请求体
    const requestBody = {
      model: MODEL_NAME,
      messages: [
        {
          role: "system",
          content: "You are a translation engine."
        },
        {
          role: "user",
          content: `Translate the following text from ${sourceLang} to ${targetLang}. Only return the translated text, without any additional explanations or context. Text to translate: "${text}"`
        }
      ]
    };

    // 5. 发送 fetch 请求到 OpenAI 兼容 API
    const apiResponse = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    // 检查 API 响应是否成功
    if (!apiResponse.ok) {
      let errorDetails = `API request failed with status ${apiResponse.status}`;
      try {
        const errorData = await apiResponse.json();
        errorDetails = errorData.error?.message || JSON.stringify(errorData);
      } catch (e) {
        // 如果响应体不是JSON或解析失败，使用状态文本
        errorDetails = apiResponse.statusText;
      }
      console.error("Error from OpenAI compatible API:", errorDetails);
      return new Response(JSON.stringify({ error: 'Failed to get translation from API.', details: errorDetails }), {
        status: apiResponse.status, // 返回API的实际状态码
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 6. 解析 API 响应 JSON
    const responseData = await apiResponse.json();
    
    // 7. 提取翻译后的文本
    // 通常位于 responseData.choices[0].message.content
    let translatedText = '';
    if (responseData.choices && responseData.choices.length > 0 && responseData.choices[0].message && responseData.choices[0].message.content) {
      translatedText = responseData.choices[0].message.content.trim();
    } else {
      console.error("Unexpected API response structure:", responseData);
      return new Response(JSON.stringify({ error: 'Failed to parse translation from API response.', details: 'Unexpected API response structure' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 8. 将翻译结果以JSON格式返回给前端
    return new Response(JSON.stringify({ translation: translatedText }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    // 9. 统一的错误处理
    console.error("Error in translation function:", error);
    return new Response(JSON.stringify({ error: 'Failed to process translation.', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}