---
name: voice-agents
description: >-
  Build real-time Indic voice agents with Sarvam STT/TTS/LLM, plus JS/TS
  custom-pipeline notes. Use this skill when creating phone bots, IVR, or
  always-on conversational voice apps. For one-shot in-chat voice reply or
  dubbing via MCP, use sarvam-mcp instead.
license: Apache-2.0
metadata:
  author: sarvam-ai
  version: "3.4"
  internal: true
---

# Voice Agents — Sarvam AI

> One-shot in-chat voice/dub → [sarvam-mcp](../sarvam-mcp) (`sarvam_tools_voice` / `_dub`). This skill = **agent code**.

> [!IMPORTANT]
> Auth: `api-subscription-key` header — NOT `Authorization: Bearer`. Env var: `SARVAM_API_KEY`

## JavaScript/TypeScript Pipeline

For JS/TS voice pipelines, use the individual SDK methods directly:

```typescript
import { SarvamAIClient } from "sarvamai";
const client = new SarvamAIClient({ apiSubscriptionKey: "YOUR_SARVAM_API_KEY" });

// STT: client.speechToText.transcribe({...})
// TTS: client.textToSpeech.convertStream({...})  // returns BinaryResponse
// LLM: client.chat.completions({...})
```

## Gotchas

| Gotcha | Detail |
|--------|--------|
| **v4 speakers are persona IDs** | `model: "bulbul:v4-flash"` needs `voice_language_style` (`simran_en_customer`, `aparna_hi_customer`). Short names (`shubh`, `anand`, `priya`) 400. Always pass `speaker`. Hindi: `aparna_hi_customer`. Tamil: `gokul_ta_narration`. No v4 personas for `ml-IN` / `od-IN` — use `bulbul:v3` there. |
| **`sarvam-30b` is deprecated — and now hard-errors at the API** | Verified live: calling `sarvam-30b` via the chat API now returns `400`: `"Model 'sarvam-30b' has been deprecated. Please use one of the available models instead: sarvam-105b, sarvam-105b-conversations."` It isn't a future risk — existing code on it is already broken. |
| **`max_tokens` budget** | Sarvam models reason internally. Don't set low `max_tokens` or `content` will be `null`. Omit, set 500+, or disable with `reasoning_effort: null`. |
| **TTS pitch/loudness** | On `bulbul:v4-flash`, `pitch` is −0.5–0.5 and `loudness` is 0.1–2.5. Bulbul v3 now accepts them too (live-verified 2026-10-06); `pace` is 0.5–2.0. Out-of-range values return 400. |
| **STT WebSocket codecs** | Only `wav`/`pcm` — no MP3/AAC/OGG for streaming. |
| **HTTP Stream for TTS** | `convertStream` returns binary audio directly (no base64), better for pipelines. |
| **Telephony** | For phone agents (e.g. Exotel), set `audio_in_sample_rate: 8000` and `audio_out_sample_rate: 8000` to match telephony audio. |

## Full Docs

Fetch framework integration guides, environment setup, and advanced patterns from:

- **https://docs.sarvam.ai/llms.txt** — comprehensive docs index
- [Bulbul v4 Flash voices](https://docs.sarvam.ai/api/api-guides-tutorials/text-to-speech/voices)
- [Rate Limits](https://docs.sarvam.ai/api/ratelimits)
