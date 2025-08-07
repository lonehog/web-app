import React, { useState } from 'react';

export default function KeywordInput({ value = [], onChange }) {
  const [input, setInput] = useState('');

  function add(term) {
    const t = (term ?? input).trim();
    if (!t) return;
    const next = Array.from(new Set([...(value || []), t]));
    onChange(next);
    setInput('');
  }

  function remove(term) {
    const next = (value || []).filter(k => k !== term);
    onChange(next);
  }

  function onKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      add();
    }
  }

  return (
    <div>
      <div className="row">
        <input
          placeholder="Add keyword and press Enter"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <button type="button" className="btn secondary" onClick={() => add()}>Add</button>
      </div>
      <div className="keyword-list" style={{ marginTop: 8 }}>
        {(value || []).map(k => (
          <span key={k} className="keyword-tag">
            {k}
            <button
              type="button"
              className="linklike"
              style={{ marginLeft: 6 }}
              onClick={() => remove(k)}
              aria-label={`remove ${k}`}
              title="remove"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
