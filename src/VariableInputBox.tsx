import React, { useRef, useEffect, useState } from "react";

export interface Variable {
  id: number;
  label: string;
}

export interface VariableInputBoxProps {
  onChange?: (value: string) => void;
  variables: Variable[];
  defaultValue?: string;
}

const VariableInputBox = ({
  onChange,
  variables,
  defaultValue,
}: VariableInputBoxProps): JSX.Element => {
  const editorRef = useRef<HTMLDivElement>(null);
  const suggestionBoxRef = useRef<HTMLDivElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionPosition, setSuggestionPosition] = useState({
    top: 0,
    left: 0,
  });
  const [filteredVars, setFilteredVars] = useState<Variable[]>([]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    // Set default value if provided
    if (defaultValue && !editor.innerHTML) {
      const parsedContent = parseDefaultValue(defaultValue, variables);
      editor.innerHTML = parsedContent;
      if (onChange) {
        onChange(getPlainText(editor));
      }
    }

    const handleInput = () => {
      const text = editor.innerText;
      const selection = window.getSelection();
      const range = selection?.getRangeAt(0);
      if (!range) return;

      const word = getLastWordBeforeCaret(editor);
      const match = word.match(/\{\{(\w*)$/);

      if (match) {
        const keyword = match[1];
        const matchedVars = variables.filter((v) =>
          v.label.toLowerCase().startsWith(keyword.toLowerCase())
        );
        setFilteredVars(matchedVars);
        const rect = range.getBoundingClientRect();
        const editorRect = editor.getBoundingClientRect();
        setSuggestionPosition({
          top: rect.top - editorRect.top + 20,
          left: rect.left - editorRect.left,
        });
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }

      if (onChange) {
        onChange(getPlainText(editor));
      }
    };

    editor.addEventListener("input", handleInput);
    return () => editor.removeEventListener("input", handleInput);
  }, [onChange, variables, defaultValue]);

  const parseDefaultValue = (text: string, variables: Variable[]): string => {
    let result = text;
    variables.forEach((variable) => {
      const regex = new RegExp(`\\{\\{${variable.id}\\}\\}`, "g");
      const span = `<span data-id="${variable.id}" contenteditable="false" class="inline-block bg-blue-200 text-blue-900 font-semibold text-sm px-2.5 py-1 rounded-lg mr-1 shadow-sm hover:bg-blue-300 hover:scale-105 transition-all duration-200 cursor-pointer" title="${variable.label}">{{${variable.label}}}</span>`;
      result = result.replace(regex, span);
    });
    return result;
  };

  const getLastWordBeforeCaret = (editor: HTMLElement) => {
    const sel = window.getSelection();
    if (!sel || !sel.focusNode) return "";
    const textBeforeCaret =
      sel.focusNode.textContent?.substring(0, sel.focusOffset) || "";
    return textBeforeCaret.split(/\s/).pop() || "";
  };

  const insertVariable = (variable: Variable) => {
    const editor = editorRef.current;
    if (!editor) return;

    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;

    const range = sel.getRangeAt(0);
    const node = sel.focusNode;

    if (!node || node.nodeType !== Node.TEXT_NODE) return;

    const textNode = node as Text;
    const fullText = textNode.textContent || "";
    const caretPos = sel.focusOffset;

    // Split text before and after caret
    const beforeCaret = fullText.slice(0, caretPos);
    const afterCaret = fullText.slice(caretPos);

    // Match the last `{{` and text following it
    const match = beforeCaret.match(/(.*?)(\{\{[\w]*)$/);
    if (!match) return;

    const prefix = match[1]; // text before {{

    // Determine if spaces are needed before and after
    const hasSpaceBefore = prefix.length === 0 || prefix.endsWith(" ");
    const hasSpaceAfter = afterCaret.length === 0 || afterCaret.startsWith(" ");
    const spaceBefore = hasSpaceBefore ? "" : " ";
    const spaceAfter = hasSpaceAfter ? "" : " ";

    // Create the variable span
    const span = document.createElement("span");
    span.textContent = `{{${variable.label}}}`;
    span.setAttribute("data-id", variable.id.toString());
    span.contentEditable = "false";
    span.className =
      "inline-block bg-blue-200 text-blue-900 font-semibold text-sm px-2.5 py-1 rounded-lg mr-1 shadow-sm hover:bg-blue-300 hover:scale-105 transition-all duration-200 cursor-pointer";
    span.title = variable.label;

    // Replace the current text node with the corrected structure
    const newTextBefore = document.createTextNode(prefix + spaceBefore);
    const newTextAfter = document.createTextNode(spaceAfter + afterCaret);
    const parent = textNode.parentNode;
    if (!parent) return;

    parent.replaceChild(newTextAfter, textNode);
    parent.insertBefore(span, newTextAfter);
    parent.insertBefore(newTextBefore, span);

    setShowSuggestions(false);
    placeCaretAfterNode(newTextAfter);

    if (onChange) {
      onChange(getPlainText(editor));
    }
  };

  const placeCaretAfterNode = (node: Node) => {
    const sel = window.getSelection();
    const range = document.createRange();
    range.setStartAfter(node);
    range.collapse(true);
    sel?.removeAllRanges();
    sel?.addRange(range);
  };

  const getPlainText = (el: HTMLElement): string => {
    const clone = el.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("span").forEach((span) => {
      const id = span.getAttribute("data-id");
      if (id) {
        span.outerHTML = `{{${id}}}`;
      } else {
        span.outerHTML = span.innerText;
      }
    });
    return clone.innerText;
  };

  return (
    <div className="relative">
      <div
        ref={editorRef}
        contentEditable
        className="border border-gray-300 rounded px-3 py-2 min-h-[40px] focus:outline-none focus:ring-2 focus:ring-blue-400"
        data-placeholder="Type here with {{variable}}"
      ></div>

      {showSuggestions && filteredVars.length > 0 && (
        <div
          ref={suggestionBoxRef}
          className="absolute bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto"
          style={{
            top: suggestionPosition.top,
            left: suggestionPosition.left,
          }}
        >
          {filteredVars.map((v) => (
            <div
              key={v.id}
              className="px-3 py-1.5 hover:bg-blue-100 cursor-pointer text-sm text-gray-800"
              onMouseDown={(e) => {
                e.preventDefault();
                insertVariable(v);
              }}
            >
              {v.label} <span className="text-gray-500 text-xs">({v.id})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VariableInputBox;
