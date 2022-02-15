export class Vec2 {
  constructor (x, y) {
    this.x = x
    this.y = y
  }
}

export class Vec3 {
  constructor (x, y, z) {
    this.x = x
    this.y = y
    this.z = z
  }

  crossProduct (v) {
    return new Vec3(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    )
  }

  subtract (v) {
    return new Vec3(
      this.x - v.x,
      this.y - v.y,
      this.z - v.z
    )
  }

  normal () {
    return Math.sqrt(this.x**2 + this.y**2 + this.z**2)
  }

  multiply (v) {
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
}

export class Box {
  constructor (x, y, width, height) {
    this.x = x
    this.y = y
    this.width = width
    this.height = height
  }
}

export const getBarycentricCoordinates = (pts, P) => {
  const v1 = new Vec3(pts[2].x - pts[0].x, pts[1].x - pts[0].x, pts[0].x - P.x)
  const v2 = new Vec3(pts[2].y - pts[0].y, pts[1].y - pts[0].y, pts[0].y - P.y)
  const u = v1.crossProduct(v2)
  /* `pts` and `P` has integer value as coordinates
     so `abs(u[2])` < 1 means `u[2]` is 0, that means
     triangle is degenerate, in this case return something with negative coordinates */
  if (Math.abs(u[2])<1) return new Vec3(-1,1,1)

  return new Vec3(1-(u.x+u.y)/u.z, u.y/u.z, u.x/u.z)
}

export const getBoundingBox = (...points) => {
  const allX = points.map(point => point.x)
  const allY = points.map(point => point.y)

  const minX = Math.min(...allX)
  const minY = Math.min(...allY)
  const width = Math.max(...allX) - minX || 1
  const height = Math.max(...allY) - minY || 1

  return new Box(minX, minY, width, height)
}
