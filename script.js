import { noteHeight, getInject } from "./note.js";
import { ranInt, collide, startSelection } from "./utils.js";
import { db, app } from "./firebase.js";
import { collection, getDoc, setDoc, doc } from 'https://www.gstatic.com/firebasejs/9.16.0/firebase-firestore.js';

var columns = 3;
var noteCount = 0;
export var noteManager = {};
export var noteList = {};
var curNoteSize = 0; 

var prev = 0; // used to determine when a note jumps columns
var oldRow = 0; // used to determine when a note jumps rows
var noteWidth = window.innerWidth * 0.33;

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

        case "Delete":
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
            attachInputHandlers(id);
        });
    }

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

    if ($(selected).parents(".noteControl").length == 0 
            && $(selected).parents(".note").length > 0) {
        selected = $(selected).parents(".note")[0];
        topSelect = selected;
        $(".note").not(".search").animate({
            "opacity": "1",
        }, 100);
        $(".note").removeClass("search");

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

            // tab behavior
            if ($(this).hasClass("tab")){
                let col = noteManager[id].col;
                let row = noteManager[id].row;
                for (let i = row; i < noteList[col].length; i++){
                    let newId = noteList[col][i];
                    $("#note-" + newId).addClass("selected");
                    offX[newId] = e.clientX - $("#note-" + newId).offset().left;
                    offY[newId] = e.clientY - $("#note-" + newId).offset().top;
                }
            }
        });
        // lastX = e.clientX;

        prev = Math.round(parseInt(selected.offsetLeft) / noteWidth);
        oldRow = Math.round((parseInt(topSelect.offsetTop) - $("#playground").offset().top) / noteHeight);

        document.onpointermove = dragMouseMove;
        document.onpointerup = cancelDrag;
    } 
    else if (selected.tagName == "BODY") {
        startSelection(e);
        $("#selection-box").css({
            "z-index": noteCount + 1,
        });
    }
    else {
    }

    function dragMouseMove(e){
        e = e || window.event;
        e.preventDefault();

        $("#trash").removeClass("trash-hover");
        $("#trash").css({
            "font-size": "xx-large"
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
                    "font-size": "xxx-large"
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
        $(".selected").not(".tab").children().css({
            "height": "90%",
            "box-shadow": "none"
        });

        $(".tab").children().css({
            "box-shadow": "none"
        });

        if ($("#trash").hasClass("trash-hover")){
            let deleteSize = $(".selected").length;
            let Col = Math.max(0, Math.min(columns - 1, 
                Math.round(parseInt(topSelect.offsetLeft) / noteWidth)));
            let Row = Math.max(0, Math.min(noteList[Col].length - deleteSize, 
                Math.round((parseInt(topSelect.offsetTop) - $("#playground").offset().top) / noteHeight)));

            noteList[Col].splice(Row, deleteSize);

            $(".selected").each(function(){
                let id = $(this).attr("id").slice(5);
                delete noteManager[id];
                $(this).remove();
                curNoteSize--;
            });

            $("#trash").removeClass("trash-hover");
            $("#trash").css({
                "font-size": "xx-large"
            });
        }
        $(".note").removeClass("selected");

        updateDisplay(topSelect, false);
        save();

        document.onpointerup = null;
        document.onpointermove = null;
    }
    
}

/**
 * Handles the creation of new notes.
 */
$("#newNoteBtn").on("click", function (e) {
    addNewNote();
});

$("#newTabBtn").on("click", function (e) {
    let id = addNewNote();
    $("#note-" + id).addClass("tab");
});

function addNewNote(){
    let addText = $("#newNoteInput").val() == "" ? ">" : $("#newNoteInput").val();
    let inject = getInject(noteCount, addText);
    $("#playground").append(inject);
    $("#newNoteInput").val("");

    $("#note-" + noteCount).css({
        "z-index": noteCount,
        // "rotate": ranInt(-3, 3) + "deg",
        "width": noteWidth + "px",
    });

    noteManager[noteCount] = {
        "id": noteCount,
        "text": addText == ">" ? "" : addText,
    };
    noteList[prev].unshift(noteCount);

    display();

    attachInputHandlers(noteCount);

    if (addText == ">"){
        $("#noteText-" + noteCount).css("display", "none");
        $("#noteInput-" + noteCount).css("display", "block");
        $("#noteInput-" + noteCount).focus();
    }
    $("#noteDisplay-" + noteCount).css("background-color", `white`);

    noteCount += 1;
    curNoteSize += 1;
    save();
    return noteCount - 1;
}

/*
* Handles the input of notes.
*/
function attachInputHandlers(noteId){
    $("#noteInput-"+noteId).on("focusout", function (e) {
        // e.preventDefault();
        getInputText(this);
        this.style.display = "none";
        $("#noteText-" + noteId).css("display", "block");
        noteManager[noteId].text = this.value;
        display($(this));
        save(noteId + " entered");
    });

    $("#noteInput-"+noteId).on("keypress", function (e) {
        let text = getInputText(this);
        if(e.keyCode == 13) {
            $(this).blur();
            $(this).val(text);
        }
    });

    $("#noteEdit-"+noteId).on("click",function (e) {
        // e.preventDefault();
        display();
        $("#noteText-" + noteId).css("display", "none");
        $("#noteInput-" + noteId).css("display", "block");
        $("#noteInput-" + noteId).focus();
        let length = $("#noteInput-" + noteId).val().length;
        $("#noteInput-" + noteId).get()[0].setSelectionRange(length, length);
    });

    $("#noteTrash-"+noteId).on("click",function (e) {
        // e.preventDefault();
        let col = noteManager[noteId].col;
        let row = noteManager[noteId].row;
        noteList[col].splice(row, 1);
        delete noteManager[noteId];
        save();
        $("#note-" + noteId).remove();
        display();
    });

    function getInputText(input){
        let noteId = input.id.slice(10);
        let inputVal = input.value.split("@");
        let text = inputVal[0] == "" ? ">" : inputVal[0];
        
        $("#noteText-" + noteId + " .noteTextContent").text(text);
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
export function display(topSelect, animate=true){
    let curX = 0;
    let curZ = 0;
    let curY = 0;
    let curRow = 0;
    let originY = $("#playground").offset().top;
    let originX = $("#playground").offset().left;

    for (let col = 0; col < columns; col++){
        noteList[col].forEach((id) => {
    
            if (id != noteCount){
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
                    "overflow": "hidden",
                    "z-index": curZ
                });
                $("#note-" + id).not(".tab").css({
                    "height": "300px",
                });

                noteManager[id].col = col;
                noteManager[id].row = curRow;
            } else {
                $("#note-" + id).css({
                    "z-index": noteCount + 
                    ($("#note-" + id).offset().top - topSelect.offsetTop) / noteHeight,
                });
            }
            curY += noteHeight;
            curZ += 1;
            curRow += 1;
        });
        curX += noteWidth;
        curY = 0;
        curZ = 0;
        curRow = 0;
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






