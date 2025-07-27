import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import mermaid from 'mermaid';
import 'highlight.js/styles/github.css'; // 代码高亮样式

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// 初始化 Mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'inherit',
  fontSize: 14,
  flowchart: {
    htmlLabels: true,
    curve: 'basis'
  }
});

// 提取mermaid代码块的函数 - 移到组件外部
const extractMermaidBlocks = (text: string) => {
  const mermaidRegex = /```mermaid\n([\s\S]*?)\n```/g;
  const blocks: { [key: string]: string } = {};
  let match;
  let index = 0;
  
  while ((match = mermaidRegex.exec(text)) !== null) {
    const key = `mermaid-${index++}`;
    blocks[key] = match[1].trim();
  }
  
  return blocks;
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mermaidElements, setMermaidElements] = useState<{ [key: string]: string }>({});

  // 当content变化时，提取并渲染mermaid图表
  useEffect(() => {
    const blocks = extractMermaidBlocks(content);
    
    // 异步渲染所有mermaid图表
    const renderMermaidBlocks = async () => {
      const renderedBlocks: { [key: string]: string } = {};
      
      for (const [key, code] of Object.entries(blocks)) {
        try {
          const { svg } = await mermaid.render(`${key}-${Date.now()}`, code);
          renderedBlocks[key] = svg;
        } catch (error: any) {
          console.error('Mermaid 渲染错误:', error);
          renderedBlocks[key] = `
            <div class="mermaid-error bg-red-50 border border-red-200 rounded p-3 my-2">
              <div class="text-red-600 text-sm">
                <strong>Mermaid 渲染失败:</strong> ${error?.message || '未知错误'}
              </div>
              <details class="mt-2">
                <summary class="text-red-500 cursor-pointer text-xs">查看原始代码</summary>
                <pre class="bg-gray-100 p-2 mt-1 rounded text-xs overflow-x-auto">${code}</pre>
              </details>
            </div>
          `;
        }
      }
      
      setMermaidElements(renderedBlocks);
    };
    
    if (Object.keys(blocks).length > 0) {
      renderMermaidBlocks();
    } else {
      setMermaidElements({});
    }
  }, [content]);

  return (
    <div 
      ref={containerRef}
      className={`markdown-content ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // 自定义代码块渲染
          code({ node, className, children, ...props }: any) {
            const inline = props.inline;
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            
            if (!inline && language === 'mermaid') {
              // 对于 mermaid 代码块，查找对应的渲染结果
              const code = String(children).trim();
              const mermaidKey = Object.keys(mermaidElements).find(key => {
                // 通过代码内容匹配
                return extractMermaidBlocks(content)[key] === code;
              });
              
              if (mermaidKey && mermaidElements[mermaidKey]) {
                return (
                  <div 
                    className="mermaid-diagram"
                    dangerouslySetInnerHTML={{ __html: mermaidElements[mermaidKey] }}
                  />
                );
              }
              
              // 如果还没有渲染结果，显示加载状态
              return (
                <div className="bg-gray-100 rounded p-3 text-center">
                  <div className="text-gray-500">正在渲染 Mermaid 图表...</div>
                </div>
              );
            }
            
            return !inline ? (
              <pre className="bg-gray-100 rounded p-3 overflow-x-auto">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            ) : (
              <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props}>
                {children}
              </code>
            );
          },
          // 自定义表格样式
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full border-collapse border border-gray-300">
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="border border-gray-300 bg-gray-100 px-3 py-2 text-left font-semibold">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="border border-gray-300 px-3 py-2">
                {children}
              </td>
            );
          },
          // 自定义链接样式
          a({ children, href }) {
            return (
              <a 
                href={href} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                {children}
              </a>
            );
          },
          // 自定义标题样式
          h1({ children }) {
            return <h1 className="text-2xl font-bold mb-4 mt-6 first:mt-0">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-xl font-bold mb-3 mt-5">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-lg font-bold mb-2 mt-4">{children}</h3>;
          },
          h4({ children }) {
            return <h4 className="text-base font-bold mb-2 mt-3">{children}</h4>;
          },
          // 自定义列表样式
          ul({ children }) {
            return <ul className="list-disc list-inside my-2 ml-4 space-y-1">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal list-inside my-2 ml-4 space-y-1">{children}</ol>;
          },
          // 自定义段落样式
          p({ children }) {
            return <p className="my-2 leading-relaxed">{children}</p>;
          },
          // 自定义引用样式
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-gray-300 pl-4 py-2 my-4 bg-gray-50 italic">
                {children}
              </blockquote>
            );
          },
          // 自定义分隔线样式
          hr() {
            return <hr className="my-6 border-gray-300" />;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer; 