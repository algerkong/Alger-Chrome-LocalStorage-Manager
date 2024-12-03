import { useEffect, useState } from 'react';
import { Layout, Button, Drawer, message, Space, Tooltip, Dropdown, Input, Spin } from 'antd';
import { CopyOutlined, ReloadOutlined, SunOutlined, MoonOutlined, MoreOutlined, SearchOutlined } from '@ant-design/icons';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { useLocale } from './contexts/LocaleContext';
import { EditorView } from '@codemirror/view';
import { CustomTable } from './components/CustomTable';

const { Header, Content } = Layout;

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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { t, setLocale } = useLocale();
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    // 检查系统主题
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const setThemeFromSystem = (e: MediaQueryListEvent | MediaQueryList) => {
      const systemDarkMode = e.matches;
      chrome.storage.local.get(['isDarkMode'], (result) => {
        if (typeof result.isDarkMode === 'undefined') {
          setIsDarkMode(systemDarkMode);
          chrome.storage.local.set({ isDarkMode: systemDarkMode });
        } else {
          setIsDarkMode(result.isDarkMode);
        }
      });
    };

    // 初始检查
    setThemeFromSystem(mediaQuery);

    // 监听系统主题变化
    const handleThemeChange = (e: MediaQueryListEvent) => {
      chrome.storage.local.get(['isDarkMode'], (result) => {
        if (typeof result.isDarkMode === 'undefined') {
          setThemeFromSystem(e);
        }
      });
    };

    mediaQuery.addEventListener('change', handleThemeChange);

    // 监听存储变化
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.isDarkMode) {
        setIsDarkMode(changes.isDarkMode.newValue);
      }
    };

    chrome.storage.local.onChanged.addListener(handleStorageChange);

    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
      chrome.storage.local.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  // 添加新的 useEffect 来处理主题类
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

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
      messageApi.error(t('getLSError'));
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
      messageApi.success(t('saveSuccess'));
    } catch (error) {
      messageApi.error(t('saveFailed'));
      console.error('编辑 localStorage 失:', error);
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
      messageApi.success(t('deleteSuccess'));
    } catch (error) {
      messageApi.error(t('deleteFailed'));
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
        tabId: tab.id?.toString() || '',
        isDarkMode: isDarkMode.toString()
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
        tabId: tab.id?.toString() || '',
        isDarkMode: isDarkMode.toString()
      });
      chrome.windows.create({
        url: chrome.runtime.getURL(`detail.html?${params.toString()}`),
        type: 'popup',
        width: 1200,
        height: 800
      });
    }
  };

  // 添加一个工具函数来判断数据类型
  const getValueType = (value: string): string => {
    try {
      // 检查布尔值
      if (value === 'true' || value === 'false') {
        return 'Boolean';
      }
      // 尝试解析 JSON
      JSON.parse(value);
      return 'JSON';
    } catch {
      if (isTimestamp(value)) {
        return 'Timestamp';
      }
      if (isNumber(value)) {
        return 'Number';
      }
      return 'String';
    }
  };
  // 添加复制代码函数
  const copySetupCode = () => {
    const lsData = items.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {} as Record<string, string>);

    const setupCode = `var ls = ${JSON.stringify(lsData, null, 2)};\nObject.keys(ls).forEach(k => localStorage[k] = ls[k]);`;
    navigator.clipboard.writeText(setupCode);
    messageApi.success(t('copied'));
  };

  // 添加搜索过滤函数
  const filteredItems = items.filter(item => 
    item.key.toLowerCase().includes(searchText.toLowerCase()) ||
    item.value.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <Layout className={`min-w-[784px] transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 dark' : 'bg-gray-50'}`}>

      {loading ? (
          <div className={`flex items-center justify-center h-[600px] py-8 ${isDarkMode ? 'bg-gray-900' : ''}`}>
            <Spin />
          </div>
        ): 
        (<>
          {contextHolder}
          <Header 
            className={`flex items-center justify-between px-4 py-2 shadow-md fixed top-0 left-0 right-0 z-10 transition-colors duration-300
              ${isDarkMode ? 'bg-gray-800 shadow-gray-700/30 text-gray-100' : 'bg-white shadow-gray-200/50'}`}
            style={{ height: '56px', borderRadius: '0 0 16px 16px' }}
          >
            <div className="flex items-center gap-4">
              <div className={`m-0 text-xl font-medium ${isDarkMode ? 'text-gray-100 !important' : ''}`}>
                {t('title')}
              </div>
            </div>
            <Space>
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'copy',
                      label: t('copySetupCode'),
                      icon: <CopyOutlined />,
                      onClick: copySetupCode
                    },
                    {
                      type: 'divider'
                    },
                    {
                      key: 'theme',
                      label: isDarkMode ? t('lightMode') : t('darkMode'),
                      icon: isDarkMode ? <SunOutlined /> : <MoonOutlined />,
                      onClick: () => {
                        const newDarkMode = !isDarkMode;
                        setIsDarkMode(newDarkMode);
                        chrome.storage.local.set({ isDarkMode: newDarkMode }, () => {
                          console.log('Theme saved:', newDarkMode);
                          if (chrome.runtime.lastError) {
                            console.error('Save theme error:', chrome.runtime.lastError);
                          }
                        });
                      }
                    },
                    {
                      type: 'divider'
                    },
                    {
                      key: 'language',
                      label: t('language'),
                      children: [
                        {
                          key: 'zh_CN',
                          label: '中文',
                          onClick: () => setLocale('zh_CN')
                        },
                        {
                          key: 'en_US',
                          label: 'English',
                          onClick: () => setLocale('en_US')
                        }
                      ]
                    }
                  ]
                }}
                trigger={['hover']}
                placement="bottomRight"
              >
                <Button
                  className={`hover:border-blue-400 hover:text-blue-400 transition-colors ${
                    isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-300 hover:text-blue-300 hover:border-blue-300' : ''
                  }`}
                  icon={<MoreOutlined />}
                />
              </Dropdown>
              <Tooltip title={t('refreshTip')}>
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={fetchLocalStorage}
                  loading={loading}
                  className={isDarkMode ? 'bg-blue-500 hover:bg-blue-400' : ''}
                >
                  {t('refresh')}
                </Button>
              </Tooltip>
            </Space>
          </Header>
          
          <Content className="p-4 mt-[56px]">
            <div className="mb-4 sticky top-[56px] z-10 py-2" style={{ 
              backgroundColor: isDarkMode ? '#111827' : '#f9fafb'
            }}>
              <Input
                placeholder={t('searchPlaceholder')}
                prefix={<SearchOutlined className={isDarkMode ? 'text-gray-400' : ''} />}
                onChange={e => setSearchText(e.target.value)}
                allowClear
                className={`${isDarkMode ? 'dark-search-input' : ''}`}
                style={{
                  backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                  borderColor: isDarkMode ? '#374151' : undefined,
                  color: isDarkMode ? '#e5e7eb' : undefined
                }}
              />
            </div>
            <CustomTable
              data={filteredItems.map(item => ({
                ...item,
                type: getValueType(item.value),
                value: item.value
              }))}
              loading={loading}
              isDarkMode={isDarkMode}
              onEdit={handleValueClick}
              onCopy={(value) => {
                navigator.clipboard.writeText(value);
                messageApi.success(t('copied'));
              }}
              onDelete={handleDelete}
              scroll={{ y: 'calc(100vh - 180px)' }}
            />
          </Content>

          <Drawer
            title={
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{t('editLS')}:</span>
                  <span className="break-all">{selectedItem?.key}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedItem && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      getValueType(selectedItem.value) === 'JSON' ? 'bg-blue-100 text-blue-600' :
                      getValueType(selectedItem.value) === 'Timestamp' ? 'bg-green-100 text-green-600' :
                      getValueType(selectedItem.value) === 'Number' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {getValueType(selectedItem.value)}
                    </span>
                  )}
                  {selectedItem?.extraInfo && (
                    <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full whitespace-nowrap">
                      {t('timestamp')}: {selectedItem.extraInfo}
                    </span>
                  )}
                </div>
              </div>
            }
            open={!!selectedItem}
            onClose={() => setSelectedItem(null)}
            width="80%"
            placement="right"
            className={isDarkMode ? 'dark' : ''}
            styles={{
              header: {
                paddingTop: 16,
                paddingBottom: 16,
              },
              body: {
                padding: '20px',
                paddingBottom: 80
              }
            }}
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
                    {t('updateToNow')}
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
                  {t('save')}
                </Button>
              </Space>
            }
          >
            <div style={{ height: 'calc(100vh - 200px)' }}>
              <CodeMirror
                value={selectedItem?.value || ''}
                height="100%"
                theme="light"
                extensions={[
                  ...(isModalJson ? [json()] : []),
                  EditorView.lineWrapping,
                ]}
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
                basicSetup={{
                  lineNumbers: true,
                  foldGutter: true,
                  highlightActiveLine: true
                }}
              />
            </div>
            </Drawer>
          </>
      )}
    </Layout>
  );
}

export default App;
