"""
Evaluate DSPy models on 50 reviews from the database.
Uses the existing analysis_json as ground truth.
"""

import os
import json
import time
from dotenv import load_dotenv
import dspy
from dspy import InputField, OutputField, Signature

load_dotenv()


class ReviewTaggingSignature(Signature):
    """Extract structured information from a contractor review.

    You are analyzing contractor reviews for home service companies.
    Extract structured data following these rules:

    - detected_services: ONLY services explicitly mentioned. Use empty list if none.
    - sentiment_score: Use realistic range 0.7-0.95 for positive, -0.7 to -0.95 for negative. Never 1.0 or -1.0.
    - project_type: "maintenance" for cleaning/routine, "consultation" for teaching/advice, "repair" for fixing, "new_construction" for new installs.
    - mentions_price: TRUE if mentions "free", cost, pricing, quotes, estimates, affordable, "$".
    - mentions_timeline: TRUE if mentions "on time", "quickly", "same day", "prompt", "next day", timing.
    """

    review_text: str = InputField(desc="The contractor review text to analyze")
    rating: int = InputField(desc="Star rating (1-5)")
    reviewer_name: str = InputField(desc="Name of the reviewer")

    detected_services: list[str] = OutputField(desc="List of services explicitly mentioned")
    sentiment: str = OutputField(desc="Overall sentiment: positive, negative, neutral, or mixed")
    sentiment_score: float = OutputField(desc="Sentiment score from -1 to 1")
    project_type: str = OutputField(desc="Type: repair, maintenance, consultation, new_construction, or null")
    mentions_price: bool = OutputField(desc="True if review mentions pricing or cost")
    mentions_timeline: bool = OutputField(desc="True if review mentions timing or scheduling")
    confidence: float = OutputField(desc="Confidence in this analysis from 0 to 1")


class ReviewTagger(dspy.Module):
    def __init__(self):
        super().__init__()
        self.tagger = dspy.ChainOfThought(ReviewTaggingSignature)

    def forward(self, review_text: str, rating: int = 5, reviewer_name: str = "Unknown"):
        return self.tagger(
            review_text=review_text,
            rating=rating,
            reviewer_name=reviewer_name
        )


def setup_lm(model_name: str):
    """Configure DSPy with a language model."""
    if ":" in model_name or model_name.startswith("ollama/"):
        # Ollama model
        if not model_name.startswith("ollama/"):
            model_name = f"ollama/{model_name}"
        lm = dspy.LM(model=model_name, api_base="http://localhost:11434", temperature=0.1)
    else:
        # Gemini model
        api_key = os.getenv("GOOGLE_AI_API_KEY") or os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_AI_API_KEY required")
        lm = dspy.LM(model=f"gemini/{model_name}", api_key=api_key, temperature=0.1)

    dspy.configure(lm=lm)
    return lm


def accuracy_metric(pred, expected):
    """Calculate accuracy score comparing prediction to ground truth."""
    score = 0.0
    max_score = 6.0  # 6 fields

    # 1. Sentiment match
    if pred.sentiment.lower() == expected.get("sentiment", "").lower():
        score += 1.0

    # 2. Sentiment score within 0.15
    try:
        pred_score = float(pred.sentiment_score)
        true_score = float(expected.get("sentiment_score", 0))
        if abs(pred_score - true_score) <= 0.15:
            score += 1.0
    except:
        pass

    # 3. Project type match
    pred_project = str(pred.project_type).lower() if pred.project_type else "null"
    true_project = str(expected.get("project_type") or "null").lower()
    if pred_project == true_project or pred_project == "none" and true_project == "null":
        score += 1.0

    # 4. Mentions price
    try:
        pred_price = str(pred.mentions_price).lower() in ("true", "1", "yes")
        true_price = bool(expected.get("mentions_price", False))
        if pred_price == true_price:
            score += 1.0
    except:
        pass

    # 5. Mentions timeline
    try:
        pred_timeline = str(pred.mentions_timeline).lower() in ("true", "1", "yes")
        true_timeline = bool(expected.get("mentions_timeline", False))
        if pred_timeline == true_timeline:
            score += 1.0
    except:
        pass

    # 6. Services detection (partial credit)
    try:
        pred_services = set(s.lower() for s in (pred.detected_services or []))
        true_services = set(s.lower() for s in expected.get("detected_services", []))

        if not pred_services and not true_services:
            score += 1.0
        elif pred_services and true_services:
            intersection = len(pred_services & true_services)
            union = len(pred_services | true_services)
            score += intersection / union if union > 0 else 0
    except:
        pass

    return score / max_score


def run_evaluation():
    """Run evaluation on 50 reviews across all models."""
    print("\n" + "=" * 70)
    print("DSPy Evaluation on 50 Reviews")
    print("=" * 70)

    # Load reviews
    with open("test_reviews_50.json", "r") as f:
        reviews = json.load(f)

    print(f"Loaded {len(reviews)} reviews")

    models = [
        ("gemini-2.0-flash", "cloud"),
        ("qwen2.5:14b", "local"),
        ("gemma2:9b", "local"),
    ]

    results = {}

    for model_name, model_type in models:
        print(f"\n{'=' * 70}")
        print(f"Testing: {model_name} ({model_type})")
        print("=" * 70)

        start_time = time.time()

        try:
            setup_lm(model_name)
            tagger = ReviewTagger()

            scores = []
            errors = 0

            for i, review in enumerate(reviews):
                try:
                    pred = tagger(
                        review_text=review["review_text"],
                        rating=review["rating"],
                        reviewer_name=review["reviewer_name"]
                    )

                    expected = review["analysis_json"]
                    score = accuracy_metric(pred, expected)
                    scores.append(score)

                    status = "✓" if score >= 0.8 else "○" if score >= 0.5 else "✗"
                    print(f"  [{i+1:2d}] {status} {review['reviewer_name'][:20]:<20} {score:.0%}")

                except Exception as e:
                    errors += 1
                    print(f"  [{i+1:2d}] ✗ {review['reviewer_name'][:20]:<20} ERROR: {str(e)[:40]}")

            elapsed = time.time() - start_time
            avg_score = sum(scores) / len(scores) if scores else 0

            results[model_name] = {
                "accuracy": avg_score,
                "time": elapsed,
                "type": model_type,
                "reviews": len(scores),
                "errors": errors
            }

            print(f"\n  Average: {avg_score:.1%} | Time: {elapsed:.1f}s | Errors: {errors}")

        except Exception as e:
            print(f"  Model error: {e}")
            results[model_name] = None

    # Summary
    print("\n" + "=" * 70)
    print("FINAL RESULTS (50 Reviews)")
    print("=" * 70)
    print(f"\n{'Model':<25} {'Type':<8} {'Accuracy':<10} {'Time':<10} {'Errors'}")
    print("-" * 65)

    for model, data in sorted(results.items(), key=lambda x: x[1]["accuracy"] if x[1] else 0, reverse=True):
        if data:
            print(f"{model:<25} {data['type']:<8} {data['accuracy']:.1%}      {data['time']:.1f}s      {data['errors']}")

    # Save results
    with open("eval_50_results.json", "w") as f:
        json.dump(results, f, indent=2)
    print(f"\n✓ Saved to eval_50_results.json")


if __name__ == "__main__":
    run_evaluation()
