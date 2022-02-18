export class Color {
  constructor (...channels: number[])
  constructor (public r: number, public g: number, public b: number, public a: number = 255) {}

  static WHITE = new Color(255, 255, 255)

  copy () {
    return new Color(this.r, this.g, this.b, this.a)
  }

  luminosity (factor: number) {
    this.r *= factor
    this.g *= factor
    this.b *= factor
    return this
  }
}

export class Vec3 {
  constructor (...coordinates: number[])
  constructor (public x: number, public y: number, public z: number) {}

  crossProduct (v: Vec3) {
    return new Vec3(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    )
  }

  subtract (v: Vec3) {
    return new Vec3(
      this.x - v.x,
      this.y - v.y,
      this.z - v.z
    )
  }

  normal () {
    return Math.sqrt(this.x**2 + this.y**2 + this.z**2)
  }

  multiply (v: Vec3) {
    return this.x * v.x + this.y * v.y + this.z * v.z
  }

  normalize () {
    const normal = this.normal()
    this.x /= normal
    this.y /= normal
    this.z /= normal

    return this
  }

  copy () {
    return new Vec3(this.x, this.y, this.z)
  }

  roundCoordinates () {
    this.x = Math.round(this.x)
    this.y = Math.round(this.y)
    this.z = Math.round(this.z)
    return this
  }

  abs () {
    this.x = Math.abs(this.x)
    this.y = Math.abs(this.y)
    this.z = Math.abs(this.z)
    return this
  }
}

export class Box {
  constructor (public x: number, public y: number, public width: number, public height: number) {}
}

export const getBarycentricCoordinates = (pts: Vec3[], P: Vec3) => {
  const v1 = new Vec3(pts[2].x - pts[0].x, pts[1].x - pts[0].x, pts[0].x - P.x)
  const v2 = new Vec3(pts[2].y - pts[0].y, pts[1].y - pts[0].y, pts[0].y - P.y)
  const u = v1.crossProduct(v2)

  /* `pts` and `P` has integer value as coordinates
     so `abs(u[2])` < 1 means `u[2]` is 0, that means
     triangle is degenerate, in this case return something with negative coordinates */
  if (Math.abs(u.z) < 1e-2) {
    return new Vec3(-1,1,1)
  }

  return new Vec3(1-(u.x+u.y)/u.z, u.y/u.z, u.x/u.z)
}

export const getBoundingBox = (...points: Vec3[]) => {
  const allX = points.map(point => point.x)
  const allY = points.map(point => point.y)

  const minX = Math.min(...allX)
  const minY = Math.min(...allY)
  const width = Math.max(...allX) - minX || 1
  const height = Math.max(...allY) - minY || 1

  return new Box(minX, minY, width, height)
}

export class Matrix {
  rows: number
  cols: number
  data: number[][]

  constructor (rows: number, cols?: number) {
    this.rows = rows
    this.cols = cols || rows

    this.data = Array(rows).fill(0).map(() => Array(this.cols).fill(0))
  }

  scale (factor: number) {
    for (let i=0; i<this.rows; i++) {
      for (let j=0; j<this.cols; j++) {
        this.data[i][j] *= factor
      }
    }

    return this
  }

  multiply (m: Matrix) {
    if (this.cols !== m.rows) {
      throw new Error(`Matrices bad sizes ${this.cols} and ${m.rows}`)
    }

    const result = new Matrix(this.rows, m.cols)

    for (let i=0; i<this.rows; i++) {
      for (let j=0; j<m.cols; j++) {
        // result.data[i][j] = 0

        for (let k=0; k<this.cols; k++) {
          result.data[i][j] += this.data[i][k] * m.data[k][j];
        }
      }
    }

    return result
  }

  toVector () {
    return new Vec3(this.data[0][0] / this.data[3][0], this.data[1][0]/this.data[3][0], this.data[2][0]/ this.data[3][0]);
  }

  static identity (size: number) {
    const m = new Matrix(size)

    for (let i = 0; i < size; i++) {
      m.data[i][i] = 1
    }

    return m
  }

  static fromVector (v: Vec3) {
    const m = new Matrix(4, 1)

    m.data[0][0] = v.x
    m.data[1][0] = v.y
    m.data[2][0] = v.z
    m.data[3][0] = 1

    return m
  }
}
