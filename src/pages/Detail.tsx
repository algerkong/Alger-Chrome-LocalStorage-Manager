import { useEffect, useState } from 'react';
import { Layout, Button, message } from 'antd';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';

const { Header, Content } = Layout;

function Detail() {
  const [value, setValue] = useState('');
  const [key, setKey] = useState('');
  const [isJson, setIsJson] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [originalTabId, setOriginalTabId] = useState<number | null>(null);

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
    <Layout className="h-screen">
      {contextHolder}
      <Header className="flex items-center justify-between bg-white px-4 py-2 shadow">
        <div className="text-lg font-semibold flex items-center gap-2">
          <span>编辑 LocalStorage: {key}</span>
          {isJson && (
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
              JSON
            </span>
          )}
        </div>
        <Button type="primary" onClick={handleSave}>
          保存
        </Button>
      </Header>
      <Content className="p-4">
        <CodeMirror
          value={value}
          height="calc(100vh - 80px)"
          theme="light"
          extensions={isJson ? [json()] : []}
          onChange={(value) => setValue(value)}
          style={{
            fontSize: 14,
          }}
        />
      </Content>
    </Layout>
  );
}

export default Detail; 