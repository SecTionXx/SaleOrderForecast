import fastapi
import pydantic
import pydantic_settings
import uvicorn

def main():
    print(f"FastAPI version: {fastapi.__version__}")
    print(f"Pydantic version: {pydantic.__version__}")
    print(f"Pydantic Settings version: {pydantic_settings.__version__}")
    print(f"Uvicorn version: {uvicorn.__version__}")
    
    # Try to create a simple Pydantic model
    from pydantic import BaseModel
    
    class SimpleModel(BaseModel):
        name: str
        value: int
    
    # Test the model
    try:
        model = SimpleModel(name="test", value=42)
        print(f"\n✅ Successfully created Pydantic model: {model}")
    except Exception as e:
        print(f"\n❌ Error creating Pydantic model: {e}")
    
    # Test FastAPI app creation
    try:
        app = fastapi.FastAPI()
        print("\n✅ Successfully created FastAPI app")
    except Exception as e:
        print(f"\n❌ Error creating FastAPI app: {e}")

if __name__ == "__main__":
    main()
