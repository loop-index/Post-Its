import { display, noteManager, noteList } from "./script.js";

$("#newNoteInput").on("click", function() {
    $(this).focus();
});


$("#newColBtn").on("click", function() {
    let id = 1;
    let title = "today";
    let inject = `<span class="col-header col-3">${title}</span>`
    $("#col-row").children(".container-fluid").prepend(inject);
    display();
});

//Search
$("#searchBtn").on("click", function() {
    let search = $("#newNoteInput").val();
    let searchList = $(".note").filter(function(note){
        console.log(note);
        // console.log($(note).children(".noteText").text());
        return $(note).children(".noteText").text().includes(search);
    });
    console.log(searchList);
});
