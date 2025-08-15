// API endpoint for AI Next Steps generation
import { getAINextSteps } from '../../../lib/ai-next-steps';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      transcript, 
      metadata,
      callScore,
      duration,
      action = 'generate'
    } = req.body;

    const aiNextSteps = getAINextSteps();

    switch (action) {
      case 'generate':
        // Generate next steps from call
        const nextSteps = await aiNextSteps.generateNextSteps({
          transcript,
          metadata,
          callScore,
          duration
        });
        
        return res.status(200).json({
          success: true,
          data: nextSteps
        });

      case 'update':
        // Update a specific next step
        const { stepId, updates } = req.body;
        const updated = await aiNextSteps.updateStep(stepId, updates);
        
        return res.status(200).json({
          success: true,
          data: updated
        });

      case 'complete':
        // Mark step as complete
        const { stepId: completeId, completionNotes } = req.body;
        const completed = await aiNextSteps.completeStep(completeId, completionNotes);
        
        return res.status(200).json({
          success: true,
          data: completed
        });

      case 'automate':
        // Execute automated actions
        const { steps } = req.body;
        const automated = await aiNextSteps.executeAutomatedActions(steps);
        
        return res.status(200).json({
          success: true,
          data: automated
        });

      case 'templates':
        // Get templates for steps
        const { nextSteps: stepsForTemplates } = req.body;
        const templates = await aiNextSteps.generateTemplates(
          stepsForTemplates,
          transcript,
          metadata
        );
        
        return res.status(200).json({
          success: true,
          data: templates
        });

      default:
        return res.status(400).json({ 
          error: 'Invalid action',
          validActions: ['generate', 'update', 'complete', 'automate', 'templates']
        });
    }

  } catch (error) {
    console.error('AI Next Steps API error:', error);
    return res.status(500).json({ 
      error: 'Failed to process next steps',
      message: error.message 
    });
  }
}