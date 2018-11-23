const Counter = require('../src/index.js')
var assert = require('power-assert')

const path = require('path')
const resolve = function (path) {
    return process.cwd(), './base' + path
}

describe('count shape', function() {
  beforeEach(function () {
    let src = resolve('/test/shapes.png')
    this.counter = new Counter(src)
    return this.counter.startLoad()
  })

  let canvas = document.createElement('canvas')
  let ctx = canvas.getContext('2d')

  it ('canvas size', function () {
    assert(canvas.width === 300)
    assert(canvas.height === 150)
  })


  it ('isTransparent', function () {
    ctx.fillRect(0, 0, 10, 10)
    let imageData = ctx.getImageData(0, 0, 300, 150)
    let counter = this.counter
    assert(counter.isTransparent(0, 0, imageData) === false)
    assert(counter.isTransparent(10, 0, imageData) === true)
  })

  it ('Counter instance Image', function () {
    let image = this.counter.image
    assert(image instanceof Image === true)
    assert(image.width === 696)
    assert(image.height === 564)
  })

  it ('Counter instance dataArray', function () {
    let counter = this.counter
    counter.getImageData().translateData()
    assert(counter.isDirty(0, 0) === true)
    assert(counter.isDirty(50, 0) === false)
    assert(counter.dataArray[0][0] === true)
    assert(counter.dataArray[0][50] === false)
  })

  it ('Counter instance find point of direction', function () {
    let counter = this.counter
    let p = {x: 0, y: 1}
    let d = ['lt', 't', 'rt', 'r', 'rb', 'b', 'lb', 'l']
    let o = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]]
    for (i in d) {
      let {x, y} = counter.posOfDir(d[i], p.x, p.y)
      assert(x === o[i][0] + p.x)
      assert(y === o[i][1] + p.y)
    }

    let {x, y} = counter.posOfDir('b', 3, 0)
    assert(x === 3)
    assert(y === 1)
  })

  it ('Counter instance find next point', function () {
    let counter = this.counter
    counter.dataArray = [
      [0, 1, 0, 1, 0],
      [0, 1, 1, 1, 0],
      [0, 1, 1, 0, 0],
      [0, 0, 1, 0, 0]
    ]
    let t = [[1, 0], [3, 0], [1, 1], [2, 2], [2, 3]]
    let r = [[2, 1], [3, 1], [1, 0], [1, 1], [1, 2]]

    for (i in t) {
      let pos = counter.nextPos(t[i][0], t[i][1]) || {}
      assert(pos.x === r[i][0])
      assert(pos.y === r[i][1])
    }
  })

  it ('Counter instance gene new dir list', function () {
    let counter = this.counter
    let dirList = counter.geneNewDirList('t')
    assert(dirList.length === 8)
    assert(dirList[0] === 'lb')
    assert(dirList[1] === 'l')

    let dir = counter.geneOppositeDir('t')
    assert(dir === 'b')
  })

  it ('Counter instance strokePath', function () {
    let counter = this.counter
    counter.dataArray = [
      [0, 1, 0, 1, 0],
      [0, 1, 1, 1, 0],
      [0, 1, 1, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0]
    ]
    counter.strokePath(1, 0)
    let path = [
      [1, 0, 'r'],
      [2, 1, 'rb'],
      [3, 0, 'rt'],
      [3, 1, 'b'],
      [2, 2, 'lb'],
      [2, 3, 'b'],
      [2, 4, 'b'],
      [2, 3, 't'],
      [1, 2, 'lt'],
      [1, 1, 't']
    ]

    assert(path.length === counter.currPath.length)
    for (let i in path) {
      let point = path[i]
      let returnPonit = counter.currPath[i]
      for (let j in point) {
        let result = returnPonit[j] !== void 0 ? returnPonit[j] === point[j] : false
        assert(result === true)
      }
    }
  })

  it ('Counter instance count', function () {
    let counter = this.counter
    counter.setDataArray([
      [0, 1, 0, 1, 0],
      [0, 1, 1, 1, 0],
      [0, 1, 1, 0, 0],
      [0, 0, 1, 0, 0]
    ])
    counter.analyze()
    assert(counter.count === 1)

    counter.setDataArray([
    // 0  1  2  3  4  5  6  7  8  9  10
      [0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0],  // 0
      [0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0],  // 1
      [0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0],  // 2
      [0, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0],  // 3
      [0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0],  // 4
      [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],  // 5
      [0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0]   // 6
    ])
    counter.analyze()
    assert(counter.count === 5)
  })

  it ('Counter instance count image shape', function () {
    let counter = this.counter

    counter.getImageData().translateData().analyze()
    assert(counter.count === 18)
  })
})
