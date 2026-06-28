import {
	type LanguageModelV4FunctionTool,
	type LanguageModelV4ProviderTool,
	type LanguageModelV4ToolChoice,
	type SharedV4Warning,
	UnsupportedFunctionalityError,
} from "@ai-sdk/provider";

type SarvamTools = Array<{
	type: "function";
	function: {
		name: string;
		description: string | undefined;
		parameters: unknown;
	};
}>;

export function prepareTools({
	tools,
	toolChoice,
}: {
	tools?: Array<LanguageModelV4FunctionTool | LanguageModelV4ProviderTool>;
	toolChoice?: LanguageModelV4ToolChoice;
}): {
	tools: SarvamTools | undefined;
	tool_choice:
		| { type: "function"; function: { name: string } }
		| "auto"
		| "none"
		| "required"
		| undefined;
	toolWarnings: SharedV4Warning[];
} {
	// when the tools array is empty, change it to undefined to prevent errors:
	const finalTools = tools?.length ? tools : undefined;
	const toolWarnings: SharedV4Warning[] = [];

	if (finalTools == null) {
		return { tools: undefined, tool_choice: undefined, toolWarnings };
	}

	const sarvamTools: SarvamTools = [];

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
