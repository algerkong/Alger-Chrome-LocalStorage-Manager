import { useEffect, useState } from 'react';
import { Layout, Button, message, Switch } from 'antd';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { SunOutlined, MoonOutlined } from '@ant-design/icons';

const { Header, Content } = Layout;

function Detail() {
  const [value, setValue] = useState('');
  const [key, setKey] = useState('');
  const [isJson, setIsJson] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [originalTabId, setOriginalTabId] = useState<number | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(['isDarkMode'], (result) => {
      setIsDarkMode(result.isDarkMode || false);
    });

    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.isDarkMode) {
        setIsDarkMode(changes.isDarkMode.newValue);
      }
    };

    chrome.storage.local.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.local.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  useEffect(() => {
    chrome.storage.local.set({ isDarkMode });
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    // 获取原始标签页ID
    const params = new URLSearchParams(window.location.search);
    const tabId = params.get('tabId');
    if (tabId) {
      setOriginalTabId(parseInt(tabId));
    }

    const keyParam = params.get('key');
    const valueParam = params.get('value');
    
    if (keyParam && valueParam) {
      setKey(keyParam);
      try {
        const parsed = JSON.parse(valueParam);
        setValue(JSON.stringify(parsed, null, 2));
        setIsJson(true);
      } catch {
        setValue(valueParam);
        setIsJson(false);
      }
    }
  }, []);

  const handleSave = async () => {
    try {
      if (isJson) {
        JSON.parse(value);
      }
      
      if (!originalTabId) {
        messageApi.error('无法获取目标标签页');
        return;
      }

      await chrome.scripting.executeScript({
        target: { tabId: originalTabId },
        func: (key: string, value: string) => {
          localStorage.setItem(key, value);
        },
        args: [key, value]
      });

      messageApi.success('保存成功');
    } catch (error) {
      if (isJson) {
        messageApi.error('JSON 格式错误，请检查格式');
      } else {
        messageApi.error('保存失败');
      }
      console.error('保存失败:', error);
    }
  };

  return (
    <Layout className={`h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {contextHolder}
      <Header 
        className={`flex items-center justify-between px-4 py-2 shadow-md transition-colors duration-300
          ${isDarkMode ? 'bg-gray-800 shadow-gray-700/30' : 'bg-white shadow-gray-200/50'}`}
      >
        <div className={`text-lg font-semibold flex items-center gap-2 ${isDarkMode ? 'text-gray-100' : ''}`}>
          <span>编辑 LocalStorage: {key}</span>
          {isJson && (
            <span className={`text-xs px-2 py-1 rounded-full ${
              isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-600'
            }`}>
              JSON
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checkedChildren={<MoonOutlined />}
            unCheckedChildren={<SunOutlined />}
            checked={isDarkMode}
            onChange={setIsDarkMode}
            className={isDarkMode ? '!bg-blue-500' : ''}
          />
          <Button 
            type="primary" 
            onClick={handleSave}
            className={isDarkMode ? 'bg-blue-500 hover:bg-blue-400' : ''}
          >
            保存
          </Button>
        </div>
      </Header>
      <Content className="p-4">
        <div className={`rounded-lg shadow-lg h-full transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800 shadow-gray-700/30' : 'bg-white shadow-gray-200/50'
        }`}>
          <CodeMirror
            value={value}
            height="calc(100vh - 120px)"
            theme={isDarkMode ? 'dark' : 'light'}
            extensions={isJson ? [json()] : []}
            onChange={(value) => setValue(value)}
            style={{
              fontSize: 14,
            }}
          />
        </div>
      </Content>
    </Layout>
  );
}

export default Detail; 