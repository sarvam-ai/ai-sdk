import {
	type LanguageModelV4CallOptions,
	type LanguageModelV4FunctionTool,
	type LanguageModelV4ProviderTool,
	type LanguageModelV4ToolChoice,
	type LanguageModelV4ToolResultOutput,
	type SharedV4Warning,
	UnsupportedFunctionalityError,
} from "@ai-sdk/provider";
import type {
	SarvamResponseFormat,
	SarvamTool,
	SarvamToolChoice,
} from "./types";

export function prepareTools({
	tools,
	toolChoice,
}: {
	tools?: Array<LanguageModelV4FunctionTool | LanguageModelV4ProviderTool>;
	toolChoice?: LanguageModelV4ToolChoice;
}): {
	tools?: SarvamTool[];
	tool_choice?: SarvamToolChoice;
	toolWarnings: SharedV4Warning[];
} {
	// when the tools array is empty, change it to undefined to prevent errors:
	const finalTools = tools?.length ? tools : undefined;
	const toolWarnings: SharedV4Warning[] = [];

	if (finalTools == null) {
		return { tools: undefined, tool_choice: undefined, toolWarnings };
	}

	const sarvamTools: SarvamTool[] = [];

	for (const tool of finalTools) {
		if (tool.type === "provider") {
			toolWarnings.push({ type: "unsupported", feature: tool.name });
		} else {
			sarvamTools.push({
				type: "function",
				function: {
					name: tool.name,
					description: tool.description,
					parameters: tool.inputSchema,
				},
			});
		}
	}

	if (toolChoice == null) {
		return { tools: sarvamTools, tool_choice: undefined, toolWarnings };
	}

	const type = toolChoice.type;

	switch (type) {
		case "auto":
		case "none":
		case "required":
			return { tools: sarvamTools, tool_choice: type, toolWarnings };
		case "tool":
			return {
				tools: sarvamTools,
				tool_choice: {
					type: "function",
					function: {
						name: toolChoice.toolName,
					},
				},
				toolWarnings,
			};
		default: {
			const _exhaustiveCheck: never = type;
			throw new UnsupportedFunctionalityError({
				functionality: `Unsupported tool choice type: ${_exhaustiveCheck}`,
			});
		}
	}
}

export function getToolResultContent(
	output: LanguageModelV4ToolResultOutput,
): string {
	switch (output.type) {
		case "text":
		case "error-text":
			return output.value;
		case "json":
		case "error-json":
		case "content":
			return JSON.stringify(output.value);
		case "execution-denied":
			return output.reason ?? "Tool execution was denied.";
		default: {
			const _exhaustiveCheck: never = output;
			return JSON.stringify(_exhaustiveCheck);
		}
	}
}

export function prepareResponseFormat(
	responseFormat: LanguageModelV4CallOptions["responseFormat"],
): SarvamResponseFormat {
	if (!responseFormat || responseFormat.type !== "json") return;

	if (responseFormat.schema)
		return {
			type: "json_schema",
			json_schema: {
				name: responseFormat.name ?? "response",
				description: responseFormat.description,
				schema: responseFormat.schema,
				strict: true,
			},
		};

	return {
		type: "json_object",
	};
}

export function prepareResponseFormatAsTool(
	responseFormat: Extract<
		NonNullable<LanguageModelV4CallOptions["responseFormat"]>,
		{ type: "json" }
	>,
): ReturnType<typeof prepareTools> {
	return {
		toolWarnings: [],
		tool_choice: {
			type: "function",
			function: { name: responseFormat.name ?? "response" },
		},
		tools: [
			{
				type: "function",
				function: {
					name: responseFormat.name ?? "response",
					description: responseFormat.description,
					parameters: responseFormat.schema,
				},
			},
		],
	};
}
