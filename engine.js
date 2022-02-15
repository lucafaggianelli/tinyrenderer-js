import { Vec3 } from "./geometry.js"
import { drawTriangle, drawTriangleTexture } from './renderer.js'

const MARGIN = 50

export default class Engine {
  lastFrameTime = 0

  constructor (canvas) {
    this.canvas = canvas

    this.canvas.style.backgroundColor = 'slategrey'
    this.canvas.style.width = '100%'
    this.canvas.style.height = '100vh'

    this.ctx = this.canvas.getContext('2d')

    this.fpsContainer = document.createElement('div')

    document.body.appendChild(this.fpsContainer)
  }

  renderModel (model) {
    const size = Math.min(this.canvas.height, this.canvas.height) - 2 * MARGIN

    const canvasWidth = this.canvas.width
    const canvasHeight = this.canvas.height
    const canvasData = this.ctx.getImageData(0, 0, canvasWidth, canvasHeight)
    const zBuffer = {}

    const highlightFaces = []

    for (const faceIndex in model.faces) {
      const isHighlighted = highlightFaces.includes(parseInt(faceIndex))
      const face = model.faces[faceIndex]
      const facetTexture = model.textureFacets[faceIndex]

      const faceNormal = model.vertices[face[2]].subtract(model.vertices[face[0]])
        .crossProduct(model.vertices[face[1]].subtract(model.vertices[face[0]]))

      const lightIntensity = faceNormal.normalize().multiply(this.lightDirection)

      if (lightIntensity <= 0) {
          continue
      }

      const trianglePoints = face.map(vertexIndex => {
        const vertex = model.vertices[vertexIndex]

        return new Vec3(
          Math.round((vertex.x + 1) * size / 2) + MARGIN,
          size - Math.round((vertex.y + 1) * size / 2) + MARGIN,
          vertex.z
        )
      })

      const texturePoints = facetTexture.map(vertexIndex => {
        const vertex = model.textureVertices[vertexIndex]

        return new Vec3(
          Math.round((vertex.x) * model.texture.width),
          model.texture.height - Math.round((vertex.y) * model.texture.height),
          vertex.z
        )
      })

      if (isHighlighted) {
        console.log('Facet', trianglePoints, face.map(vertexIndex => model.vertices[vertexIndex]))
        console.log('Texture', texturePoints, facetTexture.map(vertexIndex => model.textureVertices[vertexIndex]))

        const color = [ 255 * lightIntensity, 0, 0 ]
        drawTriangle(trianglePoints, canvasData, color, zBuffer)
      } else {
        drawTriangleTexture(trianglePoints, texturePoints, canvasData, model.texture, zBuffer, lightIntensity)
      }
    }

    this.updateCanvas(canvasData)
  }

  updateCanvas (canvasData) {
    this.ctx.putImageData(canvasData, 0, 0)
  }

  animate () {
    window.requestAnimationFrame((time) => {
      this.fps = 1 / ((performance.now() - this.lastFrameTime) / 1000);
      this.lastFrameTime = time
      this.fpsContainer.innerHTML = this.fps

      this.renderModel(model)
    })
  }
}
