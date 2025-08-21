import React, { forwardRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    [{ 'align': [] }],
    ['link'],
    ['clean']
  ],
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'list', 'bullet',
  'indent',
  'align',
  'link'
];

export const RichTextEditor = forwardRef<ReactQuill, RichTextEditorProps>(
  ({ value, onChange, placeholder, className, readOnly = false, ...props }, ref) => {
    return (
      <div className={cn("rich-text-editor", className)}>
        <ReactQuill
          ref={ref}
          theme="snow"
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          modules={modules}
          formats={formats}
          {...props}
        />
        <style dangerouslySetInnerHTML={{
          __html: `
            .rich-text-editor .ql-container {
              border-bottom-left-radius: 0.375rem;
              border-bottom-right-radius: 0.375rem;
              background: hsl(var(--background));
            }
            .rich-text-editor .ql-toolbar {
              border-top-left-radius: 0.375rem;
              border-top-right-radius: 0.375rem;
              background: hsl(var(--muted));
            }
            .rich-text-editor .ql-editor {
              min-height: 200px;
              color: hsl(var(--foreground));
            }
            .rich-text-editor .ql-editor.ql-blank::before {
              color: hsl(var(--muted-foreground));
            }
          `
        }} />
      </div>
    );
  }
);

RichTextEditor.displayName = "RichTextEditor";