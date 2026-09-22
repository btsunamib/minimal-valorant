// A non-primary touch does not reliably dispatch click on Android/iOS.
// Activate from its own pointerdown, keeping joystick/fire captures independent.
export function bindTouchAction(el, action, {active=()=>true}={}) {
 let lastTouch=-Infinity;
 const down=e=>{
  if(e.pointerType!=='touch'&&e.pointerType!=='pen')return;
  if(!active())return;
  e.preventDefault();e.stopPropagation();lastTouch=performance.now();action(e);
 };
 const click=e=>{
  if(e.pointerType==='touch'||e.pointerType==='pen'||(e.detail!==0&&performance.now()-lastTouch<800)){e.preventDefault();return;}
  if(active())action(e);
 };
 el.addEventListener('pointerdown',down);el.addEventListener('click',click);
 return()=>{el.removeEventListener('pointerdown',down);el.removeEventListener('click',click)};
}
