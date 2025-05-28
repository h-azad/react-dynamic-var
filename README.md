# react-dynamic-var

A React component for content-editable text input with variable autocompletion. It displays variables as `{{label}}` in the UI and outputs `{{id}}` in the plain text, with automatic spacing around inserted variables.

![React Dynamic Variable Demo](./react-dynamic-var.gif)

## Features

- 🚀 Smart autocomplete suggestions when typing `{{`
- 🎯 Beautiful variable tags with `{{label}}` display
- 📝 Clean output format with `{{id}}` for processing
- 🔄 Automatic spacing around variables
- 📦 TypeScript ready with full type definitions
- 🎨 Styled with Tailwind CSS (customizable)

## Installation

```bash
npm install react-dynamic-var
# or
yarn add react-dynamic-var
```

## Quick Start

```tsx
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
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `variables` | `Array<{ id: number, label: string }>` | Yes | Array of variables for suggestions |
| `onChange` | `(value: string) => void` | No | Callback fired when content changes |
| `defaultValue` | `string` | No | Initial value for the editor. Variables should be in `{{id}}` format |

## Usage Examples

### Basic Usage
```tsx
const App = () => {
  const variables = [
    { id: 1, label: 'name' },
    { id: 2, label: 'email' },
  ];

  return (
    <VariableInputBox
      variables={variables}
      onChange={(value) => console.log('Editor content:', value)}
    />
  );
};
```

### With Default Value
```tsx
const App = () => {
  const variables = [
    { id: 1, label: 'name' },
    { id: 2, label: 'email' },
  ];

  return (
    <VariableInputBox
      variables={variables}
      defaultValue="Hello {{1}}, your {{2}} is confirmed"
      onChange={(value) => console.log('Editor content:', value)}
    />
  );
};
```

### Variable Suggestions
1. Type `{{` followed by text to see suggestions
2. Type `{{na` to filter for variables containing "na"
3. Click or press Enter to insert the variable

### Input/Output Examples
- Input: `Hello {{name}}, your {{email}} is confirmed`
- Output: `Hello {{1}}, your {{2}} is confirmed`

## Styling

### With Tailwind CSS
The component uses Tailwind CSS classes by default. No additional setup needed if your project uses Tailwind.

### Without Tailwind CSS
Add these CSS classes to replicate the default styling:

```css
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
  cursor: pointer;
  transition: all 0.2s;
}

.variable-input-box span:hover {
  background-color: #93c5fd;
  transform: scale(1.05);
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © Hossain Azad