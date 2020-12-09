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

function clearPiece(board, left) {
	let side = ''
	if(typeof left === 'boolean') {
		side = left ? '.left' : ':not(.left)'
	}
	const selector = side + '.player'
	const cells = board.querySelectorAll(selector)
	for(const cell of cells) {
		cell.classList.remove('player')
	}
}

function at(board, x, y) {
	return board.rows[y] && board.rows[y].cells[x]
}

function matches(cell, left) {
	return cell && left === cell.classList.contains('left')
}

function set(cell, left) {
	if(cell != null) {
		if(left) cell.classList.add('left')
		else cell.classList.remove('left')
	}
}

function setPiece(cell) {
	cell && cell.classList.add('player')
}

function collapseLine(board, x, leftPlayer) {
	const dx = leftPlayer ? -1 : 1
	const rows = board.rows
	for(let r=0; r<rows.length; ++r) {
		const cells = rows[r].cells
		for(let c=x; c>0 && c<cells.length-1; c+=dx) {
			set(cells[c], matches(cells[c+dx], true))
		}
	}
}

function isCompleteLine(board, x, leftPlayer) {
	const rows = board.rows
	for(let r=0; r<rows.length; ++r) {
		if(matches(rows[r].cells[x], leftPlayer)) {
			return false
		}
	}
	return true
}

function linesOfPiece(board, piece) {
	const lines = []
	forPiece(board, piece, function(cell,x) {
		if(lines[lines.length-1] !== x) lines.push(x)
	})
	if(!piece.left) lines.reverse()
	return lines
}

function completeLines(board, piece) {
	return linesOfPiece(board, piece)
		.filter(l=>isCompleteLine(board, l, piece.left))
}

function maybeCollapseLines(board, piece) {
	for(const l of completeLines(board, piece)) {
		collapseLine(board, l, piece.left)
	}
}

function forPiece(board, piece, fn, ...args) {
	const shape = piece.shapes[piece.r%piece.shapes.length]
	const size = Math.sqrt(shape.length)
	const offset = piece.left ? Math.ceil(size/2) : Math.floor(size/2)
	const x = piece.x - offset, y = piece.y - offset
	for(let dx=0; dx<size; ++dx) {
		for(let dy=0; dy<size; ++dy) {
			const cell = at(board, x+dx, y+dy)
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
	forPiece(board, piece, (c) => setPiece(c))
}

function movePiece(board, piece, change) {
	const x = piece.x, y = piece.y, r = piece.r
	piece.x += change.x || 0
	piece.y += change.y || 0
	piece.r += change.r || 0
	const success = pieceFits(board, piece)
	if(success) {
		clearPiece(board, piece.left)
		drawPiece(board, piece)
	} else {
		piece.x = x
		piece.y = y
		piece.r = r
	}
	return success
}

function lockPiece(board, piece) {
	clearPiece(board, piece.left)
	forPiece(board, piece, (c)=>set(c, !piece.left))
}

function dropPiece(board, piece) {
	const ok = movePiece(board, piece, {x: piece.left ? 1 : -1})
	if(!ok) lockPiece(board, piece)
	return ok
}

function randomShape(pieces) {
	const names = Object.keys(pieces)
	const n = Math.floor(names.length * Math.random())
	return pieces[names[n]]
}

function newPiece(shapes, x, y, r, left) {
	return {
		shapes: shapes,
		x: x,  y: y,
		r: r + (left ? 0 : 2),
		left: !!left
	}
}

const pieces = {
	I: [
		[
			0,0,0,0,
			1,1,1,1,
			0,0,0,0,
			0,0,0,0
		],
		[
			0,0,1,0,
			0,0,1,0,
			0,0,1,0,
			0,0,1,0
		],
		[
			0,0,0,0,
			0,0,0,0,
			1,1,1,1,
			0,0,0,0
		],
		[
			0,1,0,0,
			0,1,0,0,
			0,1,0,0,
			0,1,0,0
		],
	],
	J: [
		[
			1,0,0,
			1,1,1,
			0,0,0
		],
		[
			0,1,1,
			0,1,0,
			0,1,0
		],
		[
			0,0,0,
			1,1,1,
			0,0,1
		],
		[
			0,1,0,
			0,1,0,
			1,1,0
		]
	],
	L: [
		[
			0,0,1,
			1,1,1,
			0,0,0
		],
		[
			0,1,0,
			0,1,0,
			0,1,1
		],
		[
			0,0,0,
			1,1,1,
			1,0,0
		],
		[
			1,1,0,
			0,1,0,
			0,1,0
		]
	],
	O: [
		[
			1,1,
			1,1
		]
	],
	S: [
		[
			0,1,1,
			1,1,0,
			0,0,0
		],
		[
			0,1,0,
			0,1,1,
			0,0,1
		],
		[
			0,0,0,
			0,1,1,
			1,1,0
		],
		[
			1,0,0,
			1,1,0,
			0,1,0
		]
	],
	T: [
		[
			0,1,0,
			1,1,1,
			0,0,0
		],
		[
			0,1,0,
			0,1,1,
			0,1,0
		],
		[
			0,0,0,
			1,1,1,
			0,1,0
		],
		[
			0,1,0,
			1,1,0,
			0,1,0
		],
	],
	Z: [
		[
			1,1,0,
			0,1,1,
			0,0,0
		],
		[
			0,0,1,
			0,1,1,
			0,1,0
		],
		[
			0,0,0,
			1,1,0,
			0,1,1
		],
		[
			0,1,0,
			1,1,0,
			1,0,0
		]
	]
}

const T = tetris()
const t = 250  // milliseconds per step

let P = [
	newPiece(randomShape(pieces), 1, 5, 0, true),
	newPiece(pieces.T, 39, 5, 2, false)
]
set(at(T, 19, 5), false)
function drop() {
	let dropped = 0
	for(const p of P) {
		const d = dropPiece(T, p)
		if(d) ++dropped
		else setTimeout(()=>maybeCollapseLines(T, p), t)
	}
	if(dropped > 0) setTimeout(drop, t)
	else clearPiece(T)
}

for(const p of P) drawPiece(T, p)
setTimeout(drop, t)
