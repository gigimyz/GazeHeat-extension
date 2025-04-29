import fetch from 'node-fetch';

const topTexts = [
  "Evaluating the functional performance of LLM applications is paramount to ensuring they continue to work well over time amid changing trends in your production environment. But producing effective metrics for evaluating LLMs poses significant challenges. When models are deployed to answer customer questions, evaluate support interactions, or generate data insights and other content, it can be difficult to obtain a stable ground truth to evaluate the application with. Further, evaluations must be tailored to the application’s specific use case in order to properly measure qualities like accuracy, relevancy, coherence, toxicity, and sentiment in LLM inputs and outputs.",
  "Tom Sobolik\n\nShri Subramanian\n\nEvaluating the functional performance of LLM applications is paramount to ensuring they continue to work well over time amid changing trends in your production environment. But producing effective metrics for evaluating LLMs poses significant challenges. ...",
  "A number of evaluation approaches, including code-based, LLM-as-a-judge, and human-in-the-loop methods, can be considered as you build your evaluation framework. In this post, we’ll explore some of the most important considerations when choosing how to evaluate your LLM application within a comprehensive monitoring framework. We’ll also discuss how to approach obtaining evaluation metrics and monitoring them in your production environment.",
  "Monitor your evaluations in production",
  "Tom Sobolik"
];

async function run() {
    try {
      const response = await fetch('http://localhost:5001/gemini-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ texts: topTexts })
      });
  
      if (!response.ok) {
        const errText = await response.text();
        console.error(`❌ Server responded with ${response.status}: ${errText}`);
      } else {
        const data = await response.json();
        console.log("✅ Gemini summary:", data.summary);
      }
    } catch (err) {
      console.error("❌ Request failed:", err);
    }
  }
  
  run();
