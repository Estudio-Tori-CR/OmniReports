"use client";
import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import style from "./style.module.css";
import { FaRegTrashAlt } from "react-icons/fa";

export interface MultiSelectOption {
  text: string;
  value: string;
}

interface Props {
  labelText: string;
  id?: string;
  options: MultiSelectOption[];
  values: string[];
  placeholder?: string;
  minChars?: number;
  isRequered?: boolean;
  disable?: boolean;
  maxSelected?: number;
  onChange: (values: string[]) => void;
}

const PersonalMultiSelect: React.FC<Props> = ({
  labelText,
  id,
  options,
  values,
  placeholder = "Search...",
  minChars = 2,
  isRequered = false,
  disable = false,
  maxSelected,
  onChange,
}) => {
  const reactId = useId();
  const inputId =
    id || `${labelText.toLowerCase().replace(/\s+/g, "-")}-${reactId}`;
  const listboxId = `${inputId}-listbox`;
  const descId = `${inputId}-desc`;

  const [query, setQuery] = useState("");
  const [currentFocus, setCurrentFocus] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const selectedSet = useMemo(() => new Set(values), [values]);

  const canSelectMore =
    typeof maxSelected === "number" ? values.length < maxSelected : true;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < minChars) return [];
    return options
      .filter((o) => o.text.toLowerCase().startsWith(q))
      .filter((o) => !selectedSet.has(o.value));
  }, [options, query, minChars, selectedSet]);

  const openIfPossible = () => {
    if (disable) return;
    if (
      query.trim().length >= minChars &&
      filtered.length > 0 &&
      canSelectMore
    ) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    openIfPossible();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filtered.length, disable, canSelectMore]);

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setCurrentFocus(-1);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  const addValue = (value: string) => {
    if (disable) return;
    if (!canSelectMore) return;
    if (selectedSet.has(value)) return;

    onChange([...values, value]);
    setQuery("");
    setIsOpen(false);
    setCurrentFocus(-1);

    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const removeValue = (value: string) => {
    if (disable) return;
    onChange(values.filter((v) => v !== value));
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disable) return;

    if (!isOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      if (
        filtered.length > 0 &&
        query.trim().length >= minChars &&
        canSelectMore
      ) {
        setIsOpen(true);
      }
    }

    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCurrentFocus((prev) =>
        filtered.length ? (prev + 1) % filtered.length : -1,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCurrentFocus((prev) =>
        filtered.length ? (prev - 1 + filtered.length) % filtered.length : -1,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (currentFocus > -1 && filtered[currentFocus]) {
        addValue(filtered[currentFocus].value);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setCurrentFocus(-1);
    }
  };

  const activeDescendantId =
    currentFocus > -1 && filtered[currentFocus]
      ? `${inputId}-opt-${filtered[currentFocus].value}`
      : undefined;

  return (
    <div className={style.container} ref={rootRef}>
      <label className={style.label} htmlFor={inputId}>
        {labelText}
        {isRequered ? <span style={{ color: "red" }}>*</span> : null}
      </label>

      <div className={style.autocomplete}>
        <input
          ref={inputRef}
          id={inputId}
          className={style.searchInput}
          type="text"
          value={query}
          disabled={disable}
          required={isRequered && values.length === 0}
          placeholder={placeholder}
          spellCheck={false}
          data-ms-editor="true"
          role="combobox"
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-describedby={descId}
          aria-activedescendant={activeDescendantId}
          onChange={(e) => {
            setQuery(e.target.value);
            setCurrentFocus(-1);
          }}
          onKeyDown={onKeyDown}
          onFocus={() => openIfPossible()}
        />

        {isOpen && (
          <div
            id={listboxId}
            className={style.suggestionsBox}
            role="listbox"
            aria-live="assertive"
            aria-atomic="true"
          >
            {filtered.map((item, idx) => {
              const isActive = idx === currentFocus;
              return (
                <button
                  key={item.value + idx}
                  id={`${inputId}-opt-${item.value}`}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  className={`${style.suggestionBtn} ${
                    isActive ? style.autocompleteActive : ""
                  }`}
                  onMouseEnter={() => setCurrentFocus(idx)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => addValue(item.value)}
                  tabIndex={-1}
                  disabled={!canSelectMore}
                >
                  {item.text}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <ul
        className={style.selectedItemsContainer}
        aria-live="assertive"
        aria-atomic="true"
      >
        {values.map((value) => {
          const option = options.find((o) => o.value === value);
          const text = option?.text ?? value;

          return (
            <li key={value}>
              <span className={style.selectedText}>{text}</span>
              <button
                type="button"
                onClick={() => removeValue(value)}
                disabled={disable}
              >
                <FaRegTrashAlt />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PersonalMultiSelect;
