import { forwardRef } from "react";
import { IconType } from "react-icons";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: IconType;
  containerClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input(
    { label, error, icon: Icon, className = "", containerClassName = "", ...props },
    ref
  ) {
    return (
      <div className={`form-group ${containerClassName}`}>
        {label && <label>{label}</label>}
        <div className={`input-wrapper ${Icon ? "has-icon" : ""} ${error ? "has-error" : ""}`}>
          {Icon && <Icon className="input-icon" size={18} />}
          <input
            ref={ref}
            className={`form-input ${className}`}
            {...props}
          />
        </div>
        {error && <span className="form-error">{error}</span>}
      </div>
    );
  }
);

export default Input;
