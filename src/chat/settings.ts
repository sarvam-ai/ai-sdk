import { z } from "zod";
import { sarvamErrorDataSchema } from "../error";

/**
 * @description Production models
 * @see https://docs.sarvam.ai/api-reference-docs/chat/chat-completions
 */
export type ChatModelId = "sarvam-30b" | "sarvam-105b" | (string & {});

export type ChatSettings = {
	/**
	 * The effort to use for reasoning.
	 *
	 * Can be disabled by explicitly setting to "none".
	 *
	 * @default "medium"
	 */
	reasoning_effort?: "none" | "low" | "medium" | "high";

	/**
	 * If set to true, the model response will be wiki grounded.
	 */
	wiki_grounding?: boolean;

	/**
	 * How many chat completion choices to generate for each input message.
	 *
	 * Note that you will be charged based on the number of generated tokens across all of the choices.
	 * Keep `n` as `1` to minimize costs.
	 */
	n?: number;

	/**
	 * Enables structured outputs, with or without a specified JSON schema.
	 *
	 * Early & Experimental, Sarvam model might not perform well.
	 *
	 * @example
	 * true: JSON is generated with response_format
	 * false: JSON is generated through tool calling argument
	 *
	 * @default false
	 */
	experimental_json_mode?: boolean;
};

export const chatSettingsSchema = z.object({
	reasoning_effort: z
		.enum(["none", "low", "medium", "high"])
		.transform((re) => (re === "none" ? null : re))
		.nullish(),
	wiki_grounding: z.boolean().nullish(),
	n: z.number().min(1).max(128).nullish(),
});

export const chatResponseSchema = z.object({
	id: z.string().nullish(),
	created: z.number().nullish(),
	model: z.string().nullish(),
	object: z.string().nullish(),
	service_tier: z.string().nullish(),
	system_fingerprint: z.string().nullish(),
	choices: z.array(
		z.object({
			index: z.number(),
			finish_reason: z.string().nullish(),
			logprobs: z.object({}).nullish(),
			message: z.object({
				content: z.string().nullish(),
				reasoning_content: z.string().nullish(),
				refusal: z.string().nullish(),
				tool_calls: z
					.array(
						z.object({
							id: z.string().nullish(),
							type: z.literal("function"),
							function: z.object({
								name: z.string(),
								arguments: z.string(),
							}),
						}),
					)
					.nullish(),
			}),
		}),
	),
	usage: z
		.object({
			completion_tokens: z.number().nullish(),
			prompt_tokens: z.number().nullish(),
			total_tokens: z.number().nullish(),
		})
		.nullish(),
});

export const chatChunkSchema = z.union([
	z.object({
		id: z.string().nullish(),
		created: z.number().nullish(),
		model: z.string().nullish(),
		choices: z.array(
			z.object({
				delta: z
					.object({
						content: z.string().nullish(),
						reasoning: z.string().nullish(),
						tool_calls: z
							.array(
								z.object({
									index: z.number(),
									id: z.string().nullish(),
									type: z.literal("function").optional(),
									function: z.object({
										name: z.string().nullish(),
										arguments: z.string().nullish(),
									}),
								}),
							)
							.nullish(),
					})
					.nullish(),
				finish_reason: z.string().nullable().optional(),
				index: z.number(),
			}),
		),
		x_sarvam: z
			.object({
				usage: z
					.object({
						prompt_tokens: z.number().nullish(),
						completion_tokens: z.number().nullish(),
					})
					.nullish(),
			})
			.nullish(),
	}),
	sarvamErrorDataSchema,
]);
