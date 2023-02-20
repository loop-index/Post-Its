import { display, noteManager, noteList } from "./script.js";

$("#newNoteInput").on("click", function() {
    $(this).focus();
});


$("#newColBtn").on("click", function() {
    let id = 1;
    let title = "today";
    let inject = `
    <span class="col-header col-4 rounded-pill justify-content-evenly">
        <p>
            <span>${title}</span>
            <span style="float:right"><i class="fa-solid fa-trash" style="display:none"></i></span>
        </p>
    </span>`
    $("#col-row").children(".container-fluid").append(inject);
    attachColumnHandlers();
    display();
});

function attachColumnHandlers(){
    $(".col-header:last-child").on("mouseover", function(e) {
        e.preventDefault();
        $(this).find("i").css({
            "display": "inline-block"
        });
    });

    $(".col-header:last-child").on("mouseout", function() {
        $(this).find("i").css({
            "display": "none"
        });
    });
}


//Search
$("#searchBtn").on("click", function() {
    let search = $("#newNoteInput").val();
    let searchList = Array.from($(".note").filter(function() {
        if ($(this).text().toLowerCase().includes(search)){
            $(this).addClass("search");
            return true;
        }
        return false;
    }));
    $(".note").not(".search").animate({
        "opacity": "0.1",
    }, 100);
    searchList.forEach(note => {
        $(note).css({
            "opacity": "1",
        });
    });
});


