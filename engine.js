import { Matrix, Vec3 } from "./geometry.js"
import { drawTriangle, drawTriangleTexture } from './renderer.js'

const buildViewport = (x, y, w, h, depth) => {
  const m = Matrix.identity(4)

  m.data[0][3] = x+w/2
  m.data[1][3] = y+h/2
  m.data[2][3] = depth/2

  m.data[0][0] = w/2
  m.data[1][1] = h/2
  m.data[2][2] = depth/2

  return m
}

export default class Engine {
  lastFrameTime = 0

  constructor (canvas) {
    this.canvas = canvas

    this.canvas.style.backgroundColor = 'slategrey'
    this.canvas.style.width = '800'
    this.canvas.style.height = '800'
    this.canvas.style.margin = '0 auto'
    this.canvas.style.display = 'block'
    this.ctx = this.canvas.getContext('2d')

    this.screenSize = Math.min(this.canvas.height, this.canvas.height)

    this.camera = new Vec3(0, 0, 20)

    this.projection = Matrix.identity(4)
    this.projection.data[3][2] = -1 / this.camera.z

    this.viewport = buildViewport(this.canvas.width / 8, this.canvas.height / 8, this.canvas.width * 3/4, this.canvas.height * 3/4, 255)

    this.fpsContainer = document.createElement('div')
    document.body.appendChild(this.fpsContainer)
  }

  baseTransformations () {
    return this.viewport.multiply(this.projection)
  }

  renderModel (model) {
    const canvasWidth = this.canvas.width
    const canvasHeight = this.canvas.height
    const canvasData = this.ctx.getImageData(0, 0, canvasWidth, canvasHeight)
    const zBuffer = {}

    const highlightFaces = []

    const transformations = this.baseTransformations()

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
        const v = transformations.multiply(Matrix.fromVector(vertex)).toVector()
        v.y = canvasHeight - v.y

        v.roundCoordinates()
        return v
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
