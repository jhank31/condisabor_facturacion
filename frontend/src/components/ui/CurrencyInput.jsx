import { useState, useCallback } from 'react';
import { formatCurrencyInput, parseCurrencyInput } from '../../utils/formatters';

/**
 * CurrencyInput — input de moneda COP con formateo en tiempo real.
 * Compatible con react-hook-form via `value` + `onChange` (usar Controller).
 *
 * Props:
 *   value        — valor numérico real (number)
 *   onChange     — callback(number) cuando cambia
 *   placeholder  — texto placeholder (default: "0")
 *   className    — clases extra para el <input>
 *   disabled     — deshabilitar el campo
 *   id           — id del input
 */
export default function CurrencyInput({
  value,
  onChange,
  placeholder = '0',
  className = '',
  disabled = false,
  id,
}) {
  // Estado de display: lo que el usuario ve (formateado con puntos)
  const [display, setDisplay] = useState(() =>
    value ? formatCurrencyInput(String(value)) : ''
  );

  const handleChange = useCallback(
    (e) => {
      const raw = e.target.value;
      // Eliminar todo lo que no sea dígito
      const onlyDigits = raw.replace(/[^0-9]/g, '');
      const formatted = onlyDigits ? formatCurrencyInput(onlyDigits) : '';
      setDisplay(formatted);
      const num = parseCurrencyInput(formatted);
      onChange(num || 0);
    },
    [onChange]
  );

  // Cuando el valor externo cambia (ej: reset del formulario)
  // sincronizar el display
  const syncedDisplay =
    display === '' && value ? formatCurrencyInput(String(value)) : display;

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      value={syncedDisplay}
      onChange={handleChange}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
      autoComplete="off"
    />
  );
}
