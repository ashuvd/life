class Cell {
  constructor(x, y, maxX, maxY) {
    this.x = x;
    this.y = y;
    this.maxX = maxX;
    this.maxY = maxY;
    this.prevX = x - 1 < 0 ? maxX - 1 : x - 1;
    this.prevY = y - 1 < 0 ? maxY - 1 : y - 1;
    this.nextX = x + 1 > maxX - 1 ? 0 : x + 1;
    this.nextY = y + 1 > maxY - 1 ? 0 : y + 1;
  }
  get neighbors() {
    return [
      new Cell(this.prevX, this.prevY, this.maxX, this.maxY),
      new Cell(this.x, this.prevY, this.maxX, this.maxY),
      new Cell(this.nextX, this.prevY, this.maxX, this.maxY),
      new Cell(this.prevX, this.y, this.maxX, this.maxY),
      new Cell(this.nextX, this.y, this.maxX, this.maxY),
      new Cell(this.prevX, this.nextY, this.maxX, this.maxY),
      new Cell(this.x, this.nextY, this.maxX, this.maxY),
      new Cell(this.nextX, this.nextY, this.maxX, this.maxY)
    ];
  }
}


class Population {
  constructor(data = {}) {
    this.data = data;
  }

  createCell(x, y, maxX, maxY) {
    return new Cell(+x, +y, maxX, maxY)
  }

  isCellAlive(cell) {
    return !!this.data[`${cell.x}:${cell.y}`];
  }

  countAliveAround(cell) {
    return cell.neighbors.reduce((total, neighbor) => {
      return total + (this.isCellAlive(neighbor) ? 1 : 0);
    }, 0);
  }
}

class World {
  constructor(rows, columns, population) {
    this.rows = rows;
    this.columns = columns;
    this.population = population;
    if (Object.keys(population.data).length === 0) {
      this.populateRandom()
    }
  }
  populateRandom() {
    for (let x = 0; x < this.columns; x++) {
      for (let y = 0; y < this.rows; y++) {
        if (Math.random() <= 0.5) continue;
        this.population.data[`${x}:${y}`] = this.population.createCell(x, y, this.columns, this.rows);
      }
    }
  }
  next() {
    const nextPopulation = {};
    const checked = {};
    Object.values(this.population.data).forEach((cell) => {
      const alive = this.population.countAliveAround(cell);

      if (alive === 2 || alive === 3) {
        const { x, y } = cell;
        nextPopulation[`${x}:${y}`] = cell;
      }

      cell.neighbors.forEach((neighbor) => {
        const { x, y } = neighbor;

        if (checked[`${x}:${y}`]) return;
        checked[`${x}:${y}`] = true;

        if (this.population.countAliveAround(neighbor) !== 3) return;
        nextPopulation[`${x}:${y}`] = neighbor;
      });
    });

    this.population.data = nextPopulation;
  }
}

class Drawer {
  constructor() {
    this.boxWidth = 800;
    this.boxHeight = 800;
    this.box = document.querySelector('.box');
  }
  clear() {
    this.box.innerHTML = "";
  }
  drawWorld(world) {
    const cellWidth = this.boxWidth / world.columns;
    const cellHeight = this.boxHeight / world.rows;
    for (let x = 0; x < world.columns; x++) {
      for (let y = 0; y < world.rows; y++) {
        const cell = document.createElement('div');
        cell.style.width = `${cellWidth}px`;
        cell.style.height = `${cellHeight}px`;
        cell.classList.add('cell')
        cell.setAttribute(`data-id`, `${x}:${y}`)
        if (`${x}:${y}` in world.population.data) {
          cell.classList.add('alive')
        } else {
          cell.classList.add('death')
        }
        this.box.appendChild(cell);
      }
    }
  };
  rerender(world) {
    const cells = this.box.children;
    for (const cell of cells) {
      const { id } = cell.dataset;
      if (id in world.population.data) {
        cell.classList.remove('death')
        cell.classList.add('alive')
      } else {
        cell.classList.remove('alive')
        cell.classList.add('death')
      }
    }
  }
  reset(world) {
    const cells = this.box.querySelectorAll('.alive');
    for (const cell of cells) {
      cell.classList.remove('alive')
      cell.classList.add('death')
    }
    world.population.data = {};
  }
}

const box = document.querySelector('.box');
const startBtn = document.querySelector('.start');
const stopBtn = document.querySelector('.stop');
const resetBtn = document.querySelector('.reset');
const generateBtn = document.querySelector('.generate');
const createBtn = document.querySelector('.create');
const widthInput = document.querySelector('.width');
const heightInput = document.querySelector('.height');
const time = document.querySelector('.time');

const drawer = new Drawer();
let world = new World(100, 100, new Population());

drawer.drawWorld(world);

function liveGeneration() {
  const startNext = Date.now();
  world.next();
  const endNext = Date.now();
  drawer.rerender(world);
  const end = Date.now();
  time.innerHTML = `${endNext - startNext}ms - ${end - endNext}ms`;
}

let timer = null;

function gameLoop() {
  liveGeneration();
  timer = setTimeout(() => window.requestAnimationFrame(gameLoop), 1000);
}

startBtn.addEventListener('click', gameLoop)
stopBtn.addEventListener('click', () => {
  clearTimeout(timer);
})
resetBtn.addEventListener('click', () => {
  drawer.reset(world);
})
generateBtn.addEventListener('click', () => {
  drawer.reset(world);
  world.populateRandom();
  drawer.rerender(world);
})
box.addEventListener('click', (e) => {
  const { id } = e.target.dataset;
  const [x, y] = id.split(':');
  world.population.data[id] = world.population.createCell(x, y, world.columns, world.rows);
  drawer.rerender(world);
})

let width, height;
widthInput.addEventListener('input', (e) => {
  width = e.target.value;
})
heightInput.addEventListener('input', (e) => {
  height = e.target.value;
})
createBtn.addEventListener('click', () => {
  if (!!width && !!height) {
    world = new World(height, width, new Population());
    drawer.clear();
    clearTimeout(timer);
    drawer.drawWorld(world);
  }
})
