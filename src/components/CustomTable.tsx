import React from 'react';
import { Space, Button, Spin, Popconfirm } from 'antd';
import { EditOutlined, CopyOutlined, DeleteOutlined } from '@ant-design/icons';
import { useLocale } from '../contexts/LocaleContext';

interface TableProps {
  data: {
    key: string;
    value: string;
    type: string;
    extraInfo?: string;
  }[];
  loading?: boolean;
  isDarkMode: boolean;
  onEdit: (record: { key: string; value: string; type: string; extraInfo?: string; }) => void;
  onCopy: (value: string) => void;
  onDelete: (key: string) => void;
  scroll?: { y: string | number };
}

export const CustomTable: React.FC<TableProps> = ({
  data,
  loading,
  isDarkMode,
  onEdit,
  onCopy,
  onDelete
}) => {

  const { t } = useLocale();
  return (
    <div className={`custom-table rounded-lg overflow-hidden ${isDarkMode ? 'dark' : ''}`}>
      {/* 表头 */}
      <div className={`table-header grid grid-cols-[30%_10%_40%_15%] gap-4 px-4 py-3 
        ${isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-gray-50'}`}>
        <div className="font-medium">{t('key')}</div>
        <div className="font-medium">{t('type')}</div>
        <div className="font-medium">{t('value')}</div>
        <div className="font-medium text-center">{t('actions')}</div>
      </div>

      {/* 表格内容 */}
      <div className="table-body relative">
        {loading ? (
          <div className={`flex items-center justify-center py-8 ${isDarkMode ? 'text-gray-300' : ''}`}>
            <Spin />
          </div>
        ) : (
          data.map((record) => (
            <div 
              key={record.key}
              className={`grid grid-cols-[30%_10%_40%_15%] gap-4 px-4 py-3 border-t 
                ${isDarkMode ? 
                  'border-gray-700 text-gray-300 hover:bg-gray-700/50' : 
                  'border-gray-100 hover:bg-gray-50'
                } transition-colors`}
            >
              <div className="break-all">{record.key}</div>
              <div>
                <TypeBadge type={record.type} />
              </div>
              <div 
                className="value-cell cursor-pointer"
                onClick={() => onEdit(record)}
                title={record.value}
              >
                {record.value}
              </div>
              <div className="flex justify-center">
                <Space>
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => onEdit(record)}
                    className="dark:text-gray-300 dark:hover:text-blue-300"
                  />
                  <Button
                    type="text"
                    icon={<CopyOutlined />}
                    onClick={() => onCopy(record.value)}
                    className="dark:text-gray-300 dark:hover:text-blue-300"
                  />
                  <Popconfirm
                    title={t('deleteConfirm')}
                    onConfirm={() => onDelete(record.key)}
                    okType="danger"
                    placement="left"
                    okText={t('confirm')}
                    cancelText={t('cancel')}
                  >
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      className="dark:!text-red-400 dark:hover:!text-red-300"
                    />
                  </Popconfirm>
                </Space>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const TypeBadge: React.FC<{ type: string }> = ({ type }) => {
  const colorMap = {
    Json: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300',
    Timestamp: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-300',
    Number: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-300',
    Boolean: 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300',
    String: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
  };

  const normalizedType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  const badgeClass = colorMap[normalizedType as keyof typeof colorMap] || colorMap.String;

  return (
    <span className={`px-2 py-1 rounded-full text-xs ${badgeClass}`}>
      {normalizedType}
    </span>
  );
}; 