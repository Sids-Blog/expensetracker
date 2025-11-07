import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReactNode } from "react";

interface BaseFieldProps {
  label: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  icon?: ReactNode;
}

interface InputFieldProps extends BaseFieldProps {
  type: 'text' | 'number' | 'date' | 'email' | 'password';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  step?: string;
  min?: string;
  max?: string;
}

interface TextareaFieldProps extends BaseFieldProps {
  type: 'textarea';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

interface SelectFieldProps extends BaseFieldProps {
  type: 'select';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  options: Array<{ value: string; label: string }>;
}

interface CheckboxFieldProps extends BaseFieldProps {
  type: 'checkbox';
  checked: boolean;
  onChange: (checked: boolean) => void;
}

type FormFieldProps = InputFieldProps | TextareaFieldProps | SelectFieldProps | CheckboxFieldProps;

export const FormField = (props: FormFieldProps) => {
  const { label, id, required, disabled, className = "", icon } = props;
  const fieldId = id || label.toLowerCase().replace(/\s+/g, '-');

  const renderField = () => {
    switch (props.type) {
      case 'textarea':
        return (
          <Textarea
            id={fieldId}
            placeholder={props.placeholder}
            value={props.value}
            onChange={(e) => props.onChange(e.target.value)}
            disabled={disabled}
            required={required}
            rows={props.rows || 3}
            className="w-full"
          />
        );

      case 'select':
        return (
          <Select value={props.value} onValueChange={props.onChange} disabled={disabled}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={props.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {props.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <input
              id={fieldId}
              type="checkbox"
              checked={props.checked}
              onChange={(e) => props.onChange(e.target.checked)}
              disabled={disabled}
              className="h-4 w-4"
            />
            <Label htmlFor={fieldId} className="text-sm cursor-pointer">
              {label}
            </Label>
          </div>
        );

      default:
        return (
          <Input
            id={fieldId}
            type={props.type}
            placeholder={props.placeholder}
            value={props.value}
            onChange={(e) => props.onChange(e.target.value)}
            disabled={disabled}
            required={required}
            step={props.step}
            min={props.min}
            max={props.max}
            className="w-full"
          />
        );
    }
  };

  if (props.type === 'checkbox') {
    return (
      <div className={`space-y-2 ${className}`}>
        {renderField()}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={fieldId} className="flex items-center gap-2">
        {icon}
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      {renderField()}
    </div>
  );
};