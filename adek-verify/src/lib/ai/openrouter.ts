const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface MessageContent {
  type: 'text' | 'image_url' | 'file';
  text?: string;
  image_url?: { url: string };
  file?: { filename: string; file_data: string };
}

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string | MessageContent[];
}

interface OpenRouterRequest {
  model: string;
  messages: Message[];
  max_tokens?: number;
  temperature?: number;
  response_format?: { type: string };
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  error?: {
    message: string;
    code: string;
  };
}

export async function callOpenRouter(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userContent: string | MessageContent[],
  options?: { maxTokens?: number; temperature?: number; reasoningEffort?: 'high' | 'medium' | 'low' }
): Promise<string> {
  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent },
  ];

  const body: Record<string, unknown> = {
    model,
    messages,
    max_tokens: options?.maxTokens ?? 4096,
    temperature: options?.temperature ?? 0.1,
    response_format: { type: 'json_object' },
  };

  // Add reasoning/thinking for models that support it
  if (options?.reasoningEffort) {
    body.reasoning = { effort: options.reasoningEffort };
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://adek-verify.vercel.app',
      'X-Title': 'ADEK Smart Document Verification',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
  }

  const data: OpenRouterResponse = await response.json();

  if (data.error) {
    throw new Error(`OpenRouter error: ${data.error.message}`);
  }

  return data.choices[0]?.message?.content || '';
}

export function buildImageContent(base64: string, mimeType: string): MessageContent {
  return {
    type: 'image_url',
    image_url: { url: `data:${mimeType};base64,${base64}` },
  };
}

export function buildFileContent(base64: string, mimeType: string, filename: string): MessageContent {
  return {
    type: 'file',
    file: {
      filename,
      file_data: `data:${mimeType};base64,${base64}`,
    },
  };
}

export function buildTextContent(text: string): MessageContent {
  return { type: 'text', text };
}

export async function testConnection(apiKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await callOpenRouter(
      apiKey,
      'anthropic/claude-sonnet-4.6',
      'Respond with exactly: {"status":"ok"}',
      'Test connection',
      { maxTokens: 50 }
    );
    const parsed = JSON.parse(result);
    return { success: parsed.status === 'ok' };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
