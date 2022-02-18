import { getBarycentricCoordinates, getBoundingBox, Vec3 } from "./geometry.js"

export const translateCoords = (point, from, to) => {
  return new Vec3(
    to.x + (to.width / from.width) * (point.x - from.x),
    to.y + (to.height / from.height) * (point.y - from.y),
    point.z
  )
}

export const drawLine = (p1, p2, canvasData, color) => {
  let steep = false

  const dx = p2.x - p1.x
  const dy = p2.y - p1.y

  if (Math.abs(dx) < Math.abs(dy)) {
    const tmp1 = p1.x
    const tmp2 = p2.x
    p1.x = p1.y
    p2.x = p2.y
    p1.y = tmp1
    p2.y = tmp2
    steep = true
  }

  if (p1.x > p2.x) {
    const tmp = p1.copy()
    p1 = p2
    p2 = tmp
  }

  for (let x = p1.x; x <= p2.x; x++) {
    const t = ((x - p1.x) / (p2.x - p1.x)) || 0
    const y = Math.round(p1.y * (1 - t) + p2.y * t)

    if (steep) {
      drawPixel(canvasData, y, x, ...color);
    } else {
      drawPixel(canvasData, x, y, ...color);
    }
  }
}

export const drawTriangle = (points, canvasData, color, zBuffer) => {
  const bbox = getBoundingBox(...points)

  const P = new Vec3(0, 0, 0)

  for (P.x = bbox.x; P.x <= bbox.x + bbox.width; P.x++) {
    for (P.y = bbox.y; P.y <= bbox.y + bbox.height; P.y++) {
      const bc_screen = getBarycentricCoordinates(points, P)

      if (bc_screen.x < 0 || bc_screen.y < 0 || bc_screen.z < 0) {
        continue
      }

      P.z = points[0].z * bc_screen.x + points[1].z * bc_screen.y + points[2].z * bc_screen.z

      const zIndex = Math.round(P.x + P.y * canvasData.width)
      if (zBuffer[zIndex] === undefined || zBuffer[zIndex] < P.z) {
        zBuffer[zIndex] = P.z

        drawPixel(canvasData, P.x, P.y, ...color)
      }
    }
  }
}

export const drawTriangleTexture = (points, texturePoints, canvasData, texture, zBuffer, lightIntensity = 1) => {
  const bbox = getBoundingBox(...points)
  const textureBbox = getBoundingBox(...texturePoints)

  const P = new Vec3(0, 0, 0)

  for (P.x = bbox.x; P.x <= bbox.x + bbox.width; P.x++) {
    for (P.y = bbox.y; P.y <= bbox.y + bbox.height; P.y++) {
      const bc_screen = getBarycentricCoordinates(points, P)

      if (bc_screen.x < 0 || bc_screen.y < 0 || bc_screen.z < 0) {
        continue
      }

      P.z = points[0].z * bc_screen.x + points[1].z * bc_screen.y + points[2].z * bc_screen.z

      const zIndex = P.x + P.y * canvasData.width
      if (!(zIndex in zBuffer) || P.z > zBuffer[zIndex]) {
        zBuffer[zIndex] = P.z

        const textureCoord = translateCoords(P, bbox, textureBbox)
        const color = getPixel(texture, Math.round(textureCoord.x), Math.round(textureCoord.y))
        color[0] *= lightIntensity
        color[1] *= lightIntensity
        color[2] *= lightIntensity

        drawPixel(canvasData, P.x, P.y, ...color)
      }
    }
  }
}

// That's how you define the value of a pixel
function drawPixel(canvasData, x, y, r, g, b, a = 255) {
  var index = (x + y * canvasData.width) * 4;

  canvasData.data[index + 0] = r;
  canvasData.data[index + 1] = g;
  canvasData.data[index + 2] = b;
  canvasData.data[index + 3] = a;
}

function getPixel(canvasData, x, y) {
  var index = (x + y * canvasData.width) * 4;

  return canvasData.data.slice(index, index + 4)
}
