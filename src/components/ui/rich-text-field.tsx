"use client";

import { useEffect, useId, useRef, type MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { Bold, Italic, List } from "lucide-react";

type Props = {
  label: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  optional?: boolean;
};

export function RichTextField({
  label,
  value,
  onChange,
  placeholder,
  optional,
}: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const focusedRef = useRef(false);
  const fieldId = useId();

  // Hydrate only when not focused, so formatting/caret are not wiped.
  useEffect(() => {
    const el = editorRef.current;
    if (!el || focusedRef.current) return;
    const next = value || "";
    if (el.innerHTML !== next) {
      el.innerHTML = next;
    }
  }, [value]);

  function emitChange() {
    const el = editorRef.current;
    if (!el) return;
    const html = el.innerHTML;
    const normalized =
      html === "<br>" || html === "<div><br></div>" ? "" : html;
    onChange(normalized);
  }

  function runCommand(command: string) {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    document.execCommand(command, false);
    emitChange();
  }

  function onToolbarMouseDown(
    event: MouseEvent<HTMLButtonElement>,
    command: string,
  ) {
    // Keep text selection when clicking toolbar buttons
    event.preventDefault();
    runCommand(command);
  }

  return (
    <div className="field">
      <div className="field-label" id={`${fieldId}-label`}>
        {label}
        {optional ? <span className="hint"> (opcional)</span> : null}
      </div>
      <div className="rte">
        <div
          className="rte-toolbar"
          role="toolbar"
          aria-label={`Formatação ${label}`}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="btn-sm"
            aria-label="Negrito"
            title="Negrito"
            onMouseDown={(e) => onToolbarMouseDown(e, "bold")}
          >
            <Bold size={14} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="btn-sm"
            aria-label="Itálico"
            title="Itálico"
            onMouseDown={(e) => onToolbarMouseDown(e, "italic")}
          >
            <Italic size={14} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="btn-sm"
            aria-label="Lista"
            title="Lista"
            onMouseDown={(e) => onToolbarMouseDown(e, "insertUnorderedList")}
          >
            <List size={14} />
          </Button>
        </div>
        <div
          id={fieldId}
          ref={editorRef}
          className="rte-editor"
          contentEditable
          role="textbox"
          aria-multiline="true"
          aria-labelledby={`${fieldId}-label`}
          data-placeholder={placeholder}
          onFocus={() => {
            focusedRef.current = true;
          }}
          onBlur={() => {
            focusedRef.current = false;
            emitChange();
          }}
          onInput={emitChange}
          suppressContentEditableWarning
        />
      </div>
    </div>
  );
}
