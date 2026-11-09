import { strict as assert } from "node:assert";
import test from "node:test";
import { convertReadableStreamToArray } from "@ai-sdk/provider-utils/test";
import { createSarvam } from "@/provider";

const usage = { prompt_tokens: 16, completion_tokens: 12, total_tokens: 28 };
const prompt = [
	{
		role: "user" as const,
		content: [{ type: "text" as const, text: "Namaste" }],
	},
];

for (const [name, fields, expected] of [
	["top-level usage-only final chunk", { usage }, [16, 12]],
	["legacy nested usage", { x_sarvam: { usage } }, [16, 12]],
	[
		"top-level usage takes precedence",
		{
			usage,
			x_sarvam: { usage: { prompt_tokens: 99, completion_tokens: 99 } },
		},
		[16, 12],
	],
	["missing usage stays unknown", {}, [undefined, undefined]],
	[
		"zero tokens are preserved",
		{ usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 } },
		[0, 0],
	],
] as const) {
	test(`doStream preserves ${name}`, async () => {
		const chunks = [
			{
				id: "stream-test",
				choices: [
					{ index: 0, delta: { content: "नमस्ते" }, finish_reason: "stop" },
				],
			},
			{ id: "stream-test", choices: [], ...fields },
		];
		const sarvam = createSarvam({
			apiKey: "test",
			fetch: async () =>
				new Response(
					`${chunks.map((c) => `data: ${JSON.stringify(c)}\n\n`).join("")}data: [DONE]\n\n`,
					{ headers: { "content-type": "text/event-stream" } },
				),
		});
		const result = await sarvam.chat("sarvam-105b").doStream({ prompt });
		const parts = await convertReadableStreamToArray(result.stream);
		const finish = parts.find((part) => part.type === "finish");
		assert.ok(finish && finish.type === "finish");
		assert.equal(finish.usage.inputTokens.total, expected[0]);
		assert.equal(finish.usage.outputTokens.total, expected[1]);
		assert.ok(
			parts.some((part) => part.type === "text-delta" && part.delta === "नमस्ते"),
		);
	});
}
