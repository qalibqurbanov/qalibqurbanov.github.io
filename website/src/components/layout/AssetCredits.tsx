import { useStyle } from "@/themes/shared/style/context";

/** Credits for the third-party 3D assets the non-original styles use. Shown only while one of them is on. */
export function AssetCredits() {
  const { style } = useStyle();
  if (style === "cyber") return null;
  return (
    <p className="mx-auto max-w-6xl px-6 pb-6 text-center font-mono text-[11px] text-muted">
      3D models:{" "}
      <a className="underline-offset-2 hover:underline" href="https://polyhaven.com" target="_blank" rel="noreferrer">
        Poly Haven
      </a>{" "}
      (CC0) · Car Concept by Eric Chadwick, Khronos glTF Sample Assets (
      <a className="underline-offset-2 hover:underline" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">
        CC BY 4.0
      </a>
      )
    </p>
  );
}
