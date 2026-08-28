import { strict as assert } from "node:assert";
import test from "node:test";
import { convertReadableStreamToArray } from "@ai-sdk/provider-utils/test";
import { createSarvam } from "@/provider";

function eventStream(chunks: unknown[]) {
	return chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`).join("");
}

test("doStream brackets streamed tool call input", async () => {
	const sarvam = createSarvam({
		apiKey: "test-api-key",
		fetch: async () =>
			new Response(
				eventStream([
					{
						id: "chatcmpl_test",
						created: 0,
						model: "sarvam-105b",
						choices: [
							{
								index: 0,
								delta: {
									tool_calls: [
										{
											index: 0,
											id: "call_test",
											type: "function",
											function: {
												name: "weather",
												arguments: '{"city"',
											},
										},
									],
								},
							},
						],
					},
					{
						id: "chatcmpl_test",
						created: 0,
						model: "sarvam-105b",
						choices: [
							{
								index: 0,
								delta: {
									tool_calls: [
										{
											index: 0,
											function: {
												arguments: ':"Pune"}',
											},
										},
									],
								},
							},
						],
					},
					{
						id: "chatcmpl_test",
						created: 0,
						model: "sarvam-105b",
						choices: [
							{
								index: 0,
								delta: {},
								finish_reason: "tool_calls",
							},
						],
					},
				]),
				{
					headers: {
						"content-type": "text/event-stream",
					},
				},
			),
	});

	const result = await sarvam.chat("sarvam-105b").doStream({
		prompt: [
			{
				role: "user",
				content: [{ type: "text", text: "What is the weather in Pune?" }],
			},
		],
	});

	const parts = await convertReadableStreamToArray(result.stream);

	assert.deepEqual(
		parts.filter((part) => part.type.startsWith("tool")),
		[
			{
				type: "tool-input-start",
				id: "call_test",
				toolName: "weather",
			},
			{
				type: "tool-input-delta",
				id: "call_test",
				delta: '{"city"',
			},
			{
				type: "tool-input-delta",
				id: "call_test",
				delta: ':"Pune"}',
			},
			{
				type: "tool-input-end",
				id: "call_test",
			},
			{
				type: "tool-call",
				toolCallId: "call_test",
				toolName: "weather",
				input: '{"city":"Pune"}',
			},
		],
	);
});
