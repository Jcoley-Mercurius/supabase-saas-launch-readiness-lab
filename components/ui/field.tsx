import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { StateGlyph } from "@/components/ui/state-glyph";

/*
 * Form controls — MDS COMPONENTS-PROPOSAL "Core controls" and
 * DESIGN-SYSTEM.md §9: "Inputs: persistent visible label; empty, populated,
 * focus, disabled, invalid, and valid where applicable. Required controls
 * include text input, textarea, select, checkbox, and links. No upload,
 * billing, scheduling, authentication, or client-workspace control appears in
 * R1."
 *
 * These are the approved shared controls, built once here rather than authored
 * per form. Nothing in this file is a new visual convention: the border,
 * radius, type scale, focus ring, and semantic colours are all approved
 * tokens, and the invalid treatment pairs the status colour with the approved
 * alert glyph and a text message so it never depends on colour alone
 * (DESIGN-SYSTEM.md §4, accessibility §14).
 *
 * Deliberately absent: any file input. R1 has no upload path at all
 * (MPS-RULE-004, MPS-REQ-013), so the component simply does not exist.
 *
 * Labels are always rendered and always visible. A placeholder is never used
 * as a label, and no control here accepts one.
 */

const CONTROL_BASE =
  "text-body text-strong bg-base border-control rounded-control w-full border px-3.5 py-2.5 min-h-11 transition-colors duration-(--motion-default) placeholder:text-subtle disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60";

const CONTROL_INVALID = "border-vulnerable";

function controlClasses(invalid: boolean, extra = "") {
  return `${CONTROL_BASE} ${invalid ? CONTROL_INVALID : ""} ${extra}`
    .replace(/\s+/g, " ")
    .trim();
}

/** Marks a required control in text as well as in the `required` attribute. */
function RequiredMark() {
  return (
    <span className="text-vulnerable" aria-hidden="true">
      {" *"}
    </span>
  );
}

function FieldMessage({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p
      id={id}
      className="text-body-sm text-vulnerable flex items-start gap-1.5"
    >
      <span className="mt-0.5 shrink-0">
        <StateGlyph shape="exclamation-circle" size={16} />
      </span>
      <span>{children}</span>
    </p>
  );
}

function FieldHint({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="text-body-sm text-subtle">
      {children}
    </p>
  );
}

/**
 * Wires label, hint, and error to a control by id.
 *
 * `aria-describedby` names the hint and, when invalid, the message, so a
 * screen reader hears the requirement and the correction with the field rather
 * than having to hunt for them (WCAG 2.2 AA 3.3.1, 3.3.2).
 */
function describedBy(id: string, hint: boolean, error: boolean) {
  const ids = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(
    Boolean,
  );
  return ids.length ? ids.join(" ") : undefined;
}

type SharedFieldProps = {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
};

function FieldShell({
  id,
  label,
  hint,
  error,
  required,
  className = "",
  children,
}: SharedFieldProps & { className?: string; children: ReactNode }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`.trim()}>
      <label htmlFor={id} className="text-body-sm text-strong font-semibold">
        {label}
        {required ? <RequiredMark /> : null}
      </label>
      {hint ? <FieldHint id={`${id}-hint`}>{hint}</FieldHint> : null}
      {children}
      {error ? <FieldMessage id={`${id}-error`}>{error}</FieldMessage> : null}
    </div>
  );
}

export type TextFieldProps = SharedFieldProps & {
  className?: string;
} & Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "id" | "className" | "placeholder"
  >;

export function TextField({
  id,
  label,
  hint,
  error,
  required,
  className,
  ...props
}: TextFieldProps) {
  return (
    <FieldShell
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={className}
    >
      <input
        id={id}
        name={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, Boolean(hint), Boolean(error))}
        className={controlClasses(Boolean(error))}
        {...props}
      />
    </FieldShell>
  );
}

export type TextAreaFieldProps = SharedFieldProps & {
  className?: string;
  /** Rendered under the control and announced politely as it changes. */
  counter?: ReactNode;
} & Omit<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    "id" | "className" | "placeholder"
  >;

export function TextAreaField({
  id,
  label,
  hint,
  error,
  required,
  className,
  counter,
  rows = 5,
  ...props
}: TextAreaFieldProps) {
  return (
    <FieldShell
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={className}
    >
      <textarea
        id={id}
        name={id}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, Boolean(hint), Boolean(error))}
        className={controlClasses(Boolean(error), "min-h-32 resize-y")}
        {...props}
      />
      {counter ? (
        <p className="text-body-sm text-subtle text-right" aria-live="polite">
          {counter}
        </p>
      ) : null}
    </FieldShell>
  );
}

export type SelectFieldProps = SharedFieldProps & {
  className?: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  /** Shown first and unselectable, so the control has no silent default. */
  placeholderOption?: string;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "id" | "className">;

export function SelectField({
  id,
  label,
  hint,
  error,
  required,
  className,
  options,
  placeholderOption,
  ...props
}: SelectFieldProps) {
  return (
    <FieldShell
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={className}
    >
      <select
        id={id}
        name={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, Boolean(hint), Boolean(error))}
        className={controlClasses(Boolean(error), "pr-10")}
        {...props}
      >
        {placeholderOption ? (
          <option value="">{placeholderOption}</option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

/*
 * Checkbox. The 44px target is on the LABEL, not on the 20px box: the whole
 * row is the hit area, which satisfies the approved 44 x 44 CSS-pixel minimum
 * for a primary control (WCAG 2.2 AA 2.5.8) without inflating the box itself.
 */
export type CheckboxProps = {
  id: string;
  label: ReactNode;
  error?: string;
  describedById?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className" | "type">;

export function Checkbox({
  id,
  label,
  error,
  describedById,
  ...props
}: CheckboxProps) {
  return (
    <label
      htmlFor={id}
      className="text-body-sm text-strong flex min-h-11 cursor-pointer items-center gap-3 py-1.5"
    >
      <input
        id={id}
        type="checkbox"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedById}
        className={`accent-primary size-5 shrink-0 rounded-[4px] ${
          error ? "outline-vulnerable outline-2 outline-offset-2" : ""
        }`.trim()}
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}

/**
 * A set of related checkboxes.
 *
 * It is a `fieldset` with a `legend` so the group has a name in the
 * accessibility tree — a set of checkboxes labelled only by a heading has no
 * programmatic grouping, and "Areas of concern" is exactly the kind of label a
 * keyboard user needs to hear once rather than infer six times.
 */
export function CheckboxGroup({
  id,
  legend,
  hint,
  error,
  required,
  children,
  className = "",
}: Omit<SharedFieldProps, "label"> & {
  legend: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <fieldset
      className={`flex flex-col gap-1.5 ${className}`.trim()}
      aria-describedby={describedBy(id, Boolean(hint), Boolean(error))}
      aria-invalid={error ? true : undefined}
    >
      <legend className="text-body-sm text-strong font-semibold">
        {legend}
        {required ? <RequiredMark /> : null}
      </legend>
      {hint ? <FieldHint id={`${id}-hint`}>{hint}</FieldHint> : null}
      <div className="tablet:grid-cols-2 mt-1 grid grid-cols-1 gap-x-6">
        {children}
      </div>
      {error ? <FieldMessage id={`${id}-error`}>{error}</FieldMessage> : null}
    </fieldset>
  );
}
