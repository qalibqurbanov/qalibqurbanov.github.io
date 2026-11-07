/** Where the cursor's trailing frame is on screen, in CSS pixels on the device-pixel grid, published by
 * ThemeCursor every frame. A scene that draws its own marks around the cursor (the monochrome crosshair
 * and circle) centres them here, so they sit exactly in the frame instead of easing to the pointer on
 * their own clock. `on` is false while there is no ThemeCursor, and the scene falls back to the pointer. */
export const ringPosition = { x: 0, y: 0, on: false };
