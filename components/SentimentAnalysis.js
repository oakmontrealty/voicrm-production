import { useState, useEffect, useRef } from 'react';
import { 
  FaceSmileIcon, 
  FaceFrownIcon, 
  ExclamationTriangleIcon,
  SparklesIcon,
  FireIcon,
  HeartIcon
} from '@heroicons/react/24/solid';

export default function SentimentAnalysis({ transcript, isCallActive }) {
  const [sentiment, setSentiment] = useState({
    score: 0, // -100 to +100
    emotion: 'neutral', // happy, sad, angry, excited, frustrated, interested
    confidence: 0,
    keywords: [],
    warnings: [],
    opportunities: []
  });

  const [history, setHistory] = useState([]);
  const [metrics, setMetrics] = useState({
    talkRatio: 50, // Customer vs Agent talk time
    interruptionCount: 0,
    positiveWords: 0,
    negativeWords: 0,
    questionsAsked: 0,
    pace: 'normal', // slow, normal, fast
    engagement: 'medium' // low, medium, high
  });

  const analysisIntervalRef = useRef(null);
  const transcriptBufferRef = useRef('');

  // Sentiment keywords and phrases
  const sentimentDictionary = {
    veryPositive: {
      words: ['love', 'excellent', 'amazing', 'perfect', 'wonderful', 'fantastic', 'great', 'awesome', 'definitely', 'absolutely'],
      phrases: ['i love it', 'sounds great', 'im excited', 'cant wait', 'looking forward', 'this is perfect'],
      score: 20
    },
    positive: {
      words: ['good', 'nice', 'happy', 'interested', 'yes', 'sure', 'okay', 'fine', 'like', 'want'],
      phrases: ['sounds good', 'i like', 'im interested', 'tell me more', 'that works'],
      score: 10
    },
    neutral: {
      words: ['maybe', 'possibly', 'could', 'might', 'depends', 'see', 'think', 'consider'],
      phrases: ['let me think', 'ill consider', 'not sure', 'i dont know'],
      score: 0
    },
    negative: {
      words: ['no', 'not', 'dont', 'cant', 'wont', 'never', 'bad', 'wrong', 'issue', 'problem'],
      phrases: ['not interested', 'dont like', 'too expensive', 'not now', 'maybe later'],
      score: -10
    },
    veryNegative: {
      words: ['hate', 'terrible', 'awful', 'horrible', 'worst', 'angry', 'frustrated', 'upset', 'waste'],
      phrases: ['waste of time', 'not interested at all', 'stop calling', 'remove me', 'dont call again'],
      score: -20
    }
  };

  // Buying signals and opportunities
  const buyingSignals = [
    { phrase: 'how much', type: 'price_inquiry', strength: 'high' },
    { phrase: 'when can', type: 'timing', strength: 'high' },
    { phrase: 'what if', type: 'consideration', strength: 'medium' },
    { phrase: 'tell me more', type: 'interest', strength: 'medium' },
    { phrase: 'my budget', type: 'budget_discussion', strength: 'high' },
    { phrase: 'financing', type: 'payment', strength: 'high' },
    { phrase: 'schedule', type: 'appointment', strength: 'high' },
    { phrase: 'visit', type: 'viewing', strength: 'high' },
    { phrase: 'compare', type: 'evaluation', strength: 'medium' },
    { phrase: 'my wife', type: 'decision_maker', strength: 'medium' },
    { phrase: 'my husband', type: 'decision_maker', strength: 'medium' }
  ];

  // Warning signals
  const warningSignals = [
    { phrase: 'too expensive', type: 'price_objection', severity: 'high' },
    { phrase: 'not interested', type: 'disinterest', severity: 'high' },
    { phrase: 'already have', type: 'competitor', severity: 'medium' },
    { phrase: 'bad time', type: 'timing', severity: 'low' },
    { phrase: 'too busy', type: 'availability', severity: 'low' },
    { phrase: 'think about it', type: 'stalling', severity: 'medium' },
    { phrase: 'call me back', type: 'postponing', severity: 'medium' },
    { phrase: 'not sure', type: 'uncertainty', severity: 'low' },
    { phrase: 'complicated', type: 'confusion', severity: 'medium' }
  ];

  // Analyze sentiment in real-time
  useEffect(() => {
    if (!transcript || !isCallActive) return;

    const analyzeSentiment = () => {
      const text = transcript.toLowerCase();
      const words = text.split(/\s+/);
      
      let totalScore = 0;
      let emotionCounts = {
        happy: 0,
        sad: 0,
        angry: 0,
        excited: 0,
        frustrated: 0,
        interested: 0,
        neutral: 0
      };

      let detectedKeywords = [];
      let detectedWarnings = [];
      let detectedOpportunities = [];

      // Analyze each sentiment category
      Object.entries(sentimentDictionary).forEach(([category, data]) => {
        // Check words
        data.words.forEach(word => {
          const count = (text.match(new RegExp(`\\b${word}\\b`, 'gi')) || []).length;
          if (count > 0) {
            totalScore += data.score * count;
            detectedKeywords.push({ word, category, count });
            
            // Map to emotions
            if (category === 'veryPositive' || category === 'positive') {
              emotionCounts.happy += count;
              emotionCounts.interested += count * 0.5;
            } else if (category === 'negative' || category === 'veryNegative') {
              emotionCounts.sad += count * 0.5;
              emotionCounts.frustrated += count;
            }
          }
        });

        // Check phrases
        data.phrases.forEach(phrase => {
          if (text.includes(phrase)) {
            totalScore += data.score * 1.5; // Phrases weighted more
            detectedKeywords.push({ phrase, category, weight: 'high' });
            
            if (phrase.includes('excited') || phrase.includes('cant wait')) {
              emotionCounts.excited += 2;
            }
          }
        });
      });

      // Check for buying signals
      buyingSignals.forEach(signal => {
        if (text.includes(signal.phrase)) {
          detectedOpportunities.push({
            ...signal,
            text: signal.phrase,
            timestamp: new Date().toISOString()
          });
          emotionCounts.interested += 2;
        }
      });

      // Check for warning signals
      warningSignals.forEach(warning => {
        if (text.includes(warning.phrase)) {
          detectedWarnings.push({
            ...warning,
            text: warning.phrase,
            timestamp: new Date().toISOString()
          });
          
          if (warning.severity === 'high') {
            emotionCounts.frustrated += 2;
          }
        }
      });

      // Determine primary emotion
      const primaryEmotion = Object.entries(emotionCounts).reduce((a, b) => 
        emotionCounts[a] > emotionCounts[b[0]] ? a : b[0]
      );

      // Calculate confidence based on keyword density
      const confidence = Math.min(100, detectedKeywords.length * 10);

      // Calculate talk ratio (simple estimation based on transcript length over time)
      const wordsPerMinute = words.length / (Date.now() / 60000);
      const pace = wordsPerMinute > 180 ? 'fast' : wordsPerMinute < 120 ? 'slow' : 'normal';

      // Update sentiment state
      setSentiment({
        score: Math.max(-100, Math.min(100, totalScore)),
        emotion: primaryEmotion,
        confidence,
        keywords: detectedKeywords.slice(0, 5), // Top 5 keywords
        warnings: detectedWarnings,
        opportunities: detectedOpportunities
      });

      // Update metrics
      setMetrics(prev => ({
        ...prev,
        positiveWords: detectedKeywords.filter(k => 
          k.category === 'positive' || k.category === 'veryPositive'
        ).length,
        negativeWords: detectedKeywords.filter(k => 
          k.category === 'negative' || k.category === 'veryNegative'
        ).length,
        questionsAsked: (text.match(/\?/g) || []).length,
        pace,
        engagement: detectedOpportunities.length > 2 ? 'high' : 
                   detectedOpportunities.length > 0 ? 'medium' : 'low'
      }));

      // Add to history
      setHistory(prev => [...prev.slice(-9), {
        timestamp: new Date().toISOString(),
        score: totalScore,
        emotion: primaryEmotion
      }]);
    };

    // Run analysis every 2 seconds
    analysisIntervalRef.current = setInterval(analyzeSentiment, 2000);
    
    // Run immediately
    analyzeSentiment();

    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
    };
  }, [transcript, isCallActive]);

  // Get emoji for emotion
  const getEmotionIcon = () => {
    switch (sentiment.emotion) {
      case 'happy':
      case 'excited':
        return <FaceSmileIcon className="h-8 w-8 text-green-500" />;
      case 'sad':
      case 'frustrated':
        return <FaceFrownIcon className="h-8 w-8 text-red-500" />;
      case 'interested':
        return <SparklesIcon className="h-8 w-8 text-blue-500" />;
      case 'angry':
        return <FireIcon className="h-8 w-8 text-red-600" />;
      default:
        return <FaceSmileIcon className="h-8 w-8 text-gray-400" />;
    }
  };

  // Get color based on score
  const getScoreColor = () => {
    if (sentiment.score > 50) return 'text-green-600';
    if (sentiment.score > 20) return 'text-green-500';
    if (sentiment.score > 0) return 'text-blue-500';
    if (sentiment.score > -20) return 'text-yellow-500';
    if (sentiment.score > -50) return 'text-orange-500';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-[#636B56] mb-4">Live Sentiment Analysis</h3>
      
      {/* Main Sentiment Display */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            {getEmotionIcon()}
            <div>
              <p className="text-sm text-gray-600">Customer Sentiment</p>
              <p className={`text-3xl font-bold ${getScoreColor()}`}>
                {sentiment.score > 0 ? '+' : ''}{sentiment.score}
              </p>
              <p className="text-sm text-gray-500 capitalize">{sentiment.emotion}</p>
            </div>
          </div>
          
          {/* Confidence Meter */}
          <div className="text-center">
            <p className="text-xs text-gray-600 mb-1">Confidence</p>
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-[#636B56] h-2 rounded-full transition-all duration-500"
                style={{ width: `${sentiment.confidence}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{sentiment.confidence}%</p>
          </div>
        </div>

        {/* Sentiment Meter */}
        <div className="relative h-8 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full">
          <div 
            className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-2 border-gray-800 rounded-full transition-all duration-500"
            style={{ left: `${((sentiment.score + 100) / 200) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Very Negative</span>
          <span>Neutral</span>
          <span>Very Positive</span>
        </div>
      </div>

      {/* Opportunities & Warnings */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Opportunities */}
        <div className="p-3 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <HeartIcon className="h-5 w-5 text-green-600" />
            <p className="font-semibold text-green-800">Opportunities</p>
          </div>
          {sentiment.opportunities.length > 0 ? (
            <ul className="space-y-1">
              {sentiment.opportunities.slice(0, 3).map((opp, idx) => (
                <li key={idx} className="text-xs text-green-700">
                  • <strong>{opp.type}:</strong> "{opp.text}"
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-green-600">No buying signals detected yet</p>
          )}
        </div>

        {/* Warnings */}
        <div className="p-3 bg-red-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
            <p className="font-semibold text-red-800">Warnings</p>
          </div>
          {sentiment.warnings.length > 0 ? (
            <ul className="space-y-1">
              {sentiment.warnings.slice(0, 3).map((warning, idx) => (
                <li key={idx} className="text-xs text-red-700">
                  • <strong>{warning.type}:</strong> "{warning.text}"
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-red-600">No concerns detected</p>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 bg-gray-50 rounded">
          <p className="text-2xl font-bold text-[#636B56]">{metrics.positiveWords}</p>
          <p className="text-xs text-gray-600">Positive Words</p>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <p className="text-2xl font-bold text-gray-600">{metrics.questionsAsked}</p>
          <p className="text-xs text-gray-600">Questions</p>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <p className="text-2xl font-bold text-red-600">{metrics.negativeWords}</p>
          <p className="text-xs text-gray-600">Negative Words</p>
        </div>
      </div>

      {/* Engagement Level */}
      <div className="p-3 bg-blue-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-800">Engagement Level</p>
            <p className="text-xs text-blue-600 mt-1">
              {metrics.engagement === 'high' && 'Customer is highly engaged - close the deal!'}
              {metrics.engagement === 'medium' && 'Customer showing interest - keep building rapport'}
              {metrics.engagement === 'low' && 'Customer needs more engagement - ask open questions'}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-lg font-bold ${
              metrics.engagement === 'high' ? 'text-green-600' :
              metrics.engagement === 'medium' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {metrics.engagement.toUpperCase()}
            </p>
            <p className="text-xs text-gray-500">Pace: {metrics.pace}</p>
          </div>
        </div>
      </div>

      {/* Real-time Keywords */}
      {sentiment.keywords.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-gray-600 mb-2">Detected Keywords:</p>
          <div className="flex flex-wrap gap-1">
            {sentiment.keywords.map((kw, idx) => (
              <span 
                key={idx}
                className={`px-2 py-1 text-xs rounded ${
                  kw.category.includes('Positive') ? 'bg-green-100 text-green-700' :
                  kw.category.includes('Negative') ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}
              >
                {kw.word || kw.phrase}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Coaching tips based on sentiment
export function SentimentCoaching({ sentiment }) {
  const getCoachingTips = () => {
    const tips = [];

    if (sentiment.score < -20) {
      tips.push({
        type: 'urgent',
        message: 'Customer seems frustrated. Acknowledge their concerns and offer solutions.',
        action: 'Say: "I understand your concern. Let me see how I can help..."'
      });
    }

    if (sentiment.opportunities.length > 0) {
      tips.push({
        type: 'opportunity',
        message: 'Buying signals detected! Move towards closing.',
        action: 'Ask: "Would you like to schedule a viewing this week?"'
      });
    }

    if (sentiment.emotion === 'interested') {
      tips.push({
        type: 'positive',
        message: 'Customer is engaged. Keep the momentum going.',
        action: 'Share more specific benefits and success stories.'
      });
    }

    if (sentiment.warnings.some(w => w.type === 'price_objection')) {
      tips.push({
        type: 'warning',
        message: 'Price concern detected. Focus on value.',
        action: 'Emphasize ROI and payment options available.'
      });
    }

    return tips;
  };

  const tips = getCoachingTips();

  if (tips.length === 0) return null;

  return (
    <div className="mt-4 space-y-2">
      {tips.map((tip, idx) => (
        <div 
          key={idx}
          className={`p-3 rounded-lg ${
            tip.type === 'urgent' ? 'bg-red-50 border-l-4 border-red-500' :
            tip.type === 'opportunity' ? 'bg-green-50 border-l-4 border-green-500' :
            tip.type === 'warning' ? 'bg-yellow-50 border-l-4 border-yellow-500' :
            'bg-blue-50 border-l-4 border-blue-500'
          }`}
        >
          <p className="text-sm font-semibold mb-1">{tip.message}</p>
          <p className="text-xs text-gray-600">{tip.action}</p>
        </div>
      ))}
    </div>
  );
}