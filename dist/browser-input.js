// Browser gestures must not take ownership of game pointers. Keep native
// clicks/pointer events intact so moving + firing + tapping ADS works together.
const editable = target => target instanceof Element && !!target.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"])');
const gameSurface = target => target instanceof Element && !!target.closest('#game,#touch,#hud');
const cancel = event => { if (event.cancelable) event.preventDefault(); };

for (const type of ['selectstart', 'contextmenu', 'dragstart']) {
  document.addEventListener(type, event => {
    if (!editable(event.target)) cancel(event);
  }, {capture: true});
}
// Safari's gesture events supplement touch-action for two-finger zoom.
for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
  document.addEventListener(type, cancel, {capture: true, passive: false});
}
document.addEventListener('touchmove', event => {
  // Combat surfaces use touch-action:none. Avoid cancelling their touch events:
  // that can suppress the click of an ADS/reload button used with another finger.
  // Menus retain single-finger scrolling, but not pinch zoom.
  if (event.touches.length > 1 && !gameSurface(event.target)) cancel(event);
}, {passive: false});
let lastTouch = -Infinity;
document.addEventListener('pointerdown', event => {
  if (event.pointerType === 'touch' || event.pointerType === 'pen') lastTouch = performance.now();
}, {passive: true});
document.addEventListener('touchstart', () => { lastTouch = performance.now(); }, {passive: true});
document.addEventListener('dblclick', event => {
  if (!editable(event.target) && performance.now() - lastTouch < 1000) cancel(event);
});
