import Layout from '../components/Layout';

export default function AIVoiceAgent() {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-3xl font-bold text-[#636B56]" style={{ fontFamily: 'Forum, serif' }}>
            AI Voice Agent
          </h1>
          <p className="text-[#7a7a7a] mt-2">Virtual assistant for automated calls and support</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-[#636B56] mb-4">Agent Status</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Status</span>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">Online</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Calls Handled Today</span>
                <span className="text-2xl font-bold text-[#636B56]">47</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Average Call Duration</span>
                <span className="text-lg">3:45</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-[#636B56] mb-4">AI Capabilities</h2>
            <ul className="space-y-3">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Answer property inquiries
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Schedule viewings
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Qualify leads
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                Transfer to human agent
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-[#636B56] mb-4">Voice Scripts</h2>
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Greeting Script</h3>
              <p className="text-gray-600">Hello! Thank you for calling. I'm your AI assistant. How can I help you with your real estate needs today?</p>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Property Inquiry Script</h3>
              <p className="text-gray-600">I'd be happy to help you with property information. Which property are you interested in, or would you like me to suggest some options based on your preferences?</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}