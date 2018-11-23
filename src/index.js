class Counter {
  constructor (imagePath) {
    this.imagePath = imagePath
    this.count = 0
    this.dirtyCount = 0
    this.visitMap = {}
    this.init()
  }

  init () {
    this.dirs = ['lt', 't', 'rt', 'r', 'rb', 'b', 'lb', 'l']
    this.nextDir = this.dirs.reduce(function (p, c, i, s) {
      let nx = s[i + 1] || s[0]
      p[c] = nx
      return p
    }, {})
    this.geneAllDirList()
    this.geneAllOppositeDir()
    this.startLoad()
  }

  startCount () {
    this.getImageData().translateData().analyze()
  }

  geneAllDirList () {
    this.allDirList = {}
    for (let dir of this.dirs) {
      this.allDirList[dir] = this.geneNewDirList(dir)
    }
  }

  geneAllOppositeDir () {
    this.oppositeDir = {}
    for (let dir of this.dirs) {
      this.oppositeDir[dir] = this.geneOppositeDir(dir)
    }
  }

  geneOppositeDir (dir) {
    let currDir = dir
    let i = 4
    while (i--) {
      currDir = this.nextDir[currDir]
    }
    return currDir
  }

  geneNewDirList (dir) {
    let currDir = dir
    let dirList = []
    let i = 13
    while (i--) {
      dirList.push(currDir)
      currDir = this.nextDir[currDir]
    }
    return dirList.slice(5)
  }

  startLoad () {
    return this.load(this.imagePath).then((image) => {
      let {width, height} = image
      this.image = image
      this.width = width
      this.height = height

      let canvas = document.createElement('canvas')
      // document.body.appendChild(canvas)
      // document.body.appendChild(image)
      canvas.width = width
      canvas.height = height

      this.canvas = canvas
    })
  }

  load (path) {
    return new Promise(function (resolve, reject) {
      let image = new Image()
      image.onload = function () {
        resolve(image)
      }
      image.onerror = function () {
        reject()
      }
      image.src = path
    })
  }

  loadError () {
    return Promise.reject(new Error('load error'))
  }

  getImageData () {
    let {canvas, width, height, image} = this

    let ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, width, height)
    ctx.drawImage(image, 0, 0, width, height)
    let imageData = ctx.getImageData(0, 0, width, height)

    this.imageData = imageData
    return this
  }

  translateData () {
    if (!this.imageData) return null
    let {width, height} = this
    let imageData = this.imageData
    let dataArray = []
    for (let y = 0; y < height; y++) {
      let row = []
      for (let x = 0; x < width; x++) {
        let dirty = this.isDirty(x, y)
        if (dirty) this.dirtyCount++
        row.push(dirty)
      }
      dataArray.push(row)
    }

    this.setDataArray(dataArray)
    return this
  }

  setDataArray (dataArray) {
    this.dataArray = dataArray
    this.height = dataArray.length
    this.width = this.height ? dataArray[0].length : 0
  }

  isTransparent (x, y, imageData) {
    if (!imageData && !this.imageData) return null
    let {width, height, data} = imageData || this.imageData
    if (x < 0 || x >= width || y < 0 || y >= height) return true
    const alphaIndex = y * (width * 4) + x * 4 + 3
    const alpha = data[alphaIndex]
    return alpha === 0
  }

  isDirty (x, y) {
    let transparent = this.isTransparent(x, y)
    return !transparent
  }
  // 当前点的相邻的一个点
  posOfDir (dir, x, y) {
    let o = {x: 0, y: 0}
    dir.split('').map(function (d) {
      let key = d.replace(/r|l/, 'x').replace(/t|b/, 'y')
      let value = d.replace(/r|b/, '1').replace(/l|t/, '-1')
      o[key] = Number(value)
    })
    x += o.x
    y += o.y
    return {x: x, y: y}
  }
  // 找出当前点的下一个点
  nextPos (x, y, dirList) {
    let dataArray = this.dataArray
    let currPathMap = this.currPathMap || {}
    for (let dir of (dirList || this.dirs)) {
      let {x: _x, y: _y} = this.posOfDir(dir, x, y)

      let found = !currPathMap[`${_x}-${_y}`] && dataArray[_y] && dataArray[_y][_x]
      if (found) {
        return {x: _x, y: _y, dir: dir}
      }
    }

    return null
  }
  // 由开始点描出路径
  strokePath (x, y, dir = 'r') {
    let startKey = `${x}-${y}`
    this.currPath = [[x, y, dir]]
    this.currPathMap = {startKey: true}
    let op = 0
    let flag = 20
    while (flag) {
      let dirList = this.allDirList[dir]
      let nextPos = this.nextPos(x, y, dirList)
      if (!nextPos) {
        let prevPos = this.currPath[this.currPath.length - op * 2 - 2]
        if (!prevPos) break
        nextPos = {x: prevPos[0], y: prevPos[1], dir: this.oppositeDir[prevPos[2]]}
        op++
      }

      x = nextPos.x
      y = nextPos.y
      dir = nextPos.dir

      let key = `${x}-${y}`

      if (key === startKey) break
      this.currPath.push([x, y, dir])
      this.currPathMap[key] = true
      this.visitMap[key] = true
    }
  }
  // 找开始点
  analyze () {
    let {dataArray, width, height} = this
    let enter = false
    this.visitMap = {}
    this.count = 0
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        let key = `${x}-${y}`
        let visited = this.visitMap[key] !== void 0
        this.visitMap[key] = true
        let dirty = dataArray[y][x]

        if (visited && dirty) enter = true
        if (!dirty) enter = false

        if (!enter && dirty) {
          this.strokePath(x, y)
          this.count++
        }
      }
    }
    return this
  }
}

module.exports = Counter
