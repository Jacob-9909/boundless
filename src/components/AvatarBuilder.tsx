"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { removeAvatar, saveAvatar } from "@/app/actions";
import {
  ANIMALS,
  BACKDROPS,
  BEARDS,
  COLORS,
  COVERS,
  DEFAULT_ANIMAL,
  DEFAULT_PERSON,
  FACES,
  GLASSES,
  HAIRS,
  lookStyle,
  nearest,
  OUTFITS,
  SKINS,
  TOPS,
  type Animal,
  type Look,
  type Person,
} from "@/lib/avatar";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { CheckboxInput } from "@astryxdesign/core/CheckboxInput";
import { SegmentedControl, SegmentedControlItem } from "@astryxdesign/core/SegmentedControl";
import { Slider } from "@astryxdesign/core/Slider";
import { Icon } from "./Icon";
import { useT } from "./I18n";

const legend = "mb-1.5 block text-sm font-bold";
// ponytail: swatches and parts stay plain aria-pressed buttons. Astryx has no swatch picker, ToggleButton's icon
// slot is too small for a 52px avatar preview, and SelectableCard is a checkbox (e2e presses them as buttons).
const pressed = "outline-3 outline-offset-2 outline-[var(--c-primary)]";

export function AvatarBuilder({ initial, shown, soft, doneHref }: { initial: Look | null; shown: boolean; soft: string; doneHref?: string }) {
  const t = useT();
  const router = useRouter();
  const [kind, setKind] = useState<Look["kind"]>(initial?.kind ?? "person");
  const [person, setPerson] = useState<Person>(initial?.kind === "person" ? initial : DEFAULT_PERSON);
  const [animal, setAnimal] = useState<Animal>(initial?.kind === "animal" ? initial : DEFAULT_ANIMAL);
  const [show, setShow] = useState(shown);
  const [saved, setSaved] = useState("");
  const [pending, start] = useTransition();
  const look: Look = kind === "person" ? person : animal;
  const setP = (k: keyof Person) => (v: string) => (setPerson((l) => ({ ...l, [k]: v })), setSaved(""));
  const setA = (k: keyof Animal) => (v: string) => (setAnimal((l) => ({ ...l, [k]: v })), setSaved(""));
  const save = () =>
    start(async () => {
      const r = await saveAvatar(look, show);
      setSaved(r.error ? t(r.error) : t("저장했어요"));
      // Sign-up's first step: once saved, carry on to where the person was going.
      if (!r.error && doneHref) router.push(doneHref);
    });
  const ANIMAL_NAMES: Record<string, string> = {
    cat: t("고양이"),
    dog: t("강아지"),
    fox: t("여우"),
    bear: t("곰"),
    panda: t("판다"),
    rabbit: t("토끼"),
    tiger: t("호랑이"),
    koala: t("코알라"),
    owl: t("부엉이"),
    penguin: t("펭귄"),
    monkey: t("원숭이"),
    lion: t("사자"),
  };

  return (
    <div className="grid gap-6 px-4 py-4 md:grid-cols-[260px_minmax(0,1fr)]">
      <div className="md:sticky md:top-20 md:self-start">
        <div className="mx-auto size-40 rounded-full ring-1 ring-black/5 md:size-52" style={lookStyle(look, soft)} role="img" aria-label={t("내 아바타 미리 보기")} />
        {kind === "person" && (
          <PhotoMatch
            onColors={(skin, hair) => {
              setPerson((l) => ({ ...l, skin, hair }));
              setSaved("");
            }}
          />
        )}
      </div>

      <div className="space-y-5">
        <SegmentedControl label={t("아바타 종류")} size="lg" value={kind} onChange={(k) => (setKind(k as Look["kind"]), setSaved(""))}>
          <SegmentedControlItem value="person" label={t("사람")} />
          <SegmentedControlItem value="animal" label={t("동물")} />
        </SegmentedControl>

        {kind === "person" ? (
          <>
            <Swatches label={t("피부색")} list={SKINS} value={person.skin} onPick={setP("skin")} />
            <Parts
              label={t("머리 모양")}
              list={TOPS}
              field="top"
              look={person}
              soft={soft}
              onPick={setP("top")}
              names={{ hijab: t("히잡"), turban: t("터번"), hat: t("모자"), winterHat1: t("털모자") }}
            />
            {COVERS.includes(person.top) ? (
              <Swatches label={t("히잡·모자 색")} list={COLORS} value={person.cover} onPick={setP("cover")} />
            ) : (
              <Swatches label={t("머리색")} list={HAIRS} value={person.hair} onPick={setP("hair")} />
            )}
            <Parts
              label={t("표정")}
              list={Object.keys(FACES)}
              field="face"
              look={person}
              soft={soft}
              onPick={setP("face")}
              names={{ smile: t("웃는 얼굴"), happy: t("신난 얼굴"), wink: t("윙크"), calm: t("차분한 얼굴") }}
            />
            <Parts label={t("안경")} list={GLASSES} field="glasses" look={person} soft={soft} onPick={setP("glasses")} />
            <Parts label={t("수염")} list={BEARDS} field="beard" look={person} soft={soft} onPick={setP("beard")} />
            <Parts label={t("옷 모양")} list={OUTFITS} field="outfit" look={person} soft={soft} onPick={setP("outfit")} />
            <Swatches label={t("옷 색")} list={COLORS} value={person.clothes} onPick={setP("clothes")} />
          </>
        ) : (
          <>
            <Parts label={t("동물")} list={ANIMALS} field="animal" look={animal} soft={soft} onPick={setA("animal")} names={ANIMAL_NAMES} />
            <Swatches label={t("배경색")} list={BACKDROPS} value={animal.backdrop} onPick={setA("backdrop")} />
          </>
        )}

        <Card className="border-l-4 border-l-primary">
          <CheckboxInput
            label={t("내 글과 댓글에도 이 아바타 쓰기")}
            description={t("켜면 같은 아바타가 붙어서 내 글끼리 이어 볼 수 있어요. 끄면 지금처럼 국기 아바타가 보여요.")}
            value={show}
            onChange={(v) => (setShow(v), setSaved(""))}
          />
        </Card>

        <div className="flex flex-wrap items-center gap-3">
          <Button label={t("저장")} variant="primary" size="lg" onClick={save} isLoading={pending} />
          {initial && (
            <form action={removeAvatar}>
              <Button type="submit" label={t("아바타 지우기")} variant="secondary" size="lg" />
            </form>
          )}
          <span role="status" className="text-sm font-bold">
            {saved}
          </span>
        </div>
        <p className="text-xs opacity-60">{t("캐릭터 디자인")}: Avataaars (Pablo Stanley) · DiceBear · Boundless</p>
      </div>
    </div>
  );
}

function Swatches({ label, list, value, onPick }: { label: string; list: string[]; value: string; onPick: (v: string) => void }) {
  const t = useT();
  return (
    <fieldset>
      <legend className={legend}>{label}</legend>
      <div className="flex flex-wrap gap-2">
        {list.map((hex, i) => (
          <button
            key={hex}
            type="button"
            aria-label={t("색 {n}", { n: i + 1 })}
            aria-pressed={value === hex}
            onClick={() => onPick(hex)}
            className={`size-10 rounded-full ring-1 ring-black/15 transition ${value === hex ? pressed : ""}`}
            style={{ backgroundColor: `#${hex}` }}
          />
        ))}
      </div>
    </fieldset>
  );
}

function Parts<L extends Look>({
  label,
  list,
  field,
  look,
  soft,
  onPick,
  names = {},
}: {
  label: string;
  list: string[];
  field: keyof L & string;
  look: L;
  soft: string;
  onPick: (v: string) => void;
  names?: Record<string, string>; // parts worth naming for screen readers (head coverings, faces, animals)
}) {
  const t = useT();
  const current = (look as Record<string, string>)[field];
  return (
    <fieldset>
      <legend className={legend}>{label}</legend>
      <div className="flex flex-wrap gap-2">
        {list.map((v, i) => (
          <button
            key={v}
            type="button"
            aria-label={names[v] ?? (v === "none" ? t("없음") : t("모양 {n}", { n: i + 1 }))}
            aria-pressed={current === v}
            onClick={() => onPick(v)}
            className={`rounded-full ring-1 ring-black/10 transition ${current === v ? pressed : "hover:ring-black/30"}`}
            style={{ ...lookStyle({ ...look, [field]: v } as Look, soft), width: 52, height: 52 }}
          />
        ))}
      </div>
    </fieldset>
  );
}

const BOX = 260;
// Where the face goes inside the guide (fractions of the box) and where colors are read.
const SKIN_AT = [
  [0.38, 0.6],
  [0.62, 0.6],
  [0.5, 0.36],
];
const HAIR_AT = [
  [0.5, 0.07],
  [0.32, 0.13],
  [0.68, 0.13],
];

/**
 * Reads skin and hair colors from a photo. The photo stays on the device: it is drawn on a canvas here, sampled,
 * and dropped. ponytail: the person lines the face up with the oval by hand; automatic face finding needs an
 * 18 MB model download.
 */
function PhotoMatch({ onColors }: { onColors: (skin: string, hair: string) => void }) {
  const t = useT();
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [nat, setNat] = useState({ w: 1, h: 1 });
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const img = useRef<HTMLImageElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const scale = Math.max(BOX / nat.w, BOX / nat.h) * zoom;
  const left = (BOX - nat.w * scale) / 2 + pos.x;
  const top = (BOX - nat.h * scale) / 2 + pos.y;

  const close = () => {
    if (url) URL.revokeObjectURL(url);
    setUrl(null);
  };
  const read = () => {
    const el = img.current;
    const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
    if (!el || !ctx) return;
    ctx.canvas.width = ctx.canvas.height = BOX;
    ctx.drawImage(el, left, top, nat.w * scale, nat.h * scale);
    const avg = (pts: number[][]) => {
      const sums = pts.map(([fx, fy]) => {
        const d = ctx.getImageData(Math.round(fx * BOX) - 6, Math.round(fy * BOX) - 6, 12, 12).data;
        const s = [0, 0, 0];
        for (let i = 0; i < d.length; i += 4) for (let c = 0; c < 3; c++) s[c] += d[i + c];
        return s.map((v) => v / (d.length / 4));
      });
      // Median per channel across the patches, so one patch on an eye or a shadow does not pull the color.
      return [0, 1, 2].map((c) => sums.map((s) => s[c]).sort((a, b) => a - b)[Math.floor(sums.length / 2)]);
    };
    onColors(nearest(avg(SKIN_AT), SKINS), nearest(avg(HAIR_AT), HAIRS));
    close();
  };

  if (!url)
    return (
      <div className="mt-4 text-center">
        <Button label={t("사진으로 색 채우기")} variant="secondary" icon={<Icon name="image" size={16} />} onClick={() => file.current?.click()} />
        <input
          ref={file}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            setError("");
            setZoom(1);
            setPos({ x: 0, y: 0 });
            setUrl(URL.createObjectURL(f));
          }}
        />
        <p className="mt-2 text-xs opacity-70">{t("사진은 이 기기에서만 쓰고, 저장하거나 서버로 보내지 않아요.")}</p>
        {error && <p className="mt-2 text-sm font-bold text-[var(--color-text-error)]">{error}</p>}
      </div>
    );

  return (
    <div className="mt-4 space-y-3 text-center">
      <p className="text-sm font-bold">{t("얼굴을 원 안에 맞춘 뒤 색을 읽어요")}</p>
      <div
        className="relative mx-auto touch-none overflow-hidden rounded-2xl bg-ink/10 select-none"
        style={{ width: BOX, height: BOX }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (d) setPos({ x: d.px + e.clientX - d.x, y: d.py + e.clientY - d.y });
        }}
        onPointerUp={() => (drag.current = null)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- a local blob URL, drawn on a canvas and dropped */}
        <img
          ref={img}
          src={url}
          alt=""
          draggable={false}
          onLoad={(e) => setNat({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
          onError={() => {
            close();
            setError(t("이 사진은 열 수 없어요. 다른 사진을 골라 주세요."));
          }}
          className="pointer-events-none absolute max-w-none"
          style={{ left, top, width: nat.w * scale, height: nat.h * scale }}
        />
        <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 size-full" aria-hidden="true">
          <path d="M0 0h100v100H0z M50 10a30 38 0 1 0 0.01 0z" fill="rgba(0,0,0,.45)" fillRule="evenodd" />
          <ellipse cx="50" cy="48" rx="30" ry="38" fill="none" stroke="white" strokeWidth="0.8" strokeDasharray="3 2" />
        </svg>
      </div>
      <div className="mx-auto max-w-[260px] text-left">
        <Slider label={t("크기")} min={1} max={3} step={0.05} value={zoom} onChange={setZoom} valueDisplay="none" width="100%" />
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button label={t("이 위치로 색 읽기")} variant="primary" onClick={read} />
        <Button label={t("취소")} variant="secondary" onClick={close} />
      </div>
    </div>
  );
}
