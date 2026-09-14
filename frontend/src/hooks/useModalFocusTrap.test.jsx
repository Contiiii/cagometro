// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it } from "vitest";

import useModalFocusTrap from "./useModalFocusTrap";

function Trap({ label }) {
  const dialogRef = useRef(null);

  useModalFocusTrap({ dialogRef });

  return (
    <div ref={dialogRef} tabIndex={-1} role="dialog" aria-label={label}>
      <button type="button">{label}</button>
    </div>
  );
}

function Nested() {
  const firstRef = useRef(null);
  const secondRef = useRef(null);

  useModalFocusTrap({ dialogRef: firstRef });
  useModalFocusTrap({ dialogRef: secondRef });

  return (
    <>
      <div ref={firstRef} tabIndex={-1} role="dialog" aria-label="first">
        <button type="button">First</button>
      </div>
      <div ref={secondRef} tabIndex={-1} role="dialog" aria-label="second">
        <button type="button">Second</button>
      </div>
    </>
  );
}

describe("useModalFocusTrap body scroll lock", () => {
  it("ripristina gli stili del body quando il modale si smonta", () => {
    const { unmount } = render(<Trap label="solo" />);

    expect(document.body.style.overflow).toBe("hidden");
    expect(document.body.style.position).toBe("fixed");

    unmount();

    expect(document.body.style.overflow).toBe("");
    expect(document.body.style.position).toBe("");
  });

  it("ripristina il body solo quando l'ultimo modale annidato si smonta", () => {
    const { unmount } = render(<Nested />);

    expect(document.body.style.overflow).toBe("hidden");

    unmount();

    expect(document.body.style.overflow).toBe("");
    expect(document.body.style.position).toBe("");
  });
});