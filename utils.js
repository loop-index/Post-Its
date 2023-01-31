export function ranInt(min, max) {
    return Math.floor(Math.random() * (max - min) ) + min;
}

export function collide(el1, el2) {
    if (el1 == null || el2 == null) return false;
    
    let rect1 = el1.getBoundingClientRect();
    let rect2 = el2.getBoundingClientRect();

    let collided = !(
      rect1.top > rect2.bottom ||
      rect1.right < rect2.left ||
      rect1.bottom < rect2.top ||
      rect1.left > rect2.right
    );

    // console.log("top: " + rect1.top + ", bottom: " + rect1.bottom);
    // console.log("left: " + rect1.left + ", right: " + rect1.right);

    // console.log("top: " + rect2.top + ", bottom: " + rect2.bottom);
    // console.log("left: " + rect2.left + ", right: " + rect2.right);
    // console.log(collided)
    return collided;
}
