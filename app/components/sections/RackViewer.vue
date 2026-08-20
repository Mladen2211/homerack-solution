<script setup lang="ts">
import * as THREE from 'three'

const canvasHolder = ref<HTMLDivElement | null>(null)
const frameEl = ref<HTMLDivElement | null>(null)

// ---- reactive UI state (mirrors the original panel's checkboxes/sliders/switches) ----
const showPosts = ref(true)
const showRods = ref(true)
const showPanels = ref(true)
const showRivets = ref(true)
const showHoles = ref(true)
const showFeet = ref(true)
const showDoor = ref(false)
const explodeValue = ref(0)
const doorValue = ref(0)
const variant = ref<Variant>('R1')
const finishKey = ref<Finish>('raw')

const VARIANTS: Record<Variant, { height: number; numU: number; title: string; sub: string }> = {
  R1: { height: 500, numU: 10, title: 'Homerack R1', sub: '10U · drag to orbit · scroll to zoom' },
  R5: { height: 250, numU: 5, title: 'Homerack R.5', sub: '5U · half-height variant' },
}

const modelTitle = computed(() => VARIANTS[variant.value].title)
const modelSub = computed(() => VARIANTS[variant.value].sub)
const doorLabel = computed(() => {
  if (doorValue.value === 0) return 'closed'
  if (doorValue.value === 100) return 'open'
  return `${doorValue.value}%`
})

// Exposed so LifestyleSection's room toggle can drive the same state a click on the
// in-panel buttons would.
defineExpose({
  applyFinish: (key: Finish) => {
    finishKey.value = key
  },
  selectVariant: (key: Variant) => {
    variant.value = key
  },
})

let cleanup: (() => void) | null = null

onMounted(() => {
  const holder = canvasHolder.value!
  const frame = frameEl.value!

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0e0f13)

  const viewerSize = () => ({ w: frame.clientWidth, h: frame.clientHeight })
  const sz0 = viewerSize()
  const camera = new THREE.PerspectiveCamera(42, sz0.w / sz0.h, 1, 5000)

  const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true })
  renderer.setSize(sz0.w, sz0.h)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  holder.appendChild(renderer.domElement)

  scene.add(new THREE.AmbientLight(0xffffff, 0.55))
  const key = new THREE.DirectionalLight(0xffffff, 0.9)
  key.position.set(500, 800, 600)
  scene.add(key)
  const fill = new THREE.DirectionalLight(0xaecfff, 0.35)
  fill.position.set(-600, 300, -400)
  scene.add(fill)
  const rim = new THREE.DirectionalLight(0xffffff, 0.25)
  rim.position.set(0, -400, -600)
  scene.add(rim)

  // ---- orbit controls ----
  const target = new THREE.Vector3(0, 250, 0)
  const spherical = new THREE.Spherical()
  spherical.setFromVector3(new THREE.Vector3(650, 500, 780).sub(target))
  let isDragging = false
  let activePointerId: number | null = null
  let lastX = 0
  let lastY = 0
  const dom = renderer.domElement

  function updateCam() {
    const pos = new THREE.Vector3().setFromSpherical(spherical).add(target)
    camera.position.copy(pos)
    camera.lookAt(target)
  }

  // Pointer capture (rather than window-level listeners) means this element keeps
  // receiving pointermove/pointerup/pointercancel for the drag even if the cursor
  // leaves the viewport or the browser window entirely — without it, releasing the
  // button outside the window never fires pointerup and the orbit is left spinning
  // on the next unrelated mouse movement. Tracking pointerId (rather than a single
  // shared isDragging flag) keeps a second simultaneous pointer (e.g. a pinch gesture
  // starting) from hijacking lastX/lastY mid-drag.
  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return
    isDragging = true
    activePointerId = e.pointerId
    lastX = e.clientX
    lastY = e.clientY
    dom.setPointerCapture(e.pointerId)
  }
  const onPointerUp = (e: PointerEvent) => {
    if (e.pointerId !== activePointerId) return
    isDragging = false
    activePointerId = null
  }
  const onPointerMove = (e: PointerEvent) => {
    if (!isDragging || e.pointerId !== activePointerId) return
    const dx = e.clientX - lastX
    const dy = e.clientY - lastY
    lastX = e.clientX
    lastY = e.clientY
    spherical.theta -= dx * 0.006
    spherical.phi -= dy * 0.006
    spherical.phi = Math.max(0.15, Math.min(Math.PI - 0.15, spherical.phi))
    updateCam()
  }
  const onWheel = (e: WheelEvent) => {
    e.preventDefault()
    spherical.radius *= 1 + e.deltaY * 0.001
    spherical.radius = Math.max(200, Math.min(2400, spherical.radius))
    updateCam()
  }
  dom.addEventListener('pointerdown', onPointerDown)
  dom.addEventListener('pointerup', onPointerUp)
  dom.addEventListener('pointercancel', onPointerUp)
  dom.addEventListener('pointermove', onPointerMove)
  dom.addEventListener('wheel', onWheel, { passive: false })
  updateCam()

  // ---- materials ----
  const alumMat = new THREE.MeshStandardMaterial({ color: 0xcfd3da, metalness: 0.75, roughness: 0.32 })
  const rodMat = new THREE.MeshStandardMaterial({
    color: 0xa9adb8,
    metalness: 0.7,
    roughness: 0.35,
    side: THREE.DoubleSide,
  })

  function ventTexture(baseColor?: string, holeColor?: string) {
    baseColor = baseColor || '#6c7180'
    holeColor = holeColor || '#2e3138'
    const size = 512
    const c = document.createElement('canvas')
    c.width = c.height = size
    const ctx = c.getContext('2d')!
    ctx.fillStyle = baseColor
    ctx.fillRect(0, 0, size, size)
    ctx.fillStyle = holeColor
    const step = 16
    const r = 3.4
    const margin = 30
    for (let y = margin; y < size - margin; y += step) {
      for (let x = margin; x < size - margin; x += step) {
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    const tex = new THREE.CanvasTexture(c)
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping
    return tex
  }

  const ventedPanelMat = new THREE.MeshStandardMaterial({
    map: ventTexture(),
    color: 0xffffff,
    metalness: 0.55,
    roughness: 0.55,
    side: THREE.DoubleSide,
  })
  const solidPanelMat = new THREE.MeshStandardMaterial({ color: 0x6c7180, metalness: 0.6, roughness: 0.4, side: THREE.DoubleSide })
  const rivetMat = new THREE.MeshStandardMaterial({
    color: 0xffcf5c,
    metalness: 0.4,
    roughness: 0.4,
    emissive: 0x442e00,
    emissiveIntensity: 0.25,
  })
  const rivetGeo = new THREE.CylinderGeometry(2, 2, 9, 12)
  const holeMat = new THREE.MeshStandardMaterial({ color: 0x0c0d10, metalness: 0.1, roughness: 0.9 })
  const footMat = new THREE.MeshStandardMaterial({ color: 0x121214, metalness: 0.05, roughness: 0.9 })
  const hingeMat = new THREE.MeshStandardMaterial({ color: 0x2b2e36, metalness: 0.65, roughness: 0.32 })
  const latchMat = new THREE.MeshStandardMaterial({ color: 0xc9524a, metalness: 0.5, roughness: 0.4 })

  // ---- constant geometry ----
  const POST = 15
  const FOOT = 252
  const HALF = FOOT / 2
  const OFF = HALF - POST / 2
  const WALL = 2
  const TUBE_WALL = 1.5
  const PANEL_T = 1.5
  const EPS = 0.3
  const U = 44.45
  const FOOT_R = 11
  const FOOT_H = 8
  const postPositions = [
    { x: -OFF, z: -OFF },
    { x: OFF, z: -OFF },
    { x: -OFF, z: OFF },
    { x: OFF, z: OFF },
  ]

  const groupPosts = new THREE.Group()
  const groupRods = new THREE.Group()
  const groupPanels = new THREE.Group()
  const groupRivets = new THREE.Group()
  const groupHoles = new THREE.Group()
  const groupFeet = new THREE.Group()
  const doorPivot = new THREE.Object3D() // rotates — the door leaf itself
  const groupDoorFixed = new THREE.Group() // stays put — hinge leaf + latch
  scene.add(groupPosts, groupRods, groupPanels, groupRivets, groupHoles, groupFeet, doorPivot, groupDoorFixed)
  const grid = new THREE.GridHelper(1000, 20, 0x23262f, 0x181a20)
  scene.add(grid)

  // Disposes geometries (not materials — those are shared module-scoped instances
  // reused across rebuilds) before dropping each child, so toggling between R1 and
  // R.5 doesn't leak a fresh set of GPU buffers on every switch.
  function clearGroup(g: THREE.Object3D) {
    while (g.children.length) {
      const child = g.children[0]!
      child.traverse((obj) => {
        const mesh = obj as THREE.Mesh
        mesh.geometry?.dispose()
      })
      g.remove(child)
    }
  }

  function makeHollowPost(size: number, wall: number, length: number) {
    const g = new THREE.Group()
    const half = size / 2
    const walls = [
      { w: size, d: wall, x: 0, z: half - wall / 2 },
      { w: size, d: wall, x: 0, z: -half + wall / 2 },
      { w: wall, d: size - 2 * wall, x: half - wall / 2, z: 0 },
      { w: wall, d: size - 2 * wall, x: -half + wall / 2, z: 0 },
    ]
    walls.forEach((wd) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(wd.w, length, wd.d), alumMat)
      m.position.set(wd.x, 0, wd.z)
      g.add(m)
    })
    return g
  }

  function buildMiterSlab(
    crossAxis: 'x' | 'z',
    crossOuter: number,
    crossInner: number,
    runAxis: 'x' | 'z',
    thickAxis: 'y',
    thickMin: number,
    thickMax: number,
  ) {
    const inset = Math.abs(crossOuter - crossInner)
    const pts2D = [
      [crossInner, -HALF + inset],
      [crossOuter, -HALF],
      [crossOuter, HALF],
      [crossInner, HALF - inset],
    ]
    function make3(pt2: number[], thickVal: number) {
      const p: Record<string, number> = { x: 0, y: 0, z: 0 }
      p[crossAxis] = pt2[0]!
      p[runAxis] = pt2[1]!
      p[thickAxis] = thickVal
      return new THREE.Vector3(p.x, p.y, p.z)
    }
    const bottom = pts2D.map((p) => make3(p, thickMin))
    const top = pts2D.map((p) => make3(p, thickMax))
    const verts = [...bottom, ...top]
    const positions: number[] = []
    function pushTri(a: number, b: number, c: number) {
      ;[a, b, c].forEach((i) => positions.push(verts[i]!.x, verts[i]!.y, verts[i]!.z))
    }
    pushTri(0, 1, 2)
    pushTri(0, 2, 3)
    pushTri(4, 6, 5)
    pushTri(4, 7, 6)
    for (let i = 0; i < 4; i++) {
      const ni = (i + 1) % 4
      pushTri(i, ni, ni + 4)
      pushTri(i, ni + 4, i + 4)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.computeVertexNormals()
    return geo
  }

  function addRivet(x: number, y: number, z: number, axis: 'x' | 'z') {
    const m = new THREE.Mesh(rivetGeo, rivetMat)
    m.position.set(x, y, z)
    if (axis === 'x') m.rotation.z = Math.PI / 2
    if (axis === 'z') m.rotation.x = Math.PI / 2
    groupRivets.add(m)
  }

  function buildAssembly(height: number, numU: number) {
    clearGroup(groupPosts)
    clearGroup(groupRods)
    clearGroup(groupPanels)
    clearGroup(groupRivets)
    clearGroup(groupHoles)
    clearGroup(groupFeet)
    clearGroup(doorPivot)
    clearGroup(groupDoorFixed)
    doorPivot.rotation.y = 0

    // 1. corner posts
    postPositions.forEach((p) => {
      const g = makeHollowPost(POST, TUBE_WALL, height)
      g.position.set(p.x, height / 2, p.z)
      g.userData.base = g.position.clone()
      g.userData.dir = new THREE.Vector3(p.x, 0, p.z).normalize()
      groupPosts.add(g)
    })

    // 1b. feet — small pads directly under each post
    const footGeo = new THREE.CylinderGeometry(FOOT_R, FOOT_R * 0.9, FOOT_H, 20)
    postPositions.forEach((p) => {
      const f = new THREE.Mesh(footGeo, footMat)
      f.position.set(p.x, -FOOT_H / 2, p.z)
      f.userData.base = f.position.clone()
      f.userData.dir = new THREE.Vector3(0, -1, 0)
      groupFeet.add(f)
    })

    // 2. angle rods
    const rodSides: { crossAxis: 'x' | 'z'; crossOuter: number; runAxis: 'x' | 'z' }[] = [
      { crossAxis: 'x', crossOuter: HALF, runAxis: 'z' },
      { crossAxis: 'x', crossOuter: -HALF, runAxis: 'z' },
      { crossAxis: 'z', crossOuter: HALF, runAxis: 'x' },
      { crossAxis: 'z', crossOuter: -HALF, runAxis: 'x' },
    ]
    const levels = [
      { capMin: height, capMax: height + WALL, legMin: height - POST, legMax: height, dirY: 1 },
      { capMin: -WALL, capMax: 0, legMin: 0, legMax: POST, dirY: -1 },
    ]
    rodSides.forEach((side) => {
      const sgn = Math.sign(side.crossOuter)
      const crossInner = side.crossOuter - sgn * POST
      levels.forEach((lvl) => {
        const group = new THREE.Group()
        const capGeo = buildMiterSlab(side.crossAxis, side.crossOuter, crossInner, side.runAxis, 'y', lvl.capMin, lvl.capMax)
        group.add(new THREE.Mesh(capGeo, rodMat))
        const legOuter = side.crossOuter + sgn * EPS
        const legInner = legOuter + sgn * WALL
        const legCenter = (legOuter + legInner) / 2
        const legMidY = (lvl.legMin + lvl.legMax) / 2
        let leg: THREE.Mesh
        if (side.crossAxis === 'x') {
          leg = new THREE.Mesh(new THREE.BoxGeometry(WALL, POST, FOOT), rodMat)
          leg.position.set(legCenter, legMidY, 0)
        } else {
          leg = new THREE.Mesh(new THREE.BoxGeometry(FOOT, POST, WALL), rodMat)
          leg.position.set(0, legMidY, legCenter)
        }
        group.add(leg)
        group.userData.base = new THREE.Vector3(0, 0, 0)
        const dirX = side.crossAxis === 'x' ? sgn : 0
        const dirZ = side.crossAxis === 'z' ? sgn : 0
        group.userData.dir = new THREE.Vector3(dirX, lvl.dirY * 0.6, dirZ).normalize()
        groupRods.add(group)

        // rivet through the LEG face into the post's flat side wall — not down through
        // the thin mitered cap into the hollow post end, which has almost nothing to bite into
        if (side.crossAxis === 'x') {
          ;[-OFF, OFF].forEach((zEnd) => addRivet(legCenter, legMidY, zEnd, 'x'))
        } else {
          ;[-OFF, OFF].forEach((xEnd) => addRivet(xEnd, legMidY, legCenter, 'z'))
        }
      })
    })

    // 3. panels
    const sidePanelGeo = new THREE.BoxGeometry(PANEL_T, height, FOOT)
    ;[-1, 1].forEach((sign) => {
      const m = new THREE.Mesh(sidePanelGeo, ventedPanelMat)
      m.position.set(sign * HALF, height / 2, 0)
      m.userData.base = m.position.clone()
      m.userData.dir = new THREE.Vector3(sign, 0, 0)
      m.userData.kind = 'side'
      m.userData.sign = sign
      groupPanels.add(m)
    })
    const CAP_PANEL_SIZE = FOOT - 12
    const capPanelGeo = new THREE.BoxGeometry(CAP_PANEL_SIZE, PANEL_T, CAP_PANEL_SIZE)
    ;[
      { y: height - PANEL_T / 2, dir: 1, kind: 'top' },
      { y: PANEL_T / 2, dir: -1, kind: 'bottom' },
    ].forEach((spec) => {
      const m = new THREE.Mesh(capPanelGeo, solidPanelMat)
      m.position.set(0, spec.y, 0)
      m.userData.base = m.position.clone()
      m.userData.dir = new THREE.Vector3(0, spec.dir, 0)
      m.userData.kind = spec.kind
      groupPanels.add(m)
    })

    // 4. mounting holes — both faces of each post
    function eiaHoleOffsets() {
      const offs: number[] = []
      for (let u = 0; u < numU; u++) {
        const uStart = u * U
        offs.push(uStart + 6.35, uStart + 22.225, uStart + 38.1)
      }
      return offs
    }
    const railStartY = (height - numU * U) / 2
    const holeYs = eiaHoleOffsets().map((o) => railStartY + o)
    const holeGeo = new THREE.CylinderGeometry(2.1, 2.1, TUBE_WALL * 2.2, 14)
    postPositions.forEach((p) => {
      const outward = Math.sign(p.z)
      const dir = new THREE.Vector3(p.x, 0, p.z).normalize()
      ;[outward, -outward].forEach((faceDir) => {
        holeYs.forEach((y) => {
          const h = new THREE.Mesh(holeGeo, holeMat)
          h.rotation.x = Math.PI / 2
          h.position.set(p.x, y, p.z + faceDir * (POST / 2 - TUBE_WALL / 2))
          h.userData.base = h.position.clone()
          h.userData.dir = dir
          groupHoles.add(h)
        })
      })
    })

    // panel rivets (frame-corner rivets were already added above, at the leg/post joints).
    // Top/bottom panels don't get rivets — they're sized to sit inside the frame, resting
    // against the underside of the cap ring, held in place once the side panels are on.
    groupPanels.children.forEach((panel) => {
      if (panel.userData.kind !== 'side') return
      const x = panel.userData.sign * HALF
      ;[-OFF, OFF].forEach((z) => {
        addRivet(x, WALL + 4, z, 'x')
        addRivet(x, height - WALL - 4, z, 'x')
      })
      addRivet(x, height / 2, -OFF, 'x')
    })

    // 5. front door — same closed-position appearance as before (rods in front of the
    // front-left/front-right posts, same X-centerline). Two things had to change to
    // actually deliver a real 270° swing, and both were verified numerically before
    // touching the code (full 1°-step sweep, checked clearance against both posts):
    //
    // 1) The pivot has to be at the true hinge point, not at the door stile's own
    //    center — otherwise the hinge-side stile has ~zero swing radius and just spins
    //    in place, still parked in front of the left post at every angle.
    // 2) A pivot placed right at the post's face (a tight, ~2mm-gap flush hinge) still
    //    isn't enough: with only a ~14mm swing radius, sweeping 270° brings the stile
    //    back around to within ~1mm of the post — it clips on the way round, worst
    //    around 250-270°. A genuine collision-free 270° needs roughly 16mm more
    //    standoff than a flush hinge gives — a "wide-throw"/extended-offset hinge,
    //    used specifically to hold a door proud of an obstruction it needs to swing
    //    clear of. That's exactly this situation, not a cosmetic choice.
    const GAP = 6
    const doorRestX = -OFF
    const doorRestZ = -HALF - GAP - POST / 2 // door's closed-position target — unchanged
    const doorWidth = 2 * OFF

    const hingeFaceX = -HALF // post's outer face AND door stile's outer face — shared plane
    const PIVOT_X = -142
    const PIVOT_Z = -121 // verified: clear of both posts through the full 0-270° sweep
    doorPivot.position.set(PIVOT_X, 0, PIVOT_Z)
    const toLocal = (wx: number, wz: number): [number, number] => [wx - PIVOT_X, wz - PIVOT_Z]

    let [lx, lz] = toLocal(doorRestX, doorRestZ)
    const doorLeftRod = makeHollowPost(POST, TUBE_WALL, height)
    doorLeftRod.position.set(lx, height / 2, lz)
    doorPivot.add(doorLeftRod)

    ;[lx, lz] = toLocal(doorRestX + doorWidth, doorRestZ)
    const doorRightRod = makeHollowPost(POST, TUBE_WALL, height)
    doorRightRod.position.set(lx, height / 2, lz)
    doorPivot.add(doorRightRod)

    ;[lx, lz] = toLocal(doorRestX + OFF, doorRestZ - POST / 2 - PANEL_T / 2)
    const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(FOOT, height, PANEL_T), ventedPanelMat)
    doorPanel.position.set(lx, height / 2, lz) // flush on the door's own outer face
    doorPivot.add(doorPanel)

    // wide-throw hinge: barrel at the true pivot, connected back to each mounting face
    // by an offset bracket — a straight bracket on the post side (same Z as the pivot,
    // so it's just a plain standoff arm), an angled one on the door side (the door's
    // own face sits at a different Z, so its bracket has to bridge both X and Z).
    function makeBar(ax: number, az: number, bx: number, bz: number, thickness: number, mat: THREE.Material) {
      const dx = bx - ax
      const dz = bz - az
      const len = Math.hypot(dx, dz)
      const bar = new THREE.Mesh(new THREE.BoxGeometry(len, height, thickness), mat)
      bar.position.set((ax + bx) / 2, height / 2, (az + bz) / 2)
      bar.rotation.y = Math.atan2(-dz, dx)
      return bar
    }

    const hingeBarrel = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, height, 16), hingeMat)
    hingeBarrel.position.set(PIVOT_X, height / 2, PIVOT_Z) // fixed — the pin doesn't rotate
    groupDoorFixed.add(hingeBarrel)

    // post-side bracket: post's outer face → pivot (world coords, fixed)
    const postMountZ = PIVOT_Z // mounting height on the post's face lines up straight with the pivot
    const postBracket = makeBar(hingeFaceX, postMountZ, PIVOT_X, PIVOT_Z, 6, hingeMat)
    groupDoorFixed.add(postBracket)

    // door-side bracket: door stile's outer face (when closed) → pivot, built in world
    // coords for clarity then converted to local (it rotates with the door)
    const doorMountWorldX = hingeFaceX
    const doorMountWorldZ = doorRestZ + 2 // near the stile's own depth
    const [pax, paz] = toLocal(doorMountWorldX, doorMountWorldZ)
    const [pbx, pbz] = toLocal(PIVOT_X, PIVOT_Z) // = [0,0], the pivot itself
    const doorBracket = makeBar(pax, paz, pbx, pbz, 6, hingeMat)
    doorPivot.add(doorBracket)

    // magnetic latch on the opposite (right) side — same shared-plane logic as before,
    // both magnets at the identical world position when closed, well clear of the
    // Z-face mounting holes and positioned at the same corner heights as the frame rivets.
    const latchGeo = new THREE.CylinderGeometry(4, 4, 3, 16)
    const latchZ = -HALF + 5 // near the post's own front-face edge
    ;[POST / 2, height - POST / 2].forEach((y) => {
      const postSide = new THREE.Mesh(latchGeo, latchMat)
      postSide.rotation.z = Math.PI / 2
      postSide.position.set(HALF + 1.5, y, latchZ) // world — proud on the right post's outer face
      groupDoorFixed.add(postSide)

      const [dx, dz] = toLocal(HALF + 1.5, latchZ)
      const doorSide = new THREE.Mesh(latchGeo, latchMat)
      doorSide.rotation.z = Math.PI / 2
      doorSide.position.set(dx, y, dz) // local — same world position when closed
      doorPivot.add(doorSide)
    })

    doorPivot.visible = showDoor.value
    groupDoorFixed.visible = showDoor.value

    grid.position.y = -Math.max(60, height * 0.12) - FOOT_H
    applyExplode()
  }

  function applyExplode() {
    const amt = explodeValue.value * 1.4
    groupRivets.visible = amt === 0 && showRivets.value
    groupPosts.children.forEach((m) => m.position.copy(m.userData.base).addScaledVector(m.userData.dir, amt))
    groupRods.children.forEach((m) => m.position.copy(m.userData.base).addScaledVector(m.userData.dir, amt * 0.7))
    groupPanels.children.forEach((m) => m.position.copy(m.userData.base).addScaledVector(m.userData.dir, amt * 1.3))
    groupHoles.children.forEach((m) => m.position.copy(m.userData.base).addScaledVector(m.userData.dir, amt))
    groupFeet.children.forEach((m) => m.position.copy(m.userData.base).addScaledVector(m.userData.dir, amt * 0.5))
  }

  function runSelectVariant(key: Variant) {
    const v = VARIANTS[key]
    buildAssembly(v.height, v.numU)
    explodeValue.value = 0
    doorValue.value = 0
    target.set(0, v.height / 2, 0)
    spherical.radius = v.height * 1.7
    updateCam()
  }

  // Swatch colors come from the shared FINISH_COLORS (also used by SiteFooter and the
  // room-mood panel) so there's one place to update if a finish's hex ever changes;
  // metalness/roughness/panel-texture colors are Three.js-specific and stay local.
  const hexToThree = (hex: string) => Number(`0x${hex.slice(1)}`)
  const FINISHES: Record<Finish, { color: number; metalness: number; roughness: number; panelBase: string; panelHole: string }> = {
    raw: { color: hexToThree(FINISH_COLORS.raw), metalness: 0.75, roughness: 0.32, panelBase: '#6c7180', panelHole: '#2e3138' },
    white: { color: hexToThree(FINISH_COLORS.white), metalness: 0.12, roughness: 0.6, panelBase: '#f1f0ec', panelHole: '#c7c6c0' },
    black: { color: hexToThree(FINISH_COLORS.black), metalness: 0.18, roughness: 0.55, panelBase: '#232529', panelHole: '#08080a' },
  }

  function runApplyFinish(key: Finish) {
    const f = FINISHES[key]
    ;[alumMat, rodMat, solidPanelMat].forEach((m) => {
      m.color.setHex(f.color)
      m.metalness = f.metalness
      m.roughness = f.roughness
    })
    ventedPanelMat.map?.dispose()
    ventedPanelMat.map = ventTexture(f.panelBase, f.panelHole)
    ventedPanelMat.map.needsUpdate = true
    ventedPanelMat.metalness = f.metalness
    ventedPanelMat.roughness = f.roughness
  }

  function onViewerResize() {
    const sz = viewerSize()
    if (sz.w < 10 || sz.h < 10) return
    camera.aspect = sz.w / sz.h
    camera.updateProjectionMatrix()
    renderer.setSize(sz.w, sz.h)
  }
  window.addEventListener('resize', onViewerResize)
  const resizeObserver = new ResizeObserver(onViewerResize)
  resizeObserver.observe(frame)

  // ---- wire reactive UI state to the engine ----
  watch(showPosts, (v) => (groupPosts.visible = v))
  watch(showRods, (v) => (groupRods.visible = v))
  watch(showPanels, (v) => (groupPanels.visible = v))
  watch(showRivets, applyExplode)
  watch(showHoles, (v) => (groupHoles.visible = v))
  watch(showFeet, (v) => (groupFeet.visible = v))
  watch(showDoor, (v) => {
    doorPivot.visible = v
    groupDoorFixed.visible = v
  })
  watch(explodeValue, applyExplode)
  watch(doorValue, (pct) => {
    doorPivot.rotation.y = (pct / 100) * (Math.PI * 1.5) // swings outward, up to 270°
  })
  watch(variant, runSelectVariant)
  watch(finishKey, runApplyFinish, { immediate: true })

  runSelectVariant(variant.value)

  let rafId = 0
  function animate() {
    rafId = requestAnimationFrame(animate)
    renderer.render(scene, camera)
  }
  animate()

  cleanup = () => {
    cancelAnimationFrame(rafId)
    window.removeEventListener('resize', onViewerResize)
    resizeObserver.disconnect()
    dom.removeEventListener('pointerdown', onPointerDown)
    dom.removeEventListener('pointerup', onPointerUp)
    dom.removeEventListener('pointercancel', onPointerUp)
    dom.removeEventListener('pointermove', onPointerMove)
    dom.removeEventListener('wheel', onWheel)
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (mesh.geometry) mesh.geometry.dispose()
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
      else mat?.dispose()
    })
    ventedPanelMat.map?.dispose()
    renderer.dispose()
    holder.removeChild(renderer.domElement)
  }
})

onBeforeUnmount(() => cleanup?.())
</script>

<template>
  <div
    ref="frameEl"
    class="relative h-[520px] w-full overflow-hidden rounded-2xl border border-line bg-[#0e0f13] shadow-[0_30px_70px_-30px_rgba(0,0,0,0.6)] sm:h-[560px] lg:h-[620px]"
  >
    <div ref="canvasHolder" class="absolute inset-0" />

    <div
      class="absolute top-4 left-4 max-h-[calc(100%-32px)] w-[262px] overflow-auto rounded-[10px] border border-[#33384a] bg-[rgba(20,22,30,0.9)] p-4 backdrop-blur-md"
    >
      <h2 class="mb-1 font-display text-[15px] font-semibold text-white">{{ modelTitle }}</h2>
      <div class="mb-3.5 font-body text-[11px] text-[#9aa0b4]">{{ modelSub }}</div>

      <div class="flex rounded-lg bg-[#1c1f28] p-[3px]">
        <button
          class="flex-1 rounded-md py-[7px] text-[11.5px] transition-colors"
          :class="variant === 'R1' ? 'bg-blue font-semibold text-white' : 'cursor-pointer text-[#9aa0b4]'"
          @click="variant = 'R1'"
        >
          R1 · 500mm
        </button>
        <button
          class="flex-1 rounded-md py-[7px] text-[11.5px] transition-colors"
          :class="variant === 'R5' ? 'bg-blue font-semibold text-white' : 'cursor-pointer text-[#9aa0b4]'"
          @click="variant = 'R5'"
        >
          R.5 · 250mm
        </button>
      </div>

      <div class="mt-2 flex rounded-lg bg-[#1c1f28] p-[3px]">
        <button
          v-for="f in (['raw', 'white', 'black'] as const)"
          :key="f"
          class="flex-1 rounded-md py-[7px] text-[11.5px] capitalize transition-colors"
          :class="finishKey === f ? 'bg-blue font-semibold text-white' : 'cursor-pointer text-[#9aa0b4]'"
          @click="finishKey = f"
        >
          {{ f }}
        </button>
      </div>

      <div class="mt-3.5 space-y-2 text-[13px]">
        <label class="flex cursor-pointer items-center justify-between">
          <span class="flex items-center gap-2"><span class="inline-block h-3 w-3 rounded-sm" style="background: #cfd3da" />Posts</span>
          <input v-model="showPosts" type="checkbox" class="h-[15px] w-[15px] accent-blue" />
        </label>
        <label class="flex cursor-pointer items-center justify-between">
          <span class="flex items-center gap-2"><span class="inline-block h-3 w-3 rounded-sm" style="background: #a9adb8" />Angle rods</span>
          <input v-model="showRods" type="checkbox" class="h-[15px] w-[15px] accent-blue" />
        </label>
        <label class="flex cursor-pointer items-center justify-between">
          <span class="flex items-center gap-2"><span class="inline-block h-3 w-3 rounded-sm" style="background: #6c7180" />Panels</span>
          <input v-model="showPanels" type="checkbox" class="h-[15px] w-[15px] accent-blue" />
        </label>
        <label class="flex cursor-pointer items-center justify-between">
          <span class="flex items-center gap-2"><span class="inline-block h-3 w-3 rounded-sm" style="background: #ffcf5c" />Rivets</span>
          <input v-model="showRivets" type="checkbox" class="h-[15px] w-[15px] accent-blue" />
        </label>
        <label class="flex cursor-pointer items-center justify-between">
          <span class="flex items-center gap-2"><span class="inline-block h-3 w-3 rounded-sm" style="background: #3fb8c9" />Mounting holes</span>
          <input v-model="showHoles" type="checkbox" class="h-[15px] w-[15px] accent-blue" />
        </label>
        <label class="flex cursor-pointer items-center justify-between">
          <span class="flex items-center gap-2"><span class="inline-block h-3 w-3 rounded-sm" style="background: #3a3c42" />Feet</span>
          <input v-model="showFeet" type="checkbox" class="h-[15px] w-[15px] accent-blue" />
        </label>
        <label class="flex cursor-pointer items-center justify-between">
          <span class="flex items-center gap-2"><span class="inline-block h-3 w-3 rounded-sm" style="background: #8fa8c9" />Front door</span>
          <input v-model="showDoor" type="checkbox" class="h-[15px] w-[15px] accent-blue" />
        </label>
      </div>

      <div v-if="showDoor" class="mt-3.5">
        <div class="flex items-center justify-between text-[13px]"><span>Door</span><span>{{ doorLabel }}</span></div>
        <input v-model.number="doorValue" type="range" min="0" max="100" class="w-full accent-blue" />
      </div>

      <div class="mt-3.5">
        <div class="flex items-center justify-between text-[13px]"><span>Exploded view</span><span>{{ explodeValue }}%</span></div>
        <input v-model.number="explodeValue" type="range" min="0" max="100" class="w-full accent-blue" />
      </div>

      <div class="mt-3.5 border-t border-[#2c303e] pt-3 text-[10.5px] leading-relaxed text-[#7a7f8c]">
        Materials and door placement are provisional and subject to change — will be updated after
        physical fitment testing.
      </div>
    </div>

    <div
      class="absolute right-4 bottom-4 rounded-md border border-line bg-bg/70 px-2.5 py-1.5 font-mono text-[10.5px] text-[#565b68]"
    >
      live model — not a rendering
    </div>
  </div>
</template>
