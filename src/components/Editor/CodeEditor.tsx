import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { EditorView } from '@codemirror/view';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: string;
  isJson?: boolean;
  isDarkMode: boolean;
  readOnly?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value, onChange, height = '100%', isJson = false, isDarkMode, readOnly = false
}) => {
  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <CodeMirror
        value={value}
        height={height}
        theme={isDarkMode ? 'dark' : 'light'}
        extensions={[
          ...(isJson ? [json()] : []),
          EditorView.lineWrapping,
        ]}
        onChange={onChange}
        readOnly={readOnly}
        style={{ fontSize: 13 }}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: true,
          tabSize: 2,
        }}
      />
    </div>
  );
};
