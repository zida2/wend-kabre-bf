const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { useChat } = require('@ai-sdk/react');

function TestComponent() {
  const { sendMessage } = useChat();
  try {
      sendMessage({ role: 'user', content: 'hello' });
  } catch (e) {
      console.log("CAUGHT:", e.message, e.stack);
  }
  return React.createElement('div', null, "Hello");
}

ReactDOMServer.renderToString(React.createElement(TestComponent));
