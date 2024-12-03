import React, { useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useLocale } from '../contexts/LocaleContext';
import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';
import { json } from '@codemirror/lang-json';

interface AddLocalStorageProps {
  isDarkMode: boolean;
  onAdd: (key: string, value: string) => Promise<void>;
}

export const AddLocalStorage: React.FC<AddLocalStorageProps> = ({ isDarkMode, onAdd }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState('');
  const { t } = useLocale();

  const handleAdd = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      await onAdd(values.key, value);
      setIsModalOpen(false);
      form.resetFields();
      setValue('');
      message.success(t('addSuccess'));
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'errorFields' in error) {
        // 表单验证错误
        return;
      }
      message.error(t('addFailed'));
      console.error('添加 localStorage 失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
    setValue('');
  };

  return (
    <>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => setIsModalOpen(true)}
        className={`${isDarkMode ? 'bg-blue-500 hover:bg-blue-400' : ''}`}
      >
        {t('add')}
      </Button>

      <Modal
        title={t('addLS')}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={[
          <Button
            key="cancel"
            onClick={handleCancel}
            className={isDarkMode ? 'dark' : ''}
          >
            {t('cancel')}
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={loading}
            onClick={handleAdd}
            className={isDarkMode ? 'bg-blue-500 hover:bg-blue-400' : ''}
          >
            {t('confirm')}
          </Button>
        ]}
        className={isDarkMode ? 'dark' : ''}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          className={isDarkMode ? 'dark' : ''}
        >
          <Form.Item
            name="key"
            label={t('key')}
            rules={[
              { required: true, message: t('keyRequired') },
              { max: 100, message: t('keyTooLong') }
            ]}
          >
            <Input 
              className={isDarkMode ? 'dark-input' : ''} 
              placeholder={t('keyPlaceholder')}
            />
          </Form.Item>
          <Form.Item
            label={t('value')}
            required
            validateStatus={value ? undefined : 'error'}
            help={value ? undefined : t('valueRequired')}
          >
            <div style={{ border: '1px solid #d9d9d9', borderRadius: '6px' }}>
              <CodeMirror
                value={value}
                height="200px"
                theme={isDarkMode ? 'dark' : 'light'}
                extensions={[
                  json(),
                  EditorView.lineWrapping,
                ]}
                onChange={(value) => {
                  setValue(value);
                }}
                style={{
                  fontSize: 14,
                }}
                basicSetup={{
                  lineNumbers: true,
                  foldGutter: true,
                  highlightActiveLine: true,
                  tabSize: 2,
                }}
              />
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}; 