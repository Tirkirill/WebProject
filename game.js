'use strict';

class Vector {
    constructor(x=0, y=0) {
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

        return new Vector(this.x*n, this.y*n);
    }
}

class Actor {
    constructor(pos=new Vector(0,0), size=new Vector(1,1), speed=new Vector(0,0)) {
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
        this._type= "actor";
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
        if (!(actor instanceof Actor)) throw new Error("Нужно передать Actor")
        if (this === actor) return false
        return this.left < actor.right && this.right > actor.left && this.top < actor.bottom && this.bottom > actor.top;
    }

}
