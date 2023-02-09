export class Note {
    constructor(id, selected){
        this.id = id;
        this.selected = false;
    }
}

export function getInject(id, text){
    return `
    <div class="note overflow-visible" id="note-${id}">
        <div class="noteDisplay overflow-hidden" id="noteDisplay-${id}">
            <p class="noteText" id="noteText-${id}" style="display:block;">${text}</p>
            <input type="text" value="" class="noteInput" id="noteInput-${id}" placeholder="to-do" style="display:none;">
            </input>
        </div>
    </div>
    `;
}

export var noteHeight = 50;