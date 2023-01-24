import Note from "./note.js";

var noteCount = 0;
var noteManager = new Map();
var noteList = [];

/**
 * Handles the drag and drop functionality of the notes.
 */
document.onmousedown = docMouseDown;
function docMouseDown(e) {
    e = e || window.event;
    e.preventDefault();

    var offX = 0; 
    var offY = 0;
    var selected = document.elementFromPoint(e.clientX, e.clientY);

    if (selected.classList.contains("note")) {
        let selectedId = selected.id.slice(5);
        noteManager.get(parseInt(selectedId)).selected = true;

        selected.style.backgroundColor = "red";
        offX = e.clientX - selected.offsetLeft;
        offY = e.clientY - selected.offsetTop;

        document.onmousemove = dragMouseMove;
        document.onmouseup = cancelDrag;
    }

    function dragMouseMove(e){
        e = e || window.event;
        e.preventDefault();
    
        selected.style.top = String(e.clientY - offY) + "px";
        selected.style.left = String(e.clientX - offX) + "px";

        updateDisplay(selected, true);
    }
    
    function cancelDrag(e){
        selected.style.backgroundColor = "white";

        updateDisplay(selected, false);

        document.onmouseup = null;
        document.onmousemove = null;
    }
    
}

/**
 * Handles the creation of new notes.
 */
document.getElementById("newNoteBtn").onclick = function (e) {
    
    let inject = `
    <div class="note" id="note-${noteCount}">    
        <p>Note ${noteCount}</p>
        <input type="text" class="noteInput" id="noteInput-${noteCount}" placeholder="Lorem ipsum">
        </input>
        <p class="noteText" id="noteText-${noteCount}" style="display:none;">Lorem ipsum</p>
    </div>
    `
    document.getElementById("playground").innerHTML += inject;

    let newElem = document.getElementById("note-" + (noteCount));
    newElem.style.top = String(newElem.offsetTop + e.clientY) + "px";
    newElem.style.left = String(newElem.offsetLeft + e.clientX) + "px";

    let newNote = new Note(noteCount, false);
    noteManager.set(noteCount, newNote);
    noteList.push(noteCount);

    display();

    $("#noteInput-" + noteCount).focus();
    $(".noteInput").on("keydown",function toggleNoteInput(e) {
        let noteId = this.id.slice(10);
        let noteText = document.getElementById("noteText-" + noteId);
        if(e.keyCode == 13) {
            noteText.innerHTML = this.value;
            this.style.display = "none";
            noteText.style.display = "block";
        }
    });

    $(".noteText").on("click",function toggleNoteInput(e) {
        display();
        console.log("clicked");
        let noteId = this.id.slice(9);
        let noteInput = document.getElementById("noteInput-" + noteId);
        
        this.style.display = "none";
        noteInput.style.display = "block";
        noteInput.focus();
    });

    noteCount += 1;
}

/**
 * Handles the movement of notes.
 */
function updateDisplay(selected, preview){
    let selectedId = selected.id.slice(5);
    let oldPos = noteList.indexOf(parseInt(selectedId));
    let newPos = Math.min(noteCount - 1, 
        Math.floor(parseInt(selected.style.top.slice(0, -2)) / 102));
    
    noteList.splice(oldPos, 1);
    noteList.splice(newPos, 0, parseInt(selectedId));
    display(preview ? selectedId : null);
}

/**
 * Handles the display of notes.
*/
function display(selectedId){
    let curY = 0;

    noteList.forEach((id) => {
        let noteText = document.getElementById("noteText-" + id);
        let noteInput = document.getElementById("noteInput-" + id);

        if (id != noteCount){
            noteInput.style.display = "none";
            noteText.style.display = "block";
        }

        let elem = document.getElementById("note-" + id);
        let originY = document.getElementById("playground").offsetTop;
        if (id != selectedId){
            // elem.style.top = String(originY + curY) + "px";
            $("#note-" + id).animate(
                {top: String(originY + curY) + "px"}, { duration: 10, queue: false });
            elem.style.left = "0px";
            elem.style.zIndex = "0";
        } else {
            elem.style.zIndex = "1";
        }
        curY += 152;
    });
}





