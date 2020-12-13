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

function tetris() {
	let board
	N(document.body,
		N('div', {class: 'outer'},
			N('div', {class: 'inner'},
				board = N('table'))))
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
		if(at(board, x, 0).classList.contains('locked')) {
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
	const x = piece.x - sx*offset, y = piece.y - offset
	for(let dx=0; dx<size; ++dx) {
		for(let dy=0; dy<size; ++dy) {
			const cell = at(board, x+sx*dx, y+dy)
			const piece = shape[dx*size+dy] === 1
			if(piece && fn(cell, x, y, ...args) === false) return false
		}
	}
	return true
}

function pieceFits(board, piece) {
	return forPiece(board, piece, (c,x,y,f)=>matches(c,f), piece.left)
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
	const names = Object.keys(shapes)
	const n = Math.floor(names.length * Math.random())
	return shapes[names[n]]
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
	]
}

function Player(x0, y0, left, stepTime, keys) {
	this.x0 = x0;  this.y0 = y0;  this.left = left
	this.dt = stepTime
	this.keys = {}
	this.keys[keys[0]] = 'up'
	this.keys[keys[1]] = left ? 'rotate' : 'drop'
	this.keys[keys[2]] = 'down'
	this.keys[keys[3]] = left ? 'drop' : 'rotate'
	this.pressed = {}
	this.shapes = shapes
	this.cleared = 0
	this.spawn()
}

Player.prototype.spawn = function() {
	const shape = randomShape(this.shapes)
	this.piece = newPiece(shape, this.x0, this.y0, 0, this.left)
	this.t = 0
}

Player.prototype.update = function(dt) {
	this.t += dt
	let step = this.dt
	if(this.pressed.drop && !this.wait) {
		step = 100
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

Player.prototype.input = function(ctrl) {
	if(this.piece == null) return
	let change
	switch(ctrl) {
		case 'up':     change = {y: -1}; break
		case 'down':   change = {y: 1};  break
		case 'rotate': change = {r: this.left ? 1 : -1};  break
	}
	if(change != null) movePiece(T, this.piece, change)
}

const T = tetris()
const t = 500  // milliseconds per step
let pause = false

const Players = [
	new Player(0, 5, true, t, ['KeyE', 'KeyS', 'KeyD', 'KeyF']),
	new Player(39, 5, false, t, ['KeyI', 'KeyJ', 'KeyK', 'KeyL'])
]
for(const p of Players) drawPiece(T, p.piece)

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


function keydown(e) {
	if(e.isComposing || e.keyCode === 229) return
	if(e.key === 'p') pause = !pause
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
