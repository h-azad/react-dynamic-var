# react-dynamic-var

A React component for content-editable text input with variable autocompletion. It displays variables as `{{label}}` in the UI and outputs `{{id}}` in the plain text, with automatic spacing around inserted variables.

## Features
- Autocomplete variables by typing `{{` followed by a label.
- Displays variables as styled, non-editable tags with `{{label}}`.
- Outputs plain text with `{{id}}` for use in callbacks.
- Automatically adds spaces around inserted variables for separation.
- TypeScript support with type definitions.
- Styling with Tailwind CSS (optional, customizable with plain CSS).

## Installation

```bash
npm install react-dynamic-var

Usage
import React from 'react';
import VariableInputBox from 'react-dynamic-var';

const variables = [
  { id: 1, label: 'name' },
  { id: 2, label: 'email' },
  { id: 3, label: 'phone' },
];

function App() {
  return (
    <VariableInputBox
      variables={variables}
      onChange={(value) => console.log('Editor content:', value)}
    />
  );
}

export default App;


Typing {{na: Shows a suggestion box with name (1).
Selecting a variable: Inserts {{name}} with spaces (e.g., Hello {{name}} world).
Output: onChange receives plain text like Hello {{1}} world.

Props



Prop
Type
Description
Default



variables
Variable[]
Array of { id: number, label: string } objects
[]


onChange
(value: string) => void
Callback with plain text output using {{id}}
undefined


Styling
The component uses Tailwind CSS classes for styling. If not using Tailwind, override styles with custom CSS:
.variable-input-box [contenteditable] {
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  min-height: 40px;
}
.variable-input-box span {
  display: inline-block;
  background-color: #bfdbfe;
  color: #1e3a8a;
  font-weight: 600;
  font-size: 0.875rem;
  padding: 0.25rem 0.625rem;
  border-radius: 0.5rem;
  margin-right: 0.25rem;
}

License
MIT```
