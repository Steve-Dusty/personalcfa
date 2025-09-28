"""
FastAPI backend for Personal CFA with Swarms integration
Uses Swarms framework for multi-agent AI with Exa search capabilities
"""

import os
import asyncio
import json
from typing import Dict, Any
from datetime import datetime

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

# Import Swarms for hierarchical agentic AI
try:
    from swarms import Agent
    from swarms.structs.hiearchical_swarm import HierarchicalSwarm
    from swarms_tools import exa_search
    print("✅ Swarms and Exa tools imported successfully")
except ImportError as e:
    print(f"❌ Failed to import Swarms/Exa: {e}")
    print("Installing required packages...")
    os.system("pip install -U swarms swarms-tools")
    try:
        from swarms import Agent
        from swarms.structs.hiearchical_swarm import HierarchicalSwarm
        from swarms_tools import exa_search
        print("✅ Swarms and Exa tools imported after installation")
    except ImportError as e2:
        print(f"❌ Still failed to import after installation: {e2}")
        # Continue without swarms for now
        Agent = None
        HierarchicalSwarm = None
        exa_search = None

# Pydantic models
class ChatMessage(BaseModel):
    message: str
    context: Dict[str, Any] = {}

class ChatResponse(BaseModel):
    response: str
    session_id: str = "default"
    timestamp: str = ""

# FastAPI app
app = FastAPI(title="Personal CFA Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SimpleFinancialOrchestrator:
    """Simple orchestrator - questionnaire + main agent + summarization agent"""
    
    def __init__(self):
        if not Agent:
            raise Exception("Swarms not available")
            
        self.questionnaire_agent = Agent(
            agent_name="Questionnaire-Agent",
            system_prompt="""You are a smart questionnaire agent for financial advice.

            Your job: Determine if the user's query needs personal information to give good advice.

            Rules:
            - General questions (stock prices, market info) = NO questions needed
            - Personal advice (portfolio, retirement, risk) = ASK 2-3 key questions
            - Be conversational and friendly
            - Only ask what's essential for their specific question

            Respond with either:
            1. {"need_info": false, "reason": "General question, no personal info needed"}
            2. {"need_info": true, "questions": ["What's your age range?", "What's your risk tolerance?"]}

            Keep questions short and relevant to their query.""",
            model_name="gemini/gemini-2.5-flash",
            max_loops=1,
            verbose=False
        )
        
        self.main_agent = Agent(
            agent_name="Financial-Assistant",
            system_prompt="""You are a helpful financial assistant with access to real-time web search. 

            Your job is to answer the specific question the user asks you. 
            
            - If they ask about stocks, give stock advice and use exa_search to get latest news/data
            - If they ask about investing, give investing advice  
            - If they just say "hi" or "hello", greet them back and ask what they need help with
            - If they ask about a specific ticker, use exa_search to get current info and provide analysis
            - When searching, use queries like "AAPL stock analysis 2024" or "Tesla earnings news"
            
            Be conversational, helpful, and direct. Don't repeat previous conversations.
            Focus ONLY on their current question.
            
            IMPORTANT: Use the exa_search tool when you need current market data, news, or analysis.""",
            model_name="gemini/gemini-2.5-flash",
            max_loops=1,
            output_type="final",
            verbose=False,
        )
        
        self.summarizer = Agent(
            agent_name="Summarizer",
            system_prompt="""You are a friendly financial assistant talking directly to the user in a chat.

            Take the detailed financial analysis and turn it into a conversational response as if you're chatting with the user.

            Guidelines:
            - Speak directly to the user ("Here's what I found for you...")
            - Use conversational tone, not formal analysis
            - Include key insights in an easy-to-read format
            - Make it personal and helpful
            - Keep under 100 words
            - Use bullet points or short paragraphs
            - End with something actionable or helpful

            Example tone: "Based on your question about AAPL, here's what I discovered..." """,
            model_name="gemini/gemini-2.5-flash",
            max_loops=1,
            output_type="final",
            verbose=False
        )
        
        # Simple conversation memory
        self.conversation_memory = {}
    
    def add_to_memory(self, session_id: str, query: str, response: dict):
        """Add conversation to memory for context"""
        if session_id not in self.conversation_memory:
            self.conversation_memory[session_id] = []
        
        context_entry = {
            'timestamp': datetime.now().isoformat(),
            'query': query,
            'response_type': response.get('type'),
            'summary': response.get('content', '')[:200] + '...' if len(response.get('content', '')) > 200 else response.get('content', '')
        }
        
        self.conversation_memory[session_id].append(context_entry)
        
        # Keep only last 10 conversations per session
        if len(self.conversation_memory[session_id]) > 10:
            self.conversation_memory[session_id] = self.conversation_memory[session_id][-10:]
        
    def run(self, query: str, session_id: str = "default", existing_profile: dict = None):
        """3-step process: Questionnaire check → Main agent → Summarizer"""
        
        print(f"❓ Step 1: Checking if questions needed for: {query}")
        
        try:
            # IMPORTANT: Clear agent memories to prevent accumulation
            try:
                print("🧹 Aggressively clearing all agent memories...")
                for agent_name, agent in [("Questionnaire", self.questionnaire_agent), ("Main", self.main_agent), ("Summarizer", self.summarizer)]:
                    print(f"  🔄 Clearing {agent_name} agent...")
                    
                    # Clear all possible memory locations
                    memory_fields = ['short_term_memory', 'memory', 'conversation', 'long_term_memory', 'working_memory']
                    for field in memory_fields:
                        if hasattr(agent, field) and getattr(agent, field):
                            memory_obj = getattr(agent, field)
                            if hasattr(memory_obj, 'clear'):
                                memory_obj.clear()
                            elif hasattr(memory_obj, 'conversation_history'):
                                memory_obj.conversation_history = []
                            elif isinstance(memory_obj, list):
                                memory_obj.clear()
                    
                    # Reset specific conversation attributes
                    if hasattr(agent, 'messages'):
                        agent.messages = []
                    if hasattr(agent, 'chat_history'):
                        agent.chat_history = []
                    if hasattr(agent, 'conversation_history'):
                        agent.conversation_history = []
                    
                print("✅ All agent memories aggressively cleared")
            except Exception as e:
                print(f"⚠️ Error clearing memories: {e}")
                import traceback
                traceback.print_exc()
            
            # Step 1: Check if we need to ask questions
            questionnaire_response = self.questionnaire_agent.run(f"User query: {query}")
            print(f"✅ Step 1 complete: {questionnaire_response}")
            
            # Try to parse the questionnaire response
            import json
            try:
                questionnaire_data = json.loads(questionnaire_response)
                if questionnaire_data.get("need_info", False):
                    # Return questions to the user
                    return {
                        "type": "questions",
                        "questions": questionnaire_data.get("questions", []),
                        "message": "I'd like to give you personalized advice. Could you help me with a few quick questions?",
                        "session_id": session_id
                    }
            except:
                # If JSON parsing fails, continue with normal flow
                print("⚠️ Could not parse questionnaire response, continuing...")
            
            # Step 2: Get detailed response from main agent
            print(f"💬 Step 2: Getting detailed analysis for: {query}")
            user_context = f"User profile: {existing_profile}" if existing_profile else "No user profile available"
            
            # Create a fresh prompt for this specific query only
            fresh_prompt = f"Answer this financial question: {query}\n\nContext: {user_context}\n\nProvide a clear, helpful response focused only on this question."
            
            detailed_response = self.main_agent.run(f"{fresh_prompt} {exa_search(query=fresh_prompt)}")
            print(f"✅ Step 2 complete: {len(detailed_response)} characters")
            
            # Step 3: Extract key points and make conversational
            print("📝 Step 3: Creating conversational response...")
            print("🔄 Processing response through summarizer agent...")
            
            # Smart extraction: Take only the most relevant parts
            lines = detailed_response.split('\n')
            important_lines = []
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                # Skip repeated questions or analysis headers
                if 'User asked:' in line or 'Here\'s the detailed analysis' in line or 'Query:' in line:
                    continue
                # Keep actual content
                if len(line) > 10:  # Ignore very short lines
                    important_lines.append(line)
            
            # Take only the last 8 important lines to avoid old conversation
            recent_content = '\n'.join(important_lines[-8:])
            
            summary_prompt = f"""
            User question: "{query}"
            
            Raw content to convert:
            {recent_content}
            
            Convert this into a friendly chat response. Rules:
            1. Answer their question directly
            2. Use conversational tone ("Here's what I found...")
            3. Max 2-3 sentences 
            4. No analysis headers or metadata
            5. Complete your thoughts - don't cut off mid-sentence
            """
            
            summary = self.summarizer.run(summary_prompt)
            print(f"✅ Step 3 complete: {len(summary)} characters")
            
            # Clean up the summary - remove any analysis artifacts
            summary_lines = summary.split('\n')
            clean_lines = []
            for line in summary_lines:
                line = line.strip()
                if not line:
                    continue
                # Skip any remaining analysis artifacts
                if 'User asked:' in line or 'Here\'s the content' in line or 'Requirements:' in line:
                    continue
                clean_lines.append(line)
            
            final_summary = '\n'.join(clean_lines)
            
            # Final length check - be less aggressive
            if len(final_summary) > 800:
                print(f"⚠️ Summary very long ({len(final_summary)} chars), truncating...")
                final_summary = final_summary[:700] + "..."
            
            return {
                "type": "response",
                "content": final_summary,
                "session_id": session_id,
                "original_length": len(detailed_response),
                "summary_length": len(final_summary)
            }
            
        except Exception as e:
            import traceback
            print(f"❌ Error: {e} Traceback: {traceback.format_exc()}")

# Global orchestrator instance
financial_orchestrator = None

def initialize_financial_swarm():
    """Initialize the financial orchestrator"""
    global financial_orchestrator
    if financial_orchestrator is None:
        financial_orchestrator = SimpleFinancialOrchestrator()
        print("🚀 Financial Orchestrator initialized")
    return financial_orchestrator

@app.on_event("startup")
async def startup_event():
    """Initialize the financial orchestrator on startup"""
    try:
        print("🚀 Starting Personal CFA Backend")
        
        # Check environment variables
        api_keys = {
            "EXA_API_KEY": os.getenv("EXA_API_KEY"),
            "GOOGLE_API_KEY": os.getenv("GOOGLE_API_KEY"),
            "OPENAI_API_KEY": os.getenv("OPENAI_API_KEY"),
        }
        
        print("📊 Environment check:")
        for key, value in api_keys.items():
            if value:
                print(f"  ✅ {key}: Set")
            else:
                print(f"  ⚠️ {key}: Not set")
        
        # Initialize orchestrator
        initialize_financial_swarm()
        print("✅ Backend startup complete")
        
    except Exception as e:
        print(f"❌ Startup error: {e}")

@app.get("/")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "running",
        "service": "Personal CFA Backend",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

@app.post("/chat")
async def chat_endpoint(chat_message: ChatMessage):
    """Synchronous chat endpoint"""
    try:
        orchestrator = initialize_financial_swarm()
        
        # Extract user profile from context if available
        user_profile = chat_message.context.get('user_profile', {})
        session_id = chat_message.context.get('session_id', 'default')
        
        # Run the orchestrator
        result = orchestrator.run(
            query=chat_message.message,
            session_id=session_id,
            existing_profile=user_profile
        )
        
        # Add to memory
        orchestrator.add_to_memory(session_id, chat_message.message, result)
        
        return {
            "content": result.get("content", ""),
            "type": result.get("type", "response"),
            "session_id": session_id,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

@app.post("/chat/stream")
async def chat_stream(chat_message: ChatMessage):
    """Streaming chat endpoint for real-time responses"""
    
    async def generate_stream():
        try:
            orchestrator = initialize_financial_swarm()
            
            # Extract user profile from context if available
            user_profile = chat_message.context.get('user_profile', {})
            session_id = chat_message.context.get('session_id', 'default')
            
            # Send initial status
            yield f"data: {json.dumps({'type': 'status', 'content': '🔍 Query Classifier analyzing your request...', 'done': False})}\n\n"
            await asyncio.sleep(0.2)
            
            yield f"data: {json.dumps({'type': 'status', 'content': '🧠 Determining data requirements...', 'done': False})}\n\n"
            await asyncio.sleep(0.2)
            
            yield f"data: {json.dumps({'type': 'status', 'content': '📊 Research Analyst gathering market data...', 'done': False})}\n\n"
            await asyncio.sleep(0.2)
            
            yield f"data: {json.dumps({'type': 'status', 'content': '🎯 Generating intelligent response...', 'done': False})}\n\n"
            await asyncio.sleep(0.2)
            
            # Run the adaptive orchestrator
            result = orchestrator.run(
                query=chat_message.message,
                session_id=session_id,
                existing_profile=user_profile
            )
            
            yield f"data: {json.dumps({'type': 'status', 'content': '✅ Analysis complete, streaming response...', 'done': False})}\n\n"
            await asyncio.sleep(0.1)
            
            # Handle different response types
            if result["type"] == "questions":
                # Stream questionnaire flow
                yield f"data: {json.dumps({'type': 'status', 'content': '❓ Checking if I need more info...', 'done': False})}\n\n"
                await asyncio.sleep(0.1)
                
                # Stream need_info = true
                yield f"data: {json.dumps({'type': 'token', 'content': 'need_info: true', 'done': False, 'need_info': True})}\n\n"
                await asyncio.sleep(0.1)
                
                # Stream the message
                message_text = result.get('message', 'I need some information to help you better.')
                yield f"data: {json.dumps({'type': 'token', 'content': message_text, 'done': False})}\n\n"
                await asyncio.sleep(0.1)
                
                # Stream each question individually
                questions = result.get('questions', [])
                for i, question in enumerate(questions):
                    yield f"data: {json.dumps({'type': 'token', 'content': f'Question {i+1}: {question}', 'done': False, 'question': question})}\n\n"
                    await asyncio.sleep(0.1)
                
                # Send completion signal for questions
                final_chunk = {
                    "type": "done",
                    "content": f"{message_text}\n\n" + "\n".join([f"• {q}" for q in questions]),
                    "done": True,
                    "need_info": True,
                    "questions": questions,
                    "session_id": session_id,
                    "timestamp": datetime.now().isoformat()
                }
                yield f"data: {json.dumps(final_chunk)}\n\n"
                
            else:
                # Stream regular response
                content = result.get("content", "I'm here to help with your financial questions!")
                
                # Simulate typing by streaming words
                words = content.split()
                accumulated_content = ""
                
                for i, word in enumerate(words):
                    accumulated_content += word + " "
                    
                    chunk = {
                        "type": "token",
                        "content": accumulated_content.strip(),
                        "done": False,
                        "word": word,
                        "progress": (i + 1) / len(words)
                    }
                    yield f"data: {json.dumps(chunk)}\n\n"
                    await asyncio.sleep(0.05)  # Simulate typing speed
                
                # Send final completion
                final_chunk = {
                    "type": "done",
                    "content": content,
                    "done": True,
                    "session_id": session_id,
                    "timestamp": datetime.now().isoformat(),
                    "original_length": result.get("original_length", 0),
                    "summary_length": result.get("summary_length", 0)
                }
                yield f"data: {json.dumps(final_chunk)}\n\n"
            
            # Add to memory
            orchestrator.add_to_memory(session_id, chat_message.message, result)
            
        except Exception as e:
            error_chunk = {
                "type": "error",
                "content": f"Sorry, I encountered an error: {str(e)}",
                "done": True,
                "error": str(e)
            }
            yield f"data: {json.dumps(error_chunk)}\n\n"
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream"
        }
    )

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Personal CFA Backend")
    print("📍 Running on http://localhost:8000")
    print("📖 Docs available at http://localhost:8000/docs")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)
