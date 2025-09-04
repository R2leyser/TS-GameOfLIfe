
import * as ex from 'excalibur';

export class Cell extends ex.Actor {

    vector: ex.Vector
    age: number;
    dead: boolean; 

    constructor(vector: ex.Vector, age?: number, dead?: boolean) {
        let color;
        switch (age) {
            case 1:
                color = ex.Color.White;
                break;
            
            case 2:
                color = ex.Color.Pink;
                break;

            case 3:
                color = ex.Color.Magenta;
                break;

            case 4:
                color = ex.Color.Purple;
                break;
            default:
                color = ex.Color.Black;
        }

        
        super({
            pos: ex.vec(0, 0),
            width: 50, // for now we'll use a box so we can see the rotation
            height: 50, // later we'll use a circle collider
            color: color
        })

        this.dead = dead ?? false;


        this.age = age ?? 1;

        if (this.age != 0) {
            this.color = ex.Color.Purple;
        }

        this.vector = vector;
        this.pos = ex.vec(vector.x * 50 + 25, vector.y * 50 + 25);
    }


    override onPostUpdate( _engine: ex.Engine, _delta: number): void {
        if (this.dead) {
            this.age--;
        }
    }




}
