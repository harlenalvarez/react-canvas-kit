import { BoxCapsule, Point, RigidNode, Spring, Vector2D } from '@practicaljs/canvas-kit'

type Node = {
  id: string,
  label: string
}
const generateNodes = (from: number, to: number) => {
  const nd = []
  for (let i = from; i <= to; i++) {
    nd.push({ id: `${i}`, label: `Node with id ${i}` })
  }
  return nd;
}

class GraphData {
  edges: [string, string][] = []
  nodes: Node[] = []
  root: Map<string, Set<string>> = new Map();


  initRoot() {
    for (const node of this.nodes) {
      this.root.set(node.id, new Set());
    }
    for (const [a, b] of this.edges) {
      this.union(a, b);
    }
  }

  union(x: string, y: string) {
    if (!this.root.has(x)) this.root.set(x, new Set());
    this.root.get(x)!.add(y);
  }

  connected = (x: string, y: string) => {
    if (this.root.get(x)?.has(y)) return true;
    if (this.root.get(y)?.has(x)) return true;
    return false;
  }
}

const mock = new GraphData()
mock.edges.push(['1', '2'])
mock.edges.push(['1', '3'])
mock.edges.push(['1', '4'])
mock.edges.push(['1', '5'])

mock.nodes = generateNodes(1, 5);
mock.initRoot();

class FdgSettings {
  restitution = .2;
  tension = 100;
  repulsive_tension = 100;
}

export const fdgSettings = new FdgSettings();

export function* fdg(center: Point) {
  const capsules: Map<string, BoxCapsule<RigidNode>> = new Map()
  const createCapsule = (id: string) => {
    const x = center.x + Math.random();
    const y = center.y + Math.random();
    const rigidNode = new RigidNode(id, new Vector2D(x, y), Vector2D.zero, Vector2D.zero, 1, false, fdgSettings.restitution)
    const capsule = new BoxCapsule(rigidNode, 100, 100);
    capsules.set(id, capsule);
  }

  for (const node of mock.nodes) {
    if (!capsules.has(node.id)) {
      createCapsule(node.id)
    }
  }

  const springs: Spring[] = []
  const repulsiveSprings: Spring[] = []
  const key = (a: string, b: string) => `${a}:${b}`
  const visited = new Set<string>();
  for (const node of mock.nodes) {
    for (const other of mock.nodes) {
      if (visited.has(key(node.id, other.id)) || visited.has(key(other.id, node.id))) continue;
      const nodeA = capsules.get(node.id)!;
      const nodeB = capsules.get(other.id)!

      const repulsive = !mock.connected(node.id, other.id)
      const springLengh = repulsive ? fdgSettings.repulsive_tension : fdgSettings.tension;
      const spring = new Spring(nodeA.component, nodeB.component, .98, springLengh, repulsive);
      if (repulsive) {
        repulsiveSprings.push(spring);
      }
      else {
        springs.push(spring);
      }
    }
  }





  yield capsules;
}