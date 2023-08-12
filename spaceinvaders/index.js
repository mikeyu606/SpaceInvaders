const scoreEl = document.querySelector('#scoreEl');
const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

canvas.width = 1024
canvas.height = 576

class Player {
    constructor() {
        this.width = 0;
        this.height = 0;
        this.position = { x: 0, y: 0 };
        this.velocity = { x: 0, y: 0 };
        this.rotation = 0;
        this.opacity = 1

        this.image = new Image();
        this.image.src = './assets/spaceship.png';
        this.image.onload = () => {
            const scale = 0.15;
            this.width = this.image.width * scale;
            this.height = this.image.height * scale;
            this.position.x = canvas.width / 2 - this.width / 2;
            this.position.y = canvas.height - this.height - 20;
        };
    }

    draw() {
        c.save();
        c.globalAlpha = this.opacity 
        c.translate(this.position.x + this.width / 2, this.position.y + this.height / 2);
        c.rotate(this.rotation);

        if (this.image) {
            c.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height);
        }

        c.restore();
        this.rotation = 0
    }

    //this method renders the player and adds the velocity 
    update() {
        this.draw();
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
    }
}

class Projectile {
    constructor({position, velocity}) {
        this.position = position;
        this.velocity = velocity;
        this.radius = 4;
    }

    draw(){
        //drawing the shape of the projectile 
        c.beginPath()
        c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2 )
        c.fillStyle = 'red'
        c.fill()
        c.closePath()
    }

    update() {
        this.draw();
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
    }
}

//used to blow up enemies 
class Particle {
    constructor({position, velocity, radius, color, fades}) {
        this.position = position;
        this.velocity = velocity;
        this.radius = radius;
        this.color = color 
        this.opacity = 1 
        this.fades = fades
    }

    draw(){
        c.save()
        c.globalAlpha = this.opacity 
        c.beginPath()
        c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2 )
        c.fillStyle = this.color
        c.fill()
        c.closePath()
        c.restore()
    }

    update() {
        this.draw();
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        if (this.fades) this.opacity -= 0.01
    }
}

class InvaderProjectile {
    constructor({position, velocity}) {
        this.position = position
        this.velocity = velocity
        this.width = 3
        this.height = 10;
    }

    draw(){ //want rectangular bullets
        c.fillStyle = 'white'
        c.fillRect(this.position.x, this.position.y, this.width, this.height)
    }

    update() {
        this.draw();
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
    }
}


//Invader 
class Invader {
    constructor({ position }) {
        console.log('Received position:', position);
        this.velocity = { 
            x: 0, 
            y: 0 }

        const image = new Image();
        image.src = './assets/invader.png';
        image.onload = () => {
            const scale = 1
            this.image = image 
            this.width = image.width * scale 
            this.height = image.height * scale 
            this.position = {
                x: position.x + 20 ,
                y: position.y + 20
            }
        }
    }
    
    //render invader onto the canvas 
    draw() {
        if (this.image) {
            c.drawImage(this.image, this.position.x - this.width / 2, this.position.y - this.height / 2, this.width, this.height);
        }
    }
    

    update({velocity}) {
        if (this.image) {
            this.draw();
            this.position.x += velocity.x;
            this.position.y += velocity.y;
        }
        
    }

    shoot(InvaderProjectiles){
        InvaderProjectiles.push(new InvaderProjectile({
            position: {
                x:this.position.x + this.width /2,
                y: this.position.y + this.height
            },
            velocity: {
                x:0,
                y:5
            }
        }))
    }
}


//this class holds a grid of enemies 
class Grid { 
    constructor() {
        this.position = {
            x:0,
            y:0
        }

        this.velocity = { //grid attribute controls the speed of the collection 
            x:7,
            y:2
        }

        this.invaders = [] //whenever we create an grid we create an invader 
        const rows = Math.floor((Math.random() * 5)+2) 
        const cols = Math.floor((Math.random() * 10)+5) 
        this.width = cols * 30
        for(let i  = 0; i < cols; i++) {
            for (let j  = 0; j < rows; j++) {
                this.invaders.push(new Invader({position: {x:i *30, y:j * 30}}))
            }
            
        }
    
    } //end of constuctor 

    update() {
        this.position.x += this.velocity.x; // Update the position based on velocity
        this.position.y += this.velocity.y;

        this.velocity.y = 0 

        if(this.position.x + this.width >= canvas.width || this.position.x <= 0 ) {
            this.velocity.x = -this.velocity.x 
            this.velocity.y = 30
        }

    }
}


//INITS

const player = new Player();
//Holding projectile objects with two properties: position and velocity in an array to remove them once <= 0 
const projectiles = []; 
const grids = []
const invaderProjectiles = []
const particles = []

const keys = {
    a: { pressed: false },
    d: { pressed: false },
};


let frames = 0 
let randomInterval = Math.floor((Math.random() * 500) + 500 ) //random interval to spawn in new enemies 
let game = {
    over: false,
    active: true
}

let score = 0 

// creating the BACKGROUND
for(let i = 0; i < 100; i++) {
    particles.push(new Particle({
        position: {
            x: Math.random() * canvas.width, 
            y: Math.random() * canvas.height
            },
        velocity: {
             x: 0,
             y: .3
            },
        radius: Math.random() * 2,
        color: 'white'
        }))
}


// create particles when player or Invader gets hit  
function createParticles({object, color, fades}) {
    //this creates the explosion of particles 
    for(let i = 0; i < 15; i++) {
        particles.push(new Particle({
            position: {
                x: object.position.x + object.width / 2, //add this to get the middle of the invader invader.width / 2
                y: object.position.y + object.height / 2
                },
            velocity: {
                 x: (Math.random() - .5) * 2,
                 y:(Math.random() -.5) * 2 
                },
            radius: Math.random() * 3,
            color: color || 'yellow',
            fades: true
            }))
    }
}


// 
function animate() {
    if(!game.active)return 
    requestAnimationFrame(animate);
    c.fillStyle = 'black';
    c.fillRect(0, 0, canvas.width, canvas.height);
    player.update();

    //loops through the particles 
    particles.forEach((particle,i) => {
        if (particle.position.y - particle.radius >= canvas.height) {
            particle.position.x = Math.random() * canvas.width
            particle.position.y = -particle.radius //put at top of canvas 
        }

        if(particle.opacity <= 0) { //removes the particles once opacity drops 
            setTimeout(() => {
                particles.splice(i,1)
            }, 0);
            
        } else particle.update()
    })

    invaderProjectiles.forEach((invaderProjectile,index) => {
        if(invaderProjectile.position.y + invaderProjectile.height >= canvas.height
            ) {
            setTimeout(() => {
                invaderProjectiles.splice(index, 1)
            }, 0)
        } else invaderProjectile.update()


        //when the invader projectile hits the player 

        if (invaderProjectile.position.y + invaderProjectile.height >= player.position.y
            && invaderProjectile.position.x + invaderProjectile.width >= player.position.x 
            && invaderProjectile.position.x <= player.position.x + player.width)  
            {
            setTimeout(() => { 
                invaderProjectiles.splice(index, 1) //removes the projectile 
                player.opacity = 0 //hides the player
                game.over =  true //set game over 
            }, 0)
            setTimeout(() => {  //after 2000 seconds after the player dies so you can see explosion 
                game.active = false 
            }, 2000)
                createParticles({
                    object: player,
                    color: 'white',
                    fades: true
                })
        }
    })

    
    
    

    projectiles.forEach((projectile, index) => {
        if (projectile.position.y + projectile.radius <= 0 ) { //code removes the projectiles as they go off the screen 
           
            setTimeout(() => { //removes flashing 
                projectiles.splice(index, 1)    
            }, 0);
            
        }
        else {
            projectile.update()
        }

    })

    //looping through the invaders 
    grids.forEach((grid, gridIndex) => {
        grid.update();

     //spawn projectiles 
     if(frames % 100 === 0 && grid.invaders.length > 0) {
        grid.invaders[Math.floor(Math.random() * grid.invaders.length)].shoot(invaderProjectiles)//choose random invador and then shoot
     }

        grid.invaders.forEach((invader, i) => {
            invader.update({ velocity: grid.velocity });
            
            // projectiles hits enemies 
            projectiles.forEach((projectile, j) => { 
                if (
                    projectile.position.y - projectile.radius <=
                        invader.position.y + invader.height && 
                    projectile.position.x + projectile.radius >= 
                        invader.position.x //right side of enemy
                    && projectile.position.x - projectile.radius <=
                     invader.position.x + invader.width
                    && projectile.position.y + projectile.radius >= 
                        invader.position.y
                    ) {
                        

                    setTimeout(() => {
                        const invaderFound = grid.invaders.find(
                            (invader2) => invader2 === invader
                        )
                        const projectileFound = projectiles.find(
                            (projectile2) => projectile2 === projectile
                        )

                            //remove invader and projectiles 
                        if (invaderFound && projectileFound) {
                            score += 100
                            scoreEl.innerHTML = score

                            createParticles({
                                object: invader,
                                fades:true
                            })


                            grid.invaders.splice(i, 1); // Remove invader from grid
                            projectiles.splice(j, 1);   // Remove projectile from projectiles array

                            if (grid.invaders.length > 0) {
                                const firstInvader = grid.invaders[0]
                                const lastInvader = grid.invaders[grid.invaders.length-1] //last col

                                grid.width = lastInvader.position.x - firstInvader.position.x + lastInvader.width
                                grid.position.x = firstInvader.position.x


                            }
                            else {
                                grids.splice(gridIndex, 1)
                            }
                        }
                    }, 0)
                }
            })
        })
    })

    if (keys.a.pressed && player.position.x >= 0) {
        player.velocity.x = -10;
        player.rotation = -0.15;
    } else if (keys.d.pressed && player.position.x + player.width <= canvas.width) {
        player.velocity.x = 10;
        player.rotation = 0.15;
    } else {
        player.velocity.x = 0;
    }
    //spawn grid of enemies 
    if (frames % randomInterval === 0) { //whenever frames hits 1000 create a new grid of enemies 
    grids.push(new Grid())
    randomInterval = Math.floor((Math.random() * 500) + 500 )
    frames = 0 
    }
    frames++
}

animate();

addEventListener('keydown', ({ key }) => {
    if(game.over) return 
    switch (key) {
        case 'a':
            keys.a.pressed = true;
            break;
        case 'd':
            keys.d.pressed = true;
            break;
        case ' ':
            projectiles.push( new Projectile({
    position: {
        x: player.position.x + player.width /2,
        y: player.position.y 
    },
    velocity: {  
        x: 0,
        y: -10
    }
}) )            
        break;
    }
});

addEventListener('keyup', ({ key }) => {
    switch (key) {
        case 'a':
            keys.a.pressed = false;
            break;
        case 'd':
            keys.d.pressed = false;
            break;
    }
});
