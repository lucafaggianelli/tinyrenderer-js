import { Box, Color, getBarycentricCoordinates, getBoundingBox, Vec3 } from "./geometry.js"

export const translateCoords = (point: Vec3, from: Box, to: Box) => {
  return new Vec3(
    to.x + (to.width / from.width) * (point.x - from.x),
    to.y + (to.height / from.height) * (point.y - from.y),
    point.z
  ).roundCoordinates()
}

export const drawLine = (p1: Vec3, p2: Vec3, canvasData: ImageData, color: Color) => {
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
      drawPixel(canvasData, new Vec3(y, x), color)
    } else {
      drawPixel(canvasData, new Vec3(x, y), color)
    }
  }
}

export const drawTriangle = (points: Vec3[], canvasData: ImageData, color: Color, zBuffer: any) => {
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

        drawPixel(canvasData, P, color)
      }
    }
  }
}

export const drawTriangleTexture = (points: Vec3[], texturePoints: Vec3[], canvasData: ImageData, texture: ImageData, zBuffer: any, lightIntensity = 1) => {
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
        const color = getPixel(texture, textureCoord)
        color.luminosity(lightIntensity)

        drawPixel(canvasData, P, color)
      }
    }
  }
}

// That's how you define the value of a pixel
function drawPixel(canvasData: ImageData, point: Vec3, color: Color) {
  const index = (point.x + point.y * canvasData.width) * 4;

  canvasData.data[index + 0] = color.r
  canvasData.data[index + 1] = color.g
  canvasData.data[index + 2] = color.b
  canvasData.data[index + 3] = color.a
}

function getPixel(canvasData: ImageData, point: Vec3) {
  const index = (point.x + point.y * canvasData.width) * 4

  return new Color(...canvasData.data.slice(index, index + 4))
}
