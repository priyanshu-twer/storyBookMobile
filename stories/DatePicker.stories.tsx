import React, { useState } from 'react';
import DatePicker from './DatePicker';

export default {
  title: 'Component/DatePicker',
  component: DatePicker,
  tags: ['autodocs'],
};

export const Default = {
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
};
