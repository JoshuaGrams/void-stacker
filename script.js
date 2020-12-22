function N(t, ...args) {
	const e=(typeof t==='string')?document.createElement(t):t
	for(const a of args) {
		if(a instanceof Element || a instanceof Text) e.appendChild(a)
		else if(Array.isArray(a)) N(e, ...a)
		else if(typeof a==='string') e.appendChild(document.createTextNode(a))
		else if(a instanceof Object) for(const k in a) {
			const v = a[k]
			if(Array.isArray(v)) e[k] = v[0]
			else if(v instanceof Function) e.addEventListener(k, v)
			else if(v instanceof Object) for(const x in v) e[k][x] = v[x]
			else e.setAttribute(k, v)
		}
	}
	return e
}

function preview(classPrefix) {
	let tbl
	const preview = N('div', {class: classPrefix + '-preview'},
		tbl = N('table'))
	for(let y=0; y<4; ++y) {
		let row
		N(tbl, row = N('tr'))
		for(let x=0; x<4; ++x) N(row, N('td'))
	}
	return preview
}

function tetris() {
	let board
	N(document.body,
		N('div', {class: 'outer'},
			N('div', {class: 'inner'},
				board = N('table')),
		preview('left'), preview('right')))
	for(let y=0; y<10; ++y) {
		let row
		N(board, row = N('tr', {class: y%2 === 0 ? 'even' : ''}))
		for(let x=0; x<40; ++x) {
			N(row, N('td', {class: x<20 ? 'left' : ''}))
		}
	}
	return board
}

function playerClass(left) {
	return (left ? 'left' : 'right') + '-player'
}

function clearClass(board, cls) {
	const cells = board.querySelectorAll('.'+cls)
	for(const cell of cells) cell.classList.remove(cls)
}

function at(board, x, y) {
	return board.rows[y] && board.rows[y].cells[x]
}

function matches(cell, left) {
	return !!cell && left === cell.classList.contains('left')
}

function set(cell, left) {
	if(cell != null) {
		if(left) cell.classList.add('left')
		else cell.classList.remove('left')
	}
}

function mark(cell, ...c) {
	cell && cell.classList.add(...c)
}

function isCompleteLine(board, x, left) {
	const rows = board.rows
	for(let y=0; y<rows.length; ++y) {
		if(matches(rows[y].cells[x], left)) return false
	}
	return true
}

function lockLine(board, x) {
	for(let y=0; y<board.rows.length; ++y) {
		mark(at(board, x, y), 'locked')
	}
}

function lockCompleteLines(board, left) {
	const cells = board.querySelectorAll('.'+playerClass(left))
	let cleared = 0
	for(const cell of cells) {
		const x = cell.cellIndex
		if(isCompleteLine(board, x, left)) {
			lockLine(board, x)
			++cleared
		}
	}
	return cleared
}

function collapseLine(board, l, left) {
	const rows = board.rows
	const W = rows[0].cells.length
	const dx = left ? -1 : 1
	for(let y=0; y<rows.length; ++y) {
		for(let x=l; x>=1 && x<W-1; x+=dx) {
			at(board, x, y).className = at(board, x+dx, y).className
		}
	}
}

function collapseLockedLines(board, left) {
	const W = board.rows[0].cells.length
	const x0 = left ? 1 : W-2
	const dx = left ? 1 : -1
	for(let x=x0; x>=1 && x<W-1; x+=dx) {
		const classes = at(board, x, 0).classList
		if(classes.contains('locked') && classes.contains('left') !== left) {
			collapseLine(board, x, left)
		}
	}
}

function forPiece(board, piece, fn, ...args) {
	const shape = piece.shapes[piece.r%piece.shapes.length]
	if(shape == null) console.log(piece)
	const size = Math.sqrt(shape.length)
	const offset = Math.ceil(size/2)
	const sx = piece.left ? 1 : -1
	const x0 = piece.x - sx*offset, y0 = piece.y - offset
	for(let dx=0; dx<size; ++dx) {
		for(let dy=0; dy<size; ++dy) {
			const x = x0 + sx*dx, y = y0+dy
			const cell = at(board, x, y)
			const piece = shape[dx*size+dy] === 1
			if(piece && fn(cell, x, y, ...args) === false) return false
		}
	}
	return true
}

function pieceFits(board, piece) {
	return forPiece(board, piece,
		(c,x,y,f) => x<0 || x>39 || matches(c,f),
		piece.left)
}

function drawPiece(board, piece) {
	forPiece(board, piece, c => mark(c, playerClass(piece.left)))
}

function movePiece(board, piece, change) {
	const x = piece.x, y = piece.y, r = piece.r
	piece.x += change.x || 0
	piece.y += change.y || 0
	piece.r += change.r || 0
	piece.r = ((piece.r % 4) + 4) % 4
	const success = pieceFits(board, piece)
	if(success) {
		clearClass(board, playerClass(piece.left))
		drawPiece(board, piece)
	} else {
		piece.x = x
		piece.y = y
		piece.r = r
	}
	return success
}

function lockPiece(board, piece) {
	forPiece(board, piece, c => set(c, !piece.left))
}

function dropPiece(board, piece) {
	return movePiece(board, piece, {x: piece.left ? 1 : -1})
}

function randomShape(shapes) {
	const u = Math.random()
	const n = Math.floor(shapes.length * u*u)
	const shape = shapes.splice(n, 1)[0]
	shapes.push(shape)
	return shape
}

function newPiece(shapes, x, y, r, left) {
	return {
		shapes: shapes,
		x: x,  y: y,
		r: r + (left ? 0 : 2),
		left: !!left
	}
}

const shapes = {
	I: [
		[
			0,0,0,0,
			0,0,0,0,
			1,1,1,1,
			0,0,0,0
		],
		[
			0,0,1,0,
			0,0,1,0,
			0,0,1,0,
			0,0,1,0
		]
	],
	J: [
		[
			0,0,0,
			1,1,1,
			0,0,1,
		],
		[
			0,1,0,
			0,1,0,
			1,1,0,
		],
		[
			0,0,0,
			1,0,0,
			1,1,1,
		],
		[
			0,1,1,
			0,1,0,
			0,1,0,
		],
	],
	L: [
		[
			0,0,0,
			1,1,1,
			1,0,0,
		],
		[
			1,1,0,
			0,1,0,
			0,1,0,
		],
		[
			0,0,0,
			0,0,1,
			1,1,1,
		],
		[
			0,1,0,
			0,1,0,
			0,1,1,
		],
	],
	O: [
		[
			1,1,
			1,1,
		]
	],
	S: [
		[
			0,0,0,
			0,1,1,
			1,1,0,
		],
		[
			1,0,0,
			1,1,0,
			0,1,0,
		],
	],
	T: [
		[
			0,0,0,
			1,1,1,
			0,1,0,
		],
		[
			0,1,0,
			1,1,0,
			0,1,0,
		],
		[
			0,0,0,
			0,1,0,
			1,1,1,
		],
		[
			0,1,0,
			0,1,1,
			0,1,0,
		],
	],
	Z: [
		[
			0,0,0,
			1,1,0,
			0,1,1,
		],
		[
			0,0,1,
			0,1,1,
			0,1,0,
		],
	],
	macaroni: [
		[
			1,0,
			1,1,
		],
		[
			1,1,
			1,0,
		],
		[
			1,1,
			0,1,
		],
		[
			0,1,
			1,1,
		],
	],
	wormy: [
		[
			0,1,
			0,1,
		],
		[
			0,0,
			1,1,
		],
	],
}

function bind(bindings, key, action) {
	if(typeof key == 'string') bindings[key] = action
	else for(const k of key) bindings[k] = action
}

function Player(x0, y0, left, stepTime, keys) {
	this.x0 = x0;  this.y0 = y0;  this.left = left
	this.dt = stepTime
	this.repeatDelay = 66
	this.keys = {}
	bind(this.keys, keys[0], 'up')
	bind(this.keys, keys[1], left ? 'rotate' : 'drop')
	bind(this.keys, keys[2], 'down')
	bind(this.keys, keys[3], left ? 'drop' : 'rotate')
	this.shapes = Object.values(shapes)
	this.preview = document.body.querySelector((left?'.left':'.right') + '-preview table')
	this.reset()
}

Player.prototype.reset = function() {
	this.repeatTimeout = null
	this.repeatCtrl = null
	this.pressed = {}
	this.cleared = 0
	this.nextShape = randomShape(this.shapes)
	this.spawn()
}

Player.prototype.spawn = function() {
	this.pressed.drop = false
	this.piece = newPiece(this.nextShape, this.x0, this.y0, 0, this.left)
	this.t = 0
	this.nextShape = randomShape(this.shapes)
	const sh = this.nextShape[0]
	const sz = Math.sqrt(sh.length)
	let x = 2, y = 2
	if(!this.left) --x
	clearClass(this.preview, playerClass(this.left))
	drawPiece(this.preview, {
		x: x,  y: y,  r: this.left ? 0 : 2,  left: this.left,
		shapes: this.nextShape
	})
	if(!pieceFits(T, this.piece)) {
		pause = true
		gameOver = Date.now()
		document.body.className = 'gameOver'
	}
}

Player.prototype.update = function(dt) {
	this.t += dt
	let step = this.dt
	if(this.repeatTimeout != null) {
		if(this.pressed[this.repeatCtrl]) {
			this.repeatTimeout -= dt
			if(this.repeatTimeout < 0) {
				this.repeatTimeout += this.repeatDelay
				this.move(this.repeatCtrl)
			}
		} else {
			this.repeatTimeout = null
		}
	}
	if(this.pressed.drop && !this.wait) {
		step = 33
		this.t = Math.min(this.t, step)
	}
	while(this.t >= step) {
		this.t -= step
		if(this.piece) {
			const fell = dropPiece(T, this.piece)
			if(!fell) {
				lockPiece(T, this.piece)
				delete this.piece
			}
		} else if(this.wait) {
			delete this.wait
		} else {
			collapseLockedLines(T, this.left)
			this.spawn()
		}
	}
	return !this.piece
}

Player.prototype.maybeLockLines = function() {
	if(!this.piece) {
		const locked = lockCompleteLines(T, this.left)
		this.cleared += locked
		clearClass(T, playerClass(this.left))
		if(locked > 0) {
			this.wait = true
			this.t = this.dt/2
		}
	}
}

Player.prototype.move = function(ctrl) {
	if(this.piece == null) return
	switch(ctrl) {
		case 'up': movePiece(T, this.piece, {y: -1}); break
		case 'down': movePiece(T, this.piece, {y: 1}); break
		case 'rotate':
			const change = {r: this.left ? 1 : -1};
			if(!movePiece(T, this.piece, change)) {
				change.y = -1
				if(!movePiece(T, this.piece, change)) {
					change.y = 1
					movePiece(T, this.piece, change)
				}
			}
			break
	}
}

Player.prototype.input = function(ctrl) {
	if(this.piece == null) return
	const initialDelay = 3 * this.repeatDelay
	switch(ctrl) {
		case 'up':
			this.repeatTimeout = initialDelay
			this.repeatCtrl = 'up'
			break
		case 'down':
			this.repeatTimeout = initialDelay
			this.repeatCtrl = 'down'
			break
		case 'rotate': break
		default: return
	}
	this.move(ctrl)
}

const T = tetris()
const t = 500  // milliseconds per step
let pause, gameOver

const Players = [
	new Player(0, 5, true, t, ['KeyW', 'KeyA', 'KeyS', 'KeyD']),
	new Player(39, 5, false, t, [
		['KeyI','ArrowUp'],
		['KeyJ','ArrowLeft'],
		['KeyK','ArrowDown'],
		['KeyL','ArrowRight']
	])
]
reset()

let t0
const dtMax = 100
function run(t) {
	const dt = (t0 == null || pause) ? 0 : t - t0
	t0 = t
	if(dt <= dtMax)  {
		for(const p of Players) p.update(dt)
		for(const p of Players) p.maybeLockLines()
		Players.reverse()
	}
	requestAnimationFrame(run)
}

function reset() {
	document.body.className = ''
	pause = false; gameOver = false
	const cells = T.querySelectorAll('td')
	for(const c of cells) {
		if(c.cellIndex < 20) c.className = 'left'
		else c.className = ''
	}
	for(let y=0; y<5; ++y) set(at(T, 20, y), y !== 2)
	for(let y=5; y<10; ++y) set(at(T, 19, y), y === 7)
	for(const p of Players) { p.reset(); drawPiece(T, p.piece) }
}

function keydown(e) {
	if(e.isComposing || e.keyCode === 229 || e.repeat) return
	if(gameOver && Date.now() - gameOver > 1000) reset()
	if(e.key === 'p' && !gameOver) pause = !pause
	for(const p of Players) {
		const ctrl = p.keys[e.code]
		if(ctrl) {
			p.pressed[ctrl] = true
			p.input(ctrl)
		}
	}
}

function keyup(e) {
	if(e.isComposing || e.keyCode === 229) return
	for(const p of Players) {
		const ctrl = p.keys[e.code]
		if(ctrl) p.pressed[ctrl] = false
	}
}

function start() {
	document.body.addEventListener('keydown', keydown)
	document.body.addEventListener('keyup', keyup)

	if(Math.random() < 0.5) Players.reverse()
	requestAnimationFrame(run)
}

start()
