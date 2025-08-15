import { useState, useEffect, useRef } from 'react';
import { MicrophoneIcon, StopIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/router';

export default function VoiceCommands() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState('');
  
  const recognition = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      recognition.current = new window.webkitSpeechRecognition();
      recognition.current.continuous = true;
      recognition.current.interimResults = true;
      recognition.current.lang = 'en-AU'; // Australian English

      recognition.current.onresult = handleSpeechResult;
      recognition.current.onerror = handleSpeechError;
      recognition.current.onend = () => setIsListening(false);
    }

    return () => {
      if (recognition.current) {
        recognition.current.stop();
      }
    };
  }, []);

  const handleSpeechResult = async (event) => {
    const last = event.results.length - 1;
    const text = event.results[last][0].transcript.toLowerCase();
    setTranscript(text);

    if (event.results[last].isFinal) {
      setProcessing(true);
      await processCommand(text);
      setProcessing(false);
      setTranscript('');
    }
  };

  const handleSpeechError = (event) => {
    console.error('Speech recognition error:', event.error);
    setFeedback('Error: ' + event.error);
    setIsListening(false);
  };

  const processCommand = async (text) => {
    // Voice command patterns
    const commands = {
      // Navigation commands
      'go to dashboard': () => router.push('/dashboard'),
      'show dashboard': () => router.push('/dashboard'),
      'open contacts': () => router.push('/contacts'),
      'show contacts': () => router.push('/contacts'),
      'open leads': () => router.push('/leads'),
      'show leads': () => router.push('/leads'),
      'open properties': () => router.push('/properties'),
      'show properties': () => router.push('/properties'),
      
      // Contact creation
      'create contact': () => createContact(text),
      'add contact': () => createContact(text),
      'new contact': () => createContact(text),
      
      // Lead management
      'create lead': () => createLead(text),
      'add lead': () => createLead(text),
      'qualify lead': () => qualifyLead(text),
      
      // Search commands
      'search for': () => performSearch(text),
      'find': () => performSearch(text),
      'look for': () => performSearch(text),
      
      // Call commands
      'call': () => initiateCall(text),
      'dial': () => initiateCall(text),
      'phone': () => initiateCall(text),
      
      // Task commands
      'create task': () => createTask(text),
      'add task': () => createTask(text),
      'remind me': () => createReminder(text),
      
      // Analytics
      'show analytics': () => router.push('/analytics'),
      'show reports': () => router.push('/analytics'),
      'revenue report': () => showRevenueReport(),
      
      // Property commands
      'list property': () => listProperty(text),
      'add property': () => listProperty(text),
      'schedule viewing': () => scheduleViewing(text),
    };

    // Process command
    let commandExecuted = false;
    for (const [pattern, action] of Object.entries(commands)) {
      if (text.includes(pattern)) {
        await action();
        commandExecuted = true;
        break;
      }
    }

    if (!commandExecuted) {
      // Use AI to interpret complex commands
      await interpretWithAI(text);
    }
  };

  const createContact = async (text) => {
    // Extract name and details from voice command
    const nameMatch = text.match(/(?:named?|called?)\s+([a-z\s]+?)(?:\s+with|\s+phone|\s+email|$)/i);
    const phoneMatch = text.match(/(?:phone|number)\s+([\d\s-+]+)/);
    const emailMatch = text.match(/(?:email)\s+([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i);

    if (nameMatch) {
      const contactData = {
        name: nameMatch[1].trim(),
        phone: phoneMatch ? phoneMatch[1].trim() : '',
        email: emailMatch ? emailMatch[1].trim() : '',
        status: 'Active',
        source: 'Voice Command',
      };

      try {
        const response = await fetch('/api/contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(contactData),
        });

        if (response.ok) {
          setFeedback(`Contact "${contactData.name}" created successfully`);
          speak(`Contact ${contactData.name} has been created`);
        }
      } catch (error) {
        setFeedback('Failed to create contact');
      }
    } else {
      setFeedback('Please say: "Create contact named [Name]"');
    }
  };

  const createLead = async (text) => {
    const nameMatch = text.match(/(?:named?|called?)\s+([a-z\s]+?)(?:\s+from|\s+at|\s+with|$)/i);
    const companyMatch = text.match(/(?:from|at|company)\s+([a-z\s]+?)(?:\s+with|\s+interested|$)/i);
    
    if (nameMatch) {
      const leadData = {
        name: nameMatch[1].trim(),
        company: companyMatch ? companyMatch[1].trim() : '',
        status: 'New',
        priority: text.includes('urgent') || text.includes('high') ? 'High' : 'Medium',
        source: 'Voice Command',
        value: extractValue(text),
      };

      try {
        const response = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(leadData),
        });

        if (response.ok) {
          setFeedback(`Lead "${leadData.name}" created`);
          speak(`Lead ${leadData.name} has been added to your pipeline`);
        }
      } catch (error) {
        setFeedback('Failed to create lead');
      }
    }
  };

  const performSearch = async (text) => {
    const searchTerm = text.replace(/search for|find|look for/gi, '').trim();
    setFeedback(`Searching for "${searchTerm}"...`);
    
    // Perform global search
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`);
      const results = await response.json();
      
      speak(`Found ${results.length} results for ${searchTerm}`);
      // Navigate to search results page or show results
    } catch (error) {
      setFeedback('Search failed');
    }
  };

  const initiateCall = async (text) => {
    const nameMatch = text.match(/call\s+([a-z\s]+)/i);
    
    if (nameMatch) {
      const name = nameMatch[1].trim();
      // Find contact and initiate call
      try {
        const response = await fetch(`/api/contacts/search?name=${encodeURIComponent(name)}`);
        const contacts = await response.json();
        
        if (contacts.length > 0) {
          // Trigger call to first matching contact
          window.dispatchEvent(new CustomEvent('initiateCall', { detail: contacts[0] }));
          setFeedback(`Calling ${contacts[0].name}...`);
          speak(`Calling ${contacts[0].name}`);
        } else {
          setFeedback(`No contact found with name "${name}"`);
        }
      } catch (error) {
        setFeedback('Failed to initiate call');
      }
    }
  };

  const createTask = async (text) => {
    const taskMatch = text.match(/(?:task|to do)\s+(.+?)(?:\s+by|\s+on|\s+tomorrow|$)/i);
    const dateMatch = text.match(/(?:by|on|tomorrow|today|next)\s+([a-z\s]+)/i);
    
    if (taskMatch) {
      const taskData = {
        title: taskMatch[1].trim(),
        due_date: parseDateFromText(dateMatch ? dateMatch[1] : 'today'),
        priority: text.includes('urgent') ? 'High' : 'Medium',
        status: 'pending',
      };

      try {
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData),
        });

        if (response.ok) {
          setFeedback(`Task "${taskData.title}" created`);
          speak('Task has been added to your list');
        }
      } catch (error) {
        setFeedback('Failed to create task');
      }
    }
  };

  const interpretWithAI = async (text) => {
    setFeedback('Interpreting command...');
    
    try {
      const response = await fetch('/api/openai/interpret-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: text }),
      });

      const result = await response.json();
      
      if (result.action) {
        // Execute the interpreted action
        await executeAIAction(result.action, result.parameters);
        setFeedback(result.feedback || 'Command executed');
      } else {
        setFeedback("I didn't understand that command");
      }
    } catch (error) {
      setFeedback('Failed to interpret command');
    }
  };

  const executeAIAction = async (action, parameters) => {
    // Execute AI-determined actions
    switch (action) {
      case 'navigate':
        router.push(parameters.path);
        break;
      case 'create':
        await createEntity(parameters.type, parameters.data);
        break;
      case 'update':
        await updateEntity(parameters.type, parameters.id, parameters.data);
        break;
      case 'search':
        await performSearch(parameters.query);
        break;
      default:
        console.log('Unknown action:', action, parameters);
    }
  };

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-AU';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognition.current?.stop();
    } else {
      recognition.current?.start();
      setIsListening(true);
      setFeedback('Listening...');
      speak('I\'m listening');
    }
  };

  const extractValue = (text) => {
    const valueMatch = text.match(/(?:worth|value|budget)\s*(?:of)?\s*\$?([\d,]+)/i);
    return valueMatch ? parseInt(valueMatch[1].replace(/,/g, '')) : 0;
  };

  const parseDateFromText = (text) => {
    const today = new Date();
    
    if (text.includes('today')) {
      return today.toISOString().split('T')[0];
    } else if (text.includes('tomorrow')) {
      today.setDate(today.getDate() + 1);
      return today.toISOString().split('T')[0];
    } else if (text.includes('next week')) {
      today.setDate(today.getDate() + 7);
      return today.toISOString().split('T')[0];
    }
    
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {/* Voice Command Button */}
      <button
        onClick={toggleListening}
        className={`p-4 rounded-full shadow-lg transition-all ${
          isListening 
            ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
            : 'bg-indigo-600 hover:bg-indigo-700'
        } text-white`}
        title="Voice Commands (Click to speak)"
      >
        {isListening ? (
          <StopIcon className="h-6 w-6" />
        ) : (
          <MicrophoneIcon className="h-6 w-6" />
        )}
      </button>

      {/* Feedback Display */}
      {(isListening || transcript || feedback) && (
        <div className="absolute bottom-20 left-0 bg-white rounded-lg shadow-xl p-4 min-w-[300px]">
          {isListening && (
            <div className="flex items-center mb-2">
              <div className="animate-pulse h-2 w-2 bg-red-500 rounded-full mr-2" />
              <span className="text-sm text-gray-600">Listening...</span>
            </div>
          )}
          
          {transcript && (
            <div className="mb-2">
              <p className="text-sm font-medium">You said:</p>
              <p className="text-sm text-gray-700">{transcript}</p>
            </div>
          )}
          
          {processing && (
            <div className="text-sm text-indigo-600 animate-pulse">Processing...</div>
          )}
          
          {feedback && !processing && (
            <div className="text-sm text-green-600">{feedback}</div>
          )}

          <div className="mt-3 text-xs text-gray-500">
            <p>Example commands:</p>
            <ul className="mt-1 space-y-1">
              <li>• "Create contact named John Smith"</li>
              <li>• "Call Sarah Johnson"</li>
              <li>• "Show dashboard"</li>
              <li>• "Create task follow up with client"</li>
              <li>• "Search for properties in Sydney"</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}