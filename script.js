import Note from "./note.js";
import { ranInt, collide } from "./utils.js";

var noteCount = 0;
var noteManager = new Map();
var noteList = [[], [], []];
var prev = 0; // used to determine when a note jumps columns
var columns = 3;
var noteWidth = window.innerWidth/3;

document.onkeydown = function(e) {
    switch (e.key) {
        case "z":
            console.log(noteList);
            break;
    }
}

/**
 * Handles the drag and drop functionality of the notes.
 */
document.onmousedown = docMouseDown;
function docMouseDown(e) {
    e = e || window.event;
    e.preventDefault();

    let offX = 0; 
    let offY = 0;
    let selected = document.elementFromPoint(e.clientX, e.clientY);

    if (selected.classList.contains("note") || selected.parentNode.classList.contains("note")) {
        selected = selected.classList.contains("note") ? selected : selected.parentNode;
        let selectedId = selected.id.slice(5);
        noteManager.get(parseInt(selectedId)).selected = true;

        selected.style.height = "auto";
        offX = e.clientX - selected.offsetLeft;
        offY = e.clientY - selected.offsetTop;

        prev = Math.max(0, Math.min(2, 
            Math.round(parseInt(selected.offsetLeft) / noteWidth)));

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
        selected.style.height = "100px";

        updateDisplay(selected, false);

        // selected.style.zIndex = String(noteCount);

        document.onmouseup = null;
        document.onmousemove = null;
    }
    
}

/**
 * Handles the creation of new notes.
 */
document.getElementById("newNoteBtn").onclick = function (e) {

    //<p>Note ${noteCount}</p>
    
    let inject = `
    <div class="note" id="note-${noteCount}">
        <p class="noteText" id="noteText-${noteCount}" style="display:none;">></p>
        <input type="text" value="" class="noteInput" id="noteInput-${noteCount}" placeholder="to-do">
        </input>
    </div>
    `
    document.getElementById("day1").innerHTML += inject;

    let newElem = document.getElementById("note-" + (noteCount));
    newElem.style.zIndex = String(noteCount);
    newElem.style.backgroundColor = 
        `rgb(${ranInt(100, 255)}, ${ranInt(100, 255)}, ${ranInt(100, 255)})`;
    newElem.style.width = "33%";

    let newNote = new Note(noteCount, false);
    noteManager.set(noteCount, newNote);
    noteList[0].unshift(noteCount);

    display();

    $("#noteInput-" + noteCount).focus();
    $(".noteInput").on("keydown", function toggleNoteInput(e) {
        if(e.keyCode == 13) {
            let noteId = this.id.slice(10);
            let noteText = document.getElementById("noteText-" + noteId);
            noteText.innerHTML = this.value == "" ? ">" : this.value;
            this.style.display = "none";
            noteText.style.display = "block";
            display();
        }
    });

    $(".noteInput").on("input", function toggleNoteInput(e) {
        let noteId = this.id.slice(10);
        let noteText = document.getElementById("noteText-" + noteId);
        noteText.innerHTML = this.value == "" ? ">" : this.value;
    });

    $(".noteText").on("dblclick",function toggleNoteInput(e) {
        display();
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
    // let noteHeight = selected.clientHeight * .7;
    let noteHeight = 70;
    let selectedId = selected.id.slice(5);

    let oldRow = noteList[prev].indexOf(parseInt(selectedId));
    noteList[prev].splice(oldRow, 1);

    let Col = Math.max(0, Math.min(columns - 1, 
        Math.round(parseInt(selected.offsetLeft) / noteWidth)));
    let newRow = Math.max(0, Math.min(noteCount - 1, 
        Math.floor(parseInt(selected.style.top) / noteHeight)));

    console.log(Col + "," + prev);

    if (Col != prev){
        prev = Col;
    } 
    noteList[Col].splice(newRow, 0, parseInt(selectedId));
    display(preview ? selectedId : null);
}

/**
 * Handles the display of notes.
*/
function display(selectedId){
    let curX = 0;
    let curZ = 0;
    let curY = 0;
    let noteHeight = 0;
    let originY = document.getElementById("playground").offsetTop;
    let originX = document.getElementById("playground").offsetLeft;

    noteList.forEach((col) => {
        col.forEach((id) => {
            let noteText = document.getElementById("noteText-" + id);
            let noteInput = document.getElementById("noteInput-" + id);
    
            if (id != noteCount){
                noteInput.blur();
                noteInput.style.display = "none";
                noteText.style.display = "block";
            }
    
            let elem = document.getElementById("note-" + id);
            // noteHeight = elem.clientHeight * .7;
            noteHeight = 70;
            if (id != selectedId){
                $("#note-" + id).animate(
                    {top: String(originY + curY) + "px"}, 
                    { duration: 10, queue: false});
                elem.style.left = String(originX + curX) + "px";
                elem.style.zIndex = curZ;
                elem.style.height = "100px";
                elem.style.overflow = "hidden";
            } else {
                elem.style.zIndex = String(noteCount);
            }
            curY += noteHeight;
            curZ += 1;
        });
        curX += noteWidth;
        curY = 0;
        curZ = 0;
    });
}







