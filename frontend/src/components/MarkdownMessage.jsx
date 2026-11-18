import React from 'react';

/**
 * Clean, safe, zero-dependency Markdown formatter for Mindy AI Companion.
 * Formats bolding, italics, code spans, code blocks, lists, simple tables, and clean spacing.
 * Gracefully cleans up horizontal separators (---) and excessive markdown clutter.
 */
export default function MarkdownMessage({ content, isUser = false }) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let currentList = null;
  let currentListType = null; // 'ul' or 'ol'
  let inCodeBlock = false;
  let codeBlockLines = [];

  // Table parsing state
  let inTable = false;
  let tableHeader = [];
  let tableRows = [];

  const flushList = () => {
    if (currentList && currentList.length > 0) {
      if (currentListType === 'ol') {
        elements.push(
          <ol key={`ol-${elements.length}`} className="list-decimal pl-5 space-y-1.5 my-2">
            {currentList}
          </ol>
        );
      } else {
        elements.push(
          <ul key={`ul-${elements.length}`} className="list-disc pl-5 space-y-1.5 my-2">
            {currentList}
          </ul>
        );
      }
      currentList = null;
      currentListType = null;
    }
  };

  const flushTable = () => {
    if (inTable && (tableHeader.length > 0 || tableRows.length > 0)) {
      elements.push(
        <div key={`tbl-${elements.length}`} className="overflow-x-auto my-3 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            {tableHeader.length > 0 && (
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700 font-bold text-slate-900 dark:text-white">
                <tr>
                  {tableHeader.map((th, hIdx) => (
                    <th key={hIdx} className="p-2.5 sm:p-3 font-semibold">
                      {renderInlineFormatted(th)}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {tableRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-2.5 sm:p-3 text-slate-700 dark:text-slate-300 leading-relaxed">
                      {renderInlineFormatted(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      inTable = false;
      tableHeader = [];
      tableRows = [];
    }
  };

  const renderInlineFormatted = (text) => {
    if (!text) return null;
    const parts = [];
    let remaining = text;
    let keyIdx = 0;

    // Pattern matches `code`, **bold**, *italic*
    const inlineRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
    let match;
    let lastIndex = 0;

    while ((match = inlineRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const matchText = match[0];
      if (matchText.startsWith('`') && matchText.endsWith('`')) {
        parts.push(
          <code
            key={keyIdx++}
            className={`px-1.5 py-0.5 rounded-md font-mono text-[11px] ${
              isUser
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 dark:bg-slate-700/80 text-teal-700 dark:text-teal-300 border border-slate-200 dark:border-slate-600'
            }`}
          >
            {matchText.slice(1, -1)}
          </code>
        );
      } else if (matchText.startsWith('**') && matchText.endsWith('**')) {
        parts.push(
          <strong
            key={keyIdx++}
            className={`font-semibold ${isUser ? 'text-white' : 'text-slate-900 dark:text-white'}`}
          >
            {matchText.slice(2, -2)}
          </strong>
        );
      } else if (matchText.startsWith('*') && matchText.endsWith('*')) {
        parts.push(
          <em
            key={keyIdx++}
            className={`italic ${isUser ? 'text-white/90' : 'text-slate-700 dark:text-slate-300'}`}
          >
            {matchText.slice(1, -1)}
          </em>
        );
      }
      lastIndex = match.index + matchText.length;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Code blocks
    if (trimmed.startsWith('```')) {
      flushList();
      flushTable();
      if (inCodeBlock) {
        elements.push(
          <pre
            key={`code-${idx}`}
            className="p-3.5 my-2.5 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto shadow-inner leading-relaxed"
          >
            <code>{codeBlockLines.join('\n')}</code>
          </pre>
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      return;
    }

    // Markdown Table Row detection (e.g. | col 1 | col 2 |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList();
      const cells = trimmed
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim());

      // Check if separator row like |---|---|
      const isDivider = cells.every((c) => /^:?-+:?$/.test(c));
      if (isDivider) {
        return; // Skip markdown divider lines
      }

      if (!inTable) {
        inTable = true;
        tableHeader = cells;
      } else {
        tableRows.push(cells);
      }
      return;
    } else {
      flushTable();
    }

    // Suppress horizontal divider lines (e.g. --- or ***)
    if (/^[-*_]{3,}$/.test(trimmed)) {
      flushList();
      return;
    }

    // Empty lines simply end any active list or table
    if (!trimmed) {
      flushList();
      flushTable();
      return;
    }

    // Numbered List (e.g. 1. , 2. )
    const numberedMatch = trimmed.match(/^(\d+)[\.\)]\s+(.+)$/);
    if (numberedMatch) {
      if (currentListType !== 'ol') {
        flushList();
        currentListType = 'ol';
        currentList = [];
      }
      currentList.push(
        <li key={`li-num-${idx}`} className="leading-relaxed">
          {renderInlineFormatted(numberedMatch[2])}
        </li>
      );
      return;
    }

    // Bulleted List (e.g. - , * , • )
    const bulletMatch = trimmed.match(/^[\-\*\•]\s+(.+)$/);
    if (bulletMatch) {
      if (currentListType !== 'ul') {
        flushList();
        currentListType = 'ul';
        currentList = [];
      }
      currentList.push(
        <li key={`li-bul-${idx}`} className="leading-relaxed">
          {renderInlineFormatted(bulletMatch[1])}
        </li>
      );
      return;
    }

    // Regular line flushes active lists
    flushList();

    // Headings (rendered with moderate, clean font sizes to avoid shouting)
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 key={`h4-${idx}`} className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white mt-2.5 mb-1">
          {renderInlineFormatted(trimmed.slice(4))}
        </h4>
      );
    } else if (trimmed.startsWith('## ')) {
      elements.push(
        <h3 key={`h3-${idx}`} className="font-bold text-sm sm:text-base text-slate-900 dark:text-white mt-3 mb-1">
          {renderInlineFormatted(trimmed.slice(3))}
        </h3>
      );
    } else if (trimmed.startsWith('# ')) {
      elements.push(
        <h2 key={`h2-${idx}`} className="font-bold text-base text-slate-900 dark:text-white mt-3 mb-1.5">
          {renderInlineFormatted(trimmed.slice(2))}
        </h2>
      );
    } else {
      elements.push(
        <p key={`p-${idx}`} className="leading-relaxed">
          {renderInlineFormatted(trimmed)}
        </p>
      );
    }
  });

  flushList();
  flushTable();

  return <div className="space-y-2 text-slate-800 dark:text-slate-100">{elements}</div>;
}
