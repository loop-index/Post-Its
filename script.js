import Note from "./note.js";
import { ranInt, collide } from "./utils.js";
import { db, app } from "./firebase.js";
import { collection, getDoc, setDoc, doc } from 'https://www.gstatic.com/firebasejs/9.16.0/firebase-firestore.js';

var noteCount = 0;
var noteManager = {};
var prev = 0; // used to determine when a note jumps columns
var columns = 3;
var noteWidth = window.innerWidth/columns;
var noteHeight = 50;

var noteList = {};
for (let i = 0; i < columns; i++) {
    noteList[i] = [];
}

window.onresize = function(e) {
    noteWidth = window.innerWidth/columns;
    display();
}

//maps keys to test functions
document.onkeydown = function(e) {
    switch (e.key) {
        case "z":
            console.log(noteManager);
            break;

        case "s":
            if (document.activeElement.tagName == "BODY"){
                console.log("saving");
                save();
            }
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
    let lastX = 0;

    if (selected.classList.contains("noteDisplay") || selected.parentNode.classList.contains("noteDisplay")) {
        selected = selected.classList.contains("noteDisplay") ? selected.parentNode : selected.parentNode.parentNode;
        let selectedId = selected.id.slice(5);
        noteManager[(parseInt(selectedId))].selected = true;

        // selected.style.height = "auto";
        offX = e.clientX - selected.offsetLeft;
        offY = e.clientY - selected.offsetTop;
        lastX = e.clientX;

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

        let speed = Math.max(-5, Math.min(5, (e.clientX - lastX)));
        selected.children[0].style.transform = "rotate(" + speed + "deg)";
        lastX = e.clientX;

        if (collide(selected, $("#trash")[0])){
            $("#trash").css({
                "width": "75px",
                "height": "75px",
                "background-size": "75px 75px"
            });
        } else {
            $("#trash").css({
                "width": "50px",
                "height": "50px",
                "background-size": "50px 50px"
            });
        }

        updateDisplay(selected, true);
    }
    
    function cancelDrag(e){
        selected.style.height = "100px";

        updateDisplay(selected, false);

        if (collide(selected, $("#trash")[0])){
            let selectedId = selected.id;
            let Col = Math.max(0, Math.min(columns - 1, 
                Math.round(parseInt(selected.offsetLeft) / noteWidth)));
            noteList[Col].pop();
            delete noteManager[parseInt(selectedId.slice(5))];
            $("#" + selectedId).remove();
            $("#trash").css({
                "width": "50px",
                "height": "50px",
                "background-size": "50px 50px"
            });
        }
        save();

        document.onmouseup = null;
        document.onmousemove = null;
    }
    
}

/**
 * Handles the creation of new notes.
 */
$("#newNoteBtn").on("click", function (e) {

    //<p>Note ${noteCount}</p>
    
    let inject = `
    <div class="note overflow-visible" id="note-${noteCount}">
        <div class="noteDisplay" id="noteDisplay-${noteCount}">
            <p class="noteText" id="noteText-${noteCount}" style="display:none;">></p>
            <input type="text" value="" class="noteInput" id="noteInput-${noteCount}" placeholder="to-do">
            </input>
        </div>
    </div>
    `;
    $("#playground").append(inject);

    $("#note-" + noteCount).css({
        "z-index": noteCount,
        "rotate": ranInt(-3, 3) + "deg",
        "width": noteWidth + "px",
    });

    let newNote = new Note(noteCount, false);
    noteManager[noteCount] = {
        "id": noteCount,
        "text": "",
    };
    noteList[prev].unshift(noteCount);

    display();
    save();

    $("#noteInput-" + noteCount).focus();
    $(".noteInput").on("focusout", function toggleNoteInput(e) {
        e.preventDefault();
        let noteId = this.id.slice(10);
        this.style.display = "none";
        $("#noteText-" + noteId).css("display", "block");
        noteManager[noteId].text = this.value;
        display();
        save();
    });

    $(".noteInput").on("keypress", function toggleNoteInput(e) {
        let noteId = this.id.slice(10);
        if(e.keyCode == 13) {
            this.style.display = "none";
            $("#noteText-" + noteId).css("display", "block");
            noteManager[noteId].text = this.value;
            this.blur();
            display();
            save();
        } else {
            let inputVal = this.value.split("@")[0];
            $("#noteText-" + noteId).text(inputVal == "" ? ">" : inputVal);
            let importance = this.value.split("@")[1];
            let red = importance ? importance.length + 1 : 0;
            $("#noteDisplay-" + noteId).css("background-color", 
                `rgb(255, ${255 - Math.max(red - 3, 0) * 30}, ${255 - red * 40})`);
        }
    });

    $(".noteText").on("dblclick",function toggleNoteInput(e) {
        e.preventDefault();
        display();
        let noteId = this.id.slice(9);
        this.style.display = "none";
        $("#noteInput-" + noteId).css("display", "block");
        $("#noteInput-" + noteId).focus();
    });

    noteCount += 1;
});

/**
 * Handles the movement of notes.
 */
function updateDisplay(selected, preview){
    let selectedId = selected.id.slice(5);

    let oldRow = noteList[prev].indexOf(parseInt(selectedId));
    noteList[prev].splice(oldRow, 1);

    let Col = Math.max(0, Math.min(columns - 1, 
        Math.round(parseInt(selected.offsetLeft) / noteWidth)));
    let newRow = Math.max(0, Math.min(noteCount - 1, 
        Math.round((parseInt(selected.style.top) - $("#playground").offset().top) / noteHeight)));

    prev = (prev == Col) ? prev : Col;
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
    let originY = $("#playground").offset().top;
    let originX = $("#playground").offset().left;

    for (let col = 0; col < columns; col++){
        noteList[col].forEach((id) => {
    
            if (id != noteCount){
                // $("#noteInput-" + id).blur();
                $("#noteInput-" + id).css("display", "none");
                $("#noteText-" + id).css("display", "block");
            }
    
            if (id != selectedId){
                $("#note-" + id).animate(
                    {top: String(originY + curY) + "px"}, 
                    { duration: 10, queue: false});
                $("#note-" + id).css({
                    "left": (originX + curX) + "px",
                    "height": "300px",
                    "overflow": "hidden",
                });
            }
            $("#note-" + id).css("z-index", curZ);
            curY += noteHeight;
            curZ += 1;
        });
        curX += noteWidth;
        curY = 0;
        curZ = 0;
    }
}

async function save(){
    const curUserRef = doc(db, "testUser", "mNsuVXombFYMZDNlN2xw");
    const curUser = await getDoc(curUserRef);
    setDoc(curUserRef, {
        noteList: noteList,
        noteMap: noteManager
    }, {merge: true});


    // console.log(curUser.data());
}






