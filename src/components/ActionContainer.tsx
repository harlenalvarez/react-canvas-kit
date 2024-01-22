import { canvasTransform, getCanvas2DContext } from '@/canvas';
import { CanvasFab } from '@/container';
import { getFabContext } from '@/container/canvas-fab/CanvasFabContext';
import { requestRedraw, useRedrawEvent } from '@/hooks';
import { clearAll } from '@/utils';
import { Button, ButtonGroup } from '@mui/material';
import { BoxCapsule, Point, RigidNode, Vector2D, getCanvasCenter, getCanvasPoint, getLineRotation, lineRectInterceptionPoint, linearInterpolation, rotateRect } from '@practicaljs/canvas-kit';
import { useEffect } from 'react';
import { ZoomComponent } from './ZoomComponent';
import { Rect2D, clearPaths, drawRectangle, nodeConnections, paths } from './drawRectangle';





/**
 * The spring ties together 2 rigid nodes, spring forces will be automatically applied to keep the object at the given distance.
 * If the spring is repulsive, it will make sure that the 2 rigid nodes are not within the given distance but not prevent streching past that
 */
export class Spring {
  constructor(public nodeA: RigidNode, public nodeB: RigidNode, public k: number, public tension: number, public repulsive: boolean) { }

  private calculateProximity(source: number, target: number) {
    const diff = Math.abs(target - source);
    return diff / source + 1
  }

  update = (dampener: number = 1) => {
    const delta = this.nodeB.point.subtract(this.nodeA.point);
    const distance = delta.magnitude() || Number.EPSILON;
    const diff = this.tension - distance;
    // if the is a repulvice spring we only want to move the nodes away from each other
    if (this.repulsive && diff < 0) return;
    const percentage = diff / distance / 2;
    const rate = this.calculateProximity(this.tension, distance);
    const dampenerScaled = Math.min(rate * dampener, 4)
    if(dampenerScaled > 1) {
      console.log('Geater then 1', dampenerScaled)
    }
    const offset = delta.scale(percentage).scale(dampenerScaled);

    if (!this.nodeA.isKinematic) {
      this.nodeA.setPoint(this.nodeA.point.subtract(offset))
    }

    if (!this.nodeB.isKinematic) {
      this.nodeB.setPoint(this.nodeB.point.add(offset))
    }
  }
}

const K = .98
const TENSION = 150
let previousPath: Rect2D | null = null;
let lastFrameTime: number | null;
let lastEnergy  = 0;
let rigidBodies: Record<string, BoxCapsule<RigidNode>> = {};
let stop = true;
let centerPoint: Point;
let draging = false;
let draggedNode: BoxCapsule<RigidNode> | null;
let edgeKeys: Set<string> = new Set();
let repulsiveNodes: Spring[] = []
const springGraph: Record<string, Spring[]> = {};


const setKey = (a: string, b: string) => {
  edgeKeys.add(`${a}:${b}`)
  edgeKeys.add(`${b}:${a}`)
}

const hasKey = (a: string, b: string) => {
  const hasA = edgeKeys.has(`${a}:${a}`)
  const hasB = edgeKeys.has(`${b}:${a}`)
  return hasA || hasB
}

const handleClick = (e: React.MouseEvent) => {
  if(e.altKey || draging) return;
  const ctx = getCanvas2DContext();
  if (!ctx) return;
  const clickedPath = checkIfInNode(e);
  if(e.shiftKey && clickedPath) {
    const modal = getFabContext('one-and-only')
    modal.openFab({
      position: {x: clickedPath.trackingPoint.x, y: clickedPath.point.y},
      key: clickedPath.key,
      path: clickedPath.path
    })
    return;
  }
  if(clickedPath && previousPath) {
    if(!rigidBodies[clickedPath.key] || !rigidBodies[previousPath.key]) {
      mapToRigidBodies();
    }
    const idA = rigidBodies[previousPath.key].component.id;
    if(!springGraph[idA]) springGraph[idA] = []
    const aLength = (springGraph[idA]?.length ?? 0) + 1
    const idB = rigidBodies[clickedPath.key].component.id;
    if(!springGraph[idB]) springGraph[idB] = []
    const bLength = (springGraph[idB]?.length ?? 0) + 1
    const length = Math.max(aLength, bLength);
    const totalWidth = 141 * 2;
    const totalCircumference = totalWidth * length / (2*Math.PI)
    const desiredTension = Math.max(TENSION, totalCircumference)
    console.log('Tension ', desiredTension)
    const spring = new Spring(
      rigidBodies[previousPath.key].component, rigidBodies[clickedPath.key].component, K, desiredTension, false
    )
    springGraph[idA].push(spring);
    springGraph[idB].push(spring);
    nodeConnections.push(spring)
    drawLineInterseptingLine(ctx, rigidBodies[previousPath.key], rigidBodies[clickedPath.key]);
    previousPath = null;
    return
  }
  if(clickedPath) {
    previousPath = clickedPath;
    return
  }
  if(e.metaKey) {
    stop = true
    draging = false
    previousPath = null
    rigidBodies = {}
    clearAll(ctx)
    clearPaths()
    edgeKeys = new Set();
    repulsiveNodes = []
    const context = getFabContext('one-and-only')
    context.close();
    return;
  }

  // first check if in on node
  const [x, y] = getCanvasPoint(e.nativeEvent.offsetX, e.nativeEvent.offsetY, ctx, false);
  const path = drawRectangle(x, y, ctx);
  canvasTransform.trackShape(path.key, path.trackingPoint.x, path.trackingPoint.y);
}

const handleDrag = (e: React.MouseEvent) => {
  e.stopPropagation()
  if(!e.altKey) return;
  e.preventDefault()

  const clickedPath = checkIfInNode(e);
  if(!clickedPath) return;

  if(!rigidBodies?.length) {
    mapToRigidBodies()
  }
  draggedNode = rigidBodies[clickedPath.key]
  draging = true;
}

const onPointerUp =(e: React.MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()

  if(draging) {
    draggedNode = null
    draging = false;
  }
}

const onDrag = (e: React.MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
  const ctx = getCanvas2DContext()
  if(!ctx) return
  if(!e.altKey || !draggedNode || !draging) return;
  const [x, y] = getCanvasPoint(e.nativeEvent.offsetX, e.nativeEvent.offsetY, ctx);
  draggedNode.component.setPoint(new Vector2D(x, y))
  updatePathPoint(draggedNode.component)

  updateSprings(1)
  
  for(const toUpdate of detectAndSolveCollisions(draggedNode)) {
    updatePathPoint(draggedNode.component)
    updatePathPoint(toUpdate.component)
  }

  requestAnimationFrame(() => {
    clearAll(ctx)
    redrawAll(ctx)
  })
}

const recenter = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  const ctx = getCanvas2DContext();
  if (!ctx) return;
  canvasTransform.recenter(ctx);
  requestRedraw()
}

const recenterOnShape = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  const ctx = getCanvas2DContext();
  if (!ctx) return;
  const firstPath = paths[0]
  canvasTransform.recenter(ctx, firstPath.trackingPoint.x, firstPath.trackingPoint.y);
  requestRedraw();
}

const recenterOnContent = (e: React.MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
  const ctx = getCanvas2DContext();
  if (!ctx) return;
  canvasTransform.recenterOnContent(ctx, false);
  requestRedraw()
}

const scaleToFit = (e: React.MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
  const ctx = getCanvas2DContext();
  if (!ctx) return;
  canvasTransform.recenterOnContent(ctx, true)
  requestRedraw()
}

const clearReadrawAll = () => {
  const ctx =  getCanvas2DContext();
  if (!ctx) return;
  clearAll(ctx)
  redrawAll(ctx)
}

const redrawAll = (ctx?: CanvasRenderingContext2D | null | number) => {
  ctx = typeof ctx === 'number' || !ctx ? getCanvas2DContext() : ctx;
  if (!ctx) return;

  const [x, y] = getCanvasCenter(ctx)
  centerPoint = { x: x-300,y: y-300}
  ctx.rect(x - 300, y - 300, 600, 600)
  ctx.stroke()
  ctx.beginPath();

  ctx.save()
  ctx.strokeStyle = 'black'
  for(const spring of Object.values(nodeConnections)) {
    drawLineInterseptingLine(ctx, rigidBodies[spring.nodeA.id], rigidBodies[spring.nodeB.id])
  }
  ctx.restore()
  for (const path of paths) {
    drawRectangle(0, 0, ctx, path)
  }
}

const redraw = () => {
  requestAnimationFrame(redrawAll)
}

const drawLineInterseptingLine = (ctx: CanvasRenderingContext2D, a: BoxCapsule<RigidNode>, b: BoxCapsule<RigidNode>) => {
  const start = a.component.point;
  const end = b.component.point;

  const aLine = lineRectInterceptionPoint(start, end, a.startPoint, a.width, a.height);
  const bLine = lineRectInterceptionPoint(start, end, b.startPoint, b.width, b.height);
  if(!aLine || !bLine) {
    const linePath = new Path2D()
    linePath.moveTo(a.component.point.x, a.component.point.y)
    linePath.lineTo(b.component.point.x, b.component.point.y)
    ctx.beginPath()
  
    ctx.stroke(linePath)
    return;
  }
  const point = linearInterpolation(aLine, bLine, .95);

  ctx.beginPath()
  ctx.moveTo(aLine.x, aLine.y);
  ctx.lineTo(bLine.x, bLine.y)
  ctx.stroke()
  // Calculate the gradient of the line
  const angle = getLineRotation(aLine, bLine);
  const desiredWidth = 100;
  const height = 20;
  const x = point.x - desiredWidth;
  const y = point.y - height/2;
  const halfX = x + desiredWidth/2
  ctx.fillStyle = 'white'
  ctx.save()
  ctx.beginPath()
  rotateRect(ctx, angle, point, desiredWidth, true);

  ctx.roundRect(x, y, desiredWidth, height, 10);
  ctx.stroke()
  ctx.fill()
  ctx.fillStyle = 'black';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText('Sample', halfX, point.y);
  ctx.restore()
}

const checkIfInNode = (e: React.MouseEvent) => {
  const ctx = getCanvas2DContext();
  if (!ctx) return null;
  const clientX = e.nativeEvent.offsetX
  const clientY = e.nativeEvent.offsetY
  const [x, y] = getCanvasPoint(clientX, clientY, ctx, true);
  for (const path of paths) {
    if(ctx.isPointInPath(path.path, x, y)) {
      return path
    }
  }
  return null;
}

const mapToRigidBodies = () => {
  const keyBody: Record<string, BoxCapsule<RigidNode>> = {}
  const rigidBodiesLocal = paths.map(p => {
    const rigid = new RigidNode(p.key, new Vector2D(p.trackingPoint.x, p.trackingPoint.y),Vector2D.zero, Vector2D.zero, 1, false, .1)
    return new BoxCapsule(rigid, p.width, p.height)
  })
  //rigidBodiesLocal[rigidBodiesLocal.length-1].component.isKinematic = true;
  rigidBodiesLocal.forEach(body => {
    keyBody[body.component.id] = body;
    if(!rigidBodies[body.component.id])
      rigidBodies[body.component.id] = body
    else
      rigidBodies[body.component.id].component.setPoint(body.component.point)
  });
  return keyBody
}

const addRepulsiveSrings = () => {
  for(const n of Object.values(rigidBodies)) {
    for(const other of Object.values(rigidBodies)) {
      if(n === other) continue;
      if(hasKey(n.component.id, other.component.id)) continue;
      const spring = new Spring(n.component, other.component, K, TENSION * 2, true);
      repulsiveNodes.push(spring)
      setKey(n.component.id, other.component.id)
    }
  }
}

let temp = 0;
const startAnimation = (e: React.MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
  stop = false
  mapToRigidBodies();
  addRepulsiveSrings();

  //rigidBodies[rigidBodies.length-1].component.isKinematic = true;
 
  // console.log(rigidBodies[0].force)
  // springs = nodeConnections.map(([a, b]) => {
  //   const aNode = keyBody[a.key];
  //   const bNode = keyBody[b.key];
  //   return new Spring(aNode, bNode, K, 200, false)
  // })
  lastFrameTime = null;
  lastEnergy = 0;
  temp = .5;
  requestAnimationFrame(animateGraph)
}

// const startForce = () => {
//   for(const capsule of Object.values(rigidBodies)) {
//     if(capsule.component.force.x === 0 && capsule.component.force.y === 0)
//      capsule.component.addForce(new Vector2D(1, 1))
//   }
// }

const updatePathPoint = (node: RigidNode) => {
  for(const path of paths) {
    if(path.key !== node.id) continue;
    path.changeTrackingPoint(node.point)
    const fab = getFabContext('one-and-only')
    
    if(fab.open && fab.key === path.key) {
      const fabPoint = {x: path.trackingPoint.x, y: path.point.y}
      fab.changeFabPosition(fabPoint)
    }
  }
}

//const updateBodies = () => {
  //   const friction = .5
  //   for(const capsule of Object.values(rigidBodies)) {
  //     capsule.component.update(2, friction);
  //     capsule.component.force = Vector2D.zero
  //     for(const path of paths) {
  //       if(path.key !== capsule.component.id) continue;
  //       path.changeTrackingPoint(capsule.component.point)
  //     }
  //   }
  // }

const updateSprings = (dampener: number) => {
  for(const spring of repulsiveNodes) {
    spring.update(dampener)
    updatePathPoint(spring.nodeA)
    updatePathPoint(spring.nodeB)
  }

  for(const spring of nodeConnections) {
    spring.update(dampener)
    updatePathPoint(spring.nodeA)
    updatePathPoint(spring.nodeB)
  }

}

function *detectAndSolveCollisions(capsule:BoxCapsule<RigidNode>){ 
  for(const other of Object.values(rigidBodies)) {
    if(capsule === other || !capsule.isColliding(other)) continue;
    const collisionAxis = capsule.component.point.subtract(other.component.point);
    const distance = collisionAxis.magnitude();
    const normilizedVector = collisionAxis.normalize()
    // need a better way to get this distance
    const aDistanceFromCenter = Math.hypot(capsule.width, capsule.height);
    const bDistanceFromCenter = Math.hypot(other.width, other.height)

    let delta = (aDistanceFromCenter - distance) * capsule.component.restitution;
    let velocity = normilizedVector.scale(delta * .5);
    capsule.component.setPoint(capsule.component.point.add(velocity));
    
    delta = (bDistanceFromCenter - distance) * other.component.restitution
    velocity = normilizedVector.scale(delta * .5);
    other.component.setPoint(other.component.point.subtract(velocity));
    yield other;
  }
}

const detectAndHandleCollitions = () => {
  for(const capsule of Object.values(rigidBodies)) {
    for(const other of Object.values(rigidBodies)) {
      if(capsule === other || !capsule.isColliding(other)) continue;
      const collisionAxis = capsule.component.point.subtract(other.component.point);
      const distance = collisionAxis.magnitude();
      
      const normilizedVector = collisionAxis.normalize()
      const capsuleRadius = Math.hypot(capsule.width, capsule.height);
      const otherRadius = Math.hypot(other.width, other.height)
      let delta = (capsuleRadius - distance) * capsule.component.restitution;
      let velocity = normilizedVector.scale(delta * .5);

     // if(!capsule.component.isKinematic) {
        capsule.component.setPoint(capsule.component.point.add(velocity));
     // }

      //if(!other.component.isKinematic) {
        delta = (otherRadius - distance) * other.component.restitution
        velocity = normilizedVector.scale(delta * .5);
        other.component.setPoint(other.component.point.subtract(velocity));
      //}
    }
  }
}

// function getContactPoint(capsule: BoxCapsule<RigidNode>, other: BoxCapsule<RigidNode>): Vector2D {
//   const point: Vector2D = capsule.component.point
//   const otherPoint: Vector2D = other.component.point

//   // Calculate the overlap on each axis
//   let xOverlap = (otherPoint.x + other.width - point.x);
//   let yOverlap = (otherPoint.y + other.height - point.y);
  
//   if(Math.abs(xOverlap) < Math.abs(yOverlap)) {
//       // Contact on left or right side of rectangles
//       return new Vector2D(point.x + xOverlap/2, otherPoint.y);
//   } else {
//       // Contact on top or bottom of rectangles
//       return new Vector2D(otherPoint.x, point.y + yOverlap/2);
//   }
// }

const containBodies = () => {
  for(const capsule of Object.values(rigidBodies)) {
    capsule.component.contain(centerPoint, 600, 600)
    for(const path of paths) {
      if(path.key !== capsule.component.id) continue;
      path.changeTrackingPoint(capsule.component.point)
    }
  }
}

const getEnergy = () => {
  let energy = 0;
  for(const rg of Object.values(rigidBodies)) {
    energy += rg.component.getKineticEnergy()
  }
  return energy;
}
const cool = (t: number) => t * .99

const animateGraph = (timestamp: number) => {
  if(!lastFrameTime) {
    lastFrameTime = timestamp
  }
  const diff = timestamp - lastFrameTime
  if(diff >= 16.67) {
    lastFrameTime = timestamp
    // startForce()
    // updateBodies()
    updateSprings(temp)
    const energy = getEnergy()
    
    if(energy < 1)
      detectAndHandleCollitions()
    //containBodies()
    clearReadrawAll()

    if(Math.abs(energy-lastEnergy) <= 0.001) {
      console.log('Stopping')
      return;
    }
    lastEnergy = energy
    temp = cool(temp)
  }
  if(stop) return;
  requestAnimationFrame(animateGraph)
}

export const ActionContainer = () => {

  useRedrawEvent(redraw, []);
  useEffect(() => {
    return () => {
      clearPaths();
      const context = getFabContext('one-and-only')
      context.close();
    }
  });

  return (
    <>
    <div 
    style={{ width: '100%' }} 
    onClick={handleClick}
    onPointerDown={handleDrag}
    onPointerMove={onDrag}
    onPointerUp={onPointerUp}
    >
      <ZoomComponent />
      <button onClick={recenter}>Recenter</button>
      <button onClick={recenterOnShape}>Recenter Shape</button>
      <button onClick={recenterOnContent}>Recenter around content</button>
      <button onClick={scaleToFit}>Recenter around content and scale</button>
      <button onClick={startAnimation}>Start Anim</button>
      <button onClick={(e) => { 
          e.preventDefault()
          e.stopPropagation()
        stop = true
        }}>Stop Anim</button>
    </div>
    {/* <CanvasModal modalId='one-and-only' offsetTop={50}>
      <ButtonGroup>
        <Button onClick={() => console.log('Option 1')}>Option 1</Button>
        <Button>Option 2</Button>
      </ButtonGroup>
    </CanvasModal> */}
    <CanvasFab fabId='one-and-only' offsetTop={50}>
      <ButtonGroup>
        <Button onClick={() => console.log('Option 1')}>Option 1</Button>
        <Button>Option 2</Button>
      </ButtonGroup>
    </CanvasFab>
    </>
  )
}