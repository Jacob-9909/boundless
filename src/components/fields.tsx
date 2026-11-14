"use client";

import { useState, type ComponentProps } from "react";
import { Selector } from "@astryxdesign/core/Selector";
import { TextArea } from "@astryxdesign/core/TextArea";
import { TextInput } from "@astryxdesign/core/TextInput";

/*
 * Astryx inputs are controlled. Most Boundless forms post straight to a server action, so these
 * keep the value locally and submit it under `name`, the way a plain <input name> did.
 */

type Omitted = "value" | "onChange" | "htmlName";

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
