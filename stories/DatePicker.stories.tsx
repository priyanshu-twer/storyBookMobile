import React, { useState } from 'react';
import DatePicker from './DatePicker';
import './DatePicker.stories.css';

export default {
  title: 'Component/DatePicker',
  component: DatePicker,
  tags: ['autodocs'],
};

const sourceCode = `import React, { useState } from 'react';
import DatePicker from './DatePicker';

const Example = () => {
  const [date, setDate] = useState(new Date());
  return (
    <DatePicker
      label="Select Date"
      value={date}
      onChange={(newDate) => setDate(newDate)}
    />
  );
};`;

export const Default = {
  render: () => {
    const [date, setDate] = useState<Date | null>(new Date());
    return (
      <div>
        <pre>
          {JSON.stringify(date, null, 2)}
        </pre>
      <DatePicker
        label="Select Date"
        value={date}
        onChange={(newDate: Date) => setDate(newDate)}
      />
      </div>
    );
  },
  parameters: {
    docs: {
      source: {
        type: 'code',
        code: sourceCode,
      },
    },
  },
};

export const Cdbt = {
  render: () => {
    const [date, setDate] = useState<Date | null>(new Date());
    return (
      <DatePicker
        label="Select Date"
        value={date}
        onChange={(newDate: Date) => setDate(newDate)}
      />
    );
  },
  parameters: {
    docs: {
      source: {
        type: 'code',
        code: sourceCode,
      },
    },
  },
};
