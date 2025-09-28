from advanced_research import AdvancedResearch
from dotenv import load_dotenv

load_dotenv()

# Initialize the research system
research_system = AdvancedResearch(
    name="AI Research Team",
    description="Specialized AI research system",
    director_model_name="gemini/gemini-2.5-flash",  # Use latest Claude model

    worker_model_name="gemini/gemini-2.5-flash",
    max_loops=1,
)

# Run research and get results
result = research_system.run(
    "What are the latest developments in quantum computing?"
)
print(result)