import { NotePhoto, NoteAudio } from "../store/modules/notes";

export class NoteHelp {
    constructor(public readonly title: string, public readonly instructions: string) {}
}

export class NoteForm {
    constructor(public readonly help: NoteHelp, public readonly body: string = "", public audios: NoteAudio[] = [], public photos: NotePhoto[] = []) {}
}

export class NotesForm {
    public readonly studyObjective: NoteForm = new NoteForm(new NoteHelp(_L("studyObjective"), _L("studyObjectiveInstruction")));
    public readonly sitePurpose: NoteForm = new NoteForm(new NoteHelp(_L("siteLocation"), _L("siteLocationInstruction")));
    public readonly siteCriteria: NoteForm = new NoteForm(new NoteHelp(_L("siteCriteria"), _L("siteCriteriaInstruction")));
    public readonly siteDescription: NoteForm = new NoteForm(new NoteHelp(_L("siteDescription"), _L("siteDescriptionInstruction")));

    constructor(public readonly id: Number, public readonly photos: NotePhoto[] = []) {}
}
