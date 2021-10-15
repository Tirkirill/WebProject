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
            throw new Error("Нужно передать Actor")
        }
        if (this === actor) {
            return false
        }
        return this.left < actor.right && this.right > actor.left && this.top < actor.bottom && this.bottom > actor.top;
    }

}

class Level {
    constructor(grid = [], actors = []) {
        this.grid = grid;
        this.actors = actors;
        if (actors) {
            this.player = actors.find((x) => x.type === "player")
        }
        this.height = grid.length;
        this.width = this.grid.reduce(function (memo, el) {
            if (el.length > memo) {
                memo = el.length
            }
            return memo
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
            return "lava"
        }
        if (pos.x < 0 || pos.y < 0 || (pos.x + size.x) > this.width) {
            return "wall"
        }
        for (let y = Math.floor(pos.y); y < pos.y + size.y; y++) {
            for (let x = Math.floor(pos.x); x < pos.x + size.x; x++) {
                let obj = this.grid[y][x]
                if (obj !== undefined) return obj
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
        else {
            this.removeActor(actor);
            if (!this.noMoreActors("coin")) {
                this.status = "won";
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

        let array = []
        plan.forEach((str) => {
            let new_str = array[array.push([]) - 1]
            for (let i = 0; i < str.length; i++) {
                let symbol = str.charAt(i);
                new_str.push(this.obstacleFromSymbol(symbol));
            }
        })
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
        let level = new Level(this.createGrid(plan), this.createActors(plan));
        return level;
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
        console.log(x, y);
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