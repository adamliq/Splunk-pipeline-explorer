(function(){
/* Build 214: fault 40. A collapsed container's links were drawn with unifiedConnectorPath, the canvas's early curves,
   anchored for 142 px cards: unlike every other link, and with no straight runs for line jumps. Each is now routed as
   the canvas routes a link: out of the side that faces the other end, round the cards and collapsed containers in the
   way, with the same rounded corners. The line jumps block takes these links in too. */

// A collapsed container's box is its proxy's; a card's is the canvas's, from builderCardBox. The proxy sits at its
// members' top-left place; a card is found by its place in the layout.
function endBox(world,layout,point){
 if(point?.members?.length){const id=point.members[0].groupId,proxy=world.querySelector(`.collapsedGroupProxy[data-collapsed-group="${CSS.escape(String(id))}"]`);
  return {x:point.x,y:point.y,w:proxy?.offsetWidth||190,h:proxy?.offsetHeight||103}}
 for(const [id,place] of layout.positions)if(Math.abs(place.x-point.x)<.5&&Math.abs(place.y-point.y)<.5)return builderCardBox(id,layout.positions);
 return {x:point.x,y:point.y,w:190,h:224}}
// The other cards and collapsed containers on the canvas, which a route goes round.
function obstacles(world,layout,skip){const boxes=[];
 for(const node of state.builderNodes){const wrap=world.querySelector(`[data-unified-node-wrap="${node.id}"]`);if(!wrap||wrap.classList.contains('navHidden')||!layout.positions.has(node.id))continue;boxes.push(builderCardBox(node.id,layout.positions))}
 for(const proxy of world.querySelectorAll('.collapsedGroupProxy'))boxes.push({x:parseFloat(proxy.style.left)||0,y:parseFloat(proxy.style.top)||0,w:proxy.offsetWidth||190,h:proxy.offsetHeight||103});
 return boxes.filter(box=>!skip.some(end=>Math.abs(end.x-box.x)<.5&&Math.abs(end.y-box.y)<.5))}
// Which sides the link leaves and enters by: across when one box is clear of the other sideways, else down or up. On a
// side, data links sit at the middle, Fleet links two thirds down and Access links a third down, as the canvas's do.
function sides(a,b){return b.x>=a.x+a.w?['right','left']:b.x+b.w<=a.x?['left','right']:b.y>=a.y+a.h?['bottom','top']:['top','bottom']}
function port(box,side,plane){const point=builderV123SidePoint(box,side);if(side==='left'||side==='right')point.y=box.y+box.h*(plane==='management'?2/3:plane==='authentication'?1/3:.5);return point}
// The route leaves and enters 3 px off the boxes, as the canvas's do, with a straight 22 px at each end; where the two
// facing sides are closer than that allows, the straight ends shorten to fit.
function route(world,layout,from,to,plane){const a=endBox(world,layout,from),b=endBox(world,layout,to),[sideA,sideB]=sides(a,b),out=builderV123Normal(sideA),into=builderV123Normal(sideB);
 const gap=sideA==='right'?b.x-a.x-a.w:sideA==='left'?a.x-b.x-b.w:sideA==='bottom'?b.y-a.y-a.h:a.y-b.y-b.h,reach=Math.max(0,Math.min(22,(gap-6)/2-1));
 const pa=port(a,sideA,plane),pb=port(b,sideB,plane),start={x:pa.x+out.x*3,y:pa.y+out.y*3},joint={x:start.x+out.x*reach,y:start.y+out.y*reach},
  stop={x:pb.x+into.x*3,y:pb.y+into.y*3},end={x:stop.x+into.x*reach,y:stop.y+into.y*reach},
  middle=builderV123RouteBetween(joint,end,obstacles(world,layout,[a,b]),'curved',true);
 return builderV123RoundedPath(compactRoutePoints([start,joint,...middle,end,stop]))}

// The layout is worked out once for all of a redraw's collapsed links.
let layoutNow=null;const layoutOnce=()=>{if(!layoutNow){layoutNow=unifiedBuilderPositions();queueMicrotask(()=>{layoutNow=null})}return layoutNow};
// Each link's ends, to route it again. A container's box can change size after the redraw (Build 151 enlarges small
// text once a redraw is done: fault 31), so the links are routed again whenever a container's box changes size. A route
// that comes out the same is not written again, so the line jumps on it stay.
const ends=new WeakMap(),watched=new Set();
function reroute(){const world=document.querySelector('.unifiedBuilderWorld');if(!world)return;const layout=layoutOnce();
 for(const path of document.querySelectorAll('#builderTree path.collapsedGroupConnector')){const e=ends.get(path);if(!e)continue;
  try{const d=route(world,layout,e.from,e.to,e.plane);if((path.dataset.plainD213||path.getAttribute('d'))!==d)path.setAttribute('d',d)}catch{}}}
const resized=typeof ResizeObserver==='function'?new ResizeObserver(reroute):null;
function watch(world){if(!resized)return;for(const proxy of [...watched])if(!proxy.isConnected){resized.unobserve(proxy);watched.delete(proxy)}
 for(const proxy of world.querySelectorAll('.collapsedGroupProxy'))if(!watched.has(proxy)){watched.add(proxy);resized.observe(proxy)}}
if(typeof appendCollapsedConnector==='function'){const appendBefore=appendCollapsedConnector;
 appendCollapsedConnector=function(svg,from,to,plane){appendBefore.call(this,svg,from,to,plane);const path=svg?.lastElementChild,world=document.querySelector('.unifiedBuilderWorld');
  if(!path?.classList.contains('collapsedGroupConnector')||!world||!from||!to)return;
  ends.set(path,{from,to,plane});try{path.setAttribute('d',route(world,layoutOnce(),from,to,plane))}catch{}watch(world)}}
})();
