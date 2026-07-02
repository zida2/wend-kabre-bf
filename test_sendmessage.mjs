const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { useChat } = require('@ai-sdk/react');

function TestComponent() {
  const { messages, sendMessage, status, stop } = useChat();
  console.log(typeof sendMessage); // should be 'function'
  
  if (typeof sendMessage === 'function') {
      try {
          sendMessage({ role: 'user', content: 'test' });
          console.log("sendMessage called successfully");
      } catch (e) {
          console.error("sendMessage error", e);
      }
  }
  
  return React.createElement('div', null, "Hello");
}

try {
  ReactDOMServer.renderToString(React.createElement(TestComponent));
} catch (e) {
    console.error(e);
}
