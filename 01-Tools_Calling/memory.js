import { ChatGroq } from "@langchain/groq";
import { StateGraph, Annotation } from "@langchain/langgraph";
import { MemorySaver } from "@langchain/langgraph";

const AgentState = Annotation.Root({
  messages: Annotation({
    reducer: (x, y) => x.concat(y), 
    default: () => [],
  }),
});

const llm = new ChatGroq({
    model: "openai/gpt-oss-120b",
    temperature: 0,
    maxRetries: 2,
    maxTokens: undefined
})
async function chatbotNode(state) {
  console.log("\n--- Agent is processing ---");
  const lastMessage = state.messages[state.messages.length - 1];
  
  const response = await llm.invoke(state.messages);

  return {
    messages: [response]
  }
}

const workflow = new StateGraph(AgentState)
  .addNode("chatbot", chatbotNode)
  .addEdge("__start__", "chatbot");


const checkpointer = new MemorySaver();

const app = workflow.compile({ checkpointer });

async function run() {
  const configUserA = { configurable: { thread_id: "user-abc-123" } };
  const configUserB = { configurable: { thread_id: "user-xyz-789" } };

  console.log("--- User A speaks ---");
  let response = await app.invoke({ messages: ["Hi, my name is Alice."] }, configUserA);
  console.log("Agent to A:", response.messages[response.messages.length - 1].content);

  console.log("\n--- User B speaks ---");
  response = await app.invoke({ messages: ["Hello, I am Bob."] }, configUserB);
  console.log("Agent to B:", response.messages[response.messages.length - 1].content);

  console.log("\n--- User A returns ---");
  response = await app.invoke({ messages: ["What is my name again?"] }, configUserA);
  console.log("Agent to A:", response.messages[response.messages.length - 1].content);
}

run();