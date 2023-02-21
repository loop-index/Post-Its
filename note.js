export class Note {
    constructor(id, selected){
        this.id = id;
        this.selected = false;
    }
}

export function getInject(id, text, type="note"){

    if (type == "note"){
        return `
        <div class="note overflow-visible draggable" id="note-${id}">
            <div class="noteDisplay overflow-hidden" id="noteDisplay-${id}">
                <p class="noteText" id="noteText-${id}" style="display:block;">
                    <span class="noteControl" style="display: none">
                        <span class="fa-solid fa-pen-to-square noteEdit" id="noteEdit-${id}"></span>
                        <span class="fa-solid fa-trash noteTrash" id="noteTrash-${id}"></span>
                    </span>
                    <span class="noteTextContent">${text}</span>
                </p>
                <textarea type="text" value="" class="noteInput" id="noteInput-${id}" placeholder="to-do" style="display:none;">${text == ">" ? "" : text}</textarea>
            </div>
        </div>
        `;
    }
    else if (type == "tab"){
        return `
        <div class="note overflow-visible draggable tab" id="note-${id}">
            <div class="noteDisplay overflow-hidden" id="noteDisplay-${id}">
                <p class="noteText" id="noteText-${id}" style="display:block;">
                    <span class="noteControl" style="display: none">
                        <span class="fa-solid fa-up-down-left-right noteMove" id="noteMove-${id}"></span>
                        <span class="fa-solid fa-pen-to-square noteEdit" id="noteEdit-${id}"></span>
                        <span class="fa-solid fa-trash noteTrash" id="noteTrash-${id}"></span>
                    </span>
                    <span class="noteTextContent">${text}</span>
                </p>
                <textarea type="text" value="" class="noteInput" id="noteInput-${id}" placeholder="to-do" style="display:none;">${text == ">" ? "" : text}</textarea>
            </div>
        </div>
        `;
    }
}

$(document).on("mouseover", ".noteDisplay", function(){
    $(this).find(".noteControl").css({
        "display": "block"
    });
});

$(document).on("mouseout", ".noteDisplay", function(){
    $(this).find(".noteControl").css({
        "display": "none"
    });
});



export var noteHeight = 50;