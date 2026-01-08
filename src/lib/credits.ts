// Centralized credit utilities (deterministic and easy to adjust)

export const CHAT_TOKEN_SCALING = {
  // divisor to estimate tokens from characters (approx 4 chars per token)
  charsPerToken: 4,
  // estimated output tokens heuristic: multiplier for input tokens
  outputMultiplier: 0.5,
  // output tokens additive buffer to be conservative
  outputBuffer: 128,
  // max output tokens assumed for estimation
  maxEstimatedOutputTokens: 2048,
};

export function computeCreditsFromTokens(inputTokens: number, outputTokens: number) {
  const effectiveTokens = inputTokens + 4 * outputTokens;
  const rawCredits = Math.ceil(effectiveTokens / 2000);
  const credits = Math.max(1, Math.min(8, rawCredits));
  return {
    inputTokens,
    outputTokens,
    effectiveTokens,
    credits
  };
}

export function estimateChatCreditsFromText(text: string, historyText = '') {
  const chars = (historyText + '\n' + text).length;
  const estimatedInputTokens = Math.max(1, Math.ceil(chars / CHAT_TOKEN_SCALING.charsPerToken));
  let estimatedOutputTokens = Math.ceil(estimatedInputTokens * CHAT_TOKEN_SCALING.outputMultiplier) + CHAT_TOKEN_SCALING.outputBuffer;
  estimatedOutputTokens = Math.max(64, Math.min(CHAT_TOKEN_SCALING.maxEstimatedOutputTokens, estimatedOutputTokens));

  return computeCreditsFromTokens(estimatedInputTokens, estimatedOutputTokens);
}

export function computeYouTubePlaylistCost(videoCount: number) {
  const price = Math.min(15, 5 + Math.min(10, videoCount));
  return { videoCount, price };
}
