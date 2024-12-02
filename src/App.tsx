import { useEffect, useState } from 'react';
import { Layout, Button, Drawer, Typography, message, Space, Table, Tooltip } from 'antd';
import { EditOutlined, CopyOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';

const { Header, Content } = Layout;
const { Title } = Typography;

interface LocalStorageItem {
  key: string;
  value: string;
  extraInfo?: string;
}

function App() {
  const [items, setItems] = useState<LocalStorageItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<LocalStorageItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [isModalJson, setIsModalJson] = useState(false);

  const fetchLocalStorage = async () => {
    try {
      setLoading(true);
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) return;

      const result = await chrome.scripting.executeScript<[], Record<string, string>>({
        target: { tabId: tab.id },
        func: () => {
          const data: Record<string, string> = {};
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
              data[key] = localStorage.getItem(key) || '';
            }
          }
          return data;
        }
      });

      if (result?.[0]?.result) {
        const storageData = result[0].result;
        const itemsArray = Object.entries(storageData).map(([key, value]) => ({
          key,
          value: typeof value === 'string' ? value : JSON.stringify(value, null, 2)
        }));
        setItems(itemsArray);
      }
    } catch (error) {
      messageApi.error('获取 localStorage 失败');
      console.error('获取 localStorage 失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocalStorage();
  }, []);

  const handleEdit = async (item: LocalStorageItem) => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) return;

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (key: string, value: string) => {
          localStorage.setItem(key, value);
        },
        args: [item.key, item.value]
      });

      setItems(prev => prev.map(i => 
        i.key === item.key ? item : i
      ));
      messageApi.success('保存成功');
    } catch (error) {
      messageApi.error('保存失败');
      console.error('编辑 localStorage 失败:', error);
    }
  };

  const handleDelete = async (key: string) => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) return;

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (key: string) => {
          localStorage.removeItem(key);
        },
        args: [key]
      });

      setItems(prev => prev.filter(item => item.key !== key));
      messageApi.success('删除成功');
    } catch (error) {
      messageApi.error('删除失败');
      console.error('删除 localStorage 失败:', error);
    }
  };

  const isTimestamp = (value: string): boolean => {
    const num = Number(value);
    return !isNaN(num) && 
      (value.length === 10 || value.length === 13) && // 10位或13位时间戳
      num > 1000000000; // 2001年以后的时间戳
  };

  const isNumber = (value: string): boolean => {
    return !isNaN(Number(value));
  };

  const handleValueClick = async (record: LocalStorageItem) => {
    // 先检查是否为时间戳或数字
    if (isTimestamp(record.value)) {
      setIsModalJson(false);
      setSelectedItem({
        ...record,
        extraInfo: new Date(Number(record.value) * (record.value.length === 10 ? 1000 : 1)).toLocaleString()
      });
      return;
    }

    if (isNumber(record.value) || record.value.length < 200) {
      setIsModalJson(false);
      setSelectedItem(record);
      return;
    }

    // 最后尝试解析 JSON
    try {
      JSON.parse(record.value);
      // 如果是 JSON，使用详情页编辑
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const params = new URLSearchParams({
        key: record.key,
        value: record.value,
        tabId: tab.id?.toString() || ''
      });
      chrome.windows.create({
        url: chrome.runtime.getURL(`detail.html?${params.toString()}`),
        type: 'popup',
        width: 1200,
        height: 800
      });
    } catch {
      // 如果不是 JSON，且前面的条件都不满足，说明是长字符串
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const params = new URLSearchParams({
        key: record.key,
        value: record.value,
        tabId: tab.id?.toString() || ''
      });
      chrome.windows.create({
        url: chrome.runtime.getURL(`detail.html?${params.toString()}`),
        type: 'popup',
        width: 1200,
        height: 800
      });
    }
  };

  const columns: ColumnsType<LocalStorageItem> = [
    {
      title: 'Key',
      dataIndex: 'key',
      key: 'key',
      width: '30%',
      render: (text: string) => (
        <div className="break-all py-2 line-clamp-1">
          {text}
        </div>
      ),
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      width: '50%',
      render: (text: string, record) => {
        return (
          <div 
            className="break-all whitespace-pre-wrap py-2 cursor-pointer hover:bg-gray-50 line-clamp-1"
            onClick={() => handleValueClick(record)}
          >
            {text}
            {text.length > 50 && (
              <span className="text-blue-500 ml-1">...</span>
            )}
          </div>
        );
      }
    },
    {
      title: '操作',
      key: 'action',
      width: '20%',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => {
              // 点击编辑按钮时也使用相同的逻辑
              handleValueClick(record);
            }}
          />
          <Button
            type="text"
            icon={<CopyOutlined />}
            onClick={() => {
              navigator.clipboard.writeText(record.value);
              messageApi.success('已复制到剪贴板');
            }}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.key)}
          />
        </Space>
      ),
    },
  ];

  // 添加复制代码函数
  const copySetupCode = () => {
    const lsData = items.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {} as Record<string, string>);

    const setupCode = `var ls = ${JSON.stringify(lsData, null, 2)};\nObject.keys(ls).forEach(k => localStorage[k] = ls[k]);`;
    navigator.clipboard.writeText(setupCode);
    messageApi.success('已复制设置代码到剪贴板');
  };

  return (
    <Layout className="min-w-[784px]">
      {contextHolder}
      <Header 
        className="flex items-center justify-between bg-white px-4 py-2 shadow fixed top-0 left-0 right-0 z-10"
        style={{ height: '56px' }}
      >
        <div className="flex items-center gap-4">
          <Title level={4} style={{ margin: 0 }}>LocalStorage 管理器</Title>
          <Tooltip 
            title="复制一段代码，可以在控制台执行以批量设置当前所有 localStorage 数据"
            placement="bottom"
          >
            <Button
              onClick={copySetupCode}
              icon={<CopyOutlined />}
            >
              复制设置代码
            </Button>
          </Tooltip>
        </div>
        <Tooltip title="刷新 localStorage 数据">
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={fetchLocalStorage}
            loading={loading}
          >
            刷新
          </Button>
        </Tooltip>
      </Header>
      
      <Content 
        className="p-4 mt-[56px]"
      >
        <div style={{ height: '100%' }}>
          <Table
            columns={columns}
            dataSource={items}
            rowKey="key"
            size="middle"
            pagination={false}
            loading={loading}
            style={{ 
              height: '100%'
            }}
            className="no-scrollbar content-table"
          />
        </div>
      </Content>

      <Drawer
        title={
          <div className="flex items-center gap-2">
            <span>编辑 {selectedItem?.key}</span>
            {isModalJson && (
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                JSON
              </span>
            )}
            {selectedItem?.extraInfo && (
              <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                时间戳: {selectedItem.extraInfo}
              </span>
            )}
            {!isModalJson && !selectedItem?.extraInfo && isNumber(selectedItem?.value || '') && (
              <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-1 rounded">
                数字
              </span>
            )}
          </div>
        }
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        width="80%"
        placement="right"
        extra={
          <Space>
            {selectedItem?.extraInfo && (
              <Button
                onClick={() => {
                  if (selectedItem) {
                    const newValue = selectedItem.value.length === 10 ? 
                      Math.floor(Date.now() / 1000).toString() : 
                      Date.now().toString();
                    setSelectedItem({
                      ...selectedItem,
                      value: newValue,
                      extraInfo: new Date(Number(newValue) * (newValue.length === 10 ? 1000 : 1)).toLocaleString()
                    });
                  }
                }}
              >
                更新为当前时间
              </Button>
            )}
            <Button 
              type="primary" 
              onClick={() => {
                if (selectedItem) {
                  handleEdit(selectedItem);
                  setSelectedItem(null);
                }
              }}
            >
              保存
            </Button>
          </Space>
        }
        styles={{
          body: {
            padding: '20px',
            paddingBottom: 80
          }
        }}
      >
        <div style={{ height: 'calc(100vh - 200px)' }}>
          <CodeMirror
            value={selectedItem?.value || ''}
            height="100%"
            theme="light"
            extensions={isModalJson ? [json()] : []}
            onChange={(value) => {
              if (selectedItem) {
                const newItem = { ...selectedItem, value };
                if (isTimestamp(value)) {
                  newItem.extraInfo = new Date(Number(value) * (value.length === 10 ? 1000 : 1)).toLocaleString();
                } else {
                  delete newItem.extraInfo;
                }
                setSelectedItem(newItem);
              }
            }}
            style={{
              fontSize: 14,
            }}
          />
        </div>
      </Drawer>
    </Layout>
  );
}

export default App;
