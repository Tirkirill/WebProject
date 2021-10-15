'use strict';

class Vector {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    plus(vector) {
        if (!(vector instanceof Vector)) {
            throw new Error("Нужно передать вектор!");
        }

        return new Vector(this.x + vector.x, this.y + vector.y);
    }

    times(n) {
        if (typeof n !== "number") {
            throw new Error("Нужно передать число!");
        }

        return new Vector(this.x * n, this.y * n);
    }
}

class Actor {
    constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
        if (!(pos instanceof Vector)) {
            throw new Error("Нужно передать вектор!");
        }
        if (!(size instanceof Vector)) {
            throw new Error("Нужно передать вектор!");
        }
        if (!(speed instanceof Vector)) {
            throw new Error("Нужно передать вектор!");
        }

        this.pos = pos;
        this.size = size;
        this.speed = speed;
        this._type = "actor";
    }
    get type() {
        return this._type;
    }
    get left() {
        return this.pos.x;
    }
    get right() {
        return this.pos.x + this.size.x;
    }
    get bottom() {
        return this.pos.y + this.size.y;
    }
    get top() {
        return this.pos.y;
    }
    act() {

    }

    isIntersect(actor) {
        if (!(actor instanceof Actor)) {
            throw new Error("Нужно передать Actor");
        }
        if (this === actor) {
            return false;
        }
        return this.left < actor.right && this.right > actor.left && this.top < actor.bottom && this.bottom > actor.top;
    }

}

class Level {
    constructor(grid = [], actors = []) {
        this.grid = grid;
        this.actors = actors;
        if (actors) {
            this.player = actors.find((x) => x.type === "player");
        }
        this.height = grid.length;
        this.width = this.grid.reduce(function (memo, el) {
            if (el.length > memo) {
                memo = el.length;
            }
            return memo;
        }, 0);
        this.status = null;
        this.finishDelay = 1;
    }

    isFinished() {
        return this.status !== null && this.finishDelay < 0;
    }

    actorAt(actor) {
        if (!(actor instanceof Actor)) {
            throw new Error("Нужно передать Actor");
        }

        for (let level_actor of this.actors) {
            if (level_actor.isIntersect(actor)) return level_actor;
        }

        return undefined;
    }

    obstacleAt(pos, size) {
        if (!(pos instanceof Vector)) {
            throw new Error("Нужно передать вектор!");
        }
        if (!(size instanceof Vector)) {
            throw new Error("Нужно передать вектор!");
        }
        if ((pos.y + size.y) > this.height) {
            return "lava";
        }
        if (pos.x < 0 || pos.y < 0 || (pos.x + size.x) > this.width) {
            return "wall";
        }
        for (let y = Math.floor(pos.y); y < pos.y + size.y; y++) {
            for (let x = Math.floor(pos.x); x < pos.x + size.x; x++) {
                let obj = this.grid[y][x];
                if (obj !== undefined) return obj;
            }
        }
    }

    removeActor(actor) {
        if (this.actors.indexOf(actor) >= 0) {
            this.actors.splice(this.actors.indexOf(actor), 1);
        }
    }

    noMoreActors(type) {
        return !this.actors.some(elem => elem.type === type);
    }

    playerTouched(type, actor) {
        if (this.status !== null) {
            return;
        }
        if (type === "lava" || type === "fireball") {
            this.status = "lost";
        }
        if (type === "coin" && actor.type === "coin") {
            this.removeActor(actor);
            if (this.noMoreActors("coin")) {
                this.status = "won";
                return this.status;
            }
        }
    }
}

class LevelParser {
    constructor(symbols) {
        this.symbols = symbols;
    }

    actorFromSymbol(symbol) {
        if (!symbol || !this.symbols[symbol]) {
            return undefined;
        }
        return this.symbols[symbol];
    }

    obstacleFromSymbol(symbol) {
        if (symbol === "x") {
            return "wall";
        }
        if (symbol === "!") {
            return "lava";
        }
    }

    createGrid(plan) {
        if (plan.length === 0) {
            return [];
        }

        let array = [];
        plan.forEach((str) => {
            let new_str = array[array.push([]) - 1];
            for (let i = 0; i < str.length; i++) {
                let symbol = str.charAt(i);
                new_str.push(this.obstacleFromSymbol(symbol));
            }
        });
        return array;
    }

    createActors(arrStr) {
        let actors = [];
        if (!this.symbols) return actors;
        for (let j = 0; j < arrStr.length; j++) {
            let str = arrStr[j];
            for (let i = 0; i < str.length; i++) {
                let symbol = str[i];
                if (typeof this.symbols[symbol] === "function") {
                    let type = Object(this.actorFromSymbol(symbol));
                    let actor = new type(new Vector(i, j));
                    if (actor instanceof Actor) {
                        actors.push(actor);
                    }
                }
            }
        }

        return actors;
    }

    parse(plan) {
        return new Level(this.createGrid(plan), this.createActors(plan));
    }
}

class Fireball extends Actor {
    constructor(pos = new Vector(0, 0), speed = new Vector(0, 0)) {
        super(pos,undefined, speed);
        this._type = 'fireball';
    }

    getNextPosition(time=1) {
        let x = this.pos.x + this.speed.x * time;
        let y = this.pos.y + this.speed.y * time;
        return new Vector(x, y);
    }

    handleObstacle() {
        this.speed = new Vector(-this.speed.x, -this.speed.y);
    }

    act(time, level) {
        let next_pos = this.getNextPosition(time);
        let obstacle = level.obstacleAt(next_pos, this.size);
        if (!obstacle) {
            this.pos = next_pos;
        }
        else {
            this.handleObstacle();
        }
    }
}

class HorizontalFireball extends Fireball {
    constructor(pos = new Vector(0, 0)) {
        super(pos, new Vector(2, 0));
    }
}

class VerticalFireball extends Fireball {
    constructor(pos = new Vector(0, 0)) {
        super(pos, new Vector(0, 2));
    }
}

class FireRain extends Fireball {
    constructor(pos = new Vector(0, 0)) {
        super(pos, new Vector(0, 3));
        this.beg_pos = pos;
    }

    handleObstacle() {
        this.pos = this.beg_pos;
    }
}

class Coin extends Actor {
    constructor(pos = new Vector()) {
        super(pos.plus(new Vector(0.2, 0.1)), new Vector(0.6, 0.6));
        this.springSpeed = 8;
        this.springDist = 0.07;
        this.spring = Math.random() * Math.PI * 2;
        this.base = this.pos;
        this._type = "coin";
    }

    updateSpring(time = 1) {
        this.spring = this.spring + (this.springSpeed * time);
    }

    getSpringVector() {
        return new Vector(0, Math.sin(this.spring) * this.springDist);
    }

    getNextPosition(time = 1) {
        this.updateSpring(time);
        return this.base.plus(this.getSpringVector());
    }

    act(time) {
        this.pos = this.getNextPosition(time);
    }
}

class Player extends Actor {
    constructor(pos = new Vector()) {
        super(pos.plus(new Vector(0, -0.5)), new Vector(0.8, 1.5));
        this._type = "player";
    }
}

let actorDict = {
    '@': Player,
    'v': FireRain,
    'o': Coin,
    '|': VerticalFireball,
    '=': HorizontalFireball
};
let parser = new LevelParser(actorDict);
loadLevels()
    .then(value => {
        let schemas = JSON.parse(String(value));
        runGame(schemas, parser, DOMDisplay)
            .then(() => alert('Вы выиграли приз!'));
    });