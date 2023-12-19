import { canvasTransform, getCanvas2DContext } from '@/canvas';
import { requestRedraw, useRedrawEvent } from '@/hooks';
import { clearAll } from '@/utils';
import { BoxCapsule, Point, RigidNode, Spring, Vector2D, getCanvasCenter, getCanvasPoint } from '@practicaljs/canvas-kit';
import { useEffect } from 'react';
import { ZoomComponent } from './ZoomComponent';
import { Rect2D, clearPaths, drawRectangle, nodeConnections, paths } from './drawRectangle';

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
  
  if(clickedPath && previousPath) {
    if(!rigidBodies[clickedPath.key] || !rigidBodies[previousPath.key]) {
      mapToRigidBodies();
    }
    const spring = new Spring(
      rigidBodies[previousPath.key].component, rigidBodies[clickedPath.key].component, K, TENSION, false
    )
    nodeConnections.push(spring)
    drawLine(ctx, previousPath.trackingPoint, clickedPath.trackingPoint);
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

const stopDrag = (e: React.MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
  draggedNode = null
  draging = false;
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

const redrawAll = (ctx?: CanvasRenderingContext2D | null) => {
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
    drawLine(ctx, spring.nodeA.point, spring.nodeB.point)
  }
  ctx.restore()
  for (const path of paths) {
    drawRectangle(0, 0, ctx, path)
  }
}

const redraw = () => {
  requestAnimationFrame(redrawAll)
}

const drawLine = (ctx: CanvasRenderingContext2D, a: Point, b: Point) => {
  ctx.beginPath()
  ctx.moveTo(a.x, a.y)
  ctx.lineTo(b.x, b.y)
  ctx.stroke()
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
      const spring = new Spring(n.component, other.component, K, TENSION, true);
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
  temp = 1;
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
    containBodies()
    clearReadrawAll()

    console.log('Energy ', energy);
    if(Math.abs(energy-lastEnergy) <= 0.001) {
      console.log('Stopping')
      return;
    }
    lastEnergy = energy
    temp = cool(temp)
    console.log(temp)
  }
  if(stop) return;
  requestAnimationFrame(animateGraph)
}

export const ActionContainer = () => {
  useRedrawEvent(redraw, []);
  useEffect(() => {
    return () => {
      clearPaths();
    }
  })
  return (
    <div 
    style={{ width: '100%' }} 
    onClick={handleClick}
    onPointerDown={handleDrag}
    onPointerMoveCapture={onDrag}
    onPointerUp={stopDrag}
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
  )
}