from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Notes Summarization Service", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:5173,http://localhost:5174').split(','),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize AI Models (lazy loading)
huggingface_available = False
gemini_available = False
summarizer = None
gemini_model = None

def load_huggingface():
    """Lazy load HuggingFace model only when needed"""
    global summarizer, huggingface_available
    if not huggingface_available:
        try:
            from transformers import pipeline
            logger.info("Loading HuggingFace BART model...")
            summarizer = pipeline("summarization", model="facebook/bart-large-cnn", device=-1)
            huggingface_available = True
            logger.info("HuggingFace BART summarization model loaded successfully")
        except Exception as e:
            logger.warning(f"Could not load HuggingFace: {e}")
            huggingface_available = False
    return huggingface_available

def load_gemini():
    """Lazy load Gemini model only when needed"""
    global gemini_model, gemini_available
    if not gemini_available:
        try:
            api_key = os.getenv('GEMINI_API_KEY')
            if api_key:
                import google.generativeai as genai
                genai.configure(api_key=api_key)
                gemini_model = genai.GenerativeModel('gemini-1.5-flash')
                gemini_available = True
                logger.info("Gemini AI loaded successfully")
            else:
                logger.warning("No Gemini API key found")
        except Exception as e:
            logger.warning(f"Could not load Gemini AI: {e}")
            gemini_available = False
    return gemini_available

class SummarizeRequest(BaseModel):
    text: str
    max_length: int = 150

class SummarizeResponse(BaseModel):
    summary: str
    ai_model: str

@app.get("/")
async def root():
    return {"message": "AI Notes Summarization Service", "status": "running"}

@app.get("/health")
async def health_check():
    # Try to load models to check availability
    gemini_status = load_gemini()
    hf_status = load_huggingface()
    
    return {
        "status": "healthy", 
        "primary_ai": "gemini" if gemini_status else "huggingface" if hf_status else "smart-truncation",
        "gemini_loaded": gemini_status,
        "huggingface_loaded": hf_status
    }

@app.post("/summarize", response_model=SummarizeResponse)
async def summarize_text(request: SummarizeRequest):
    try:
        text = request.text.strip()
        
        # Only use AI for longer texts
        if len(text) < 50:
            return SummarizeResponse(summary=text, ai_model="simple-truncation")
        
        # 1. Try Gemini first (Primary AI - Fast, professional)
        if load_gemini():
            try:
                prompt = f"Summarize this text in {request.max_length} characters or less, preserving key information: {text}"
                response = gemini_model.generate_content(prompt)
                ai_summary = response.text.strip()
                
                # Apply smart truncation
                if len(ai_summary) > request.max_length:
                    ai_summary = smart_truncate(ai_summary, request.max_length)
                    return SummarizeResponse(summary=ai_summary, ai_model="gemini-truncated")
                else:
                    return SummarizeResponse(summary=ai_summary, ai_model="gemini")
                    
            except Exception as e:
                logger.warning(f"Gemini AI failed, trying HuggingFace: {e}")
        
        # 2. Try HuggingFace as backup (Reliable, no API key needed)
        if load_huggingface():
            try:
                # HuggingFace works better with longer texts
                if len(text) > 100:
                    # Split very long texts for HuggingFace
                    max_chunk_length = 1024
                    if len(text) > max_chunk_length:
                        chunks = [text[i:i+max_chunk_length] for i in range(0, len(text), max_chunk_length)]
                        summaries = []
                        for chunk in chunks[:2]:  # Limit to first 2 chunks
                            result = summarizer(chunk, max_length=min(130, request.max_length), min_length=30, do_sample=False)
                            summaries.append(result[0]['summary_text'])
                        ai_summary = ' '.join(summaries)
                    else:
                        result = summarizer(text, max_length=min(130, request.max_length), min_length=30, do_sample=False)
                        ai_summary = result[0]['summary_text']
                    
                    # Apply smart truncation to fit max_length
                    if len(ai_summary) > request.max_length:
                        ai_summary = smart_truncate(ai_summary, request.max_length)
                        return SummarizeResponse(summary=ai_summary, ai_model="huggingface-truncated")
                    else:
                        return SummarizeResponse(summary=ai_summary, ai_model="huggingface")
                        
            except Exception as e:
                logger.warning(f"HuggingFace failed, using fallback: {e}")
        
        # 3. Fallback: Smart text summarization
        summary = smart_truncate(text, request.max_length)
        return SummarizeResponse(summary=summary, ai_model="smart-truncation")
    
    except Exception as e:
        logger.error(f"Error during summarization: {e}")
        raise HTTPException(status_code=500, detail="Summarization failed")

def smart_truncate(text: str, max_length: int) -> str:
    """
    Smart truncation that never cuts words in half.
    Always ends at complete word boundaries.
    """
    if len(text) <= max_length:
        return text
    
    # Reserve space for "..."
    available_length = max_length - 3
    
    # Find the last complete word within the limit
    words = text.split()
    truncated_words = []
    current_length = 0
    
    for word in words:
        # +1 for the space between words
        word_length = len(word) + (1 if truncated_words else 0)
        
        if current_length + word_length <= available_length:
            truncated_words.append(word)
            current_length += word_length
        else:
            break
    
    if not truncated_words:
        # If even the first word is too long, truncate it
        return text[:available_length] + "..."
    
    # Join words and add "..."
    result = ' '.join(truncated_words)
    
    # Ensure we don't exceed max_length
    if len(result) > available_length:
        result = result[:available_length]
        # Find the last complete word again
        last_space = result.rfind(' ')
        if last_space > 0:
            result = result[:last_space]
    
    return result + "..."

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
