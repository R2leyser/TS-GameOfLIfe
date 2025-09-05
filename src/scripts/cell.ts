
import * as ex from 'excalibur';

export class Cell extends ex.Actor {

    vector: ex.Vector
    age: number;
    dead: boolean; 

    updateAge( age: number) {
        this.age = age;
        switch (age) {
            case 1:
                this.color = ex.Color.White;
                break;
            
            case 2:
                this.color = ex.Color.Pink;
                break;

            case 3:
                this.color = ex.Color.Magenta;
                break;

            case 4:
                this.color = ex.Color.Purple;
                break;
            default:
                this.color = ex.Color.Black;
                this.kill();
        }
    }

    updatePos( vec: ex.Vector ): void {
        this.vector = vec;
        this.pos = ex.vec(vec.x * 40 + 20, vec.y * 40 + 20);
    } 
    
    resetColor(): void {
        this.color = ex.Color.fromHex("#4E44AC")
        this.graphics.opacity = 1;
    }

    constructor(vector: ex.Vector, age?: number, dead?: boolean) {
        
        super({
            pos: ex.vec(0, 0),
            width: 40, // for now we'll use a box so we can see the rotation
            height: 40, // later we'll use a circle collider
            color: ex.Color.fromHex("#4E44AC")
        })

        this.dead = dead ?? false;


        this.age = age ?? 1;

        this.vector = vector;
        this.pos = ex.vec(vector.x * 40 + 20, vector.y * 40 + 20);
    }
}
