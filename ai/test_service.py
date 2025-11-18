"""
Test script for AI service
Tests the process_file_with_prompt function with a CV file and parse_resume prompt
"""
import os
import json
from pathlib import Path
from service import process_file_with_prompt

# Try to load .env file if python-dotenv is available
try:
    from dotenv import load_dotenv
    # Load .env from project root (parent of ai folder)
    env_path = Path(__file__).parent.parent / '.env'
    if env_path.exists():
        load_dotenv(env_path)
        print(f"✅ Loaded environment variables from {env_path}")
    else:
        print(f"ℹ️  .env file not found at {env_path}")
        print("   You can create it or set environment variables manually")
except ImportError:
    # python-dotenv not installed, user must set env vars manually
    pass


def main():
    """Main test function"""
    # Get the directory where this file is located
    current_dir = Path(__file__).parent
    
    # Set up file paths
    cv_file = current_dir / "CV_files/Pe-CV2.pdf"
    prompt_name = "parse_resume"
    
    # Check if CV file exists
    if not cv_file.exists():
        print(f"❌ Error: CV file not found at {cv_file}")
        return
    
    # Check if OPENROUTER_API_KEY is set
    api_key = os.getenv('OPENROUTER_API_KEY')
    if not api_key:
        print("❌ Error: OPENROUTER_API_KEY is not set in environment variables")
        print()
        print("   You can set it in one of these ways:")
        print("   1. Create a .env file in the project root with:")
        print("      OPENROUTER_API_KEY=your-api-key-here")
        print()
        print("   2. Export it in your terminal:")
        print("      export OPENROUTER_API_KEY='your-api-key'")
        print()
        print("   3. Set it when running the script:")
        print("      OPENROUTER_API_KEY='your-api-key' python test_service.py")
        return
    
    print("=" * 70)
    print("🧪 Testing AI Service")
    print("=" * 70)
    print(f"📄 CV File: {cv_file}")
    print(f"📝 Prompt: {prompt_name}")
    print(f"🔑 API Key: {'*' * (len(api_key) - 4) + api_key[-4:] if len(api_key) > 4 else '****'}")
    print("=" * 70)
    print()
    
    # Parse command line arguments
    import argparse
    
    parser = argparse.ArgumentParser(description='Test AI service with resume parsing')
    parser.add_argument('model', nargs='?', default='anthropic/claude-3.5-sonnet',
                       help='LLM model name (default: anthropic/claude-3.5-sonnet)')
    parser.add_argument('--pdf-engine', choices=['pdf-text', 'mistral-ocr', 'native'],
                       help='PDF processing engine for OpenRouter')
    
    args = parser.parse_args()
    
    model = args.model
    pdf_engine = args.pdf_engine
    
    print(f"🤖 Using model: {model}")
    print("📄 Sending file directly to OpenRouter (PDF as base64, DOCX as text)")
    if pdf_engine:
        print(f"📄 PDF engine: {pdf_engine}")
    print()
    
    try:
        print("⏳ Processing CV file with OpenRouter API...")
        print("   This may take a few moments...")
        print()
        
        # Process the file with the prompt
        result = process_file_with_prompt(
            file_path=str(cv_file),
            prompt_name=prompt_name,
            model=model,
            pdf_engine=pdf_engine,
            temperature=0.7,
            max_tokens=4000,
            response_format={"type": "json_object"}
        )
        
        print("✅ Success! Response received from OpenRouter")
        print()
        print("=" * 70)
        print("📊 Results:")
        print("=" * 70)
        print()
        
        # Pretty print the JSON result
        if isinstance(result, dict):
            print(json.dumps(result, ensure_ascii=False, indent=2))
        else:
            print(result)
        
        print()
        print("=" * 70)
        
        # Optionally save to file
        output_file = current_dir / "test_output.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        print(f"💾 Results saved to: {output_file}")
        
    except FileNotFoundError as e:
        print(f"❌ File Error: {e}")
    except ValueError as e:
        print(f"❌ Configuration Error: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        print("\n📋 Full traceback:")
        traceback.print_exc()


if __name__ == "__main__":
    main()

