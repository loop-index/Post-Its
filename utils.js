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

function separateNotes(selected){
  let moveX = 0;
  let moveY = 0;
  let selectedId = selected ? selected.id.slice(5) : null;

  noteList.forEach((id) => {
      let noteText = document.getElementById("noteText-" + id);
      let noteInput = document.getElementById("noteInput-" + id);

      if (id != noteCount){
          noteInput.style.display = "none";
          noteText.style.display = "block";
      }

      if (id != selectedId) {
          let elem = document.getElementById("note-" + id);
          
          noteList.forEach((id2) => {
              let elem2 = document.getElementById("note-" + id2);
              if (id != id2 && collide(elem, elem2)){
                  let avgX = (elem.offsetLeft + elem2.offsetLeft) / 2;
                  let avgY = (elem.offsetTop + elem2.offsetTop) / 2;

                  moveX += (elem.offsetLeft - avgX) * .7;
                  moveY += (elem.offsetTop - avgY) * .7;
              }
          });

          let oldX = elem.offsetLeft;
          let oldY = elem.offsetTop;

          $("#note-" + id).animate(
              {top: String(oldY + moveY) + "px", left: String(oldX + moveX) + "px"}, { duration: 100, queue: false });
      }
  });
}