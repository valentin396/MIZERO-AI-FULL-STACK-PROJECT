import ChatBot from '../components/ChatBot.jsx';

export default function DashboardChat() {
  return (
    <div className="px-8 py-8 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-1">Chat with AI</h1>
      <p className="text-ink/60 mb-6">Talk MIZERO through a report conversationally, in English or Kinyarwanda.</p>
      <ChatBot />
    </div>
  );
}
