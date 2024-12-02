interface MessageRequest {
  action: 'getLocalStorage' | 'setLocalStorage' | 'removeLocalStorage';
  data?: {
    key: string;
    value?: string;
  };
}

interface MessageResponse {
  success?: boolean;
  data?: Record<string, string>;
}

// 用于获取当前页面的 localStorage 数据
function getAllLocalStorage(): Record<string, string> {
  const data: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      data[key] = localStorage.getItem(key) || '';
    }
  }
  return data;
}

// 监听来自插件的消息
chrome.runtime.onMessage.addListener((
  request: MessageRequest,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: MessageResponse) => void
) => {
  if (request.action === 'getLocalStorage') {
    sendResponse({ data: getAllLocalStorage() });
  } else if (request.action === 'setLocalStorage' && request.data) {
    const { key, value } = request.data;
    if (value) {
      localStorage.setItem(key, value);
      sendResponse({ success: true });
    }
  } else if (request.action === 'removeLocalStorage' && request.data) {
    const { key } = request.data;
    localStorage.removeItem(key);
    sendResponse({ success: true });
  }
}); 