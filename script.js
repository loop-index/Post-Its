import { noteHeight, getInject } from "./note.js";
import { ranInt, collide, startSelection } from "./utils.js";
import { db, app } from "./firebase.js";
import { collection, getDoc, setDoc, doc } from 'https://www.gstatic.com/firebasejs/9.16.0/firebase-firestore.js';

var columns = 3;
var noteCount = 0;
var noteManager = {};
var noteList = {};
var curNoteSize = 0; 

var prev = 0; // used to determine when a note jumps columns
var oldRow = 0; // used to determine when a note jumps rows
var noteWidth = window.innerWidth/columns;

const curUserRef = doc(db, "testUser", "mNsuVXombFYMZDNlN2xw");
// const curUserRef = doc(db, "testUser", "lol");
var curUser;

window.onresize = function(e) {
    noteWidth = window.innerWidth/columns;
    // $(".noteDisplay").css("width", noteWidth * 0.9 + "px");
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
                noteList = {};
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
    console.time("loading from firestore");
    curUser = await getDoc(curUserRef);
    console.timeEnd("loading from firestore");
    
    noteCount = curUser.data()["noteCount"];
    noteList = curUser.data()["noteList"];
    noteManager = curUser.data()["noteMap"];
    curNoteSize = curUser.data()["curNoteSize"];

    console.log(Object.keys(noteList).length)

    if (Object.keys(noteList).length < columns){
        let newColumns = Object.keys(noteList).length;
        for (let i = newColumns; i < columns; i++) {
            noteList[i] = [];
        }
        save();
    }

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
document.onpointerdown = function docMouseDown(e) {
    e = e || window.event;
    e.preventDefault();

    let offX = {}; 
    let offY = {};
    let selected = document.elementFromPoint(e.clientX, e.clientY);
    let topSelect = null;
    // let lastX = 0;

    if (selected.classList.contains("noteDisplay") || selected.parentNode.classList.contains("noteDisplay")) {
        selected = selected.classList.contains("noteDisplay") ? selected.parentNode : selected.parentNode.parentNode;
        topSelect = selected;

        if (!$(selected).hasClass("selected")){
            $(".note").removeClass("selected");
            $(selected).addClass("selected");
        }

        $(".selected").children().css({
            "height": "auto",
        });

        $(".selected").each(function() {
            let id = $(this).attr("id").slice(5);
            offX[id] = e.clientX - $(this).offset().left;
            offY[id] = e.clientY - $(this).offset().top;

            if ($(this).offset().top < topSelect.offsetTop){
                topSelect = this;
            }
        });
        // lastX = e.clientX;

        prev = Math.round(parseInt(selected.offsetLeft) / noteWidth);
        oldRow = Math.round((parseInt(topSelect.offsetTop) - $("#playground").offset().top) / noteHeight);

        document.onpointermove = dragMouseMove;
        document.onpointerup = cancelDrag;
    } 
    else if (selected.tagName != "BUTTON") {
        startSelection(e);
        $("#selection-box").css({
            "z-index": noteCount + 1,
        });
    }

    function dragMouseMove(e){
        e = e || window.event;
        e.preventDefault();

        $("#trash").removeClass("trash-hover");
        $("#trash").css({
            "width": "50px",
            "height": "50px",
            "background-size": "50px 50px"
        });

        $(".selected").each(function(){
            let id = $(this).attr("id").slice(5);
            $(this).css({
                "top": String(e.clientY - offY[id]) + "px",
                "left": String(e.clientX - offX[id]) + "px",
            });
            $(this).children().css({
                "box-shadow": "8px 8px 0 rgba(0, 0, 0, 0.5)"
            });
            if (collide($("#noteDisplay-" + id)[0], $("#trash")[0])){
                $("#trash").css({
                    "width": "75px",
                    "height": "75px",
                    "background-size": "75px 75px"
                });
                $("#trash").addClass("trash-hover");
            } 
        });

        // let speed = Math.max(-5, Math.min(5, (e.clientX - lastX)));
        // selected.children[0].style.transform = "rotate(" + speed + "deg)";
        // lastX = e.clientX;

        updateDisplay(topSelect, true);
    }
    
    function cancelDrag(e){
        $(".selected").children().css({
            "height": "90%",
            "box-shadow": "2px -2px 4px rgba(0, 0, 0, 0.2)"
        });

        if ($("#trash").hasClass("trash-hover")){
            let deleteSize = $(".selected").length;
            let Col = Math.max(0, Math.min(columns - 1, 
                Math.round(parseInt(topSelect.offsetLeft) / noteWidth)));
            let newRow = Math.max(0, Math.min(noteList[Col].length - deleteSize, 
                Math.round((parseInt(topSelect.offsetTop) - $("#playground").offset().top) / noteHeight)));

            noteList[Col].splice(newRow, deleteSize);

            $(".selected").each(function(){
                let id = $(this).attr("id").slice(5);
                delete noteManager[id];
                $(this).remove();
                curNoteSize--;
            });

            $("#trash").removeClass("trash-hover");
            $("#trash").css({
                "width": "50px",
                "height": "50px",
                "background-size": "50px 50px"
            });
        }
        save();
        $(".note").removeClass("selected");

        updateDisplay(topSelect, false);

        document.onpointerup = null;
        document.onpointermove = null;
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

    attachInputHandlers();
    $("#noteText-" + noteCount).css("display", "none");
    $("#noteInput-" + noteCount).css("display", "block");
    $("#noteInput-" + noteCount).focus();
    $("#noteDisplay-" + noteCount).css("background-color", `white`);

    noteCount += 1;
    curNoteSize += 1;
    save();
});

/*
* Handles the input of notes.
*/
function attachInputHandlers(){
    $(".noteInput").on("focusout", function toggleNoteInput(e) {
        e.preventDefault();
        let noteId = this.id.slice(10);
        getInputText(this);
        this.style.display = "none";
        $("#noteText-" + noteId).css("display", "block");
        noteManager[noteId].text = this.value;
        display($(this));
        save(noteId + " entered");
    });

    $(".noteInput").on("keypress", function toggleNoteInput(e) {
        let text = getInputText(this);
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

    function getInputText(input){
        let noteId = input.id.slice(10);
        let inputVal = input.value.split("@");
        let text = inputVal[0] == "" ? ">" : inputVal[0];
        $("#noteText-" + noteId).text(text);
        let red = inputVal[1] ? inputVal[1].length + 1 : 0;
        $("#noteDisplay-" + noteId).css("background-color", 
            `rgb(255, ${255 - Math.max(red - 3, 0) * 30}, ${255 - red * 40})`);
        return input.value;
    }
}

/**
 * Handles the movement of notes.
 */
function updateDisplay(topSelect, preview){
    let moveSize = $(".selected").length;

    let Col = Math.max(0, Math.min(columns - 1, 
        Math.round(parseInt(topSelect.offsetLeft) / noteWidth)));
    let newRow = Math.max(0, Math.min(noteList[Col].length - moveSize, 
        Math.round((parseInt(topSelect.offsetTop) - $("#playground").offset().top) / noteHeight)));

    let moveList = noteList[prev].splice(oldRow, moveSize);

    prev = Col;
    oldRow = newRow;
    noteList[Col].splice(newRow, 0, ...moveList);

    display(preview ? topSelect : null);
}

/**
 * Handles the display of notes.
*/
function display(topSelect, animate=true){
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
    
            if (!$("#note-" + id).hasClass("selected")){
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
                    "height": "150px",
                    "overflow": "hidden",
                });
                $("#note-" + id).css("z-index", curZ);
            } else {
                $("#note-" + id).css({
                    "z-index": noteCount + 
                    ($("#note-" + id).offset().top - topSelect.offsetTop) / noteHeight,
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
    await setDoc(curUserRef, {
        noteCount: noteCount,
        noteList: noteList,
        noteMap: noteManager,
        curNoteSize: curNoteSize,
    });
    console.log(message);
}






