import React, { useRef, useEffect, useState, useCallback } from "react";
import { debounce } from "lodash";

interface Variable {
  id: number;
  label: string;
}

interface VariableInputBoxProps {
  onChange?: (value: string) => void;
  variables: Variable[];
  defaultValue?: string;
  placeholder?: string;
  className?: string;
}

const VariableInputBox = ({
  onChange,
  variables,
  defaultValue,
  placeholder = "Type here with {{variable}}",
  className = "",
}: VariableInputBoxProps): JSX.Element => {
  const editorRef = useRef<HTMLDivElement>(null);
  const suggestionBoxRef = useRef<HTMLDivElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionPosition, setSuggestionPosition] = useState({
    top: 0,
    left: 0,
  });
  const [filteredVars, setFilteredVars] = useState<Variable[]>([]);
  const [selectedVariableId, setSelectedVariableId] = useState<number | null>(
    null
  );

  const handleInput = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

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
      setSelectedVariableId(null);
    } else {
      setShowSuggestions(false);
    }

    if (onChange) {
      onChange(getPlainText(editor));
    }
  }, [onChange, variables]);

  const debouncedHandleInput = useCallback(debounce(handleInput, 100), [
    handleInput,
  ]);

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

    editor.addEventListener("input", debouncedHandleInput);
    return () => editor.removeEventListener("input", debouncedHandleInput);
  }, [onChange, variables, defaultValue, debouncedHandleInput]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      const pastedText = e.clipboardData?.getData("text/plain") || "";
      const parsedContent = parseDefaultValue(pastedText, variables);
      document.execCommand("insertHTML", false, parsedContent);

      // Trigger suggestions if pasted text ends with {{keyword
      const text = editor.innerText;
      const word = getLastWordBeforeCaret(editor);
      const match = word.match(/\{\{(\w*)$/);
      if (match) {
        const keyword = match[1];
        const matchedVars = variables.filter((v) =>
          v.label.toLowerCase().startsWith(keyword.toLowerCase())
        );
        setFilteredVars(matchedVars);
        const selection = window.getSelection();
        const range = selection?.getRangeAt(0);
        if (range) {
          const rect = range.getBoundingClientRect();
          const editorRect = editor.getBoundingClientRect();
          setSuggestionPosition({
            top: rect.top - editorRect.top + 20,
            left: rect.left - editorRect.left,
          });
          setShowSuggestions(true);
        }
      }

      if (onChange) {
        onChange(getPlainText(editor));
      }
    };

    editor.addEventListener("paste", handlePaste);
    return () => editor.removeEventListener("paste", handlePaste);
  }, [onChange, variables]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Backspace") {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return;
        const range = sel.getRangeAt(0);
        const startNode = range.startContainer;
        const startOffset = range.startOffset;

        // Prevent default if we're deleting a span
        let shouldPreventDefault = false;

        // Case 1: Caret in a text node
        if (startNode.nodeType === Node.TEXT_NODE && startNode.parentNode) {
          const parent = startNode.parentNode;
          if (!parent) return;
          const childNodes = Array.from(parent.childNodes);
          const nodeIndex = childNodes.indexOf(startNode as ChildNode);

          // Check for previous span (e.g., after {{username}})
          if (startOffset === 0 && nodeIndex > 0) {
            const prevNode = childNodes[nodeIndex - 1];
            if (prevNode.nodeName === "SPAN") {
              shouldPreventDefault = true;
              parent.removeChild(prevNode);
            }
          }

          // Check if at the start of the editor
          if (startOffset === 0 && nodeIndex === 0 && childNodes.length > 0) {
            const firstNode = childNodes[0];
            if (firstNode.nodeName === "SPAN") {
              shouldPreventDefault = true;
              parent.removeChild(firstNode);
            }
          }
        }

        // Case 2: Caret at the start of the editor with no text node
        if (startNode === editor && startOffset === 0) {
          const childNodes = Array.from(editor.childNodes);
          if (childNodes.length > 0 && childNodes[0].nodeName === "SPAN") {
            shouldPreventDefault = true;
            editor.removeChild(childNodes[0]);
          }
        }

        // Case 3: Caret after a span with no text node in between (e.g., {{username}}{{email}})
        if (startNode.nodeName === "SPAN" && startNode.parentNode) {
          shouldPreventDefault = true;
          const span = startNode;
          const parent = span.parentNode;
          if (!parent) return;
          const childNodes = Array.from(parent.childNodes);
          const nodeIndex = childNodes.indexOf(span as ChildNode);
          if (nodeIndex > 0) {
            const prevNode = childNodes[nodeIndex - 1];
            if (prevNode.nodeName === "SPAN") {
              parent.removeChild(prevNode);
            } else {
              parent.removeChild(span);
            }
          } else {
            parent.removeChild(span);
          }
        }

        if (shouldPreventDefault) {
          e.preventDefault();
          if (onChange) {
            onChange(getPlainText(editor));
          }
        }
      }
    };

    editor.addEventListener("keydown", handleKeyDown);
    return () => editor.removeEventListener("keydown", handleKeyDown);
  }, [onChange]);

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
    let node = sel.focusNode;

    if (selectedVariableId !== null) {
      // Replace existing variable
      const span = editor.querySelector(
        `span[data-id="${selectedVariableId}"]`
      );
      if (span && span.parentNode) {
        node = span.parentNode;
        range.selectNode(span);
        range.deleteContents();
      }
      setSelectedVariableId(null);
    }

    if (!node || node.nodeType !== Node.TEXT_NODE) {
      // If not in a text node, insert at the end of the editor
      const textNode = document.createTextNode("");
      editor.appendChild(textNode);
      range.setStart(textNode, 0);
      range.setEnd(textNode, 0);
      node = textNode;
    }

    const textNode = node as Text;
    const fullText = textNode.textContent || "";
    const caretPos = sel.focusOffset;

    // Split text before and after caret
    const beforeCaret = fullText.slice(0, caretPos);
    const afterCaret = fullText.slice(caretPos);

    // Match the last `{{` and text following it
    const match = beforeCaret.match(/(.*?)(\{\{[\w]*)$/);
    const prefix = match ? match[1] : beforeCaret;
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

    // Add click handler for deletion/replacement
    span.addEventListener("click", () => {
      setSelectedVariableId(variable.id);
      setFilteredVars(variables);
      setShowSuggestions(true);
      const range = document.createRange();
      range.selectNode(span);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      const rect = range.getBoundingClientRect();
      const editorRect = editor.getBoundingClientRect();
      setSuggestionPosition({
        top: rect.top - editorRect.top + 20,
        left: rect.left - editorRect.left,
      });
    });

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
        className={`border border-gray-300 rounded px-3 py-2 min-h-[40px] focus:outline-none focus:ring-2 focus:ring-blue-400 ${className}`}
        data-placeholder={placeholder}
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
export type { Variable, VariableInputBoxProps };