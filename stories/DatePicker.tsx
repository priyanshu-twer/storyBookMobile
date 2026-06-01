import React from 'react';
import styled from 'styled-components';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './date.css';

const Container = styled.div`
  margin: 12px 0;
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
`;

const Label = styled.div`
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #4a4a4a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const InputContainer = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background-color: #f8f9fa;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  width: 100%;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.01);

  &:hover {
    background-color: #f1f3f5;
    border-color: rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }

  &:focus {
    outline: none;
    background-color: #ffffff;
    border-color: #1a1a1a;
    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.05);
  }
`;

const InputText = styled.span`
  font-size: 15px;
  font-weight: 500;
  color: #1a1a1a;
`;

const IconWrapper = styled.span`
  color: #888;
  font-size: 18px;
  display: flex;
  align-items: center;
`;


interface DatePickerProps {
  label?: string;
  value: Date | null;
  onChange: (date: Date) => void;
  placeholder?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({ label, value, onChange, placeholder = 'Select date' }) => {
  // Custom Input for ReactDatePicker to preserve custom styling
  const CustomWebInput = React.forwardRef(({ value: formattedValue, onClick }: any, ref: any) => (
    <InputContainer ref={ref} onClick={onClick} type="button">
      <InputText>{formattedValue || placeholder}</InputText>
      <IconWrapper>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="4" ry="4"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      </IconWrapper>
    </InputContainer>
  ));

  return (
    <Container>
      {label ? <Label>{label}</Label> : null}
      
      <ReactDatePicker
        selected={value}
        onChange={(date: Date | null) => {
          if (date) {
            onChange(date);
          }
        }}
        customInput={<CustomWebInput />}
        dateFormat="MM/dd/yyyy"
        portalId='root-portal'
      />
    </Container>
  );
};

export default DatePicker;

