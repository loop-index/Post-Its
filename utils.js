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

var selection = new Set([]);

export function getSelection(){
    return selection;
}

export function startSelection(e){
  e = e || window.event;
  e.preventDefault();

  let startX = e.clientX;
  let startY = e.clientY;
  let firstCol = null;

  $("#selection-box").css({
    "left": String(startX) + "px",
    "top": String(startY) + "px",
    "width": "0px",
    "height": "0px",
    "display": "block"
  });

  selection.clear();
  $(".noteDisplay").removeClass("rotating-border");

  document.onmousemove = selectMouseMove;
  document.onmouseup = cancelSelect;

  function selectMouseMove(e){
    e = e || window.event;
    e.preventDefault();

    let endX = e.clientX;
    let endY = e.clientY;

    let left = Math.min(startX, endX);
    let top = Math.min(startY, endY);
    let width = Math.abs(startX - endX);
    let height = Math.abs(startY - endY);

    $("#selection-box").css({
      "left": String(left) + "px",
      "top": String(top) + "px",
      "width": String(width) + "px",
      "height": String(height) + "px",
      "display": "block"
    });

    selection.clear();
    firstCol = checkInside($("#selection-box")[0], "noteDisplay", firstCol);
  }

  function cancelSelect(e){
    document.onmousemove = null;
    document.onmouseup = null;
    $("#selection-box").css({
      "display": "none"
    });
    console.log(selection);
  }

  function checkInside(box, elemID, firstCol){
    let rect1 = box.getBoundingClientRect();
    let noInside = true;
  
    $("." + elemID).each(function(){
      let rect2 = this.getBoundingClientRect();
  
      if (!firstCol){
        let inside = (
          rect1.top < rect2.top &&
          rect1.right > rect2.right &&
          rect1.bottom > rect2.bottom &&
          rect1.left < rect2.left
        );
  
        if (inside){
          firstCol = rect2.left;
          // console.log(firstCol);
        } 
      }
      if (firstCol == rect2.left){
        let inside = (
          rect1.top < rect2.top &&
          rect1.right > rect2.right &&
          rect1.bottom > rect2.bottom &&
          rect1.left < rect2.left
        );
  
        if (inside){
          $(this).addClass("rotating-border");
          selection.add(this.id);
          noInside = false;
        } else {
          $(this).removeClass("rotating-border");
        }
      }
    });
    if (noInside){
      firstCol = null;
    }
  
    return firstCol;
  }
}


