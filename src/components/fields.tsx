"use client";

import { startTransition, useState, type ComponentProps, type FormEvent } from "react";
import { Selector } from "@astryxdesign/core/Selector";
import { TextArea } from "@astryxdesign/core/TextArea";
import { TextInput } from "@astryxdesign/core/TextInput";

/*
 * Astryx inputs are controlled. Most Boundless forms post straight to a server action, so these
 * keep the value locally and submit it under `name`, the way a plain <input name> did.
 */

type Omitted = "value" | "onChange" | "htmlName";

/**
 * onSubmit for a form whose fields are Astryx (controlled) inputs: runs the useActionState action
 * without React's automatic form reset. That reset rewrites the DOM values behind React's back, so a
 * second comment in a row was submitted empty. Keep `action={action}` too: it still works before hydration.
 */
export function keepValues(dispatch: (f: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
    startTransition(() => dispatch(f));
  };
}

export function TextField({ name, defaultValue = "", ...rest }: Omit<ComponentProps<typeof TextInput>, Omitted> & { name: string; defaultValue?: string }) {
  const [v, setV] = useState(defaultValue);
  return <TextInput {...rest} htmlName={name} value={v} onChange={setV} />;
}

export function TextAreaField({ name, defaultValue = "", ...rest }: Omit<ComponentProps<typeof TextArea>, Omitted> & { name: string; defaultValue?: string }) {
  const [v, setV] = useState(defaultValue);
  return <TextArea {...rest} htmlName={name} value={v} onChange={setV} />;
}

type SelectorBase = Omit<ComponentProps<typeof Selector>, Omitted | "hasClear">;

/** No clear button: every Boundless select has a sensible default value. */
export function SelectField({ name, defaultValue, ...rest }: SelectorBase & { name: string; defaultValue?: string }) {
  const [v, setV] = useState(defaultValue);
  return <Selector {...(rest as ComponentProps<typeof Selector>)} hasClear={false} htmlName={name} value={v} onChange={(x: string | null) => setV(x ?? undefined)} />;
}
