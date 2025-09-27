from swarms import Agent
from dotenv import load_dotenv
import os
import fastapi

load_dotenv()

# Create a basic financial advisor agent
financial_agent = Agent(
    agent_name="Financial-Advisor",
    agent_description="Personal finance and investment advisor",
    system_prompt="""You are an expert financial advisor with deep knowledge of:
    - Investment strategies and portfolio management
    - Risk assessment and mitigation
    - Market analysis and trends
    - Financial planning and budgeting

    Provide clear, actionable advice while considering risk tolerance.""",
    model_name="gemini/gemini-2.5-flash",
    max_loops=50,
    temperature=0.3,
    output_type="str",
    interactive=True
)

# Run the agent
response = financial_agent.run("What are the best investment strategies for a 30-year-old?")
print(response)