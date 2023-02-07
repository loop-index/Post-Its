import { getInject } from "./note.js";
import { ranInt, collide } from "./utils.js";
import { db, app } from "./firebase.js";
import { collection, getDoc, setDoc, doc } from 'https://www.gstatic.com/firebasejs/9.16.0/firebase-firestore.js';

var columns = 3;
var noteCount = 0;
var noteManager = {};
var noteList = {};
for (let i = 0; i < columns; i++) {
    noteList[i] = [];
}

var prev = 0; // used to determine when a note jumps columns
var noteWidth = window.innerWidth/columns;
var noteHeight = 50;

const curUserRef = doc(db, "testUser", "mNsuVXombFYMZDNlN2xw");
var curUser;

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

        case "x":
            if (document.activeElement.tagName == "BODY"){
                noteManager = {};
                noteList = { 0: [], 1: [], 2: [] };
                noteCount = 0;
                save();
            }
            break;

        case "s":
            if (document.activeElement.tagName == "BODY"){
                save();
            }
            break;
    }
}

/**
 * Loads notes from the database and displays them. 
*/
$(document).ready(async function() {
    curUser = await getDoc(curUserRef);
    noteCount = curUser.data()["noteCount"];
    noteList = curUser.data()["noteList"];
    noteManager = curUser.data()["noteMap"];

    for (let col = 0; col < columns; col++){
        noteList[col].forEach((id) => {
            let inputVal = noteManager[id].text.split("@")[0];
            let importance = noteManager[id].text.split("@")[1];
            let red = importance ? importance.length + 1 : 0;
            let text = inputVal == "" ? ">" : inputVal;
            let inject = getInject(id, text);
            $("#playground").append(inject);
            $("#noteDisplay-" + id).css("background-color", 
                `rgb(255, ${255 - Math.max(red - 3, 0) * 30}, ${255 - red * 40})`);

            $("#note-" + id).css({
                "z-index": id,
                // "rotate": ranInt(-3, 3) + "deg",
                "width": noteWidth + "px",
            });
        });
    }
    attachInputHandlers();
    display(null, false);
});

/**
 * Handles the drag and drop functionality of the notes.
 */
document.onmousedown = function docMouseDown(e) {
    e = e || window.event;
    e.preventDefault();

    let offX = 0; 
    let offY = 0;
    let selected = document.elementFromPoint(e.clientX, e.clientY);
    let lastX = 0;

    if (selected.classList.contains("noteDisplay") || selected.parentNode.classList.contains("noteDisplay")) {
        selected = selected.classList.contains("noteDisplay") ? selected.parentNode : selected.parentNode.parentNode;
        let selectedId = selected.id.slice(5);

        $(selected).children().css({
            "height": "auto",
        });

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
    
        $(selected).css({
            "top": String(e.clientY - offY) + "px",
            "left": String(e.clientX - offX) + "px",
        })

        $(selected).children().css({
            "box-shadow": "8px 8px 0 rgba(0, 0, 0, 0.5)"
        })

        // let speed = Math.max(-5, Math.min(5, (e.clientX - lastX)));
        // selected.children[0].style.transform = "rotate(" + speed + "deg)";
        // lastX = e.clientX;

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
        $(selected).children().css({
            "height": "90%",
        })

        $(selected).children().css({
            "box-shadow": "none"
        })

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
    let inject = getInject(noteCount, ">");
    $("#playground").append(inject);

    $("#note-" + noteCount).css({
        "z-index": noteCount,
        // "rotate": ranInt(-3, 3) + "deg",
        "width": noteWidth + "px",
    });

    noteManager[noteCount] = {
        "id": noteCount,
        "text": "",
    };
    noteList[prev].unshift(noteCount);

    display();
    save();

    attachInputHandlers();
    $("#noteText-" + noteCount).css("display", "none");
    $("#noteInput-" + noteCount).css("display", "block");
    $("#noteInput-" + noteCount).focus();
    console.log("New note created");
    noteCount += 1;
});

/*
* Handles the input of notes.
*/
function attachInputHandlers(){
    $(".noteInput").on("focusout", function toggleNoteInput(e) {
        e.preventDefault();
        let noteId = this.id.slice(10);
        this.style.display = "none";
        $("#noteText-" + noteId).css("display", "block");
        noteManager[noteId].text = this.value;
        display();
        save(noteId + " entered");
    });

    $(".noteInput").on("keypress", function toggleNoteInput(e) {
        let noteId = this.id.slice(10);
        let inputVal = this.value.split("@")[0];
        let text = inputVal == "" ? ">" : inputVal;
        $("#noteText-" + noteId).text(text);
        let importance = this.value.split("@")[1];
        let red = importance ? importance.length + 1 : 0;
        $("#noteDisplay-" + noteId).css("background-color", 
            `rgb(255, ${255 - Math.max(red - 3, 0) * 30}, ${255 - red * 40})`);
        
        if(e.keyCode == 13) {
            this.blur();
            this.value = text;
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
}

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
function display(selectedId, animate=true){
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
                if (animate){
                    $("#note-" + id).animate(
                        {top: String(originY + curY) + "px"}, 
                        { duration: 10, queue: false});
                }
                else{
                    $("#note-" + id).css("top", String(originY + curY) + "px");
                }
                $("#note-" + id).css({
                    "left": (originX + curX) + "px",
                    "height": "300px",
                    "overflow": "hidden",
                });
                $("#note-" + id).css("z-index", curZ);
            } else {
                $("#note-" + id).css({
                    "z-index": noteCount,
                });
            }
            curY += noteHeight;
            curZ += 1;
        });
        curX += noteWidth;
        curY = 0;
        curZ = 0;
    }
}

/*
* Handles the saving of notes.
*/
async function save(message="Saved"){
    setDoc(curUserRef, {
        noteCount: noteCount,
        noteList: noteList,
        noteMap: noteManager
    });
    console.log(message);
}






