"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

interface LeadFormProps {
  agentId: string;
  agentName: string;
  refCode: string;
}

interface FieldErrors {
  full_name?: string;
  email?: string;
  phone?: string;
  property_address?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LeadForm({ agentId, agentName, refCode }: LeadFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function validate(): boolean {
    const errors: FieldErrors = {};
    if (fullName.trim().length < 2) errors.full_name = "Please enter your full name.";
    if (!EMAIL_RE.test(email.trim())) errors.email = "Please enter a valid email address.";
    if (phone.trim().replace(/\D/g, "").length < 7) errors.phone = "Please enter a valid phone number.";
    if (address.trim().length < 5) errors.property_address = "Please enter the property address.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("leads").insert({
      agent_id: agentId,
      ref_code: refCode,
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      property_address: address.trim(),
      message: message.trim() || null,
      status: "new",
    });
    setLoading(false);

    if (error) {
      setSubmitError(
        "Something went wrong submitting your request. Please try again in a moment.",
      );
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="py-8 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-accent-50">
          <svg className="h-8 w-8 text-accent-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-navy-800">Request received!</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
          Thanks, {fullName.split(" ")[0] || "there"}. Our team will contact you
          shortly to schedule your free ADU consultation.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <h2 className="text-lg font-bold text-navy-800">Get your free consultation</h2>
        <p className="mt-1 text-sm text-slate-500">
          Referred by <span className="font-semibold text-navy-800">{agentName}</span>
        </p>
      </div>

      {submitError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {submitError}
        </div>
      ) : null}

      <div>
        <label htmlFor="lead-name" className="label">
          Full name *
        </label>
        <input
          id="lead-name"
          type="text"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="input"
          placeholder="Jane Smith"
        />
        {fieldErrors.full_name ? (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.full_name}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="lead-email" className="label">
            Email *
          </label>
          <input
            id="lead-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="jane@example.com"
          />
          {fieldErrors.email ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
          ) : null}
        </div>
        <div>
          <label htmlFor="lead-phone" className="label">
            Phone *
          </label>
          <input
            id="lead-phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input"
            placeholder="(555) 123-4567"
          />
          {fieldErrors.phone ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor="lead-address" className="label">
          Property address *
        </label>
        <input
          id="lead-address"
          type="text"
          autoComplete="street-address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="input"
          placeholder="123 Main St, San Diego, CA"
        />
        {fieldErrors.property_address ? (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.property_address}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="lead-message" className="label">
          Message <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <textarea
          id="lead-message"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="input resize-none"
          placeholder="Tell us about your project…"
        />
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full py-3">
        {loading ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Submitting…
          </>
        ) : (
          "Request free consultation"
        )}
      </button>
      <p className="text-center text-xs text-slate-400">
        We&apos;ll only use your information to contact you about your ADU project.
      </p>
    </form>
  );
}
