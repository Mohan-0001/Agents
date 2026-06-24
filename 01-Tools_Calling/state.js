import "dotenv/config"
import { tool } from "@langchain/core/tools";
import { ChatGroq } from "@langchain/groq";
import * as z from "zod";
import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { BaseMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";

const AgentState = Annotation.Root({
    messages: Annotation({
        reducer: (old, update) => old.concat(update),
        default: () => []
    }),
    stepsCount: Annotation({
        reducer: (old, newState) => newState,
        default: () => 0
    })
})

const llm = new ChatGroq({
    model: "openai/gpt-oss-120b",
    temperature: 0,
    maxTokens: undefined,
    maxRetries: 2
})

const MultiplyTool = tool(
    async({a,b}) => {
        return String(a*b);
    },
    {
        name: "multiply",
        description : "Multiply 2 numbers",
        schema: z.object({
            a: z.number(),
            b: z.number()
        })
    }
)

const llmWithTools = llm.bindTools([MultiplyTool]);

const AgentNode = async(state) => {
    const messages = state.messages;
    const query = messages[0].content;
    const aiResponse = await llmWithTools.invoke(messages);
    return { messages:  [aiResponse] };
}

const isToolCall = async(state) => {
    const messages = state.messages;
    const lastMessage = messages[messages.length -1];

    if(lastMessage?.tool_calls && lastMessage?.tool_calls.length>0){
        return "tools"
    }
    return "end";
}

const toolNode = new ToolNode([MultiplyTool]);

const graph = new StateGraph(AgentState)
                .addNode("agent", AgentNode)
                .addNode("tools", toolNode)
                .addEdge(START, "agent")
                .addConditionalEdges("agent",isToolCall, {
                    tools: "tools",
                    end: END
                })
                .addEdge("tools","agent").compile();

const response = await graph.invoke({
    messages: [ new HumanMessage("Multiply 2 number 2 and 9, explicitly use tool that is for this.")]
})

console.log(response);