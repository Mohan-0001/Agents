import "dotenv/config"
import { ChatGroq } from "@langchain/groq"
import { tool } from "@langchain/core/tools";
import { HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import * as z from "zod"

const llm = new ChatGroq({
    model: "openai/gpt-oss-120b",
    temperature: 0,
    maxTokens: undefined,
    maxRetries: 2
})

const multiplyTool = tool(
    async({a,b}) => {
        return String(a*b);
    },{
        name: "multiply",
        description : "Multiply 2 numbers",
        schema: z.object({
            a: z.number(),
            b: z.number()
        })
    }
)


// const response = await llm.invoke([
//  {
//    role:"user",
//    content:"What is Binary Search?"
//  },
//  {
//    role:"assistant",
//    content:"Binary Search works on sorted arrays."
//  }
// ])

// const response =  await llm.invoke([
//     new HumanMessage("What is Binary Search"),
//     new SystemMessage("Binary Search works on sorted arrays")
// ])


const llmwithTools = llm.bindTools([multiplyTool]);

const query = "What is the result of multiplying 2 with 9, use tool multiply explicitly for tool coaaling output";

const response = await llmwithTools.invoke(query);
console.log(response);
console.log("=======================================================================================")

let toolAnswer = "";
let finalAnswer ;
if(response.tool_calls && response.tool_calls.length >0){
    toolAnswer = await multiplyTool.invoke(response.tool_calls[0].args);
    finalAnswer = await llmwithTools.invoke([
        new HumanMessage(query),
        response,
        new ToolMessage({
            content: toolAnswer,
            tool_call_id : response.tool_calls[0].id
        })
    ]);
    console.l
    console.log(finalAnswer); 

}

// const res = await llmwithTools.invoke(toolAnswer);
// console.log(response);
