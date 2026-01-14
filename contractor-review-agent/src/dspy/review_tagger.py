"""
DSPy Review Tagger Prototype

This module implements a DSPy-based review tagging system that uses
BootstrapFewShot optimization to find optimal few-shot examples.

Usage:
    python review_tagger.py --optimize      # Run optimization
    python review_tagger.py --evaluate      # Evaluate current model
    python review_tagger.py --test          # Test on a single review
"""

import os
import json
import argparse
from typing import Literal
from dotenv import load_dotenv

import dspy
from dspy import InputField, OutputField, Signature
from dspy.teleprompt import BootstrapFewShot
from pydantic import BaseModel, Field

# Load environment variables
load_dotenv()

# =============================================================================
# Data Models (Pydantic for type safety)
# =============================================================================

class ReviewAnalysis(BaseModel):
    """Structured output for review analysis."""
    detected_services: list[str] = Field(default_factory=list, description="Services explicitly mentioned")
    sentiment: Literal["positive", "negative", "neutral", "mixed"] = Field(description="Overall sentiment")
    sentiment_score: float = Field(ge=-1.0, le=1.0, description="Sentiment score from -1 to 1")
    themes: list[str] = Field(default_factory=list, description="Key themes discussed")
    project_type: Literal["repair", "maintenance", "consultation", "new_construction"] | None = Field(
        default=None, description="Type of project"
    )
    mentions_price: bool = Field(description="Whether pricing is mentioned")
    mentions_timeline: bool = Field(description="Whether timing/scheduling is mentioned")
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence in analysis")


# =============================================================================
# DSPy Signature (defines the task interface)
# =============================================================================

class ReviewTaggingSignature(Signature):
    """Extract structured information from a contractor review.

    You are analyzing contractor reviews for a chimney/fireplace service company.
    Extract structured data following these rules:

    - detected_services: ONLY services explicitly mentioned. Use empty list if none.
    - sentiment_score: Use realistic range 0.7-0.95 for positive reviews. Never 1.0.
    - project_type: "maintenance" for cleaning, "consultation" for teaching/advice, "repair" for fixing.
    - mentions_price: TRUE if mentions "free", cost, pricing, quotes, estimates.
    - mentions_timeline: TRUE if mentions "on time", "quickly", "same day", "prompt", "next season".
    """

    review_text: str = InputField(desc="The contractor review text to analyze")
    rating: int = InputField(desc="Star rating (1-5)")
    reviewer_name: str = InputField(desc="Name of the reviewer")

    detected_services: list[str] = OutputField(desc="List of services explicitly mentioned in the review")
    sentiment: str = OutputField(desc="Overall sentiment: positive, negative, neutral, or mixed")
    sentiment_score: float = OutputField(desc="Sentiment score from -1 (very negative) to 1 (very positive)")
    themes: list[str] = OutputField(desc="Key themes like 'professional', 'on time', 'quality work'")
    project_type: str = OutputField(desc="Type: repair, maintenance, consultation, new_construction, or null")
    mentions_price: bool = OutputField(desc="True if review mentions pricing, free services, or cost")
    mentions_timeline: bool = OutputField(desc="True if review mentions timing, scheduling, or punctuality")
    confidence: float = OutputField(desc="Confidence in this analysis from 0 to 1")


# =============================================================================
# DSPy Module (implements the tagging logic)
# =============================================================================

class ReviewTagger(dspy.Module):
    """DSPy module for review tagging with Chain-of-Thought reasoning."""

    def __init__(self):
        super().__init__()
        # Use ChainOfThought for better reasoning on ambiguous cases
        self.tagger = dspy.ChainOfThought(ReviewTaggingSignature)

    def forward(self, review_text: str, rating: int = 5, reviewer_name: str = "Unknown"):
        """Tag a single review."""
        result = self.tagger(
            review_text=review_text,
            rating=rating,
            reviewer_name=reviewer_name
        )
        return result


# =============================================================================
# Training Data (Ground Truth)
# =============================================================================

TRAINING_DATA = [
    {
        "review_text": "Mac was great. Prompt and professional. I'd honestly thought my fireplace was beyond help but he put in the time to get it cleaned and ready for the season. I highly recommend and will call again.",
        "rating": 5,
        "reviewer_name": "Johnny Figueroa",
        # Ground truth
        "detected_services": ["fireplace cleaning"],
        "sentiment": "positive",
        "sentiment_score": 0.85,
        "themes": ["professional", "prompt", "thorough"],
        "project_type": "maintenance",
        "mentions_price": False,
        "mentions_timeline": True,  # "ready for the season", "prompt"
        "confidence": 0.9
    },
    {
        "review_text": "Booked a simple fireplace cleaning and inspection for my wood burning fireplace. With this being a recently purchased home, I expected soot and a cracked liner, but instead got wildlife. Mace found a raccoon living in my chimney like it was an Airbnb with a five-month lease. He handled the removal like a pro, got everything cleaned up, and now I can finally use my fireplace raccoon-free and ready for winter. Would 100% call again!",
        "rating": 5,
        "reviewer_name": "Victor Lebegue",
        "detected_services": ["fireplace cleaning", "inspection", "wildlife removal"],
        "sentiment": "positive",
        "sentiment_score": 0.95,
        "themes": ["professional", "thorough", "problem-solver"],
        "project_type": "repair",  # Wildlife removal is a repair
        "mentions_price": False,
        "mentions_timeline": False,
        "confidence": 0.95
    },
    {
        "review_text": "Photos and honest information on the chimney cleaning. Very efficient and super with cleaning up. Will use them again.",
        "rating": 5,
        "reviewer_name": "Paula Weaver",
        "detected_services": ["chimney cleaning"],
        "sentiment": "positive",
        "sentiment_score": 0.85,
        "themes": ["efficient", "transparent", "clean"],
        "project_type": "maintenance",
        "mentions_price": False,
        "mentions_timeline": False,
        "confidence": 0.9
    },
    {
        "review_text": "Mace did an excellent job! We were so impressed with his professionalism and knowledge. He took care of the maintenance needed same day as the free inspection, making it incredibly easy - we now have a functional fireplace ready for the winter!",
        "rating": 5,
        "reviewer_name": "Kayla",
        "detected_services": ["maintenance", "inspection"],
        "sentiment": "positive",
        "sentiment_score": 0.95,
        "themes": ["professional", "knowledgeable", "efficient"],
        "project_type": "maintenance",
        "mentions_price": True,   # "free inspection"
        "mentions_timeline": True,  # "same day"
        "confidence": 0.95
    },
    {
        "review_text": "This was my first time using CrownUp and they met all my expectations. Mace arrived right on time and did an excellent job. He addressed all my concerns. He was also wonderful with my dog.",
        "rating": 5,
        "reviewer_name": "Dusty Slaten",
        "detected_services": [],  # No specific service mentioned
        "sentiment": "positive",
        "sentiment_score": 0.85,
        "themes": ["punctual", "attentive", "friendly"],
        "project_type": None,  # Unknown
        "mentions_price": False,
        "mentions_timeline": True,  # "right on time"
        "confidence": 0.85
    },
    {
        "review_text": "Eli showed up and got to work quickly and explained in detail everything about the process of the work to be done and kept me informed every step of work process\nVery professional and courteous!\nDid a great job",
        "rating": 5,
        "reviewer_name": "Herb Hoover",
        "detected_services": [],  # No specific service named
        "sentiment": "positive",
        "sentiment_score": 0.9,
        "themes": ["professional", "courteous", "communicative"],
        "project_type": None,
        "mentions_price": False,
        "mentions_timeline": True,  # "quickly"
        "confidence": 0.85
    },
    {
        "review_text": "Mace came out and was great - went above and beyond and even showed me how to work our fire place in our new house",
        "rating": 5,
        "reviewer_name": "megan everett",
        "detected_services": ["fireplace instruction"],
        "sentiment": "positive",
        "sentiment_score": 0.85,
        "themes": ["helpful", "knowledgeable", "above and beyond"],
        "project_type": "consultation",  # Teaching = consultation
        "mentions_price": False,
        "mentions_timeline": False,
        "confidence": 0.85
    },
    {
        "review_text": "Mace did a great job with our cleaning. He was very knowledgeable, finished quickly, and cleaned up thoroughly.",
        "rating": 5,
        "reviewer_name": "chaddhird",
        "detected_services": ["cleaning"],
        "sentiment": "positive",
        "sentiment_score": 0.85,
        "themes": ["knowledgeable", "efficient", "thorough"],
        "project_type": "maintenance",
        "mentions_price": False,
        "mentions_timeline": True,  # "finished quickly"
        "confidence": 0.9
    },
    {
        "review_text": "Mace as great! Polite, timely, knowledgeable, and addressed all my concerns.",
        "rating": 5,
        "reviewer_name": "Kelly Straub",
        "detected_services": [],  # No service specified
        "sentiment": "positive",
        "sentiment_score": 0.85,
        "themes": ["polite", "punctual", "knowledgeable", "attentive"],
        "project_type": None,
        "mentions_price": False,
        "mentions_timeline": True,  # "timely"
        "confidence": 0.85
    },
    {
        "review_text": "Mace is great, have worked with him twice. Clean at his job and respectful. See you guys next season!",
        "rating": 5,
        "reviewer_name": "Chloe Anderson",
        "detected_services": [],  # No specific service
        "sentiment": "positive",
        "sentiment_score": 0.85,
        "themes": ["reliable", "clean", "respectful", "repeat customer"],
        "project_type": "maintenance",  # "next season" implies recurring maintenance
        "mentions_price": False,
        "mentions_timeline": True,  # "next season"
        "confidence": 0.8
    },
]


def create_dspy_examples():
    """Convert training data to DSPy Example objects."""
    examples = []
    for item in TRAINING_DATA:
        # Convert project_type None to "null" string for DSPy
        project_type = item["project_type"] if item["project_type"] else "null"

        example = dspy.Example(
            review_text=item["review_text"],
            rating=item["rating"],
            reviewer_name=item["reviewer_name"],
            detected_services=item["detected_services"],
            sentiment=item["sentiment"],
            sentiment_score=item["sentiment_score"],
            themes=item["themes"],
            project_type=project_type,
            mentions_price=item["mentions_price"],
            mentions_timeline=item["mentions_timeline"],
            confidence=item["confidence"]
        ).with_inputs("review_text", "rating", "reviewer_name")

        examples.append(example)

    return examples


# =============================================================================
# Evaluation Metric
# =============================================================================

def accuracy_metric(example, prediction, trace=None):
    """
    Calculate accuracy score for a prediction against ground truth.

    Returns a score from 0 to 1 based on how many fields match.
    """
    score = 0.0
    max_score = 7.0  # 7 fields to evaluate

    # 1. Sentiment match (exact)
    if prediction.sentiment == example.sentiment:
        score += 1.0

    # 2. Sentiment score (within 0.1)
    try:
        pred_score = float(prediction.sentiment_score)
        true_score = float(example.sentiment_score)
        if abs(pred_score - true_score) <= 0.1:
            score += 1.0
    except (ValueError, TypeError):
        pass

    # 3. Project type match
    pred_project = str(prediction.project_type).lower() if prediction.project_type else "null"
    true_project = str(example.project_type).lower() if example.project_type else "null"
    if pred_project == true_project:
        score += 1.0

    # 4. Mentions price (boolean)
    try:
        pred_price = str(prediction.mentions_price).lower() in ("true", "1", "yes")
        true_price = bool(example.mentions_price)
        if pred_price == true_price:
            score += 1.0
    except:
        pass

    # 5. Mentions timeline (boolean)
    try:
        pred_timeline = str(prediction.mentions_timeline).lower() in ("true", "1", "yes")
        true_timeline = bool(example.mentions_timeline)
        if pred_timeline == true_timeline:
            score += 1.0
    except:
        pass

    # 6. Services detection (partial credit)
    try:
        pred_services = set(s.lower() for s in prediction.detected_services) if prediction.detected_services else set()
        true_services = set(s.lower() for s in example.detected_services) if example.detected_services else set()

        if not pred_services and not true_services:
            score += 1.0  # Both empty = correct
        elif pred_services and true_services:
            # Calculate Jaccard similarity
            intersection = len(pred_services & true_services)
            union = len(pred_services | true_services)
            score += intersection / union if union > 0 else 0
        # One empty, one not = 0 points
    except:
        pass

    # 7. Confidence reasonableness (0.5-1.0 range)
    try:
        conf = float(prediction.confidence)
        if 0.5 <= conf <= 1.0:
            score += 1.0
    except:
        pass

    return score / max_score


# =============================================================================
# Main Functions
# =============================================================================

def setup_lm(model_name: str = "gemini-2.0-flash"):
    """Configure DSPy to use a language model (Gemini or Ollama)."""

    # Check if this is an Ollama model
    if model_name.startswith("ollama/") or ":" in model_name:
        # Ollama model - litellm uses "ollama/" prefix
        if not model_name.startswith("ollama/"):
            model_name = f"ollama/{model_name}"

        lm = dspy.LM(
            model=model_name,
            api_base="http://localhost:11434",
            temperature=0.1
        )
        dspy.configure(lm=lm)
        print(f"✓ Configured DSPy with Ollama: {model_name}")
        return lm

    # Gemini model
    api_key = os.getenv("GOOGLE_AI_API_KEY") or os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise ValueError("GOOGLE_AI_API_KEY or GEMINI_API_KEY environment variable required")

    # Configure DSPy with Gemini via litellm
    # litellm uses "gemini/" prefix for Google AI Studio models
    lm = dspy.LM(
        model=f"gemini/{model_name}",
        api_key=api_key,
        temperature=0.1
    )
    dspy.configure(lm=lm)

    print(f"✓ Configured DSPy with Gemini: {model_name}")
    return lm


def run_optimization():
    """Run BootstrapFewShot optimization to find optimal few-shot examples."""
    print("\n" + "="*60)
    print("DSPy BootstrapFewShot Optimization")
    print("="*60)

    # Setup
    setup_lm("gemini-2.0-flash")
    examples = create_dspy_examples()

    # Split into train/val
    train_set = examples[:7]
    val_set = examples[7:]

    print(f"\nTraining set: {len(train_set)} examples")
    print(f"Validation set: {len(val_set)} examples")

    # Create baseline module
    baseline_tagger = ReviewTagger()

    # Evaluate baseline
    print("\n--- Baseline Performance ---")
    baseline_scores = []
    for ex in val_set:
        pred = baseline_tagger(
            review_text=ex.review_text,
            rating=ex.rating,
            reviewer_name=ex.reviewer_name
        )
        score = accuracy_metric(ex, pred)
        baseline_scores.append(score)
        print(f"  {ex.reviewer_name}: {score:.2%}")

    baseline_avg = sum(baseline_scores) / len(baseline_scores)
    print(f"\nBaseline Average: {baseline_avg:.2%}")

    # Run optimization
    print("\n--- Running BootstrapFewShot ---")
    optimizer = BootstrapFewShot(
        metric=accuracy_metric,
        max_bootstrapped_demos=4,
        max_labeled_demos=4,
        max_rounds=1,
        max_errors=5
    )

    optimized_tagger = optimizer.compile(
        student=ReviewTagger(),
        trainset=train_set
    )

    # Evaluate optimized
    print("\n--- Optimized Performance ---")
    optimized_scores = []
    for ex in val_set:
        pred = optimized_tagger(
            review_text=ex.review_text,
            rating=ex.rating,
            reviewer_name=ex.reviewer_name
        )
        score = accuracy_metric(ex, pred)
        optimized_scores.append(score)
        print(f"  {ex.reviewer_name}: {score:.2%}")

    optimized_avg = sum(optimized_scores) / len(optimized_scores)
    print(f"\nOptimized Average: {optimized_avg:.2%}")

    # Summary
    improvement = optimized_avg - baseline_avg
    print("\n" + "="*60)
    print(f"IMPROVEMENT: {improvement:+.2%}")
    print("="*60)

    # Save optimized model
    output_path = "optimized_tagger.json"
    optimized_tagger.save(output_path)
    print(f"\n✓ Saved optimized model to {output_path}")

    return optimized_tagger


def run_evaluation():
    """Evaluate the current model on all examples."""
    print("\n" + "="*60)
    print("Full Evaluation")
    print("="*60)

    setup_lm("gemini-2.0-flash")
    tagger = ReviewTagger()
    examples = create_dspy_examples()

    scores = []
    results = []

    for i, ex in enumerate(examples, 1):
        pred = tagger(
            review_text=ex.review_text,
            rating=ex.rating,
            reviewer_name=ex.reviewer_name
        )
        score = accuracy_metric(ex, pred)
        scores.append(score)

        result = {
            "review": i,
            "reviewer": ex.reviewer_name,
            "score": f"{score:.2%}",
            "predicted": {
                "services": pred.detected_services,
                "sentiment": pred.sentiment,
                "score": pred.sentiment_score,
                "project_type": pred.project_type,
                "price": pred.mentions_price,
                "timeline": pred.mentions_timeline
            },
            "expected": {
                "services": ex.detected_services,
                "sentiment": ex.sentiment,
                "score": ex.sentiment_score,
                "project_type": ex.project_type,
                "price": ex.mentions_price,
                "timeline": ex.mentions_timeline
            }
        }
        results.append(result)

        print(f"\n[{i}] {ex.reviewer_name}: {score:.2%}")
        print(f"    Predicted: sentiment={pred.sentiment}, timeline={pred.mentions_timeline}, price={pred.mentions_price}")
        print(f"    Expected:  sentiment={ex.sentiment}, timeline={ex.mentions_timeline}, price={ex.mentions_price}")

    avg_score = sum(scores) / len(scores)
    print("\n" + "="*60)
    print(f"AVERAGE ACCURACY: {avg_score:.2%}")
    print("="*60)

    # Save detailed results
    with open("evaluation_results.json", "w") as f:
        json.dump({"average": f"{avg_score:.2%}", "results": results}, f, indent=2)
    print("\n✓ Saved detailed results to evaluation_results.json")


def test_single_review(review_text: str):
    """Test the tagger on a single review."""
    setup_lm("gemini-2.0-flash")
    tagger = ReviewTagger()

    print("\n" + "="*60)
    print("Single Review Test")
    print("="*60)
    print(f"\nReview: {review_text[:100]}...")

    result = tagger(review_text=review_text)

    print(f"\n--- Results ---")
    print(f"Detected Services: {result.detected_services}")
    print(f"Sentiment: {result.sentiment} ({result.sentiment_score})")
    print(f"Project Type: {result.project_type}")
    print(f"Mentions Price: {result.mentions_price}")
    print(f"Mentions Timeline: {result.mentions_timeline}")
    print(f"Confidence: {result.confidence}")

    if hasattr(result, 'reasoning'):
        print(f"\nReasoning: {result.reasoning}")


def compare_models(include_ollama: bool = True):
    """Compare different models using DSPy."""
    import time

    print("\n" + "="*60)
    print("Model Comparison via DSPy")
    print("="*60)

    # All models to test
    models = [
        ("gemini-2.0-flash", "cloud"),
        ("gemini-2.5-flash-lite-preview-06-17", "cloud"),  # 2.5 Flash-Lite
    ]

    if include_ollama:
        models.extend([
            ("gemma2:9b", "local"),
            ("qwen2.5:14b", "local"),
        ])

    examples = create_dspy_examples()  # All 10 examples

    results = {}

    for model_name, model_type in models:
        print(f"\n--- Testing {model_name} ({model_type}) ---")
        start_time = time.time()
        try:
            setup_lm(model_name)
            tagger = ReviewTagger()

            scores = []
            for ex in examples:
                pred = tagger(
                    review_text=ex.review_text,
                    rating=ex.rating,
                    reviewer_name=ex.reviewer_name
                )
                score = accuracy_metric(ex, pred)
                scores.append(score)
                print(f"    {ex.reviewer_name}: {score:.2%}")

            avg = sum(scores) / len(scores)
            elapsed = time.time() - start_time
            results[model_name] = {
                "accuracy": avg,
                "time": elapsed,
                "type": model_type
            }
            print(f"  Average: {avg:.2%} ({elapsed:.1f}s)")

        except Exception as e:
            print(f"  Error: {e}")
            results[model_name] = None

    print("\n" + "="*60)
    print("DSPy MODEL COMPARISON RESULTS")
    print("="*60)
    print(f"\n{'Model':<35} {'Type':<8} {'Accuracy':<10} {'Time':<10}")
    print("-" * 65)

    for model, data in sorted(results.items(), key=lambda x: x[1]["accuracy"] if x[1] else 0, reverse=True):
        if data:
            print(f"{model:<35} {data['type']:<8} {data['accuracy']:.1%}      {data['time']:.1f}s")

    # Save results
    with open("dspy_model_comparison.json", "w") as f:
        json.dump(results, f, indent=2)
    print(f"\n✓ Saved to dspy_model_comparison.json")


# =============================================================================
# CLI Entry Point
# =============================================================================

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="DSPy Review Tagger")
    parser.add_argument("--optimize", action="store_true", help="Run BootstrapFewShot optimization")
    parser.add_argument("--evaluate", action="store_true", help="Evaluate on all examples")
    parser.add_argument("--test", type=str, help="Test on a single review text")
    parser.add_argument("--compare", action="store_true", help="Compare different models")

    args = parser.parse_args()

    if args.optimize:
        run_optimization()
    elif args.evaluate:
        run_evaluation()
    elif args.test:
        test_single_review(args.test)
    elif args.compare:
        compare_models()
    else:
        # Default: run evaluation
        run_evaluation()
