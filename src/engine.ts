import { Color, Matrix, Vec3 } from './geometry'
import Model from './model'
import { drawTriangle, drawTriangleTexture } from './renderer.js'

const buildViewport = (x: number, y: number, w: number, h: number, depth: number) => {
  const m = Matrix.identity(4)

  m.data[0][3] = x+w/2
  m.data[1][3] = y+h/2
  m.data[2][3] = depth/2

  m.data[0][0] = w/2
  m.data[1][1] = h/2
  m.data[2][2] = depth/2

  return m
}

const lookAt = (eye: Vec3, center: Vec3, up: Vec3) => {
  const z = eye.subtract(center).normalize()
  const x = up.crossProduct(z).normalize()
  const y = z.crossProduct(x).normalize()

  const inverse = Matrix.identity(4)
  const tr = Matrix.identity(4)

  for (let i = 0; i < 3; i++) {
    inverse.data[0][i] = x.byIndex(i)
    inverse.data[1][i] = y.byIndex(i)
    inverse.data[2][i] = z.byIndex(i)
    tr.data[i][3] = -center.byIndex(i)
  }

  return inverse.multiply(tr)
}

export default class Engine {
  camera?: Vec3
  canvas: HTMLCanvasElement
  lightDirection?: Vec3
  models: Model[] = []

  private fpsContainer: HTMLElement
  private lastFrameTime = 0
  private perspectiveProjection: Matrix
  private viewport: Matrix

  constructor (canvas: HTMLCanvasElement) {
    // Canvas setup
    this.canvas = canvas
    this.canvas.style.backgroundColor = 'slategrey'
    this.canvas.style.width = '800'
    this.canvas.style.height = '800'
    this.canvas.style.margin = '0 auto'
    this.canvas.style.display = 'block'

    // Transformations
    /**
     * Transformation to create the 3D effect
     */
    this.perspectiveProjection = Matrix.identity(4)
    /**
     * Clip coordinates to the screen coordinates
     */
    this.viewport = buildViewport(this.canvas.width / 8, this.canvas.height / 8, this.canvas.width * 3/4, this.canvas.height * 3/4, 255)

    this.fpsContainer = document.createElement('div')
    document.body.appendChild(this.fpsContainer)
  }

  baseTransformations () {
    if (!this.camera) {
      throw new Error('Please define a camera')
    }

    const view = lookAt(this.camera, new Vec3(0, 0, 0), new Vec3(0, 1, 0))

    return this.viewport.multiply(this.perspectiveProjection).multiply(view)
  }

  renderModel (model: Model) {
    const canvasWidth = this.canvas.width
    const canvasHeight = this.canvas.height
    const canvasData = this.getCanvasContext().getImageData(0, 0, canvasWidth, canvasHeight)
    const zBuffer = {}

    const transformations = this.baseTransformations()

    for (const faceIndex in model.faces) {
      const face = model.faces[faceIndex]
      const facetTexture = model.textureFacets[faceIndex]

      let lightIntensities = new Vec3(0, 0, 0)

      if (this.lightDirection) {
        lightIntensities = new Vec3(
          ...face.map(vertexIndex =>
            model.verticesNormals[vertexIndex].normalize().multiply(this.lightDirection!.normalize())
          )
        )
      }

      const trianglePoints = face.map(vertexIndex => {
        const vertex = model.vertices[vertexIndex]
        const v = transformations.multiply(Matrix.fromVector(vertex)).toVector()
        v.y = canvasHeight - v.y

        v.roundCoordinates()
        return v
      })

      if (model.texture) {
        const texturePoints = facetTexture.map(vertexIndex => {
          const vertex = model.textureVertices[vertexIndex]

          return new Vec3(
            vertex.x * model.texture!.width,
            model.texture!.height - vertex.y * model.texture!.height,
            vertex.z
          ).roundCoordinates()
        })

        drawTriangleTexture(trianglePoints, texturePoints, canvasData, model.texture, zBuffer, lightIntensities)
      } else {
        drawTriangle(trianglePoints, canvasData, Color.WHITE, zBuffer, lightIntensities)
      }
    }

    this.updateCanvas(canvasData)
  }

  private getCanvasContext () {
    const ctx = this.canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Cant obtain canvas context')
    }

    return ctx
  }

  updateCanvas (canvasData: ImageData) {
    this.getCanvasContext().putImageData(canvasData, 0, 0)
  }

  render (callback?: () => void) {
    if (callback) {
      callback()
    }

    this.getCanvasContext().clearRect(0, 0, this.canvas.width, this.canvas.height)

    for (const model of this.models) {
      this.renderModel(model)
    }

    window.requestAnimationFrame((time) => {
      const fps = 1 / ((performance.now() - this.lastFrameTime) / 1000)
      this.lastFrameTime = time
      this.fpsContainer.innerHTML = fps.toFixed(0)

      // this.render(callback)
    })
  }
}
