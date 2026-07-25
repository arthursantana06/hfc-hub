import { AlertCircle, CheckCircle2 } from "lucide-react";

interface FieldProps {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  defaultValue?: string;
  errors?: string[];
}

export function Field({
  id,
  label,
  type = "text",
  autoComplete,
  placeholder,
  defaultValue,
  errors,
}: FieldProps) {
  const invalid = Boolean(errors?.length);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-inter text-sm text-slate-700">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        defaultValue={defaultValue}
        aria-invalid={invalid}
        aria-describedby={invalid ? `${id}-error` : undefined}
        className={`px-4 py-2.5 bg-white border rounded-lg shadow-sm font-inter text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent transition-colors ${
          invalid ? "border-red-300" : "border-slate-200"
        }`}
      />
      {invalid && (
        <p id={`${id}-error`} className="font-inter text-xs text-red-600">
          {errors!.join(" ")}
        </p>
      )}
    </div>
  );
}

export function FormAlert({
  tone,
  children,
}: {
  tone: "error" | "success";
  children: React.ReactNode;
}) {
  const isError = tone === "error";
  const Icon = isError ? AlertCircle : CheckCircle2;

  return (
    <div
      role="status"
      className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-3 font-inter text-sm ${
        isError
          ? "bg-red-50 border-red-100 text-red-700"
          : "bg-emerald-50 border-emerald-100 text-emerald-700"
      }`}
    >
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

export function SubmitButton({
  pending,
  label,
  pendingLabel,
}: {
  pending: boolean;
  label: string;
  pendingLabel: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-brand-600 text-white rounded-lg py-2.5 font-inter font-medium text-sm shadow-sm hover:bg-brand-900 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
